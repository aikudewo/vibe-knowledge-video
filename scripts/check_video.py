#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
成片验收器 —— 一条命令跑完全部硬指标，输出 PASS / FAIL。

用法：
    python 工具/check_video.py 成片.mp4
    python 工具/check_video.py 成片.mp4 --min-ink 1.0 --min-motion 0.15

为什么要有这个脚本：
    03-避坑清单 第 5 条「切点处画面是空的」写得很清楚，
    但 2026-10-21 那一轮还是犯了三次。
    清单靠记，脚本靠跑——能跑的东西才不会被忘掉。

检查项：
    1. 规格：宽高 / 帧率 / 帧数 / 时长 / 音轨
    2. 亮部占比：逐帧算，低于阈值报时间点（= 空屏 / 切点黑闪）
    3. 帧差：逐帧算，连续不动 = 卡顿
    4. 黑帧：亮度标准差过低
    5. 音频：峰值、RMS、长静音

重要：亮部占比必须用**原始分辨率**算。
    缩到 320x180 会把 1px 细线平均掉，指标严重失真——
    这个错在 2026-10-21 犯过，导致误判。
"""

import argparse
import json
import os
import shutil
import subprocess
import sys

import numpy as np


# ---------- 找 ffmpeg / ffprobe ----------
def find_bin(name):
    cands = [
        os.environ.get("FFMPEG_DIR", ""),
        os.path.join("node_modules", "@remotion", "compositor-win32-x64-msvc"),
        os.path.join("node_modules", "@remotion", "compositor-darwin-arm64"),
        os.path.join("node_modules", "@remotion", "compositor-darwin-x64"),
        os.path.join("node_modules", "@remotion", "compositor-linux-x64-gnu"),
        "/opt/homebrew/bin",
        "/usr/local/bin",
        "/usr/bin",
        "",
    ]
    exe = name + (".exe" if os.name == "nt" else "")
    for c in cands:
        p = os.path.join(c, exe) if c else exe
        if os.path.isfile(p) or shutil.which(p):
            return p
    return name


FFMPEG = find_bin("ffmpeg")
FFPROBE = find_bin("ffprobe")


def probe(path):
    cmd = [
        FFPROBE, "-hide_banner", "-v", "error",
        "-show_entries", "stream=codec_type,width,height,r_frame_rate,nb_frames,duration",
        "-show_entries", "format=duration",
        "-of", "json", path,
    ]
    out = subprocess.run(cmd, capture_output=True, text=True)
    if out.returncode != 0:
        raise SystemExit("ffprobe 失败：" + out.stderr[:400])
    return json.loads(out.stdout)


def read_frames(path, w, h):
    """逐帧读灰度原始像素（原始分辨率，不缩放）。"""
    cmd = [
        FFMPEG, "-hide_banner", "-loglevel", "error",
        "-i", path,
        "-f", "rawvideo", "-pix_fmt", "gray", "-",
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=w * h)
    size = w * h
    while True:
        buf = proc.stdout.read(size)
        if not buf or len(buf) < size:
            break
        yield np.frombuffer(buf, dtype=np.uint8).reshape(h, w).astype(np.float32)
    proc.stdout.close()
    proc.wait()


def read_audio(path, sr=22050):
    cmd = [
        FFMPEG, "-hide_banner", "-loglevel", "error",
        "-i", path, "-vn", "-ac", "1", "-ar", str(sr),
        "-f", "s16le", "-",
    ]
    out = subprocess.run(cmd, capture_output=True)
    if out.returncode != 0 or not out.stdout:
        return None, sr
    d = np.frombuffer(out.stdout, dtype=np.int16).astype(np.float32) / 32768.0
    return d, sr


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--min-ink", type=float, default=0.8, help="亮部占比下限 %%（参考片最低 0.88%%）")
    ap.add_argument("--min-motion", type=float, default=0.12, help="帧差下限，低于即卡顿")
    ap.add_argument("--max-static", type=float, default=0.05, help="「静止且空」帧占比上限")
    ap.add_argument("--expect-fps", type=int, default=0, help="期望帧率，0=不校验")
    ap.add_argument("--expect-dur", type=float, default=0, help="期望时长秒，0=不校验")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    if not os.path.isfile(args.video):
        raise SystemExit("找不到文件：" + args.video)

    info = probe(args.video)
    v = next((s for s in info["streams"] if s.get("codec_type") == "video"), None)
    a = next((s for s in info["streams"] if s.get("codec_type") == "audio"), None)
    if not v:
        raise SystemExit("没有视频流")

    w, h = int(v["width"]), int(v["height"])
    num, den = (v.get("r_frame_rate") or "30/1").split("/")
    fps = float(num) / float(den or 1)
    dur = float(v.get("duration") or info["format"]["duration"])
    nb = int(v.get("nb_frames") or round(dur * fps))

    fails, warns = [], []

    # ---------- 1. 规格 ----------
    print("=" * 62)
    print("成片验收  %s" % os.path.basename(args.video))
    print("=" * 62)
    print("规格      %dx%d  %.3g fps  %d 帧  %.2fs  音轨 %s"
          % (w, h, fps, nb, dur, "有" if a else "无"))
    if w < 1080:
        fails.append("分辨率过低：%dx%d（竖屏至少 1080x1920，横屏 1920x1080）" % (w, h))
    if not a:
        fails.append("没有音轨")
    if args.expect_fps and abs(fps - args.expect_fps) > 0.01:
        fails.append("帧率 %.2f ≠ 期望 %d" % (fps, args.expect_fps))
    if args.expect_dur and abs(dur - args.expect_dur) > 0.15:
        fails.append("时长 %.2fs ≠ 期望 %.2fs" % (dur, args.expect_dur))

    # ---------- 2/3/4. 逐帧 ----------
    inks, diffs, stds = [], [], []
    prev = None
    for f in read_frames(args.video, w, h):
        # 中位数用抽样算，够准且快
        med = float(np.median(f[::8, ::8]))
        inks.append(float((np.abs(f - med) > 14).mean() * 100))
        stds.append(float(f.std()))
        if prev is not None:
            diffs.append(float(np.abs(f - prev).mean()))
        prev = f

    n = len(inks)
    inks = np.array(inks)
    diffs = np.array(diffs) if diffs else np.array([0.0])
    stds = np.array(stds)

    print("\n[逐帧] 共 %d 帧（原始分辨率统计）" % n)
    print("  亮部占比   均值 %.2f%%   最小 %.2f%%   最大 %.2f%%"
          % (inks.mean(), inks.min(), inks.max()))
    print("  帧差       均值 %.3f    最小 %.3f    最大 %.3f"
          % (diffs.mean(), diffs.min(), diffs.max()))
    print("  亮度标准差 最小 %.1f（<8 视为黑帧）" % stds.min())
    print("  注：亮部占比与帧差都随分辨率变化——同一支片 960 宽与 1920 宽算出来不是一个数，")
    print("      跨片比较必须同分辨率，或把两边都降到同一尺寸再算。")

    dark = [(i / fps, v2) for i, v2 in enumerate(inks) if v2 < args.min_ink]
    if dark:
        fails.append("有 %d 帧亮部 < %.1f%%（空屏 / 切点黑闪）" % (len(dark), args.min_ink))
        print("  空屏时间点：%s" % ", ".join("%.2fs(%.2f%%)" % (t, k) for t, k in dark[:8]))

    # 静止本身不是错：参考片会停在一张图上讲（17617 帧里 752 帧静止，4.3%）。
    # 真正的错是「静止 + 空」——画面不动、又没内容，观众会觉得卡死。
    static_all = [i for i, v2 in enumerate(diffs) if v2 < 0.03]
    static_dead = [(i / fps) for i in static_all if inks[i + 1] < 3.0]
    print("  静止帧 %d 个（%.1f%%），其中「静止且空」%d 个"
          % (len(static_all), 100 * len(static_all) / max(1, len(diffs)), len(static_dead)))
    if len(static_dead) / max(1, len(diffs)) > args.max_static:
        fails.append("「静止且空」%d 帧（%.1f%%），超过上限 %.0f%%"
                     % (len(static_dead), 100 * len(static_dead) / len(diffs), args.max_static * 100))
        print("  位置：%s" % ", ".join("%.2fs" % t for t in static_dead[:8]))
    if diffs.mean() < args.min_motion:
        warns.append("帧差均值 %.3f 偏低（< %.2f），画面偏静" % (diffs.mean(), args.min_motion))

    black = [(i / fps, s) for i, s in enumerate(stds) if s < 8]
    if black:
        fails.append("有 %d 帧接近全黑（标准差 < 8）" % len(black))

    # ---------- 5. 音频 ----------
    d, sr = read_audio(args.video)
    if d is not None and len(d) > 0:
        peak = float(np.abs(d).max())
        rms = float(np.sqrt((d ** 2).mean()))
        print("\n[音频] 峰值 %.3f   RMS %.3f" % (peak, rms))
        if peak > 0.97:
            fails.append("音频削波（峰值 %.3f）" % peak)
        if rms < 0.02:
            warns.append("整体音量偏低（RMS %.3f）" % rms)

        win = int(2 * sr)
        silent = []
        for i in range(0, max(1, len(d) - win + 1), win):
            seg = d[i:i + win]
            if float(np.sqrt((seg ** 2).mean())) < 0.005:
                silent.append(i / sr)
        if silent:
            fails.append("有 %d 处 2 秒以上静音" % len(silent))
            print("  静音起点：%s" % ", ".join("%.1fs" % t for t in silent[:6]))
    else:
        warns.append("读不到音频")

    # ---------- 结论 ----------
    print("\n" + "=" * 62)
    if fails:
        print("❌ FAIL  %d 项" % len(fails))
        for x in fails:
            print("   · " + x)
    else:
        print("✅ PASS  全部硬指标达标")
    for x in warns:
        print("   ⚠ " + x)
    print("=" * 62)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())

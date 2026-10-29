"""
配音生成器 —— edge-tts 分句合成，并输出时长表（供字幕对齐用）。

用法：
    pip install edge-tts
    python gen_vo.py lines.txt              # 每行一句
    python gen_vo.py lines.txt --voice zh-CN-YunxiNeural --rate -4%

输出：
    public/vo/vo1.mp3, vo2.mp3 ...
    public/vo/timing.txt   每句的时长与累计起点（秒），直接抄进 Remotion

为什么必须分句：
    整段合成拿不到每句的边界，字幕只能估。分句后每句一个文件，
    时长可以精确测出来，字幕切点就准了。
"""

import argparse
import asyncio
import os
import subprocess
import wave

import edge_tts

FFPROBE_CANDIDATES = [
    "ffprobe",
    "/opt/homebrew/bin/ffprobe",
    "/usr/local/bin/ffprobe",
    "./node_modules/@remotion/compositor-darwin-arm64/ffprobe",
    "./node_modules/@remotion/compositor-darwin-x64/ffprobe",
    "./node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe",
]


def probe_duration(path):
    """用 ffprobe 读时长；读不到就退回 wave（wav 才有效）。"""
    for ff in FFPROBE_CANDIDATES:
        try:
            out = subprocess.run(
                [ff, "-hide_banner", "-i", path],
                capture_output=True,
                text=True,
            ).stderr
            line = [l for l in out.split("\n") if "Duration" in l]
            if line:
                hms = line[0].split("Duration:")[1].split(",")[0].strip()
                h, m, s = hms.split(":")
                return int(h) * 3600 + int(m) * 60 + float(s)
        except Exception:
            pass
    if path.endswith(".wav"):
        with wave.open(path, "rb") as w:
            return w.getnframes() / w.getframerate()
    return 0.0


async def synth(lines, voice, rate, pitch, outdir):
    os.makedirs(outdir, exist_ok=True)
    for i, text in enumerate(lines, 1):
        c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await c.save(os.path.join(outdir, "vo%d.mp3" % i))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script", help="每行一句的文本文件")
    ap.add_argument("--voice", default="zh-CN-YunjianNeural")
    ap.add_argument("--rate", default="-4%")
    ap.add_argument("--pitch", default="-2Hz")
    ap.add_argument("--out", default="public/vo")
    ap.add_argument("--gap", type=float, default=0.18, help="句间停顿（秒）")
    ap.add_argument("--start", type=float, default=0.4, help="第一句起点（秒）")
    args = ap.parse_args()

    with open(args.script, encoding="utf-8") as f:
        lines = [l.strip() for l in f if l.strip()]

    asyncio.run(synth(lines, args.voice, args.rate, args.pitch, args.out))

    t = args.start
    rows = []
    for i, text in enumerate(lines, 1):
        dur = probe_duration(os.path.join(args.out, "vo%d.mp3" % i))
        rows.append((i, t, dur, text))
        t += dur + args.gap

    lines_out = ["# 句序\t起点(s)\t时长(s)\t帧(30fps)\t文本"]
    for i, st, dur, text in rows:
        lines_out.append(
            "%d\t%.2f\t%.2f\t%d\t%s" % (i, st, dur, round(st * 30), text)
        )
    lines_out.append("")
    lines_out.append("# 总时长 %.2fs（含句间 %.2fs 停顿）" % (t, args.gap))
    lines_out.append("# Remotion 里直接：<Sequence from={%d}><Audio src=... /></Sequence>" % round(rows[0][1] * 30))

    path = os.path.join(args.out, "timing.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines_out))
    print("\n".join(lines_out))
    print("\n写入 " + path)


if __name__ == "__main__":
    main()

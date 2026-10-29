import sys
import wave
import numpy as np

# 用法: python3 工具/analyze2.py [wav路径]
# 默认读工程目录下的 out/audio/bgm.wav
path = sys.argv[1] if len(sys.argv) > 1 else "out/audio/bgm.wav"
w = wave.open(path, "rb")
sr = w.getframerate()
raw = w.readframes(w.getnframes())
w.close()
data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

hop, win = 128, 1024           # ~5.8ms 帧间隔，更细
nfr = 1 + (len(data) - win) // hop
frames = np.lib.stride_tricks.sliding_window_view(data, win)[::hop][:nfr]
spec = np.abs(np.fft.rfft(frames * np.hanning(win), axis=1))
freqs = np.fft.rfftfreq(win, 1 / sr)
edges = np.array([0, 60, 120, 240, 500, 900, 1500, 2500, 4000, 7000, 11025])
bands = [spec[:, (freqs >= edges[i]) & (freqs < edges[i + 1])].mean(axis=1)
         for i in range(len(edges) - 1)]
S = np.log1p(np.array(bands).T * 100)
flux = np.concatenate([[0], np.maximum(0, np.diff(S, axis=0)).sum(axis=1)])
flux = flux / (flux.max() + 1e-9)
fps = sr / hop
t = np.arange(len(flux)) / fps

# ---- 网格搜索 BPM + 相位 ----
best = None
for bpm in np.arange(96, 130, 0.05):
    per = 60 / bpm
    for ph in np.arange(0, per, 0.02):
        g = np.arange(ph, t[-1], per)
        idx = np.clip((g * fps).astype(int), 0, len(flux) - 1)
        # 每个格点取 ±20ms 内的最大 flux
        sc = 0.0
        for i in idx:
            sc += flux[max(0, i - 3):i + 4].max()
        sc /= len(idx)
        if best is None or sc > best[0]:
            best = (sc, bpm, ph)
print("best grid: score=%.4f bpm=%.2f phase=%.3fs" % best)

sc, bpm, ph = best
per = 60 / bpm
beats = np.arange(ph, t[-1], per)
print("beat count:", len(beats), "beat=%.4fs bar=%.4fs" % (per, per * 4))

# ---- 每拍强度 ----
print("\nbeat#  time   flux   bar#  (★ = 强拍/乐句起)")
for i, b in enumerate(beats):
    i0 = int(b * fps)
    v = flux[max(0, i0 - 3):i0 + 4].max()
    star = " ★" if v > 0.16 else ""
    print(f"{i:3d}  {b:6.2f}  {v:.3f}  bar{i//4:2d}{star}")

# ---- 结构：0.5s 能量 ----
rms = np.sqrt((frames ** 2).mean(axis=1))
print("\n-- energy per 0.5s --")
for i in range(0, len(rms), int(fps * 0.5)):
    bar = "█" * int(rms[i] * 60)
    print(f"{i/fps:5.1f}s {rms[i]:.3f} {bar}")

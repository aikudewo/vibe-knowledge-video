import wave, sys, json
import numpy as np

# 用法: python3 工具/analyze.py [wav路径]
path = sys.argv[1] if len(sys.argv) > 1 else "out/audio/bgm.wav"
w = wave.open(path, "rb")
sr = w.getframerate()
n = w.getnframes()
ch = w.getnchannels()
sw = w.getsampwidth()
raw = w.readframes(n)
w.close()

data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
if ch > 1:
    data = data.reshape(-1, ch).mean(axis=1)

dur = len(data) / sr
print(f"sr={sr} ch={ch} sw={sw} dur={dur:.3f}s")

hop = 220          # 10ms
win = 1024
nfr = 1 + (len(data) - win) // hop
frames = np.lib.stride_tricks.sliding_window_view(data, win)[::hop][:nfr]
window = np.hanning(win)
spec = np.abs(np.fft.rfft(frames * window, axis=1))
fps_env = sr / hop

# 对数频带压缩（近似 mel 分组）
freqs = np.fft.rfftfreq(win, 1 / sr)
edges = np.array([0, 80, 160, 300, 500, 800, 1200, 2000, 3000, 5000, 8000, 11025])
bands = []
for i in range(len(edges) - 1):
    m = (freqs >= edges[i]) & (freqs < edges[i + 1])
    if m.sum() > 0:
        bands.append(spec[:, m].mean(axis=1))
S = np.log1p(np.array(bands).T * 100)

flux = np.maximum(0, np.diff(S, axis=0)).sum(axis=1)
flux = np.concatenate([[0], flux])
# 归一化 + 平滑
flux = flux / (flux.max() + 1e-9)
k = np.hanning(5); k = k / k.sum()
flux_s = np.convolve(flux, k, mode="same")

# RMS 能量
rms = np.sqrt((frames ** 2).mean(axis=1))

# 节拍估计：flux 自相关
f = flux_s - flux_s.mean()
ac = np.correlate(f, f, mode="full")[len(f) - 1:]
ac = ac / (ac[0] + 1e-9)
min_bpm, max_bpm = 60, 160
lo = int(fps_env * 60 / max_bpm)
hi = int(fps_env * 60 / min_bpm)
seg = ac[lo:hi]
cand = []
for i in range(1, len(seg) - 1):
    if seg[i] > seg[i - 1] and seg[i] > seg[i + 1] and seg[i] > 0.05:
        bpm = 60 * fps_env / (i + lo)
        cand.append((float(seg[i]), round(bpm, 1)))
cand.sort(reverse=True)
print("tempo candidates (score, bpm):", cand[:8])

# 每 0.25s 输出一次能量/flux，观察结构
step = int(fps_env * 0.25)
print("\n t(s)  rms    flux")
for i in range(0, len(flux_s), step):
    print(f"{i/fps_env:6.2f} {rms[i]:.4f} {flux_s[i]:.3f}")

# 峰值检测（简易）
th = np.percentile(flux_s, 88)
peaks = []
for i in range(2, len(flux_s) - 2):
    if flux_s[i] >= th and flux_s[i] == flux_s[i - 2:i + 3].max():
        if not peaks or (i - peaks[-1]) > fps_env * 0.18:
            peaks.append(i)
print("\npeaks(s):", [round(p / fps_env, 2) for p in peaks])
print("peak count:", len(peaks))

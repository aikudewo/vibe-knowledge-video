"""
音效合成器 —— 7 个基础音效，全部用 numpy 生成，无版权风险。

用法：
    python gen_sfx.py                    # 输出到 ./public/sfx/
    python gen_sfx.py path/to/public     # 指定 public 目录

依赖：numpy
"""

import os
import sys

import wave
import numpy as np

SR = 44100
_PUB = sys.argv[1] if len(sys.argv) > 1 else "public"
OUT = os.path.join(_PUB, "sfx") + os.sep
os.makedirs(OUT, exist_ok=True)


def save(name, sig, peak=0.9):
    sig = np.asarray(sig, dtype=np.float32)
    m = np.abs(sig).max()
    if m > 0:
        sig = sig / m * peak
    # 首尾 5ms 淡入淡出，避免爆音
    n = int(0.005 * SR)
    if len(sig) > 2 * n:
        sig[:n] *= np.linspace(0, 1, n)
        sig[-n:] *= np.linspace(1, 0, n)
    w = wave.open(OUT + name, "wb")
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(sig, -1, 1) * 32767).astype(np.int16).tobytes())
    w.close()
    print(name, "%.3fs" % (len(sig) / SR))


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


# 1. pop —— 卡片/文字落定
t = t_axis(0.13)
f = 980 * np.exp(-t * 22) + 260
phase = 2 * np.pi * np.cumsum(f) / SR
env = np.exp(-t * 42)
pop = np.sin(phase) * env
pop += np.random.randn(len(t)) * np.exp(-t * 320) * 0.35  # 起始瞬态
save("pop.wav", pop, 0.8)

# 2. whoosh —— 场景转场
t = t_axis(0.6)
noise = np.random.randn(len(t))
sweep = np.exp(-((t - 0.3) ** 2) / (2 * 0.11**2))  # 中段最强
a = 0.012 + 0.5 * sweep  # 低通系数随时间变化
y = np.zeros_like(noise)
prev = 0.0
for i in range(len(noise)):
    prev = prev + a[i] * (noise[i] - prev)
    y[i] = prev
y = y * sweep
save("whoosh.wav", y, 0.55)

# 3. chime —— 数据/重点
t = t_axis(1.1)
chime = np.zeros_like(t)
for freq, amp, dec in [(1046.5, 1.0, 4.5), (1568.0, 0.55, 6.0), (2093.0, 0.3, 8.0)]:
    chime += amp * np.sin(2 * np.pi * freq * t) * np.exp(-t * dec)
save("chime.wav", chime, 0.6)

# 4. tick —— 清单逐行
t = t_axis(0.05)
n = np.random.randn(len(t))
n = np.diff(np.concatenate([[0], n]))  # 简易高通
tick = n * np.exp(-t * 150)
save("tick.wav", tick, 0.5)

# 5. thud —— 强调低音
t = t_axis(0.35)
f = 95 * np.exp(-t * 6) + 48
phase = 2 * np.pi * np.cumsum(f) / SR
thud = np.sin(phase) * np.exp(-t * 11)
save("thud.wav", thud, 0.75)

# 6. paper —— 撕纸（纸片 / 拼贴场景）
t = t_axis(0.55)
noise = np.random.randn(len(t))
env = np.exp(-t * 6.5) * (1 - np.exp(-t * 140))
spikes = (np.random.rand(len(t)) > 0.996) * np.random.randn(len(t)) * 2.4  # 随机纤维断裂
paper = (noise * 0.55 + spikes) * env
paper = np.diff(np.concatenate([[0], paper]))  # 高通，去掉闷的低频
save("paper.wav", paper, 0.65)

# 7. stamp —— 盖章（落款 / 收尾）
t = t_axis(0.5)
f = 150 * np.exp(-t * 9) + 52
phase = 2 * np.pi * np.cumsum(f) / SR
stamp = np.sin(phase) * np.exp(-t * 13)
stamp += np.random.randn(len(t)) * np.exp(-t * 95) * 0.45  # 纸面拍击
save("stamp.wav", stamp, 0.85)


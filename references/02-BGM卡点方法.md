# BGM 卡点方法

> 卡点不是"听个大概"，是算出来的。误差要控制在 1 帧（33 毫秒）以内。

---

## 一、为什么必须算

人耳对 50ms 以上的音画错位就会不适。30fps 下一帧是 33ms，所以**卡点精度必须到帧级**。

靠耳朵听、靠软件自动打点，通常会有 ±100ms 的误差，慢歌看不出来，快节奏的歌会很"飘"。

算出来的是三个数：**BPM、首拍相位、音乐结束时间**。有了这三个，所有时间点都能推。

---

## 二、三步分析

### 第 1 步 · 转成 wav

```bash
ffmpeg -i bgm.m4a -ac 1 -ar 22050 out/audio/bgm.wav
```

单声道 22050Hz 就够——我们只关心节奏，不需要高频细节，文件也小。

### 第 2 步 · 跑 `工具/analyze2.py`

```bash
pip install numpy
python3 工具/analyze2.py
```

脚本做四件事：

1. **分帧做 FFT**（1024 窗长，128 跳步 ≈ 5.8ms 一帧）
2. **压成 10 个对数频带**，对每帧求"能量增量"，得到**频谱通量（spectral flux）**
   —— 这就是"打击感"的数值化：鼓点来的时候，通量会突然升高
3. **自相关 + 网格搜索**：遍历 96~130 BPM、每 0.05 BPM 一档，同时遍历相位（每 0.02s 一档），
   找出「格点落在通量峰值上」最多的那组
4. 输出 **BPM、相位、每一拍的时间与强度、整首的能量包络**

### 第 3 步 · 读结果

家居篇的输出：

```
best grid: score=0.1968 bpm=112.85 phase=0.080s
beat count: 62 beat=0.5317s bar=2.1267s
```

- **BPM = 112.85**
- **首拍 = 0.08s**
- 一拍 0.5317s，一小节（4 拍）2.1267s

再看能量包络的尾部：

```
29.95s 0.306
30.00s 0.260
30.05s 0.005   ← 这里硬收了
30.10s 0.000
```

说明音乐实际只到 **30.05s**，后面的 3 秒是静音。片长应该按 30.05s 定，不是按文件时长 33s。

---

## 三、换算成帧

30fps 下：

```
一拍  = 0.5317 × 30 = 15.95 帧 ≈ 16 帧
一小节 = 16 × 4      = 64 帧
900 帧 = 30s ≈ 14 小节
```

代码里**不要手写帧号**，全部用函数推：

```tsx
const FPS = 30;
const BEAT_OFFSET = 0.08;    // 首拍时间
const BEAT_SEC = 0.5317;     // 60 / 112.85

/** 第 n 拍所在的帧 */
const beatF = (n: number) =>
  Math.round((BEAT_OFFSET + n * BEAT_SEC) * FPS);

/** 第 bar 小节第 b 拍 */
const barF = (bar: number, b = 0) => beatF(bar * 4 + b);
```

这样换歌只改 `BEAT_SEC` 一个常量，全片自动跟着变。

### 常见 BPM 对照表

| BPM | 一拍(s) | 一拍(帧@30) | 一小节(帧) | 30s 里有几小节 |
|---|---|---|---|---|
| 90 | 0.667 | 20.0 | 80 | 11.25 |
| 100 | 0.600 | 18.0 | 72 | 12.5 |
| 112.85 | 0.532 | 15.95 | 63.8 | 14.1 |
| 120 | 0.500 | 15.0 | 60 | 15 |
| 128 | 0.469 | 14.06 | 56.25 | 16 |

> BPM 不是 30 的整数倍时，一拍不会正好是整数帧。
> **用 `Math.round()` 每拍单独取整**，误差不会累积；用固定的 16 帧/拍反而会漂移。

---

## 四、最关键的一条：元素要在拍点"落定"

**错误做法**：元素在拍点**开始**动。

```tsx
// ❌ 拍点才开始，切点处画面是空的
interpolate(frame, [start, start + 12], [0, 1])
```

**正确做法**：元素提前起跑，**正好在拍点到位**。

```tsx
// ✅ 拍点即落定
interpolate(frame, [start - 12, start], [0, 1])
```

差别在于：观众看到的是"文字**砸**在鼓点上"，而不是"鼓点之后文字才慢慢出来"。

所有入场动效都要这样改：

| 动效 | 改法 |
|---|---|
| `Reveal` 淡入 | `[start - dur, start]` |
| `spring` 弹出 | `frame - (start - 10)` |
| 数字滚动 | `[start - 8, start + 2]` |
| 色条生长 | `[segStart - 8, segStart]` |

---

## 五、场景切换：互补叠化，不能透底

场景 A 淡出、场景 B 淡入，如果两个窗口不重合，中间会有一帧"两边都半透明"，背景色透出来，看起来像闪白。

**解法**：两个场景用**同一段窗口**，透明度之和恒等于 1。

```tsx
const Scene = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  const inP  = interpolate(frame, [from - 9, from], [0, 1], { clamp });
  const outP = interpolate(frame, [to - 9, to],     [0, 1], { clamp });
  const op   = inP * (1 - outP);   // A 的 outP 和 B 的 inP 是同一段
  return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};
```

因为下一个场景的 `from` 正好等于当前场景的 `to`，所以：
`op_A = 1 - outP`，`op_B = inP`，而 `inP + outP = 1`，**总和永远是 1**。

---

## 六、音画同步校验（出片后必做）

不要相信"看起来对齐了"。用互相关算出实际偏移：

```python
import wave, numpy as np

def load(p):
    w = wave.open(p, 'rb')
    d = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.
    w.close()
    return d

# 先把成片的音轨抽出来：ffmpeg -i final.mp4 -ac 1 -ar 22050 out/render.wav
a = load('bgm.wav')[:22050 * 8]      # 源文件前 8 秒
b = load('render.wav')[:22050 * 8]   # 成片前 8 秒

n = 1 << int(np.ceil(np.log2(len(a) + len(b))))
cc = np.fft.irfft(np.fft.rfft(a, n) * np.conj(np.fft.rfft(b, n)), n)
lag = int(np.argmax(cc))
if lag > len(a): lag -= n

print('偏移 %d samples = %.1f ms' % (lag, lag / 22050 * 1000))
```

**判定标准**：`0 samples / 0.0 ms` 才算通过。

家居篇的实测结果：`偏移 0 samples = 0.0 ms`，相关系数 `1.000`。

如果不是 0，说明 `<Audio>` 前面有多余的空帧，或者 `Sequence` 的起点偏了。

---

## 七、音频结尾的处理

如果音乐是**硬收**（突然静音），视频最后一帧切断会有"咔"的爆音。

```tsx
<Audio
  src={staticFile("bgm.m4a")}
  volume={(f) =>
    interpolate(f, [END - 8, END], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  }
/>
```

最后 8 帧（0.27 秒）做淡出，既压掉爆音，又不影响前面的节奏。

如果音乐本身是自然衰减的，就不用加这段。

---

## 八、选段：从哪一秒开始切

### 8.0 默认规则：从 0:00 开始（2026-10-22 起）

**用户给了曲子，就从 0:00 播，不从高潮切。**

> 用户原话：`bgm要使用那个一开始给你的那个从头开始播放，不用从高潮开始，一定要跟随画面卡点，跟随主体动作或者动效卡点`

理由：

- **前奏是起势。** 从高潮起，一进来就是满的，后面没有对比，观众的情绪无处可去。
- **卡点靠的是"拍"，不是"能量"。** 前奏一样有拍，一样能卡，只是听起来安静。
- **片子讲的是从安静到收拢。** 音乐也该从安静开始，跟画面同构。

做法：

```bash
# 45 秒从 0:00 截
ffmpeg -ss 0 -t 45 -i 源曲.m4a -ac 2 -ar 48000 -c:a pcm_s16le public/bgm-xxx.wav
```

- 开头 **0.12s 淡入**（压掉第一拍的爆音）
- 结尾 **0.9s 淡出**（硬收的歌必须做）
- 归一化峰值 **0.900**、RMS 0.318 左右
- 112.8 BPM 下 45 秒刚好 21 小节

切完用互相关确认没截错位置（换过采样率/格式之后尤其要查）：

```python
np.corrcoef(a[:n], b[:n])[0, 1]   # > 0.95 才算同一段
```

深睡自由实测 `0.990 @ 0.00s`，确认同一首、同一起点。

> **下面 8.1–8.3 是"从中间切"的旧方法，只在两种情况下用**：
> ① 用户明确要求从副歌起；② 整首前奏超过 8 秒且没有可用的拍。

### 8.1 找 drop：看能量包络（备选方案）

```python
import wave, numpy as np
w = wave.open("full.wav", "rb"); sr = w.getframerate()
d = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.
w.close()

step = int(0.5 * sr)
for i in range(len(d) // step):
    v = float(np.sqrt((d[i*step:(i+1)*step] ** 2).mean()))
    print("%5.1fs %.3f %s" % (i * 0.5, v, "#" * int(v * 60)))
```

输出里，**能量突然从 0.2 跳到 0.6 的那个点，就是 drop**。

实测例（《千年之后》完整版 2:13）：

```
 16.0s 0.257  ###############
 16.5s 0.191  ###########        ← 前奏收尾，能量掉下去
 17.0s 0.590  ###################################  ← drop
 17.5s 0.570  ##################################
```

### 8.2 对齐到小节线

drop 不一定正好落在整秒。用拍点公式反推：

```python
beat = 0.5314          # 60 / 112.90
phase = 0.02           # 首拍相位
n = round((17.0 - phase) / beat)     # → 32
start = phase + n * beat             # → 17.0248s
```

`32 拍 = 8 小节`，正好是整小节 —— 说明这个 drop 是标准的 8 小节进副歌，可以放心从这里切。

### 8.3 切出来

```bash
ffmpeg -ss 17.0248 -t 44.8 -i full.m4a -ac 1 -ar 44100 -c:a pcm_s16le bgm-full.wav
```

切完之后，**这段音频自己的第 0 拍就在 0 秒**，所以代码里 `BEAT_OFFSET = 0`。

---

## 九、音乐不够长：按小节循环

45 秒的视频，只找到 30 秒的音乐怎么办？

### 9.1 关键：重叠长度必须是整数拍

如果随便切一刀接上，第二段的拍点会错位，后半段就全飘了。

```
loop 点 = phase + n × beat（落在拍上）
重叠长度 = k × beat（整数拍）
```

实测参数：

```
原曲 30.05s 硬收，取到第 56 拍 = 29.855s
重叠 2 拍 = 1.0634s
第二段起点 = 29.855 - 1.0634 = 28.7916s
检查：(28.7916 - 0.08) / 0.5317 = 53.99 ≈ 54 拍 ✓ 对上了
```

### 9.2 Remotion 自带的 ffmpeg 没有 acrossfade

这个构建是精简版，`acrossfade`、`amix`、`m4a` 封装器都可能缺失。**用 numpy 自己做**：

```python
import wave, numpy as np

w = wave.open("src.wav", "rb"); sr = w.getframerate()
d = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.
w.close()

p = int(28.7916 * sr)      # 第一段保留到重叠起点
o = int(1.0634 * sr)       # 重叠长度
L = int(44.7916 * sr)      # 目标总长
b = d[:int(16.0 * sr)]     # 第二段（从原曲 0 开始）

out = np.zeros(L, dtype=np.float32)
out[:p] = d[:p]
t = np.linspace(0, 1, o, dtype=np.float32)
out[p:p+o] = d[p:p+o] * (1 - t) + b[:o] * t     # 线性交叉淡化
out[p+o:] = b[o:o + (L - p - o)]

wv = wave.open("loop.wav", "wb")
wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(sr)
wv.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
wv.close()
```

> 输出用 **wav**。这个 ffmpeg 构建转不了 m4a，wav 反而更省事（Remotion 直接支持）。

### 9.3 更好的方案：换一首足够长的

循环接缝在安静的氛围乐里听不出来，但在有旋律、有人声的歌里一定会被察觉。

**优先级**：够长的新歌 > 截取 drop > 循环拼接。

如果只能循环，就把接缝藏在一个转场或音效下面。

---

## 十、完整流程速查

```bash
# 1. 转 wav
ffmpeg -i bgm.m4a -ac 1 -ar 22050 out/bgm.wav

# 2. 算 BPM + 相位
python3 工具/analyze2.py

# 3. 从 0:00 截 45 秒（默认，见 8.0）
ffmpeg -ss 0 -t 45 -i bgm.m4a -ac 2 -ar 48000 -c:a pcm_s16le public/bgm.wav
#    （只有在用户要求从副歌起时，才去第八节 8.1 看能量包络找 drop）

# 4. 代码里换算
#    BEAT_OFFSET = 首拍相位（从 0:00 起时就是 0.01 左右，不是 0）
#    BEAT_SEC    = 0.5319
#    END         = 小节数 × 4 × BEAT_SEC × 30

# 5. 出片后校验
#    FFT 互相关，偏移应为 0（AAC 会有 <1ms 的编码延迟）
```

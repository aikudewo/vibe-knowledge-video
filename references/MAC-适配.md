# macOS 运行说明

这套流程原本在 Windows 上跑。**文档里的命令已经全部改成 macOS 写法了**，
不需要你再去逐条替换——下面只说三件事：改了什么、还剩什么要注意、怎么验证。

---

## 一、已经替你改好的四处

| 项 | 原来（Windows） | 现在（文档里就是这个） |
|---|---|---|
| Python | `python 工具/check_video.py` | **`python3 工具/check_video.py`** |
| 渲染浏览器 | 每条渲染/静帧命令都带 `--browser-executable="C:/Program Files/.../chrome.exe"` | **参数已删**。Remotion 自带的 Chromium 在 Mac 上是好的 |
| ffmpeg | `node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe` | **`ffmpeg`**（brew 装的系统版） |
| 绝对路径 | `C:/Users/HP/Desktop/...` | **`~/Desktop/...`** 或相对路径 |

顺带改掉的：`工具/analyze.py` / `analyze2.py` 原本硬编码了 Windows 音频路径，
现在改成读命令行参数，默认 `out/audio/bgm.wav`：

```bash
python3 工具/analyze2.py                      # 默认读 out/audio/bgm.wav
python3 工具/analyze2.py ~/Music/bgm.wav      # 或指定
```

`工具/check_video.py` 的 `find_bin()` 已按这个顺序找 ffmpeg，不用改：

```
$FFMPEG_DIR → compositor-darwin-arm64 → compositor-darwin-x64
→ /opt/homebrew/bin → /usr/local/bin → /usr/bin → PATH
```

> **为什么还要提 Windows？** 因为 `03-避坑清单.md` 里有一条"渲染静默失败"的坑
> 只在 Windows 上出现过。文档保留了它，标注了「仅 Windows」，Mac 上遇到类似症状
> 先删 `node_modules/.remotion` 重装一次。

---

## 二、还剩四处要注意（都是环境，不是代码）

### 1. 装依赖

```bash
brew install node python ffmpeg
python3 -m pip install numpy
```

`check_video.py` 要 numpy，`check_words.py` 是纯标准库不用装。

### 2. 字体（会影响观感，但不改代码）

`模板/Neon.tsx` 里写好了双平台 fallback：

```ts
export const SANS  = "Microsoft YaHei, PingFang SC, sans-serif";
export const SERIF = "SimSun, Songti SC, serif";
```

Mac 上自动落到 **PingFang SC** 和 **Songti SC**，代码不用动。但**字形会变**：

| 项 | 差异 | 怎么办 |
|---|---|---|
| 宋体 | Songti SC 比 SimSun 略粗、字面略大 | 标题 62px 看着变重了，先不动，看过帧再说 |
| 无衬线 | PingFang SC 比雅黑略圆、字距略松 | **21px 的注释行要重新确认**，这是最容易读不清的一档 |
| 数字 | 两边都是系统 sans，粗细接近 | 无需处理 |

> **不要凭想象改字号。** 先渲一版、从成片抽帧、看完再决定。
> Windows 上调好的字号换渲染环境，观感会差一档——这条是踩过的坑。

### 3. 脚本权限

```bash
chmod +x 工具/*.py
```

不加也能用 `python3 工具/xxx.py` 跑；加了才能 `./工具/check_video.py`。

### 4. 中文文件名（NFD 坑）

macOS 文件系统把中文文件名规范化成 **NFD**（拆开的组合字符），Windows 和 Linux 用 NFC。
**同一台 Mac 上不会出问题**，但工程再打包传给第三台机器时，可能出现「知识」变「知␣识」这类乱码。

规避办法：**工程目录和组件文件名用英文**（`src/Dazi45.tsx` 已经是对的），
只有文档和成片用中文名——它们不参与编译。

---

## 三、验证清单（四项全绿才算环境通了）

```bash
# 1. 工具能跑
python3 工具/check_words.py 模板/Dazi45.tsx
#    期望：✅ 未命中任何违禁词

# 2. ffmpeg 能找到
ffmpeg -version | head -1
#    期望：打印版本号，不是 command not found

# 3. 工程能起
npm start
#    期望：浏览器里左侧出现 Dazi45 / Doudou45 / DaziCover

# 4. 能渲一帧
npx remotion still src/index.ts Dazi45 out/t.png --frame=600 --log=error
#    期望：暗场 + 斜的仪表板 + 小人剪影
```

**第 4 步最关键。** 出来是白的，说明帧号或 Composition 名不对；
报错找不到 Chrome，说明 `node_modules/.remotion` 坏了，删掉重装。

---

## 四、Windows 上还要加回那一行

如果这套东西要搬回 Windows 用，渲染命令要补上：

```
--browser-executable="C:/Program Files/Google/Chrome/Application/chrome.exe"
```

原因是那台机器内置的 headless chrome 下载损坏，不加会静默失败（退出码 1，无报错）。
Mac 不需要。

# vibe-knowledge-video

一套打磨过的 **45 秒知识短视频** 生产流程，封装成 WorkBuddy / Claude Skill。

> 选题 → 脚本 → 分镜 → 素材 → Remotion 制作 → 验收 → 封面 → 文案

## 这套流程解决什么

做「Vibe 知识大赏」风格的知识短视频时，最容易翻车的不是创意，是**细节**：
字太小、切点是黑的、画面静止像 PPT、元素从第 0 帧就露馅、违禁词藏在注释行里。
这套 skill 把 31 条踩过的坑、两个验收工具、11 个模板，全部固化下来。

## 核心特点

- **一条镜头，0 次硬切**（满屏 + 光爆转场，不是横向长卷）
- **三幕结构**：先现象 → 再数据 → 最后揭奥妙，名词留到最后
- **矛盾驱动**：结尾再强化矛盾，不化解
- **纸感 / 包豪斯 / 暗场** 多套视觉，全部 SVG + Remotion
- **可验收**：亮部占比、帧差、静止帧、违禁词，全部脚本化

## 目录

```
SKILL.md                    # 入口：什么时候用、交付标准、铁律
references/                 # 16 份文档
  00-工作流总览.md
  03-避坑清单.md            # 31 条坑，最重要
  12-复盘-2026-10.md
  AI-交接说明书.md
  ...
scripts/                    # 6 个 Python 工具
  check_video.py            # 成片验收
  check_words.py            # 违禁词扫描
  analyze.py                # 参考片拆解
  gen_sfx.py / gen_vo.py    # 音效 / 配音
assets/templates/           # 11 个 Remotion 模板
  Neon.tsx                  # 公共库（所有组件都 import）
  Paper45.tsx / Doudou45.tsx / Dazi45.tsx / Veri45.tsx / Concert45.tsx
  Cover*.tsx                # 封面
```

## 安装

```bash
git clone <this-repo> ~/.workbuddy-ai/skills/vibe-knowledge-video
```

或者直接把整个目录拷进 `~/.workbuddy-ai/skills/`。

## 用法

```
读一下 vibe-knowledge-video 这个 skill，然后帮我做一个关于 XX 的 45 秒知识视频
```

## 验收命令

```bash
python scripts/check_video.py 成片.mp4 --expect-fps 30 --expect-dur 45
python scripts/check_words.py src/YourVideo.tsx
```

## 依赖

- Python 3.10+（numpy、Pillow）
- Node 18+ / Remotion 4.x
- Chrome（Remotion 渲染）
- 生图：SenseNova（`gen_img.py`，需自己的 API Key）

## 说明

模板是**参考实现**，不是开箱即用的工程——需要自己建 Remotion 工程、装依赖，
再把 `assets/templates/` 里的组件拷进 `src/`。`Neon.tsx` 是公共库，所有组件都依赖它。

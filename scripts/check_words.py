# -*- coding: utf-8 -*-
"""
违禁词检查 · 抖音发布前必跑

用法：
    python 工具/check_words.py 源文件.tsx
    python 工具/check_words.py 源文件.tsx 文案.md
    python 工具/check_words.py --dir 项目/片名-版本/

扫什么：
  - .tsx  .jsx  → 提取字符串字面量 + JSX 文本节点（画面上的每一句字）
  - .md   .txt  → 全文（发布文案、脚本、数据台账）

输出：按类别分组的命中清单，带行号和原文。
退出码：0 无命中 / 1 有命中（可以接在脚本里做闸门）

词库来源：《广告法》第九条（绝对化用语）+ 抖音社区自律公约（导流、站外平台）
+ 医疗健康类内容规范 + 常见电商违规词。不是官方词库，是排查用的下限清单。
"""
import io
import os
import re
import sys

# ============================================================
# 词库：按风险等级和类别分。CRITICAL 是发出去大概率被限流的。
# ============================================================

RULES = [
    ("站外平台", "CRITICAL", [
        "小红书", "微博", "B站", "哔哩哔哩", "快手", "视频号", "公众号",
        "淘宝", "天猫", "京东", "拼多多", "闲鱼", "得物", "知乎", "豆瓣",
        "贴吧", "抖音商城", "YouTube", "Instagram", "Twitter", "TikTok",
    ]),
    ("导流引流", "CRITICAL", [
        "加微信", "加V", "加v", "私信我", "私我", "扫码", "二维码",
        "点击链接", "主页链接", "评论区见", "一键三连",
    ]),
    ("医疗健康功效", "CRITICAL", [
        "治疗", "治愈", "根治", "疗效", "药效", "消炎", "杀菌",
        "防癌", "抗癌", "降血压", "降血糖", "降血脂", "降三高",
        "抗认知衰退", "认知衰退", "预防疾病", "临床验证", "医学证明",
        "药到病除", "包治", "治百病",
        "康复",  # 无资质账号讲这个容易被判医疗内容
    ]),
    ("绝对化用语", "HIGH", [
        "最好", "最佳", "最强", "最大", "最高", "最低", "最便宜", "最快",
        "第一品牌", "全网第一", "销量第一", "排名第一",
        "顶级", "极致", "唯一", "首个", "首选", "独家",
        "国家级", "世界级", "最高级", "领导品牌",
        "独一无二", "史无前例", "绝无仅有", "填补空白", "万能",
        "100%", "百分百",
    ]),
    ("虚假承诺", "HIGH", [
        "永久", "彻底", "立竿见影", "立刻见效", "一次见效", "马上见效",
        "无效退款", "保证有效", "包退包换",
    ]),
    ("种草带货", "HIGH", [
        "好物", "推荐购买", "同款", "链接在", "下单", "购买链接",
        "秒杀", "清仓", "特价", "最低价", "全网最低", "包邮", "优惠券",
        "免费送", "限时抢", "错过就没了",
    ]),
    ("敏感品类", "HIGH", [
        "减肥", "瘦身", "丰胸", "壮阳", "脱发", "生发", "祛斑", "美白针",
        "抗衰", "延缓衰老", "排毒", "祛湿", "调理身体", "增强免疫",
    ]),
    ("金融理财", "HIGH", [
        "保本", "稳赚", "暴利", "收益率", "投资回报", "躺赚", "零风险",
    ]),
    ("迷信", "HIGH", [
        "风水", "招财", "转运", "辟邪", "开光", "算命", "灵验", "化煞",
    ]),
    ("运营话术", "LOW", [
        "点赞", "关注我", "转发", "求关注", "冲完播",
    ]),
    ("价格词", "LOW", [
        "块钱", "几块", "便宜", "划算", "性价比", "省钱",
    ]),
]

# 白名单：命中这些不算（避免「最近」「最后」被当成绝对化）
WHITELIST = [
    "最近", "最后", "最初", "最终", "最多", "至少",
    "最后一句", "最后一个",
]


def load_rules():
    """把词库摊平成 (词, 类别, 等级)，长词优先匹配。"""
    flat = []
    for cat, level, words in RULES:
        for w in words:
            flat.append((w, cat, level))
    flat.sort(key=lambda x: -len(x[0]))
    return flat


def is_code_value(txt):
    """判断这个字符串是不是代码里的参数值（颜色、百分比、数值），不是文案。
    典型：offset="100%"  fill="#fffaf0"  fontSize="46"  strokeWidth={6}"""
    if not txt:
        return True
    has_cn = bool(re.search(r"[\u4e00-\u9fa5]", txt))
    has_word = bool(re.search(r"[A-Za-z]{3,}", txt))
    return not has_cn and not has_word


def extract_texts(path):
    """从源文件里提取所有可能出现在画面/文案上的文字。"""
    s = io.open(path, encoding="utf-8").read()
    lines = s.split("\n")
    out = []
    ext = os.path.splitext(path)[1].lower()

    if ext in (".tsx", ".jsx", ".ts", ".js"):
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            # 跳过纯 import / 类型声明，减少噪音
            if stripped.startswith("import ") or stripped.startswith("//"):
                continue
            # 字符串字面量：双引号、单引号、反引号
            for m in re.finditer(
                r'"([^"\\]*(?:\\.[^"\\]*)*)"'
                r"|'([^'\\]*(?:\\.[^'\\]*)*)'"
                r"|`([^`]*)`",
                line,
            ):
                txt = m.group(1) or m.group(2) or m.group(3) or ""
                txt = txt.strip()
                if txt and not is_code_value(txt):
                    out.append((i, txt))
            # JSX 文本节点 >中文<
            for m in re.finditer(r">([^<>{}]*[\u4e00-\u9fa5][^<>{}]*)<", line):
                txt = m.group(1).strip()
                if txt:
                    out.append((i, txt))
    else:
        for i, line in enumerate(lines, 1):
            if line.strip():
                out.append((i, line.strip()))

    return out


def check(path, rules):
    hits = []
    for lineno, text in extract_texts(path):
        for word, cat, level in rules:
            if word not in text:
                continue
            # 白名单：如果这个词只是白名单词的一部分，跳过
            skip = False
            for wl in WHITELIST:
                if word in wl and wl in text:
                    skip = True
                    break
            if skip:
                continue
            hits.append((lineno, text, word, cat, level))
    return hits


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print(__doc__)
        return 0

    targets = []
    for a in args:
        if os.path.isdir(a):
            for root, _, files in os.walk(a):
                for f in files:
                    if os.path.splitext(f)[1].lower() in (
                        ".tsx", ".jsx", ".ts", ".js", ".md", ".txt"
                    ):
                        targets.append(os.path.join(root, f))
        elif os.path.isfile(a):
            targets.append(a)
        else:
            print(f"找不到：{a}")

    rules = load_rules()
    total = 0
    critical = 0

    for path in targets:
        hits = check(path, rules)
        if not hits:
            continue
        print("=" * 62)
        print(f"{os.path.basename(path)}  命中 {len(hits)} 处")
        print("=" * 62)
        # 按等级排序：CRITICAL → HIGH → LOW
        order = {"CRITICAL": 0, "HIGH": 1, "LOW": 2}
        hits.sort(key=lambda h: (order.get(h[4], 3), h[0]))
        for lineno, text, word, cat, level in hits:
            mark = "!!" if level == "CRITICAL" else ("!" if level == "HIGH" else "·")
            print(f"  {mark} L{lineno:<5} [{level}/{cat}] 「{word}」")
            print(f"      {text[:90]}")
        print()
        total += len(hits)
        critical += sum(1 for h in hits if h[4] == "CRITICAL")

    print("-" * 62)
    if total == 0:
        print("✅ 未命中任何违禁词")
        return 0
    print(f"共 {total} 处命中，其中 CRITICAL {critical} 处")
    if critical:
        print("!! CRITICAL 是发出去大概率被限流的，必须改")
    print("· LOW 是提示，不一定要改（价格词、运营话术看语境）")
    return 1


if __name__ == "__main__":
    sys.exit(main())

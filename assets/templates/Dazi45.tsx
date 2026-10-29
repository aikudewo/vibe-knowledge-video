import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { SANS, SERIF } from "./Neon";

/* ============================================================
   《大字理论》· 纸感长镜版 · 45 秒 / 1350 帧 / 一条镜头 0 硬切

   主张：这一代人的养生，不是在找更好的方法，是把方法减到不用记。

   ◆ 三个世界，一条镜头（风格变换不靠硬切，靠换光）
     段 1–3  暖米白纸感   人手，墨线抖动 ON
     段 3 末 灯灭         划掉三行 → 画面压到近黑
     段 4–6  暗场         仪表斜板、玻璃卡、发光曲线，抖动 OFF
     段 6 末 灯亮         分数落地后退回暖白
     段 7–8  暖米白纸感   抖动回来，收

   配色分工：陶土红 = 人 / 结论；靛蓝 = 数据 / 仪表 / 被量的那个人

   空间轴
     起点   餐桌 500–1120      小人 1250   段1
     站 1   词卡 1400–2060     小人 1250   段2
     站 1′  三条 1400–2040     小人 1250   段3（同位替换）
     站 2   仪表板 1672–2432   小人 2050   段4（三维斜板）
     站 3   数据 2190–2962     小人 2050   段5
     站 3′  分布 2200–2860     小人 2050   段6（同位替换）
     站 4   窗   2800–3200     小人 2600   段7
     收尾   压白                            段8
   ============================================================ */

const FLOOR = 800;

const P = {
  paper: "#f4ecdc",
  paper2: "#e9dcc3",
  ink: "#2b2622",
  soft: "rgba(43,38,34,0.84)",
  faint: "rgba(43,38,34,0.64)",
  line: "rgba(43,38,34,0.28)",
  clay: "#c4532f",
  mustard: "#e7b23f",
  sage: "#8fae7c",
  indigo: "#3b4a6b",
};

/* 暗场用色 */
const D = {
  bg: "#101215",
  card: "rgba(238,234,224,0.06)",
  edge: "rgba(238,234,224,0.16)",
  ink: "#f2eee4",
  soft: "rgba(242,238,228,0.78)",
  faint: "rgba(242,238,228,0.5)",
  line: "rgba(242,238,228,0.2)",
  indigo: "#8fb4e6",
  clay: "#e87848",
  sage: "#9fc48a",
  mustard: "#f0c463",
};

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const r = Math.round(A[0] + (B[0] - A[0]) * t);
  const g = Math.round(A[1] + (B[1] - A[1]) * t);
  const bl = Math.round(A[2] + (B[2] - A[2]) * t);
  return `rgb(${r},${g},${bl})`;
};

type KF = { f: number } & Record<string, number>;
function kf<T extends KF>(list: T[], f: number): T {
  if (f <= list[0].f) return list[0];
  const last = list[list.length - 1];
  if (f >= last.f) return last;
  let i = 0;
  while (i < list.length - 2 && f > list[i + 1].f) i++;
  const a = list[i];
  const b = list[i + 1];
  const t = smooth((f - a.f) / (b.f - a.f));
  const o: Record<string, number> = { f };
  for (const k of Object.keys(a)) {
    if (k === "f") continue;
    o[k] = a[k] + (b[k] - a[k]) * t;
  }
  return o as T;
}

const em = (f: number, start: number, dur = 12) => {
  const e = smooth(clamp01((f - start) / dur));
  return { op: e, sc: 0.94 + 0.06 * e, dy: (1 - e) * 16 };
};
const out = (f: number, start: number, dur = 12) => 1 - smooth(clamp01((f - start) / dur));

/* ---------------- 摄像机 ---------------- */
const CAM = [
  { f: 0, cx: 1000, cy: 545, k: 1.02 },
  { f: 130, cx: 1150, cy: 545, k: 1.03 },
  { f: 319, cx: 1300, cy: 546, k: 1.042 },
  { f: 511, cx: 1340, cy: 546, k: 1.05 },
  { f: 654, cx: 2050, cy: 548, k: 1.082 },
  { f: 798, cx: 2450, cy: 549, k: 1.098 },
  { f: 910, cx: 2480, cy: 549, k: 1.11 },
  { f: 1021, cx: 2940, cy: 550, k: 1.13 },
  { f: 1350, cx: 3200, cy: 551, k: 1.168 },
];

/* ---------------- 小人 ---------------- */
type GK = { f: number; x: number; hip: number; tRot: number; lRot: number; aR: number; aL: number; walk: number };
const GUIDE: GK[] = [
  { f: 0, x: 1250, hip: 650, tRot: 0, lRot: 0, aR: 12, aL: -12, walk: 0 },
  { f: 40, x: 1250, hip: 650, tRot: -5, lRot: 0, aR: 12, aL: -70, walk: 0 },
  { f: 112, x: 1250, hip: 650, tRot: -5, lRot: 0, aR: 12, aL: -70, walk: 0 },
  { f: 132, x: 1250, hip: 650, tRot: 0, lRot: 0, aR: 12, aL: -12, walk: 0 },
  { f: 158, x: 1250, hip: 650, tRot: -3, lRot: 0, aR: 74, aL: -8, walk: 0 },
  { f: 312, x: 1250, hip: 650, tRot: -3, lRot: 0, aR: 74, aL: -8, walk: 0 },
  { f: 332, x: 1250, hip: 650, tRot: -2, lRot: 0, aR: 58, aL: -8, walk: 0 },
  { f: 505, x: 1250, hip: 650, tRot: -2, lRot: 0, aR: 58, aL: -8, walk: 0 },
  { f: 511, x: 1250, hip: 650, tRot: 0, lRot: 0, aR: 12, aL: -12, walk: 1 },
  { f: 620, x: 2050, hip: 650, tRot: 0, lRot: 0, aR: 12, aL: -12, walk: 0 },
  { f: 640, x: 2050, hip: 650, tRot: -3, lRot: 0, aR: 40, aL: -10, walk: 0 },
  { f: 700, x: 2050, hip: 650, tRot: -3, lRot: 0, aR: 62, aL: -8, walk: 0 },
  { f: 790, x: 2050, hip: 650, tRot: -3, lRot: 0, aR: 62, aL: -8, walk: 0 },
  { f: 806, x: 2050, hip: 650, tRot: -2, lRot: 0, aR: 44, aL: -8, walk: 0 },
  { f: 900, x: 2050, hip: 650, tRot: -2, lRot: 0, aR: 44, aL: -8, walk: 0 },
  { f: 910, x: 2050, hip: 650, tRot: 0, lRot: 0, aR: 12, aL: -12, walk: 1 },
  { f: 1021, x: 2600, hip: 650, tRot: 0, lRot: 0, aR: 12, aL: -12, walk: 0 },
  { f: 1060, x: 2620, hip: 650, tRot: -2, lRot: 0, aR: 26, aL: -10, walk: 0 },
  { f: 1350, x: 2800, hip: 650, tRot: -2, lRot: 0, aR: 26, aL: -10, walk: 0 },
];

const Guide: React.FC<{ f: number; ghost: number; op: number; dark: number }> = ({ f, ghost, op, dark }) => {
  const g = kf(GUIDE, f);
  const sw = g.walk * Math.sin(f * 0.62) * 11;
  const bob = g.walk * Math.abs(Math.sin(f * 0.62)) * -4;
  const rad = (d: number) => (d * Math.PI) / 180;
  const fillOp = 1 - ghost;

  const body = mix(P.indigo, "#2d405e", dark);
  const edge = mix(P.ink, "#e6e2d8", dark);
  const head = mix(P.paper, "#191d23", dark);

  return (
    <g transform={`translate(${g.x} ${g.hip + bob})`} filter="url(#liftS)" opacity={op}>
      <ellipse cx={0} cy={152} rx={58} ry={9} fill={dark > 0.5 ? "rgba(0,0,0,0.4)" : "rgba(90,70,45,0.16)"} />
      <line x1={-14} y1={0} x2={-14 + sw} y2={150} stroke={edge} strokeWidth={12} strokeLinecap="round" />
      <line x1={14} y1={0} x2={14 - sw} y2={150} stroke={edge} strokeWidth={12} strokeLinecap="round" />
      <g transform={`rotate(${g.tRot})`}>
        <rect x={-30} y={-150} width={60} height={154} rx={28} fill={body} fillOpacity={fillOp} stroke={edge} strokeWidth={4} />
        <line x1={0} y1={-146} x2={0} y2={-166} stroke={edge} strokeWidth={9} />
        <circle cx={0} cy={-196} r={38} fill={head} fillOpacity={fillOp} stroke={edge} strokeWidth={4.2} />
        <path d="M -35 -206 Q -28 -244 0 -242 Q 28 -240 35 -208" fill="none" stroke={edge} strokeWidth={7} strokeLinecap="round" />
        <circle cx={-13} cy={-198} r={4.2} fill={edge} opacity={1 - 0.5 * ghost} />
        <circle cx={13} cy={-198} r={4.2} fill={edge} opacity={1 - 0.5 * ghost} />
        <path d="M -7 -176 q 7 6 14 0" fill="none" stroke={edge} strokeWidth={3.4} strokeLinecap="round" opacity={1 - 0.5 * ghost} />
        <line x1={26} y1={-136} x2={26 + Math.sin(rad(g.aR)) * 92} y2={-136 + Math.cos(rad(g.aR)) * 92} stroke={edge} strokeWidth={10} strokeLinecap="round" />
        <line x1={-26} y1={-136} x2={-26 + Math.sin(rad(g.aL)) * 92} y2={-136 + Math.cos(rad(g.aL)) * 92} stroke={edge} strokeWidth={10} strokeLinecap="round" />
      </g>
    </g>
  );
};

/* ---------------- 纸片 / 背景 / 文本行 ---------------- */
const Paper: React.FC<{
  x: number; y: number; w: number; h: number;
  rot?: number; fill?: string; op?: number; sc?: number; dark?: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, rot = 0, fill = "#fffaf0", op = 1, sc = 1, dark = 0, children }) => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const f2 = mix(fill, "#1b1f25", dark);
  const st = dark > 0.5 ? "rgba(238,234,224,0.16)" : "rgba(43,38,34,0.13)";
  return (
    <g opacity={op} transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${sc}) translate(${-cx} ${-cy})`}>
      <path d={`M ${x + 4} ${y + 3} L ${x + w - 5} ${y} L ${x + w} ${y + h - 4} L ${x + 3} ${y + h} Z`} fill={f2} stroke={st} strokeWidth={1.6} filter="url(#lift)" />
      {children}
    </g>
  );
};

const PaperBg: React.FC<{ dark: number }> = ({ dark }) => (
  <AbsoluteFill style={{ backgroundColor: mix(P.paper, D.bg, dark) }}>
    <svg width="1920" height="1080" style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="11" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <filter id="lift" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="9" stdDeviation="11" floodColor="#8a6a44" floodOpacity="0.3" />
        </filter>
        <filter id="liftS" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#8a6a44" floodOpacity="0.28" />
        </filter>
        <radialGradient id="lampg" cx="32%" cy="18%" r="85%">
          <stop offset="0%" stopColor="rgba(255,246,222,0.9)" />
          <stop offset="100%" stopColor="rgba(255,246,222,0)" />
        </radialGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#lampg)" opacity={1 - dark} />
      <rect width="1920" height="1080" filter="url(#grain)" opacity={0.07 - 0.045 * dark} style={{ mixBlendMode: "multiply" }} />
    </svg>
  </AbsoluteFill>
);

const Line: React.FC<{
  f: number; start: number; dur?: number; x?: number; y: number;
  size?: number; color?: string; text: string; op?: number; sans?: boolean; ls?: string; anchor?: "start" | "middle";
}> = ({ f, start, dur = 14, x = 120, y, size = 56, color = P.ink, text, op = 1, sans, ls, anchor }) => {
  const e = em(f, start, dur);
  return (
    <g opacity={e.op * op} transform={`translate(0 ${e.dy})`}>
      <text x={x} y={y} textAnchor={anchor} fontFamily={sans ? SANS : SERIF} fontSize={size} fill={color} letterSpacing={ls}>{text}</text>
    </g>
  );
};

/* ---------------- 段1：餐桌 + 奶茶 + 1.5L 水瓶 ---------------- */
const Table: React.FC = () => (
  <g>
    <path d="M 560 596 L 1150 596 L 1180 664 L 590 664 Z" fill={P.paper2} stroke={P.ink} strokeWidth={4.4} strokeLinejoin="round" filter="url(#liftS)" />
    <path d="M 590 664 L 1180 664 L 1180 692 L 590 692 Z" fill="#d5c4a2" stroke={P.ink} strokeWidth={4.4} strokeLinejoin="round" />
    <line x1={672} y1={692} x2={672} y2={FLOOR} stroke={P.ink} strokeWidth={21} strokeLinecap="round" />
    <line x1={1104} y1={692} x2={1104} y2={FLOOR} stroke={P.ink} strokeWidth={21} strokeLinecap="round" />
  </g>
);

const Drinks: React.FC<{ f: number }> = ({ f }) => {
  const a = em(f, 20, 14);
  const b = em(f, 30, 14);
  return (
    <g>
      <g opacity={a.op} transform={`translate(0 ${a.dy})`}>
        <path d="M 740 596 L 749 464 L 821 464 L 830 596 Z" fill={P.paper} stroke={P.ink} strokeWidth={4} strokeLinejoin="round" filter="url(#liftS)" />
        <path d="M 744 522 L 826 522 L 829 593 L 741 593 Z" fill="rgba(196,83,47,0.32)" />
        <rect x={735} y={446} width={100} height={22} rx={5} fill={P.paper2} stroke={P.ink} strokeWidth={3.6} />
        <line x1={800} y1={446} x2={812} y2={380} stroke={P.ink} strokeWidth={5.2} strokeLinecap="round" />
        <line x1={758} y1={494} x2={806} y2={494} stroke="rgba(43,38,34,0.42)" strokeWidth={2.4} strokeLinecap="round" />
      </g>
      <g opacity={b.op} transform={`translate(0 ${b.dy})`}>
        <path d="M 898 596 L 901 442 Q 903 416 924 410 L 924 380 L 966 380 L 966 410 Q 987 416 989 442 L 992 596 Z" fill="rgba(59,74,107,0.05)" stroke={P.ink} strokeWidth={4} strokeLinejoin="round" filter="url(#liftS)" />
        <path d="M 902 476 L 988 476 L 991 592 L 899 592 Z" fill="rgba(59,74,107,0.32)" />
        <line x1={901} y1={476} x2={989} y2={476} stroke="rgba(59,74,107,0.8)" strokeWidth={3.4} />
        <rect x={918} y={354} width={54} height={28} rx={5} fill={P.paper2} stroke={P.ink} strokeWidth={3.6} />
        <line x1={900} y1={440} x2={916} y2={440} stroke="rgba(43,38,34,0.4)" strokeWidth={2.6} strokeLinecap="round" />
        <line x1={900} y1={556} x2={916} y2={556} stroke="rgba(43,38,34,0.4)" strokeWidth={2.6} strokeLinecap="round" />
        <line x1={900} y1={576} x2={916} y2={576} stroke="rgba(43,38,34,0.4)" strokeWidth={2.6} strokeLinecap="round" />
        <rect x={902} y={498} width={86} height={48} rx={3} fill="#fffaf0" opacity={0.95} />
        <text x={945} y={532} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill={P.indigo}>1.5L</text>
      </g>
    </g>
  );
};

/* ---------------- 段2：四张词卡，四个「大」对齐 ---------------- */
const WORDS = [
  { big: "大", small: "水", note: "1.5L 随身" },
  { big: "大", small: "睡", note: "八小时" },
  { big: "大", small: "菜", note: "300–500g" },
  { big: "大", small: "走", note: "不配速" },
];

const BigCards: React.FC<{ f: number }> = ({ f }) => {
  const W = 150;
  const H = 252;
  const Y = 356;
  const baseX = 1400;
  const gap = 20;
  const alive = out(f, 300, 20);
  const alignOn = smooth(clamp01((f - 246) / 18)) * alive;

  return (
    <g>
      {WORDS.map((w, i) => {
        const e = em(f, 158 + i * 16, 12);
        const x = baseX + i * (W + gap);
        const cx = x + W / 2;
        return (
          <Paper key={w.small} x={x} y={Y} w={W} h={H} rot={i % 2 ? 0.8 : -0.7} op={e.op * alive} sc={e.sc} fill="#fffaf0">
            <text x={cx} y={Y + 100} textAnchor="middle" fontFamily={SERIF} fontSize={84} fill={P.clay}>{w.big}</text>
            <text x={cx} y={Y + 174} textAnchor="middle" fontFamily={SERIF} fontSize={46} fill={P.ink}>{w.small}</text>
            <line x1={x + 24} y1={Y + 196} x2={x + W - 24} y2={Y + 196} stroke={P.line} strokeWidth={2} />
            <text x={cx} y={Y + 228} textAnchor="middle" fontFamily={SANS} fontSize={21} fill={P.faint}>{w.note}</text>
          </Paper>
        );
      })}
      <line
        x1={baseX - 14}
        y1={Y + 122}
        x2={baseX + 4 * (W + gap) - gap + 14}
        y2={Y + 122}
        stroke={P.clay}
        strokeWidth={2.4}
        strokeDasharray="9 9"
        opacity={0.46 * alignOn}
      />
    </g>
  );
};

/* ---------------- 段3：三条「不要求」，逐条划掉 → 灯灭时被扫走 ---------------- */
const REQ = ["不要求配速", "不要求步数破万", "不要求穿专业装备"];

const NoReq: React.FC<{ f: number }> = ({ f }) => {
  const e = em(f, 332, 14);
  /* 灯灭的一瞬间，这张卡被扫出画外：位移 + 旋转 + 淡出 */
  const swipe = smooth(clamp01((f - 492) / 22));
  const alive = 1 - swipe;

  return (
    <g opacity={e.op * alive} transform={`translate(${-340 * swipe} ${e.dy + 90 * swipe}) rotate(${-9 * swipe} 1710 480)`}>
      <Paper x={1380} y={318} w={660} h={330} rot={-0.5} fill="#fffaf0">
        <text x={1420} y={368} fontFamily={SANS} fontSize={24} fill={P.indigo} letterSpacing="0.2em">大走 · 定义</text>
        <line x1={1420} y1={384} x2={2000} y2={384} stroke={P.line} strokeWidth={2} />
        {REQ.map((t, i) => {
          const rowIn = smooth(clamp01((f - (350 + i * 24)) / 14));
          const p = smooth(clamp01((f - (414 + i * 26)) / 16));
          const y = 442 + i * 62;
          const w = t.length * 40 + 20;
          return (
            <g key={t} opacity={rowIn}>
              <text x={1420} y={y} fontFamily={SERIF} fontSize={40} fill={P.ink}>{t}</text>
              <line x1={1416} y1={y - 14} x2={1416 + w * p} y2={y - 14} stroke={P.clay} strokeWidth={4.4} strokeLinecap="round" opacity={0.86} />
            </g>
          );
        })}
      </Paper>
    </g>
  );
};

/* ---------------- 段4：三维斜的仪表板 ---------------- */
const DIALS = [
  { cx: 1815, cy: 428, label: "步数", val: "8421", base: -34, sweep: 22 },
  { cx: 1815, cy: 598, label: "卡路里", val: "1860", base: 18, sweep: 26 },
  { cx: 2285, cy: 424, label: "睡眠分", val: "76", base: -62, sweep: 16 },
  { cx: 2285, cy: 594, label: "体脂率", val: "22.4", base: 8, sweep: 20 },
];

const SQ = 0.84; /* 盘面透视压缩 */

const Dial: React.FC<{ f: number; d: (typeof DIALS)[number]; op: number; rise: number }> = ({ f, d, op, rise }) => {
  const R = 72;
  /* 入场：指针从最左扫到目标位 */
  const spin = smooth(clamp01((f - 566) / 26));
  const target = d.base + Math.sin(f * 0.055 + d.cx * 0.013) * d.sweep;
  const th = -122 + (target + 122) * spin;
  const rad = (a: number) => (a * Math.PI) / 180;
  const pt = (a: number, r: number): [number, number] => [d.cx + Math.sin(rad(a)) * r, d.cy - Math.cos(rad(a)) * r * SQ];

  const [nx, ny] = pt(th, R - 26);

  return (
    <g opacity={op}>
      <ellipse cx={d.cx} cy={d.cy} rx={R} ry={R * SQ} fill="rgba(143,180,230,0.05)" stroke={D.ink} strokeWidth={3.2} />
      {Array.from({ length: 13 }, (_, i) => {
        const a = -120 + i * 20;
        const major = i % 3 === 0;
        const [x1, y1] = pt(a, R - 7);
        const [x2, y2] = pt(a, R - (major ? 20 : 14));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={major ? D.indigo : D.faint} strokeWidth={major ? 3 : 1.7} strokeLinecap="round" />;
      })}
      <line x1={d.cx} y1={d.cy} x2={nx} y2={ny} stroke={D.clay} strokeWidth={5} strokeLinecap="round" />
      <circle cx={d.cx} cy={d.cy} r={5.5} fill={D.ink} />
      <text x={d.cx} y={d.cy + 44} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={30} fill={D.ink}>{d.val}</text>
      <text x={d.cx} y={d.cy + R * SQ + 32} textAnchor="middle" fontFamily={SANS} fontSize={22} fill={D.soft}>{d.label}</text>
    </g>
  );
};

const Dials: React.FC<{ f: number; dark: number }> = ({ f, dark }) => {
  const o = em(f, 552, 18).op * out(f, 642, 14);
  const rise = smooth(clamp01((f - 552) / 30));
  const dy = (1 - rise) * 120;

  return (
    <g opacity={o} transform={`translate(0 ${dy})`}>
      {/* 斜板：顶面 + 前唇，和餐桌同一套透视 */}
      <path d="M 1700 352 L 2400 334 L 2440 690 L 1668 712 Z" fill="#1b2027" stroke="rgba(238,234,224,0.22)" strokeWidth={3} strokeLinejoin="round" filter="url(#liftS)" />
      <path d="M 1668 712 L 2440 690 L 2440 712 L 1668 734 Z" fill="#12161b" stroke="rgba(238,234,224,0.22)" strokeWidth={3} strokeLinejoin="round" />
      <path d="M 1706 366 L 2394 348 L 2432 676 L 1676 698 Z" fill="none" stroke="rgba(143,180,230,0.16)" strokeWidth={1.6} />
      {DIALS.map((d) => (
        <Dial key={d.label} f={f} d={d} op={1} rise={rise} />
      ))}
    </g>
  );
};

/* ---------------- 段5：三张玻璃数据卡 ---------------- */
const DATA = [
  { n: "7390", u: "万台", l1: "2025 中国", l2: "腕戴设备", note: "同比 +20.8%", col: D.indigo },
  { n: "2.3", u: "亿", l1: "挑战月均", l2: "睡眠 90 分", note: "话题浏览", col: D.indigo },
  { n: "100", u: "万+", l1: "教你骗过", l2: "手表", note: "教程获赞", col: D.indigo },
];

const DataCards: React.FC<{ f: number; dark: number }> = ({ f, dark }) => {
  const alive = out(f, 782, 18);
  const W = 240;
  const H = 288;
  const Y = 338;
  return (
    <g>
      {DATA.map((d, i) => {
        const e = em(f, 652 + i * 14, 16);
        const x = 2190 + i * (W + 26);
        /* 入场带一点立体：从后往前倾 */
        const tilt = (1 - e.op) * (i % 2 ? 4 : -4);
        return (
          <Paper key={d.n} x={x} y={Y} w={W} h={H} rot={tilt} op={e.op * alive} sc={0.9 + 0.1 * e.op} fill="#fffaf0" dark={dark}>
            <rect x={x + 22} y={Y + 40} width={5} height={44} rx={2.5} fill={d.col} opacity={0.9} />
            <text x={x + 40} y={Y + 76} fontFamily={SANS} fontWeight={700} fontSize={40} fill={d.col}>{d.n}</text>
            <text x={x + 40 + d.n.length * 24} y={Y + 76} fontFamily={SANS} fontSize={22} fill={dark > 0.5 ? D.soft : P.soft}>{d.u}</text>
            <text x={x + 22} y={Y + 132} fontFamily={SANS} fontSize={22} fill={dark > 0.5 ? D.soft : P.soft}>{d.l1}</text>
            <text x={x + 22} y={Y + 162} fontFamily={SANS} fontSize={22} fill={dark > 0.5 ? D.soft : P.soft}>{d.l2}</text>
            <line x1={x + 22} y1={Y + 194} x2={x + W - 22} y2={Y + 194} stroke={dark > 0.5 ? D.line : P.line} strokeWidth={2} />
            <text x={x + 22} y={Y + 232} fontFamily={SANS} fontSize={21} fill={dark > 0.5 ? D.faint : P.faint}>{d.note}</text>
          </Paper>
        );
      })}
    </g>
  );
};

/* ---------------- 段6：人群分布 + 两个分数（暗场里发光） ---------------- */
const gaussY = (x: number) => 618 - 208 * Math.exp(-Math.pow((x - 2530) / 172, 2));

const Curve: React.FC<{ f: number; dark: number }> = ({ f, dark }) => {
  const alive = out(f, 876, 16);
  const e = em(f, 800, 16);
  const pts: string[] = [];
  for (let x = 2230; x <= 2830; x += 20) pts.push(`${x} ${gaussY(x).toFixed(1)}`);
  const d = `M ${pts.join(" L ")}`;
  const grow = smooth(clamp01((f - 812) / 26));
  const drop = (start: number) => {
    /* 分数从上方落下，带一次轻微回弹 */
    const t = clamp01((f - start) / 18);
    const o = 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
    return { y: -150 * (1 - o), op: smooth(clamp01((f - start) / 8)) };
  };
  const a1 = drop(846);
  const a2 = drop(862);
  const lineIn = smooth(clamp01((f - 828) / 20));

  return (
    <g opacity={e.op * alive} transform={`translate(0 ${e.dy})`}>
      <Paper x={2200} y={340} w={660} h={340} rot={0.4} fill="#fffaf0" dark={dark}>
        <text x={2236} y={378} fontFamily={SANS} fontSize={24} fill={D.indigo} letterSpacing="0.2em">睡眠分 · 怎么给的</text>
        <line x1={2236} y1={394} x2={2824} y2={394} stroke={D.line} strokeWidth={2} />

        <line x1={2236} y1={618} x2={2824} y2={618} stroke={D.ink} strokeWidth={2.4} opacity={0.5} />
        <path d={d} fill="none" stroke={D.indigo} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={grow} filter="url(#glow)" />

        <g opacity={lineIn}>
          <line x1={2530} y1={398} x2={2530} y2={618} stroke={D.clay} strokeWidth={2.6} strokeDasharray="8 8" />
          <text x={2546} y={608} fontFamily={SANS} fontSize={21} fill={D.clay}>人群平均</text>
        </g>

        <g opacity={a1.op} transform={`translate(0 ${a1.y})`}>
          <circle cx={2392} cy={gaussY(2392)} r={26} fill={D.clay} />
          <text x={2392} y={gaussY(2392) + 9} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={24} fill="#14171c">62</text>
        </g>
        <g opacity={a2.op} transform={`translate(0 ${a2.y})`}>
          <circle cx={2692} cy={gaussY(2692)} r={26} fill={D.indigo} />
          <text x={2692} y={gaussY(2692) + 9} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={24} fill="#14171c">90</text>
        </g>

        <text x={2236} y={656} fontFamily={SANS} fontSize={21} fill={D.faint}>同一把尺子，量所有人</text>
      </Paper>
    </g>
  );
};

/* ---------------- 段7：窗 + 水壶 + 纸条（灯亮回来） ---------------- */
const Window7: React.FC<{ f: number }> = ({ f }) => {
  const e = em(f, 918, 18);
  const noteIn = smooth(clamp01((f - 962) / 18)) * out(f, 1028, 34);
  /* 灯亮的暖光晕：从窗里涨出来 */
  const bloom = smooth(clamp01((f - 896) / 56));
  return (
    <g>
      <g opacity={bloom * 0.9}>
        <ellipse cx={3000} cy={520} rx={520 * (0.6 + 0.4 * bloom)} ry={420 * (0.6 + 0.4 * bloom)} fill="url(#bloomg)" />
      </g>
      <g opacity={e.op} transform={`translate(0 ${e.dy})`}>
        <rect x={2800} y={300} width={400} height={400} fill="rgba(59,74,107,0.07)" stroke={P.ink} strokeWidth={5.4} />
        <line x1={2804} y1={486} x2={3196} y2={486} stroke="rgba(59,74,107,0.2)" strokeWidth={2.4} />
        <path d="M 2810 486 L 2810 452 L 2856 452 L 2856 486 Z" fill="rgba(59,74,107,0.13)" />
        <path d="M 2864 486 L 2864 436 L 2912 436 L 2912 486 Z" fill="rgba(59,74,107,0.17)" />
        <path d="M 2960 486 L 2960 458 L 3010 458 L 3010 486 Z" fill="rgba(59,74,107,0.13)" />
        <circle cx={3140} cy={392} r={26} fill="rgba(231,178,63,0.28)" />
        <circle cx={3110} cy={492} r={22} fill="rgba(143,174,124,0.3)" />
        <circle cx={3110} cy={500} r={14} fill="rgba(143,174,124,0.22)" />
        <line x1={3000} y1={300} x2={3000} y2={700} stroke={P.ink} strokeWidth={4} />
        <line x1={2800} y1={500} x2={3200} y2={500} stroke={P.ink} strokeWidth={4} />
        <line x1={2770} y1={700} x2={3230} y2={700} stroke={P.ink} strokeWidth={9} strokeLinecap="round" />
        <rect x={2800} y={700} width={400} height={14} fill={P.paper2} stroke={P.ink} strokeWidth={4} />

        <path d="M 2856 700 L 2856 656 Q 2856 636 2876 636 L 2916 636 Q 2936 636 2936 656 L 2936 700 Z" fill={P.sage} stroke={P.ink} strokeWidth={4} strokeLinejoin="round" filter="url(#liftS)" />
        <path d="M 2936 650 Q 2956 650 2956 668 Q 2956 686 2936 686" fill="none" stroke={P.ink} strokeWidth={5} strokeLinecap="round" />
        <line x1={2856} y1={662} x2={2936} y2={662} stroke="rgba(43,38,34,0.3)" strokeWidth={2.4} />

        <g opacity={noteIn}>
          <Paper x={3252} y={352} w={168} h={122} rot={-2.2} fill="#fdf6e6">
            <text x={3336} y={412} textAnchor="middle" fontFamily={SERIF} fontSize={30} fill={P.ink}>今天</text>
            <text x={3336} y={450} textAnchor="middle" fontFamily={SERIF} fontSize={30} fill={P.clay}>走过了</text>
          </Paper>
        </g>
      </g>
    </g>
  );
};

/* ---------------- 主组件 ---------------- */
export const Dazi45: React.FC = () => {
  const f = useCurrentFrame();
  const cam = kf(CAM, f);

  /* 灯：0 = 暖白纸感，1 = 暗场。灯灭 498–518，灯亮 894–914（都快，中间不留灰）。 */
  const dark = clamp01(smooth(clamp01((f - 498) / 20)) * (1 - smooth(clamp01((f - 894) / 20))));

  /* 抖动开关：暗场关，其余开。 */
  const boilAmt = clamp01(
    (1 - smooth(clamp01((f - 494) / 22))) + smooth(clamp01((f - 902) / 24))
  );

  const boilX = (Math.sin(f * 0.44) * 0.55 + Math.sin(f * 1.03 + 2.1) * 0.22) * boilAmt;
  const boilY = (Math.cos(f * 0.51 + 1.1) * 0.5 + Math.cos(f * 0.97 + 0.4) * 0.2) * boilAmt;

  const camT = `translate(960 540) scale(${cam.k}) translate(${-cam.cx + boilX} ${-cam.cy + boilY})`;

  const ghost = smooth(clamp01((f - 1040) / 80));
  const guideOp = 1 - 0.72 * smooth(clamp01((f - 1060) / 90));
  const white = 0.90 * smooth(clamp01((f - 1036) / 92));

  /* 段8 金句：字距缓慢张开，10 秒里一直有像素在动 */
  const lsOpen = (base: number) => `${(base + 0.12 * smooth(clamp01((f - 1046) / 300))).toFixed(4)}em`;

  /* 屏幕层文字颜色跟着灯走 */
  const T = {
    ink: mix(P.ink, "#f2eee4", dark),
    clay: mix(P.clay, "#e87848", dark),
    indigo: mix(P.indigo, "#8fb4e6", dark),
    sub: mix("#3b342c", "#d8d3c8", dark),
  };

  /* 段窗口 */
  const s1 = out(f, 116, 18);
  const s2 = em(f, 132, 14).op * out(f, 300, 20);
  const s3 = em(f, 320, 14).op * out(f, 496, 16);
  const s4 = em(f, 520, 16).op * out(f, 640, 14);
  const s5 = em(f, 652, 14).op * out(f, 780, 18);
  const s6 = em(f, 800, 14).op * out(f, 884, 16);
  const s7 = em(f, 918, 14).op * out(f, 1024, 24);
  const s8 = em(f, 1046, 18).op;
  const s8b = em(f, 1116, 20).op;

  return (
    <AbsoluteFill>
      <PaperBg dark={dark} />

      <svg width="1920" height="1080" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="bloomg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,238,200,0.55)" />
            <stop offset="100%" stopColor="rgba(255,238,200,0)" />
          </radialGradient>
        </defs>

        {/* ---- 会被灯光压暗的一层：房间 + 段1–3 的物件 ---- */}
        <g transform={camT}>
          <rect x={-1600} y={FLOOR} width={8000} height={340} fill="rgba(120,100,72,0.13)" />
          <line x1={-1600} y1={FLOOR} x2={5200} y2={FLOOR} stroke="rgba(43,38,34,0.22)" strokeWidth={2.4} />
          <g transform="translate(-60 0)">
            <Table />
            <Drinks f={f} />
          </g>
          <BigCards f={f} />
          <NoReq f={f} />
        </g>
      </svg>

      {/* ---- 灯：压暗整层 ---- */}
      <AbsoluteFill style={{ backgroundColor: D.bg, opacity: dark * 0.98 }} />

      {/* ---- 亮着的一层：仪表 / 数据 / 窗 / 人 ---- */}
      <svg width="1920" height="1080" style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={camT}>
          <Window7 f={f} />
          <Dials f={f} dark={dark} />
          <DataCards f={f} dark={dark} />
          <Curve f={f} dark={dark} />
          <Guide f={f} ghost={ghost} op={guideOp} dark={dark} />
        </g>
      </svg>

      {/* ---- 压白：往更亮的暖白推，不是往纸色推 ---- */}
      {white > 0.001 && <AbsoluteFill style={{ backgroundColor: "#fdf8ec", opacity: white }} />}

      {/* ---- 屏幕层 ---- */}
      <svg width="1920" height="1080" style={{ position: "absolute", left: 0, top: 0 }}>
        {/* 段1 钩子 */}
        <g opacity={s1}>
          <Line f={f} start={4} y={132} size={30} sans color={P.clay} ls="0.22em" text="一个字的答案" />
          <Line f={f} start={12} y={300} size={82} text="弱者喝饮料，" />
          <Line f={f} start={26} y={402} size={82} color={P.clay} text="强者喝大水。" />
          <Line f={f} start={44} y={944} size={40} sans color="rgba(43,38,34,0.9)" text="10 月 5 日，这句话上了热榜。" />
        </g>

        {/* 段2 现象 */}
        <g opacity={s2}>
          <Line f={f} start={136} y={196} size={28} sans color={P.clay} ls="0.22em" text="现象" />
          <Line f={f} start={150} y={300} size={62} text="这轮养生潮，都用同一个字。" />
          <Line f={f} start={214} y={944} size={40} sans color="rgba(43,38,34,0.9)" text="大水、大睡、大菜、大走。" />
        </g>

        {/* 段3 反转 */}
        <g opacity={s3}>
          <Line f={f} start={324} y={196} size={28} sans color={P.clay} ls="0.22em" text="反转" />
          <Line f={f} start={336} y={300} size={62} text="但「大」不是多的意思。" />
          <Line f={f} start={344} y={944} size={40} sans color="rgba(43,38,34,0.9)" text="「大走」的定义，是三个不要求。" op={out(f, 436, 14)} />
          <Line f={f} start={448} y={944} size={44} sans color={P.clay} text="「大」的意思是——不用量。" />
        </g>

        {/* 段4 机制 */}
        <g opacity={s4}>
          <Line f={f} start={526} y={196} size={28} sans color={T.indigo} ls="0.22em" text="机制" />
          <Line f={f} start={538} y={300} size={62} color={T.ink} text="过去十年，健康被拆成了数字。" />
          <Line f={f} start={556} y={944} size={40} sans color={T.sub} text="步数、卡路里、睡眠分、体脂率。" />
        </g>

        {/* 段5 数据 */}
        <g opacity={s5}>
          <Line f={f} start={656} y={196} size={28} sans color={T.indigo} ls="0.22em" text="数据" />
          <Line f={f} start={664} y={300} size={62} color={T.ink} text="一边买，一边学怎么骗过它。" />
          <Line f={f} start={682} y={944} size={40} sans color={T.sub} text="2025 年，中国卖出 7390 万台腕戴设备。" />
        </g>

        {/* 段6 代价 */}
        <g opacity={s6}>
          <Line f={f} start={804} y={196} size={28} sans color={T.indigo} ls="0.22em" text="代价" />
          <Line f={f} start={816} y={300} size={62} color={T.ink} text="手表给你打分，你每天都在被考核。" />
          <Line f={f} start={834} y={944} size={40} sans color={T.sub} text="评分基于人群平均，不适配每一个人。" />
        </g>

        {/* 段7 落点 */}
        <g opacity={s7}>
          <Line f={f} start={916} y={196} size={28} sans color={T.clay} ls="0.22em" text="落点" />
          <Line f={f} start={928} y={300} size={62} color={T.ink} text="「大」做的事只有一件。" />
          <Line f={f} start={948} y={944} size={40} sans color={T.sub} text="把「需要记录」，变回「做了就算」。" />
        </g>

        {/* 段8 金句：左边留窗，右边放字 */}
        <g transform={`translate(0 ${-10 * smooth(clamp01((f - 1046) / 300))})`}>
          <g opacity={s8}>
            <Line f={f} start={1052} y={470} size={74} x={1020} ls={lsOpen(0.02)} text="量得越细，做得越少。" />
          </g>
          <g opacity={s8b}>
            <Line f={f} start={1122} y={594} size={74} x={1020} ls={lsOpen(0.02)} color={P.clay} text="不用量的，才做得久。" />
            <line x1={1024} y1={650} x2={1024 + 380 * smooth(clamp01((f - 1180) / 40))} y2={650} stroke={P.clay} strokeWidth={3} opacity={0.5} strokeLinecap="round" />
          </g>
        </g>
      </svg>

      <Audio src={staticFile("bgm-qn45.wav")} volume={0.85} />
    </AbsoluteFill>
  );
};

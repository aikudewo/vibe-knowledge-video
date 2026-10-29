import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { SANS, SERIF } from "./Neon";

/* ============================================================
   《大人为什么开始玩小孩的玩具》· 纸感长镜版 · 45s
   一条镜头走完：餐桌 → 书桌 → 窗。0 次硬切。

   空间轴
     餐桌   620–1270   板 790–1120   小人 1312
     旧卡/条件卡  1400 / 1600 / 1800（w186 h280 y280–560）
     象限图 1480–1780 / y590–790
     书桌   1900–2350  小人 2200
     颈椎尺 2600–2950
     窗     3100–3450  小人 3250

   节拍 112.8 BPM｜一拍 15.957 帧｜一小节 63.83 帧｜21.15 小节
   段落：0 / 130 / 319 / 511 / 654 / 798 / 910 / 1021 / 1181 / 1250 / 1350

   每屏三层（密度红线）：
     主体图 + 数字/标签 + 注释，缺一层就重做
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

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

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
const drawOn = (f: number, start: number, dur = 14) => 1 - smooth(clamp01((f - start) / dur));

/* ---------------- 摄像机：k 单调递增 ---------------- */
const CAM = [
  { f: 0, cx: 772, cy: 545, k: 1.02 },
  { f: 130, cx: 1030, cy: 545, k: 1.03 },
  { f: 319, cx: 1190, cy: 546, k: 1.04 },
  { f: 511, cx: 1230, cy: 546, k: 1.05 },
  { f: 654, cx: 2450, cy: 548, k: 1.082 },
  { f: 798, cx: 2450, cy: 549, k: 1.1 },
  { f: 910, cx: 2460, cy: 549, k: 1.116 },
  { f: 1021, cx: 2540, cy: 550, k: 1.134 },
  { f: 1181, cx: 3250, cy: 552, k: 1.152 },
  { f: 1250, cx: 3270, cy: 552, k: 1.162 },
  { f: 1350, cx: 3290, cy: 553, k: 1.17 },
];

/* ---------------- 小人 ---------------- */
type GK = { f: number; x: number; hip: number; tRot: number; lRot: number; aR: number; aL: number; walk: number };
const GUIDE: GK[] = [
  { f: 0, x: 1312, hip: 650, tRot: 0, lRot: 0, aR: 12, aL: -12, walk: 0 },
  { f: 56, x: 1312, hip: 650, tRot: -6, lRot: 0, aR: 74, aL: -6, walk: 0 },
  { f: 118, x: 1312, hip: 650, tRot: -3, lRot: 0, aR: 40, aL: -6, walk: 0 },
  { f: 300, x: 1312, hip: 650, tRot: -3, lRot: 0, aR: 40, aL: -6, walk: 0 },
  { f: 330, x: 1312, hip: 650, tRot: 0, lRot: 0, aR: 12, aL: -12, walk: 0 },
  { f: 511, x: 1312, hip: 650, tRot: 0, lRot: 0, aR: 12, aL: -12, walk: 1 },
  { f: 654, x: 2200, hip: 650, tRot: 0, lRot: 0, aR: 12, aL: -12, walk: 0 },
  { f: 670, x: 2200, hip: 650, tRot: -4, lRot: 0, aR: 66, aL: -6, walk: 0 },
  { f: 880, x: 2200, hip: 650, tRot: -4, lRot: 0, aR: 66, aL: -6, walk: 0 },
  { f: 900, x: 2200, hip: 650, tRot: 0, lRot: 0, aR: 12, aL: -12, walk: 0 },
  { f: 930, x: 2200, hip: 650, tRot: -2, lRot: 0, aR: 44, aL: -6, walk: 0 },
  { f: 1021, x: 2200, hip: 650, tRot: -2, lRot: 0, aR: 44, aL: -6, walk: 1 },
  { f: 1150, x: 3100, hip: 650, tRot: 0, lRot: 0, aR: 12, aL: -12, walk: 0 },
  { f: 1166, x: 3100, hip: 650, tRot: -8, lRot: 0, aR: 96, aL: -8, walk: 0 },
  { f: 1206, x: 3100, hip: 650, tRot: -8, lRot: 0, aR: 96, aL: -8, walk: 0 },
  { f: 1230, x: 3100, hip: 650, tRot: -10, lRot: 0, aR: 128, aL: -10, walk: 0 },
  { f: 1350, x: 3100, hip: 650, tRot: -10, lRot: 0, aR: 132, aL: -10, walk: 0 },
];

const Guide: React.FC<{ f: number }> = ({ f }) => {
  const g = kf(GUIDE, f);
  const sw = g.walk * Math.sin(f * 0.62) * 11;
  const bob = g.walk * Math.abs(Math.sin(f * 0.62)) * -4;
  const rad = (d: number) => (d * Math.PI) / 180;

  return (
    <g transform={`translate(${g.x} ${g.hip + bob})`} filter="url(#liftS)">
      <ellipse cx={0} cy={152} rx={58} ry={9} fill="rgba(90,70,45,0.16)" />
      <line x1={-14} y1={0} x2={-14 + sw} y2={150} stroke={P.ink} strokeWidth={12} strokeLinecap="round" />
      <line x1={14} y1={0} x2={14 - sw} y2={150} stroke={P.ink} strokeWidth={12} strokeLinecap="round" />
      <g transform={`rotate(${g.tRot})`}>
        <rect x={-30} y={-150} width={60} height={154} rx={28} fill={P.indigo} stroke={P.ink} strokeWidth={4} />
        <line x1={0} y1={-146} x2={0} y2={-166} stroke={P.ink} strokeWidth={9} />
        <circle cx={0} cy={-196} r={38} fill={P.paper} stroke={P.ink} strokeWidth={4.2} />
        <path d="M -35 -206 Q -28 -244 0 -242 Q 28 -240 35 -208" fill="none" stroke={P.ink} strokeWidth={7} strokeLinecap="round" />
        <circle cx={-13} cy={-198} r={4.2} fill={P.ink} />
        <circle cx={13} cy={-198} r={4.2} fill={P.ink} />
        <path d="M -7 -176 q 7 6 14 0" fill="none" stroke={P.ink} strokeWidth={3.4} strokeLinecap="round" />
        <line x1={26} y1={-136} x2={26 + Math.sin(rad(g.aR)) * 92} y2={-136 + Math.cos(rad(g.aR)) * 92} stroke={P.ink} strokeWidth={10} strokeLinecap="round" />
        <line x1={-26} y1={-136} x2={-26 + Math.sin(rad(g.aL)) * 92} y2={-136 + Math.cos(rad(g.aL)) * 92} stroke={P.ink} strokeWidth={10} strokeLinecap="round" />
      </g>
    </g>
  );
};

/* ---------------- 纸片 / 背景 / 文本行 ---------------- */
const Paper: React.FC<{
  x: number; y: number; w: number; h: number;
  rot?: number; fill?: string; op?: number; sc?: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, rot = 0, fill = "#fffaf0", op = 1, sc = 1, children }) => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g opacity={op} transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${sc}) translate(${-cx} ${-cy})`}>
      <path d={`M ${x + 4} ${y + 3} L ${x + w - 5} ${y} L ${x + w} ${y + h - 4} L ${x + 3} ${y + h} Z`} fill={fill} stroke="rgba(43,38,34,0.13)" strokeWidth={1.6} filter="url(#lift)" />
      {children}
    </g>
  );
};

const PaperBg: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: P.paper }}>
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
        <linearGradient id="sun" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="rgba(255,232,168,0.55)" />
          <stop offset="1" stopColor="rgba(255,232,168,0)" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#lampg)" />
      <rect width="1920" height="1080" filter="url(#grain)" opacity={0.07} style={{ mixBlendMode: "multiply" }} />
    </svg>
  </AbsoluteFill>
);

const Line: React.FC<{
  f: number; start: number; dur?: number; x?: number; y: number;
  size?: number; color?: string; text: string; op?: number; sans?: boolean; ls?: string;
}> = ({ f, start, dur = 14, x = 120, y, size = 56, color = P.ink, text, op = 1, sans, ls }) => {
  const e = em(f, start, dur);
  return (
    <g opacity={e.op * op} transform={`translate(0 ${e.dy})`}>
      <text x={x} y={y} fontFamily={sans ? SANS : SERIF} fontSize={size} fill={color} letterSpacing={ls}>{text}</text>
    </g>
  );
};

/* ---------------- 餐桌 / 拼豆板 / 吊灯 / 照片 ---------------- */
const Table: React.FC<{ f: number }> = ({ f }) => {
  const e = em(f, 2, 14);
  return (
    <g opacity={e.op}>
      <path d="M 620 610 L 1240 610 L 1270 672 L 650 672 Z" fill={P.paper2} stroke={P.ink} strokeWidth={4} strokeLinejoin="round" filter="url(#liftS)" />
      <path d="M 650 672 L 1270 672 L 1270 694 L 650 694 Z" fill="#d5c4a2" stroke={P.ink} strokeWidth={4} strokeLinejoin="round" />
      <line x1={722} y1={694} x2={722} y2={800} stroke={P.ink} strokeWidth={17} strokeLinecap="round" />
      <line x1={1204} y1={694} x2={1204} y2={800} stroke={P.ink} strokeWidth={17} strokeLinecap="round" />
    </g>
  );
};

const COLS = 9;
const ROWS = 8;
const CW = 34;
const CH = 30;
const BX = 802;
const BY = 400;
const PATTERN = [
  ".CC...CC.",
  "CCCC.CCCC",
  "CCCCCCCCC",
  "CCCCCCCCC",
  ".CCCCCCC.",
  "..CCCCC..",
  "...CCC...",
  "...M.....",
];

const Board: React.FC<{ f: number; start?: number }> = ({ f, start = 5 }) => (
  <g>
    <Paper x={790} y={386} w={330} h={268} rot={-1.2} fill="#f7ecd6" op={em(f, start, 12).op} sc={em(f, start, 12).sc}>
      {PATTERN.map((row, r) =>
        row.split("").map((ch, c) => {
          const i = r * COLS + c;
          const e = em(f, start + 7 + i * 0.58, 8);
          const x = BX + c * CW;
          const y = BY + r * CH;
          const fill = ch === "C" ? P.clay : ch === "M" ? P.mustard : ch === "S" ? P.sage : "none";
          return (
            <g key={i} opacity={e.op}>
              <rect x={x + 2} y={y + 2} width={CW - 4} height={CH - 4} rx={5} fill={fill}
                stroke={ch === "." ? "rgba(43,38,34,0.16)" : P.ink} strokeWidth={ch === "." ? 1.5 : 2.4} />
              {ch !== "." && (
                <line x1={x + 7} y1={y + 7} x2={x + CW - 11} y2={y + 7} stroke={P.paper} strokeWidth={2.6} opacity={0.45} strokeLinecap="round" />
              )}
            </g>
          );
        })
      )}
    </Paper>
    {[{ x: 700, y: 646 }, { x: 1170, y: 634 }, { x: 1140, y: 660 }, { x: 748, y: 628 }].map((d, i) => (
      <circle key={i} cx={d.x} cy={d.y} r={8} fill={i % 2 ? P.sage : P.mustard} stroke={P.ink} strokeWidth={2.2} opacity={em(f, 30 + i * 4, 8).op} />
    ))}
  </g>
);

const Lamp: React.FC<{ f: number }> = ({ f }) => (
  <g opacity={em(f, 8, 14).op}>
    <line x1={940} y1={130} x2={940} y2={292} stroke={P.ink} strokeWidth={3.4} />
    <path d="M 892 292 L 988 292 L 1014 348 L 866 348 Z" fill={P.mustard} stroke={P.ink} strokeWidth={4} strokeLinejoin="round" filter="url(#liftS)" />
    <ellipse cx={940} cy={348} rx={74} ry={9} fill="#f8e6b6" stroke={P.ink} strokeWidth={3} />
  </g>
);

const WallNote: React.FC<{ f: number }> = ({ f }) => (
  <g opacity={em(f, 124, 14).op} transform="translate(716 300) rotate(-2.6)">
    <rect x={-74} y={-86} width={148} height={172} fill="#fbf3e0" stroke={P.ink} strokeWidth={3.4} filter="url(#liftS)" />
    <rect x={-58} y={-70} width={116} height={110} fill={P.paper2} stroke={P.ink} strokeWidth={2.6} />
    <path d="M -30 22 L -12 -6 L 4 14 L 18 -14 L 38 24 Z" fill={P.sage} stroke={P.ink} strokeWidth={2.4} />
    <circle cx={-20} cy={-38} r={7} fill={P.mustard} stroke={P.ink} strokeWidth={2.2} />
    <circle cx={0} cy={-96} r={5} fill={P.clay} stroke={P.ink} strokeWidth={2} />
  </g>
);

/* ---------------- 三张旧卡（带用途标签，多一层信息） ---------------- */
const HistCard: React.FC<{
  x: number; y: number; w: number; h: number; rot: number;
  year: string; where: string; who: string; note: string; use: string;
  op: number; sc: number; kind: 1 | 2 | 3;
}> = ({ x, y, w, h, rot, year, where, who, note, use, op, sc, kind }) => {
  const cx = x + w / 2;
  const fy = y + 162;
  return (
    <Paper x={x} y={y} w={w} h={h} rot={rot} op={op} sc={sc} fill="#fbf1dc">
      <text x={x + 16} y={y + 52} fontFamily={SANS} fontWeight={700} fontSize={42} fill={P.ink}>{year}</text>
      <text x={x + 16} y={y + 84} fontFamily={SANS} fontSize={21} fill={P.soft}>{where}</text>
      <line x1={x + 16} y1={y + 98} x2={x + w - 16} y2={y + 98} stroke={P.line} strokeWidth={2} />

      <g transform={`translate(${cx} ${fy})`} stroke={P.ink} strokeWidth={3} fill="none" strokeLinecap="round">
        {kind === 1 && (
          <>
            <path d="M -28 18 Q -34 -6 -15 -12 L 13 -12 Q 28 -8 30 10 Q 30 22 20 24 L -17 24 Q -26 24 -28 18 Z" fill={P.paper} />
            <path d="M -12 -12 L -16 -30 Q -14 -37 -7 -35" />
            <path d="M 3 -12 L 5 -34 Q 8 -41 14 -38" />
            <circle cx={20} cy={-26} r={7} fill={P.clay} stroke={P.ink} strokeWidth={2.2} />
          </>
        )}
        {kind === 2 && (
          <>
            <circle cx={0} cy={-20} r={14} fill={P.paper} />
            <path d="M -12 -8 L -18 22 L 18 22 L 12 -8 Z" fill={P.sage} />
            <line x1={-18} y1={22} x2={-20} y2={33} />
            <line x1={18} y1={22} x2={20} y2={33} />
            <circle cx={-5} cy={-22} r={2.2} fill={P.ink} />
            <circle cx={5} cy={-22} r={2.2} fill={P.ink} />
          </>
        )}
        {kind === 3 && (
          <>
            <circle cx={-3} cy={-24} r={14} fill={P.paper} />
            <path d="M 10 -17 Q 19 -7 17 4" />
            <path d="M -19 5 L -26 32 L 21 32 L 14 3 Z" fill={P.indigo} />
            <circle cx={-8} cy={-24} r={2.2} fill={P.ink} />
            <circle cx={2} cy={-24} r={2.2} fill={P.ink} />
          </>
        )}
      </g>

      <text x={cx} y={y + 236} textAnchor="middle" fontFamily={SERIF} fontSize={30} fill={kind === 3 ? P.clay : P.ink}>{who}</text>
      <line x1={x + 16} y1={y + 248} x2={x + w - 16} y2={y + 248} stroke={P.line} strokeWidth={2} />
      <text x={cx} y={y + 271} textAnchor="middle" fontFamily={SANS} fontSize={22} letterSpacing="0.12em" fill={kind === 3 ? P.clay : P.sage}>{use}</text>
    </Paper>
  );
};

/* ---------------- 三张条件卡（每张带一个迷你图） ---------------- */
const CondCard: React.FC<{
  x: number; y: number; w: number; h: number; rot: number;
  n: string; t: string; note: string; op: number; sc: number; kind: 1 | 2 | 3; f: number; start: number;
}> = ({ x, y, w, h, rot, n, t, note, op, sc, kind, f, start }) => {
  const cx = x + w / 2;
  const gy = y + 158;
  return (
    <Paper x={x} y={y} w={w} h={h} rot={rot} op={op} sc={sc} fill="#fbf1dc">
      <text x={x + 16} y={y + 46} fontFamily={SANS} fontSize={21} letterSpacing="0.2em" fill={P.clay}>{n}</text>
      <text x={x + 16} y={y + 84} fontFamily={SERIF} fontSize={37} fill={P.ink}>{t}</text>
      <line x1={x + 16} y1={y + 94} x2={x + w - 16} y2={y + 94} stroke={P.line} strokeWidth={2} />

      <g transform={`translate(${cx} ${gy})`}>
        {/* 1 目标明确：靶心 + 一条"就这一张"的指示 */}
        {kind === 1 && (
          <>
            <circle cx={-16} cy={0} r={40} fill="none" stroke={P.ink} strokeWidth={3} opacity={0.5} />
            <circle cx={-16} cy={0} r={24} fill="none" stroke={P.ink} strokeWidth={3} opacity={0.7} />
            <circle cx={-16} cy={0} r={9} fill={P.clay} stroke={P.ink} strokeWidth={2.4} />
            <path d={`M 34 -34 L 6 -12`} stroke={P.ink} strokeWidth={2.6} strokeDasharray="6 5" />
            <rect x={34} y={-46} width={44} height={30} rx={3} fill={P.paper2} stroke={P.ink} strokeWidth={2.4} />
          </>
        )}
        {/* 2 反馈即时：72 格进度条，逐格填 */}
        {kind === 2 && (
          <>
            {Array.from({ length: 24 }).map((_, i) => {
              const k = em(f, start + 6 + i * 1.1, 6).op;
              return (
                <rect key={i} x={-66 + (i % 12) * 11} y={i < 12 ? -26 : -8} width={8} height={14} rx={2}
                  fill={i % 3 === 0 ? P.mustard : P.clay} stroke={P.ink} strokeWidth={1.6} opacity={k} />
              );
            })}
          </>
        )}
        {/* 3 难度可调：三级阶梯 */}
        {kind === 3 && (
          <>
            <path d="M -60 26 L -60 10 L -20 10 L -20 -6 L 20 -6 L 20 -22 L 60 -22"
              fill="none" stroke={P.ink} strokeWidth={3.4} strokeLinejoin="round" />
            <circle cx={-60} cy={10} r={5} fill={P.sage} stroke={P.ink} strokeWidth={2} />
            <circle cx={-20} cy={-6} r={5} fill={P.mustard} stroke={P.ink} strokeWidth={2} />
            <circle cx={20} cy={-22} r={5} fill={P.clay} stroke={P.ink} strokeWidth={2} />
            <text x={-60} y={42} textAnchor="middle" fontFamily={SANS} fontSize={18} fill={P.faint}>小</text>
            <text x={-20} y={42} textAnchor="middle" fontFamily={SANS} fontSize={18} fill={P.faint}>中</text>
            <text x={20} y={42} textAnchor="middle" fontFamily={SANS} fontSize={18} fill={P.faint}>大</text>
          </>
        )}
      </g>

      <text x={cx} y={y + 254} textAnchor="middle" fontFamily={SANS} fontSize={21} fill={P.soft}>{note}</text>
    </Paper>
  );
};

/* ---------------- 心流象限 ---------------- */
const Quadrant: React.FC<{ f: number; op: number }> = ({ f, op }) => {
  const x0 = 1724;
  const y0 = 764;
  const w = 220;
  const h = 138;
  const ax = drawOn(f, 424, 20);
  return (
    <g opacity={op}>
      <Paper x={1400} y={572} w={572} h={228} rot={0.4} fill="#fffaf0">
        <text x={1420} y={612} fontFamily={SANS} fontSize={21} letterSpacing="0.14em" fill={P.clay}>心流的三个区域</text>
        {/* 左：图例，把象限接回片子的论点 */}
        <g opacity={em(f, 452, 12).op}>
          <circle cx={1428} cy={654} r={7} fill={P.clay} stroke={P.ink} strokeWidth={2.2} />
          <text x={1444} y={661} fontFamily={SANS} fontSize={22} fill={P.ink}>工作：挑战涨，技能没长</text>
          <circle cx={1428} cy={694} r={7} fill={P.mustard} stroke={P.ink} strokeWidth={2.2} />
          <text x={1444} y={701} fontFamily={SANS} fontSize={22} fill={P.ink}>拼豆：两个一起涨</text>
          <text x={1420} y={750} fontFamily={SANS} fontSize={21} fill={P.faint}>横轴 技能　纵轴 挑战</text>
        </g>
        {/* 右：二维图。上左＝焦虑，下右＝无聊，对角线＝心流 */}
        <g opacity={em(f, 440, 12).op}>
          <path d={`M ${x0} ${y0 - h} L ${x0 + w} ${y0 - h} L ${x0} ${y0} Z`} fill="rgba(196,83,47,0.14)" />
          <path d={`M ${x0 + w} ${y0 - h} L ${x0 + w} ${y0} L ${x0} ${y0} Z`} fill="rgba(143,174,124,0.18)" />
          <line x1={x0} y1={y0} x2={x0 + w} y2={y0 - h} stroke={P.ink} strokeWidth={2.2} strokeDasharray="7 6" opacity={0.45} />
          <text x={x0 + 22} y={y0 - h + 44} fontFamily={SERIF} fontSize={27} fill={P.clay}>焦虑</text>
          <text x={x0 + w - 10} y={y0 - 14} textAnchor="end" fontFamily={SERIF} fontSize={27} fill={P.sage}>无聊</text>
          <rect x={x0 + 92} y={y0 - h / 2 - 16} width={58} height={28} rx={4} fill="#fffaf0" opacity={0.92} />
          <text x={x0 + 121} y={y0 - h / 2 + 5} textAnchor="middle" fontFamily={SERIF} fontSize={26} fill={P.ink}>心流</text>
        </g>
        <line x1={x0} y1={y0} x2={x0 + w} y2={y0} stroke={P.ink} strokeWidth={2.4} strokeDasharray={1} pathLength={1} strokeDashoffset={ax} />
        <line x1={x0} y1={y0} x2={x0} y2={y0 - h} stroke={P.ink} strokeWidth={2.4} strokeDasharray={1} pathLength={1} strokeDashoffset={ax} />
      </Paper>
    </g>
  );
};

/* ---------------- 书桌 ---------------- */
const Desk: React.FC<{ f: number }> = ({ f }) => {
  const e = em(f, 512, 14);
  return (
    <g opacity={e.op} transform="translate(140 0)">
      <path d="M 2160 626 L 2550 626 L 2570 680 L 2186 680 Z" fill={P.paper2} stroke={P.ink} strokeWidth={4} strokeLinejoin="round" filter="url(#liftS)" />
      <path d="M 2186 680 L 2570 680 L 2570 698 L 2186 698 Z" fill="#d5c4a2" stroke={P.ink} strokeWidth={4} strokeLinejoin="round" />
      <line x1={2220} y1={698} x2={2220} y2={800} stroke={P.ink} strokeWidth={15} strokeLinecap="round" />
      <line x1={2530} y1={698} x2={2530} y2={800} stroke={P.ink} strokeWidth={15} strokeLinecap="round" />
      {/* 抽屉：把长凳读成书桌 */}
      <g opacity={em(f, 524, 14).op}>
        <rect x={2252} y={700} width={230} height={58} rx={3} fill={P.paper} stroke={P.ink} strokeWidth={3} />
        <line x1={2322} y1={729} x2={2412} y2={729} stroke={P.ink} strokeWidth={5} strokeLinecap="round" />
      </g>
    </g>
  );
};

/* ---------------- 对照表：工作 vs 拼豆 ---------------- */
const CompareTable: React.FC<{ f: number; op: number }> = ({ f, op }) => {
  const x = 2410;
  const y = 262;
  const w = 560;
  const h = 300;
  const rows = [
    { k: "目标", job: "提升体验", play: "一张图" },
    { k: "反馈", job: "年底考核", play: "一颗一颗" },
    { k: "难度", job: "不由你定", play: "可大可小" },
  ];
  return (
    <g opacity={op}>
      <Paper x={x} y={y} w={w} h={h} rot={-0.6} fill="#fffaf0">
        <text x={x + 20} y={y + 36} fontFamily={SANS} fontSize={21} letterSpacing="0.16em" fill={P.clay}>同三条，两套系统</text>
        <line x1={x + 20} y1={y + 50} x2={x + w - 20} y2={y + 50} stroke={P.line} strokeWidth={2} />
        {/* 工作列：一条不占 */}
        <rect x={x + 266} y={y + 58} width={140} height={h - 100} fill="rgba(43,38,34,0.05)" />
        {/* 拼豆列：三条都占 */}
        <rect x={x + 412} y={y + 58} width={128} height={h - 100} fill="rgba(143,174,124,0.14)" />
        <text x={x + 336} y={y + 80} textAnchor="middle" fontFamily={SANS} fontSize={22} fill="rgba(43,38,34,0.72)">工作</text>
        <text x={x + 476} y={y + 80} textAnchor="middle" fontFamily={SANS} fontSize={22} fill={P.ink}>拼豆</text>
        <line x1={x + 266} y1={y + 62} x2={x + 266} y2={y + h - 40} stroke={P.line} strokeWidth={2} />
        <line x1={x + 412} y1={y + 62} x2={x + 412} y2={y + h - 40} stroke={P.line} strokeWidth={2} />
        {rows.map((r, i) => {
          const e = em(f, 642 + i * 22, 12);
          const ry = y + 122 + i * 56;
          return (
            <g key={r.k} opacity={e.op} transform={`translate(0 ${e.dy})`}>
              <text x={x + 20} y={ry + 8} fontFamily={SERIF} fontSize={31} fill={P.ink}>{r.k}</text>
              <text x={x + 336} y={ry} textAnchor="middle" fontFamily={SANS} fontSize={22} fill="rgba(43,38,34,0.70)">{r.job}</text>
              <text x={x + 476} y={ry} textAnchor="middle" fontFamily={SANS} fontSize={22} fill={P.ink}>{r.play}</text>
              <line x1={x + 284} y1={ry - 7} x2={x + 388} y2={ry - 7} stroke={P.clay} strokeWidth={2.2} strokeLinecap="round" opacity={0.6} />
            </g>
          );
        })}
        <line x1={x + 20} y1={y + h - 40} x2={x + w - 20} y2={y + h - 40} stroke={P.line} strokeWidth={2} />
        <text x={x + w - 20} y={y + h - 14} textAnchor="end" fontFamily={SANS} fontSize={22} fill={P.clay}>三条，一条不占</text>
      </Paper>
    </g>
  );
};

/* ---------------- 四张数据卡 ---------------- */
const DataGrid: React.FC<{ f: number; op: number }> = ({ f, op }) => {
  const items = [
    { n: "387.8亿", u: "全网播放", s: "截至 2026-07", c: P.clay },
    { n: "100亿", u: "全网曝光", s: "一年之内", c: P.mustard },
    { n: "2万", u: "上海拼豆大会", s: "2026-05 现场", c: P.sage },
    { n: "2600万", u: "条笔记", s: "全网累计", c: P.indigo },
  ];
  return (
    <g opacity={op}>
      {items.map((it, i) => {
        const e = em(f, 800 + i * 16, 12);
        const x = 2410 + (i % 2) * 316;
        const y = 262 + Math.floor(i / 2) * 172;
        return (
          <Paper key={it.u} x={x} y={y} w={296} h={152} rot={i % 2 ? 0.8 : -0.9} op={e.op} sc={e.sc} fill="#fffaf0">
            <rect x={x + 18} y={y + 22} width={6} height={34} fill={it.c} />
            <text x={x + 36} y={y + 60} fontFamily={SANS} fontWeight={700} fontSize={46} fill={P.ink}>{it.n}</text>
            <text x={x + 20} y={y + 100} fontFamily={SANS} fontSize={24} fill={P.soft}>{it.u}</text>
            <text x={x + 20} y={y + 131} fontFamily={SANS} fontSize={21} fill={P.faint}>{it.s}</text>
          </Paper>
        );
      })}
    </g>
  );
};

/* ---------------- 颈椎负荷折线（角度 → 公斤） ---------------- */
const NeckChart: React.FC<{ f: number; op: number }> = ({ f, op }) => {
  const x0 = 2840;
  const x1 = 3200;
  const y0 = 706;
  const y1 = 350;
  const px = (d: number) => x0 + (d / 60) * (x1 - x0);
  const py = (k: number) => y0 - (k / 30) * (y0 - y1);
  const pts = [
    { d: 0, k: 5 },
    { d: 15, k: 12 },
    { d: 30, k: 18 },
    { d: 45, k: 22 },
    { d: 60, k: 27 },
  ];
  const ax = drawOn(f, 918, 22);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${px(p.d)} ${py(p.k)}`).join(" ");
  return (
    <g opacity={op}>
      <text x={x0} y={316} fontFamily={SANS} fontSize={21} letterSpacing="0.16em" fill={P.clay}>低头角度 → 颈椎负荷 kg</text>
      {/* 网格 */}
      {[10, 20, 30].map((k) => (
        <g key={k}>
          <line x1={x0} y1={py(k)} x2={x1} y2={py(k)} stroke={P.ink} strokeWidth={1.6} strokeDasharray="6 7" opacity={0.22} />
          <text x={x0 - 12} y={py(k) + 7} textAnchor="end" fontFamily={SANS} fontSize={22} fill={P.faint}>{k}</text>
        </g>
      ))}
      <text x={x0 - 12} y={y0 + 7} textAnchor="end" fontFamily={SANS} fontSize={22} fill={P.faint}>0</text>
      {/* 轴 */}
      <line x1={x0} y1={y0} x2={x1 + 14} y2={y0} stroke={P.ink} strokeWidth={2.6} strokeDasharray={1} pathLength={1} strokeDashoffset={ax} />
      <line x1={x0} y1={y0} x2={x0} y2={y1 - 16} stroke={P.ink} strokeWidth={2.6} strokeDasharray={1} pathLength={1} strokeDashoffset={ax} />
      {/* 折线 */}
      <path d={path} fill="none" stroke={P.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={1} pathLength={1} strokeDashoffset={drawOn(f, 940, 26)} />
      {pts.map((p, i) => {
        const e = em(f, 948 + i * 10, 10);
        const hot = p.d === 60;
        const lx = p.d === 0 ? px(0) + 18 : px(p.d);
        const anchor = p.d === 0 ? "start" : "middle";
        return (
          <g key={p.d} opacity={e.op}>
            <circle cx={px(p.d)} cy={py(p.k)} r={hot ? 9 : 6} fill={hot ? P.clay : P.paper} stroke={P.ink} strokeWidth={2.4} />
            <text x={lx} y={p.d === 0 ? py(p.k) + 8 : py(p.k) - 18} textAnchor={anchor} fontFamily={SANS} fontSize={hot ? 34 : 23}
              fill={hot ? P.clay : P.soft}>{p.k}</text>
            <text x={px(p.d)} y={y0 + 30} textAnchor="middle" fontFamily={SANS} fontSize={22} fill={P.faint}>{p.d}°</text>
          </g>
        );
      })}
      {/* 空白处注释：最重一档的量级类比，跟 27 标签同步亮 */}
      <g opacity={em(f, 976, 12).op}>
        <text x={2852} y={358} fontFamily={SANS} fontSize={21} letterSpacing="0.14em" fill={P.clay}>最重的一档</text>
        <text x={2852} y={388} fontFamily={SANS} fontSize={22} fill={P.soft}>27 kg ≈ 一个 8 岁小孩</text>
      </g>
    </g>
  );
};

/* ---------------- 窗 ---------------- */
const WindowScene: React.FC<{ f: number; op: number }> = ({ f, op }) => {
  const e = em(f, 1052, 16);
  return (
    <g opacity={op * e.op}>
      {/* 光带：从窗斜射进室内 */}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M 3200 ${296 + i * 98} L 2500 ${470 + i * 98} L 2500 ${528 + i * 98} L 3200 ${364 + i * 98} Z`}
          fill="url(#sun)" opacity={0.62 - i * 0.14} />
      ))}
      {/* 窗框 */}
      <rect x={3200} y={250} width={380} height={440} fill="#fdf6e6" stroke={P.ink} strokeWidth={5} filter="url(#liftS)" />
      <line x1={3390} y1={250} x2={3390} y2={690} stroke={P.ink} strokeWidth={4} />
      <line x1={3200} y1={468} x2={3580} y2={468} stroke={P.ink} strokeWidth={4} />
      <circle cx={3272} cy={352} r={32} fill={P.sage} opacity={0.5} stroke={P.ink} strokeWidth={2.6} />
      <circle cx={3322} cy={390} r={23} fill={P.sage} opacity={0.4} stroke={P.ink} strokeWidth={2.4} />
      {/* 小桌 */}
      <path d="M 3140 640 L 3560 640 L 3578 676 L 3158 676 Z" fill={P.paper2} stroke={P.ink} strokeWidth={4} strokeLinejoin="round" />
      <line x1={3182} y1={676} x2={3182} y2={800} stroke={P.ink} strokeWidth={14} strokeLinecap="round" />
      <line x1={3532} y1={676} x2={3532} y2={800} stroke={P.ink} strokeWidth={14} strokeLinecap="round" />
      {/* 桌上：拼完的板，立着靠在窗台 */}
      <g opacity={em(f, 1150, 16).op}>
        <rect x={3292} y={464} width={176} height={176} rx={4} fill="#f7ecd6" stroke={P.ink} strokeWidth={3.4} filter="url(#liftS)" />
        {Array.from({ length: 7 }).map((_, r) =>
          Array.from({ length: 7 }).map((_, c) => (
            <rect key={`${r}-${c}`} x={3298 + c * 24} y={470 + r * 24} width={21} height={21} rx={2}
              fill={(r + c) % 3 === 0 ? P.mustard : P.clay} stroke={P.ink} strokeWidth={1.4} />
          ))
        )}
        <g opacity={1 - smooth(clamp01((f - 1252) / 30)) * 0.9}>
          <text x={3484} y={522} fontFamily={SANS} fontWeight={700} fontSize={34} fill={P.clay}>72</text>
          <text x={3522} y={522} fontFamily={SANS} fontSize={23} fill={P.faint}>/ 72</text>
          <text x={3484} y={556} fontFamily={SANS} fontSize={21} fill={P.soft}>全部拼完</text>
        </g>
      </g>
      {/* 右侧：一盆绿植，收住画面右缘 */}
      <g opacity={em(f, 1100, 16).op}>
        <path d="M 3628 726 L 3712 726 L 3700 800 L 3640 800 Z" fill={P.paper2} stroke={P.ink} strokeWidth={3.4} strokeLinejoin="round" filter="url(#liftS)" />
        <path d="M 3670 726 Q 3662 676 3634 654" fill="none" stroke={P.ink} strokeWidth={3.4} strokeLinecap="round" />
        <path d="M 3670 726 Q 3680 668 3706 648" fill="none" stroke={P.ink} strokeWidth={3.4} strokeLinecap="round" />
        <ellipse cx={3628} cy={646} rx={26} ry={16} fill={P.sage} stroke={P.ink} strokeWidth={2.6} transform="rotate(-24 3628 646)" />
        <ellipse cx={3712} cy={640} rx={26} ry={16} fill={P.sage} stroke={P.ink} strokeWidth={2.6} transform="rotate(22 3712 640)" />
        <ellipse cx={3670} cy={618} rx={18} ry={30} fill={P.sage} stroke={P.ink} strokeWidth={2.6} opacity={0.9} />
      </g>
    </g>
  );
};

/* ============================================================ */
export const Doudou45: React.FC = () => {
  const f = useCurrentFrame();
  const cam = kf(CAM, f);
  const boilX = Math.sin(f * 0.44) * 0.55 + Math.sin(f * 1.03 + 2.1) * 0.22;
  const boilY = Math.cos(f * 0.51 + 1.1) * 0.5 + Math.cos(f * 0.97 + 0.4) * 0.2;
  const camT = `translate(960 540) scale(${cam.k}) translate(${-cam.cx} ${-cam.cy}) translate(${boilX} ${boilY})`;

  /* 段1 钩子 0–130 */
  const hookOp = out(f, 112, 12);
  const subOp = em(f, 56, 14).op * out(f, 176, 12);

  /* 段2 旧卡 130–319 */
  const histOp = out(f, 300, 16);
  const c1 = em(f, 132, 14);
  const c2 = em(f, 168, 14);
  const c3 = em(f, 204, 14);
  const axis = drawOn(f, 232, 18);

  /* 段3 条件卡 319–511 */
  const condOp = out(f, 500, 14);
  const k1 = em(f, 330, 14);
  const k2 = em(f, 362, 14);
  const k3 = em(f, 394, 14);
  const quadOp = em(f, 424, 14).op * out(f, 500, 14);

  /* 段4 对照 654–798 */
  const cmpOp = em(f, 614, 16).op * out(f, 792, 12);

  /* 段5 数据 798–910 */
  const dataOp = out(f, 904, 12);

  /* 段6 代价 910–1021 */
  const neckOp = em(f, 914, 14).op * out(f, 1015, 12);

  /* 段7 落点 1181–1250 */
  const winSceneOp = em(f, 1036, 26).op;
  const winOp = em(f, 1146, 16).op;
  const txt7Op = winOp * out(f, 1250, 12);

  /* 段8 金句 1250–1350 */
  const veil = smooth(clamp01((f - 1250) / 34)) * 0.87;
  // 金句压上来时主角退成轮廓，别让人头从字后面透出来
  const guideOp = 1 - smooth(clamp01((f - 1252) / 30)) * 0.92;
  const q1 = em(f, 1254, 12);
  const q2 = em(f, 1284, 12);

  return (
    <AbsoluteFill>
      <PaperBg />

      <svg width="1920" height="1080" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id="wc"><rect x="0" y="0" width="1920" height="1080" /></clipPath>
          <linearGradient id="wallfade" gradientUnits="userSpaceOnUse" x1={120} y1={0} x2={600} y2={0}>
            <stop offset="0" stopColor={P.paper2} stopOpacity={0} />
            <stop offset="1" stopColor={P.paper2} stopOpacity={0.4} />
          </linearGradient>
        </defs>

        <g clipPath="url(#wc)">
          <g transform={camT}>
            <rect x={-1600} y={FLOOR} width={8000} height={340} fill="rgba(120,100,72,0.13)" />
            <rect x={-600} y={130} width={7200} height={670} fill="url(#wallfade)" />
            <line x1={-1600} y1={FLOOR} x2={5200} y2={FLOOR} stroke={P.ink} strokeWidth={4} strokeDasharray={1} pathLength={1} strokeDashoffset={drawOn(f, -8, 12)} />

            <ellipse cx={960} cy={818} rx={344} ry={18} fill="rgba(143,174,124,0.22)" stroke={P.ink} strokeWidth={2.4} opacity={em(f, 12, 14).op * 0.9} />

            <Lamp f={f} />
            <Table f={f} />
            <Board f={f} />

            {/* 段2 三张旧卡 */}
            <g opacity={histOp}>
              <HistCard x={1400} y={280} w={186} h={280} rot={-1.3} year="1971" where="瑞典 · 专利" who="养老院" note="练手指，抗衰退" use="康复"
                op={c1.op} sc={c1.sc} kind={1} />
              <HistCard x={1600} y={280} w={186} h={280} rot={0.9} year="1980s" where="美国 Perler" who="儿童玩具" note="重新包装" use="益智"
                op={c2.op} sc={c2.sc} kind={2} />
              <HistCard x={1800} y={280} w={186} h={280} rot={-0.7} year="2024" where="中国 · 短视频" who="成年人" note="一坐三小时" use="解压"
                op={c3.op} sc={c3.sc} kind={3} />
              <line x1={1382} y1={592} x2={1986} y2={592} stroke={P.ink} strokeWidth={3}
                strokeDasharray={1} pathLength={1} strokeDashoffset={axis} opacity={0.78} />
              <path d="M 1986 592 l -18 -7 l 0 14 Z" fill={P.ink} opacity={0.78} />
              {[1493, 1693, 1893].map((x, i) => (
                <circle key={x} cx={x} cy={592} r={7} fill={P.clay} stroke={P.ink} strokeWidth={2.4} opacity={em(f, 236 + i * 8, 10).op} />
              ))}
            </g>

            {/* 段3 三张条件卡 + 象限 */}
            <g opacity={condOp}>
              <CondCard x={1400} y={280} w={186} h={280} rot={-1.1} n="01" t="目标" note="就这一张图"
                op={k1.op} sc={k1.sc} kind={1} f={f} start={334} />
              <CondCard x={1600} y={280} w={186} h={280} rot={0.8} n="02" t="反馈" note="一颗一颗看得见"
                op={k2.op} sc={k2.sc} kind={2} f={f} start={366} />
              <CondCard x={1800} y={280} w={186} h={280} rot={-0.6} n="03" t="难度" note="图可大可小"
                op={k3.op} sc={k3.sc} kind={3} f={f} start={398} />
            </g>
            <Quadrant f={f} op={quadOp} />

            {/* 段4–6 书桌区 */}
            <CompareTable f={f} op={cmpOp} />
            <DataGrid f={f} op={dataOp} />
            <NeckChart f={f} op={neckOp} />

            {/* 段7–8 窗 */}
            <WindowScene f={f} op={winSceneOp} />

            <g opacity={guideOp}><Guide f={f} /></g>
            {/* 书桌压在人之上：人从桌后走过时才不穿模 */}
            <Desk f={f} />
          </g>
        </g>

        {/* ================= 屏幕层 ================= */}
        {/* 段1 钩子 */}
        <g opacity={hookOp}>
          <Line f={f} start={4} y={132} size={30} sans color={P.clay} ls="0.22em" text="大人为什么开始玩小孩的玩具" />
          <Line f={f} start={12} y={300} size={82} text="一盒塑料豆，" />
          <Line f={f} start={26} y={402} size={76} color={P.clay} text="一年 387 亿次播放。" />
        </g>
        <Line f={f} start={42} y={944} size={40} sans color="rgba(43,38,34,0.9)" text="成年人低头，能拼三个小时。" op={subOp} />

        {/* 段2 反转 */}
        <Line f={f} start={132} y={200} size={28} sans color={P.clay} ls="0.22em" text="它本来不是玩具" op={histOp} />
        <Line f={f} start={150} y={300} size={54} text="1971 年，瑞典。" op={histOp} />
        <Line f={f} start={184} y={382} size={34} color={P.soft} text="工程师从边角料里捡出它。" op={histOp} />
        <Line f={f} start={222} y={470} size={62} color={P.clay} text="叫康复训练。" op={histOp} />
        <Line f={f} start={190} y={944} size={40} sans color="rgba(43,38,34,0.9)" text="给养老院的老人练手指，抗认知衰退。" op={histOp} />

        {/* 段3 心流 */}
        <Line f={f} start={322} y={196} size={28} sans color={P.clay} ls="0.22em" text="机制 · 心流" op={condOp} />
        <Line f={f} start={340} y={300} size={62} text="为什么它管用。" op={condOp} />
        <Line f={f} start={378} y={392} size={36} color={P.soft} text="三条同时成立，" op={condOp} />
        <Line f={f} start={400} y={440} size={36} color={P.soft} text="人才会忘记时间。" op={condOp} />
        <Line f={f} start={432} y={944} size={40} sans color="rgba(43,38,34,0.9)" text="太简单会无聊，太难会焦虑。" op={condOp} />

        {/* 段4 对照 */}
        <Line f={f} start={656} y={196} size={28} sans color={P.clay} ls="0.22em" text="机制 · 对照" op={cmpOp} />
        <Line f={f} start={676} y={300} size={54} text="把这三条，" op={cmpOp} />
        <Line f={f} start={700} y={378} size={54} text="套到你的工作上。" op={cmpOp} />
        <Line f={f} start={742} y={470} size={54} color={P.clay} text="三条，一条不占。" op={cmpOp} />
        <Line f={f} start={760} y={944} size={40} sans color="rgba(43,38,34,0.9)" text="目标、反馈、难度——三条都不由你定。" op={cmpOp} />

        {/* 段5 数据 */}
        <Line f={f} start={800} y={196} size={28} sans color={P.clay} ls="0.22em" text="数据" op={dataOp} />
        <Line f={f} start={818} y={300} size={62} text="所以它不只是火。" op={dataOp} />
        <Line f={f} start={856} y={384} size={40} color={P.soft} text="一年之内，四个数字。" op={dataOp} />
        <Line f={f} start={870} y={944} size={40} sans color="rgba(43,38,34,0.9)" text="来源不同，只看量级。" op={dataOp} />

        {/* 段6 代价 */}
        <Line f={f} start={912} y={196} size={28} sans color={P.clay} ls="0.22em" text="代价" op={neckOp} />
        <Line f={f} start={930} y={300} size={62} text="但它也留账。" op={neckOp} />
        <Line f={f} start={968} y={384} size={42} color={P.soft} text="低头越久，账越大。" op={neckOp} />
        <Line f={f} start={990} y={944} size={40} sans color="rgba(43,38,34,0.9)" text="Hansraj 2014 · 头部约 5 公斤，靠杠杆放大。" op={neckOp} />

        {/* 段7 落点 */}
        <Line f={f} start={1146} y={196} size={28} sans color={P.clay} ls="0.22em" text="落点" op={txt7Op} />
        <Line f={f} start={1160} y={300} size={58} text="问题不在豆子。" op={txt7Op} />
        <Line f={f} start={1188} y={382} size={42} color={P.soft} text="在你一天里，有没有一件事，" op={txt7Op} />
        <Line f={f} start={1204} y={452} size={42} color={P.soft} text="是你知道什么时候能做完的。" op={txt7Op} />

        {/* 段8 金句 */}
        <rect x={0} y={0} width={1920} height={1080} fill={P.paper} opacity={veil} />
        <g opacity={q1.op}>
          <text x={960} y={430} textAnchor="middle" fontFamily={SERIF} fontSize={78} fill={P.ink}>不是大人变小了。</text>
        </g>
        <g opacity={q2.op}>
          <text x={960} y={556} textAnchor="middle" fontFamily={SERIF} fontSize={90} fill={P.clay}>是能做完的事，变少了。</text>
        </g>
        <g opacity={em(f, 1322, 12).op}>
          <text x={960} y={1002} textAnchor="middle" fontFamily={SANS} fontSize={24} letterSpacing="0.3em" fill={P.soft}>大人为什么开始玩小孩的玩具</text>
        </g>
      </svg>

      <Audio src={staticFile("bgm-qn45.wav")} volume={0.85} />
    </AbsoluteFill>
  );
};

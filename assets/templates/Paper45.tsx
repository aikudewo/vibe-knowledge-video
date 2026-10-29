import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { SANS, SERIF } from "./Neon";

/* ============================================================
   深睡自由 · 纸感长镜版 · 45s
   一条镜头走完：小人从床边出发，经过光 / 声 / 温 / 压 四个站，
   走回来躺下。镜头跟着他，信息在他停住的时候浮现。
   全程 0 次硬切。BGM《千年之后》0:00 起，112.8 BPM。
   一拍 = 15.957 帧；一小节 = 63.83 帧。
   ============================================================ */

const BEAT = 0.5319 * 30;
const B = (n: number) => 1 + n * BEAT;
const FLOOR = 800;

const P = {
  paper: "#f4ecdc",
  paper2: "#e9dcc3",
  ink: "#2b2622",
  soft: "rgba(43,38,34,0.72)",
  faint: "rgba(43,38,34,0.48)",
  line: "rgba(43,38,34,0.22)",
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

/* ---------------- 摄像机 ---------------- */
const CAM = [
  { f: 0, cx: 640, cy: 545, k: 1.02 },
  { f: 128, cx: 640, cy: 545, k: 1.03 },
  { f: 170, cx: 950, cy: 545, k: 1.03 },
  { f: 288, cx: 950, cy: 545, k: 1.04 },
  { f: 330, cx: 1250, cy: 550, k: 1.045 },
  { f: 480, cx: 1250, cy: 550, k: 1.055 },
  { f: 520, cx: 1950, cy: 555, k: 1.06 },
  { f: 672, cx: 1950, cy: 555, k: 1.065 },
  { f: 716, cx: 2750, cy: 555, k: 1.07 },
  { f: 864, cx: 2750, cy: 555, k: 1.075 },
  { f: 904, cx: 3350, cy: 560, k: 1.08 },
  { f: 1182, cx: 3350, cy: 560, k: 1.085 },
  { f: 1274, cx: 700, cy: 545, k: 1.095 },
  { f: 1350, cx: 620, cy: 545, k: 1.1 },
];

/* ---------------- 小人 ---------------- */
type GK = { f: number; x: number; hip: number; tRot: number; lRot: number; aR: number; aL: number; walk: number };
const GUIDE: GK[] = [
  { f: 0, x: 820, hip: 650, tRot: 0, lRot: 0, aR: 6, aL: -6, walk: 0 },
  { f: 34, x: 820, hip: 650, tRot: -3, lRot: 0, aR: 114, aL: -8, walk: 0 },
  { f: 118, x: 820, hip: 650, tRot: -3, lRot: 0, aR: 114, aL: -8, walk: 0 },
  { f: 160, x: 1000, hip: 650, tRot: 0, lRot: 0, aR: 0, aL: 0, walk: 1 },
  { f: 176, x: 1000, hip: 650, tRot: -4, lRot: 0, aR: 140, aL: -12, walk: 0 },
  { f: 286, x: 1000, hip: 650, tRot: -4, lRot: 0, aR: 140, aL: -12, walk: 0 },
  { f: 330, x: 1150, hip: 650, tRot: 0, lRot: 0, aR: 0, aL: 0, walk: 1 },
  { f: 344, x: 1150, hip: 650, tRot: -5, lRot: 0, aR: 88, aL: -8, walk: 0 },
  { f: 478, x: 1150, hip: 650, tRot: -5, lRot: 0, aR: 88, aL: -8, walk: 0 },
  { f: 520, x: 1850, hip: 650, tRot: 0, lRot: 0, aR: 0, aL: 0, walk: 1 },
  { f: 536, x: 1850, hip: 650, tRot: -5, lRot: 0, aR: 74, aL: -8, walk: 0 },
  { f: 670, x: 1850, hip: 650, tRot: -5, lRot: 0, aR: 74, aL: -8, walk: 0 },
  { f: 716, x: 2560, hip: 650, tRot: 0, lRot: 0, aR: 0, aL: 0, walk: 1 },
  { f: 732, x: 2560, hip: 650, tRot: -5, lRot: 0, aR: 80, aL: -8, walk: 0 },
  { f: 862, x: 2560, hip: 650, tRot: -5, lRot: 0, aR: 80, aL: -8, walk: 0 },
  { f: 904, x: 3080, hip: 650, tRot: 0, lRot: 0, aR: 0, aL: 0, walk: 1 },
  { f: 920, x: 3080, hip: 650, tRot: -5, lRot: 0, aR: 76, aL: -8, walk: 0 },
  { f: 1040, x: 3080, hip: 650, tRot: -3, lRot: 0, aR: 58, aL: -8, walk: 0 },
  { f: 1182, x: 3080, hip: 650, tRot: -3, lRot: 0, aR: 58, aL: -8, walk: 0 },
  { f: 1258, x: 800, hip: 650, tRot: 0, lRot: 0, aR: 0, aL: 0, walk: 1 },
  { f: 1264, x: 800, hip: 650, tRot: 0, lRot: 0, aR: -10, aL: -10, walk: 0 },
  { f: 1294, x: 552, hip: 646, tRot: -90, lRot: 90, aR: -12, aL: -12, walk: 0 },
  { f: 1350, x: 552, hip: 646, tRot: -90, lRot: 90, aR: -12, aL: -12, walk: 0 },
];

const Guide: React.FC<{ f: number }> = ({ f }) => {
  const g = kf(GUIDE, f);
  const runK = f > 1176 && f < 1300 ? 1.85 : 1;
  const sw = g.walk * Math.sin(f * 0.62 * runK) * (runK > 1 ? 23 : 17);
  const bob = g.walk * Math.abs(Math.sin(f * 0.62 * runK)) * (runK > 1 ? -8 : -5);
  const lying = Math.abs(g.tRot) > 45;
  const rad = (d: number) => (d * Math.PI) / 180;
  const legOp = Math.max(0, 1 - smooth(clamp01((f - 1262) / 2)) + smooth(clamp01((f - 1292) / 3)));

  return (
    <g transform={`translate(${g.x} ${g.hip + bob})`} filter="url(#liftS)">
      <ellipse cx={0} cy={lying ? 60 : 152} rx={lying ? 150 : 62} ry={lying ? 14 : 10} fill="rgba(90,70,45,0.16)" />
      <g opacity={legOp}>
        <g transform={`rotate(${g.lRot + sw} -14 0)`}>
          <line x1={-14} y1={0} x2={-14} y2={150} stroke={P.ink} strokeWidth={12} strokeLinecap="round" />
        </g>
        <g transform={`rotate(${g.lRot - sw} 14 0)`}>
          <line x1={14} y1={0} x2={14} y2={150} stroke={P.ink} strokeWidth={12} strokeLinecap="round" />
        </g>
      </g>
      <g transform={`rotate(${g.tRot})`}>
        <rect x={-30} y={-150} width={60} height={154} rx={28} fill={P.indigo} stroke={P.ink} strokeWidth={4} />
        <line x1={0} y1={-146} x2={0} y2={-166} stroke={P.ink} strokeWidth={9} />
        <circle cx={0} cy={-196} r={38} fill={P.paper} stroke={P.ink} strokeWidth={4.2} />
        <path d="M -35 -206 Q -28 -244 0 -242 Q 28 -240 35 -208" fill="none" stroke={P.ink} strokeWidth={7} strokeLinecap="round" />
        {lying ? (
          <>
            <path d="M -20 -198 q 8 -9 16 0" fill="none" stroke={P.ink} strokeWidth={3.4} strokeLinecap="round" />
            <path d="M 6 -198 q 8 -9 16 0" fill="none" stroke={P.ink} strokeWidth={3.4} strokeLinecap="round" />
            <path d="M -6 -176 q 7 6 14 0" fill="none" stroke={P.ink} strokeWidth={3.4} strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={-13} cy={-198} r={4.2} fill={P.ink} />
            <circle cx={13} cy={-198} r={4.2} fill={P.ink} />
            <path d="M -7 -176 q 7 6 14 0" fill="none" stroke={P.ink} strokeWidth={3.4} strokeLinecap="round" />
          </>
        )}
        <line x1={26} y1={-136} x2={26 + Math.sin(rad(g.aR)) * 94} y2={-136 + Math.cos(rad(g.aR)) * 94} stroke={P.ink} strokeWidth={10} strokeLinecap="round" />
        <line x1={-26} y1={-136} x2={-26 + Math.sin(rad(g.aL)) * 94} y2={-136 + Math.cos(rad(g.aL)) * 94} stroke={P.ink} strokeWidth={10} strokeLinecap="round" />
      </g>
    </g>
  );
};

/* ---------------- 纸片 ---------------- */
const Paper: React.FC<{
  x: number; y: number; w: number; h: number;
  rot?: number; fill?: string; op?: number; sc?: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, rot = 0, fill = "#fff8ea", op = 1, sc = 1, children }) => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g opacity={op} transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${sc}) translate(${-cx} ${-cy})`}>
      <path d={`M ${x + 4} ${y + 3} L ${x + w - 5} ${y} L ${x + w} ${y + h - 4} L ${x + 3} ${y + h} Z`} fill={fill} filter="url(#lift)" />
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
      </defs>
      <rect width="1920" height="1080" fill="url(#lampg)" />
      <rect width="1920" height="1080" filter="url(#grain)" opacity={0.07} style={{ mixBlendMode: "multiply" }} />
    </svg>
  </AbsoluteFill>
);

/* ---------------- 标题（屏幕空间） ---------------- */
const Title: React.FC<{ k: string; t: string; op: number; size?: number }> = ({ k, t, op, size = 84 }) => (
  <g opacity={op}>
    <text x={120} y={140} fontFamily={SANS} fontSize={30} letterSpacing="0.24em" fill={P.clay}>{k}</text>
    <text x={120} y={228} fontFamily={SERIF} fontSize={size} fill={P.ink}>{t}</text>
  </g>
);

const Foot: React.FC<{ t: string; op: number }> = ({ t, op }) => (
  <text x={120} y={1036} fontFamily={SANS} fontSize={28} fill={P.faint} opacity={op}>{t}</text>
);

/* ============================================================ */
export const Full45: React.FC = () => {
  const f = useCurrentFrame();
  const cam = kf(CAM, f);
  // 墨线抖动：手绘感的地基。没有它，停留段每帧完全一样，就成了 PPT。
  const boilX = Math.sin(f * 0.44) * 0.55 + Math.sin(f * 1.03 + 2.1) * 0.22;
  const boilY = Math.cos(f * 0.51 + 1.1) * 0.5 + Math.cos(f * 0.97 + 0.4) * 0.2;
  const camT = `translate(960 540) scale(${cam.k}) translate(${-cam.cx} ${-cam.cy}) translate(${boilX} ${boilY})`;

  /* 钩子 */
  const c48 = em(f, -10, 14);
  const c57 = em(f, 20, 14);
  const c48op = c48.op * out(f, 116, 12);
  const c57op = c57.op * out(f, 116, 12);
  const bu = em(f, 34, 12);
  const buOp = bu.op * out(f, 116, 12);

  /* 系统 */
  const sysCards = [
    { n: "01", k: "光", v: "−20~50%", s: "褪黑素", x: 180, b: 128, rot: -1.6 },
    { n: "02", k: "声", v: "≤30 dB", s: "夜间上限", x: 640, b: 144, rot: 1.2 },
    { n: "03", k: "温", v: "18–22℃", s: "室温", x: 1100, b: 160, rot: -1.1 },
    { n: "04", k: "压", v: "支撑优先", s: "不是分区", x: 1560, b: 176, rot: 1.5 },
  ];

  /* 光 */
  const phoneIn = { ...em(f, 318, 12), op: em(f, 318, 12).op * out(f, 484, 12) };
  const barsIn = em(f, 350, 12);
  const bh = f < 400 ? 0.62 : 0.38;
  const barTop = 470 + 270 * (1 - bh);

  /* 声 */
  const dbY = (db: number) => 760 - db * 7;
  const ptr = f < 560 ? 30 : 42;

  /* 温 */
  const tY = (t: number) => 680 - (t - 10) * 13.08;

  return (
    <AbsoluteFill>
      <PaperBg />

      <svg width="1920" height="1080" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id="wc"><rect x="0" y="0" width="1920" height="1080" /></clipPath>
          <clipPath id="quiltClip"><rect x="180" y="556" width="620" height="152" /></clipPath>
          <pattern id="hatch" width="14" height="14" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="14" stroke={P.clay} strokeWidth={3} opacity={0.35} />
          </pattern>
        </defs>

        <g clipPath="url(#wc)">
          <g transform={camT}>
            {/* ============ 房间 ============ */}
            <rect x={-400} y={FLOOR} width={4200} height={400} fill={P.paper2} opacity={0.5} />
            <line x1={-400} y1={FLOOR} x2={3800} y2={FLOOR} stroke={P.ink} strokeWidth={4} strokeDasharray={1} pathLength={1} strokeDashoffset={drawOn(f, -10, 12)} />

            {/* 窗 */}
            <g opacity={em(f, 2, 14).op * out(f, 1232, 20)}>
              <rect x={860} y={360} width={180} height={220} fill={P.paper} stroke={P.ink} strokeWidth={3.4} />
              <line x1={950} y1={360} x2={950} y2={580} stroke={P.ink} strokeWidth={2.6} />
              <line x1={860} y1={470} x2={1040} y2={470} stroke={P.ink} strokeWidth={2.6} />
            </g>

            {/* 床 */}
            <g>
              <rect x={180} y={700} width={580} height={108} rx={8} fill={P.paper2} stroke={P.ink} strokeWidth={4} filter="url(#liftS)" />
              <rect x={180} y={660} width={580} height={44} rx={6} fill="#fffaf0" stroke={P.ink} strokeWidth={4} />
              <rect x={268} y={618} width={192} height={48} rx={22} fill={P.paper} stroke={P.ink} strokeWidth={4} />
              <ellipse cx={600} cy={620} rx={110} ry={40} fill={P.sage} stroke={P.ink} strokeWidth={4} />
              <rect x={430} y={612} width={330} height={96} rx={22} fill={P.sage} stroke={P.ink} strokeWidth={4} />
              <path d="M 448 656 Q 560 646 660 658 Q 720 666 742 656" fill="none" stroke={P.ink} strokeWidth={2.4} opacity={0.5} />
            </g>

            {/* 搁板 + 手机 */}
            <g>
              <rect x={1180} y={566} width={300} height={16} rx={4} fill={P.paper2} stroke={P.ink} strokeWidth={3.4} />
              <path d="M 1202 582 L 1202 622 L 1234 582 Z" fill={P.paper2} stroke={P.ink} strokeWidth={3} strokeLinejoin="round" />
              <path d="M 1458 582 L 1458 622 L 1426 582 Z" fill={P.paper2} stroke={P.ink} strokeWidth={3} strokeLinejoin="round" />
              <rect x={1400} y={530} width={44} height={36} rx={6} fill={P.clay} stroke={P.ink} strokeWidth={3.2} />
              <line x1={1422} y1={530} x2={1422} y2={486} stroke={P.ink} strokeWidth={4} />
              <path d="M 1422 508 Q 1390 492 1388 464 Q 1416 470 1422 496" fill={P.sage} stroke={P.ink} strokeWidth={2.6} strokeLinejoin="round" />
              <path d="M 1422 500 Q 1448 478 1454 452 Q 1428 460 1422 492" fill={P.sage} stroke={P.ink} strokeWidth={2.6} strokeLinejoin="round" />
            </g>

            {/* 冰箱 */}
            <g>
              <rect x={1900} y={470} width={190} height={330} rx={10} fill={P.paper2} stroke={P.ink} strokeWidth={4.4} filter="url(#liftS)" />
              <line x1={1900} y1={568} x2={2090} y2={568} stroke={P.ink} strokeWidth={3} />
              <rect x={2028} y={530} width={8} height={26} rx={4} fill={P.ink} />
              <rect x={2028} y={600} width={8} height={40} rx={4} fill={P.ink} />
            </g>

            {/* ============ 钩子 ============ */}
            <Paper x={880} y={120} w={520} h={400} rot={-1.4} op={c48op} sc={c48.sc}>
              <text x={922} y={300} fontFamily={SERIF} fontSize={160} fill={P.clay}><tspan>48</tspan><tspan dx={-26}>.</tspan><tspan dx={-26}>5%</tspan></text>
              <text x={924} y={364} fontFamily={SANS} fontSize={32} fill={P.ink}>18 岁以上人群</text>
              <text x={924} y={406} fontFamily={SANS} fontSize={32} fill={P.soft}>睡眠困扰率</text>
              <text x={924} y={466} fontFamily={SANS} fontSize={28} fill={P.faint}>超 3 亿人</text>
            </Paper>
            <Paper x={880} y={556} w={520} h={168} rot={1.1} op={c57op} sc={c57.sc}>
              <text x={922} y={640} fontFamily={SERIF} fontSize={64} fill={P.ink}>5700 亿元</text>
              <text x={924} y={686} fontFamily={SANS} fontSize={26} fill={P.soft}>2025 睡眠经济规模</text>
            </Paper>

            {/* ============ 系统 · 四张变量卡 ============ */}
            {sysCards.map((c) => {
              const e = em(f, c.b, 12);
              return (
                <Paper key={c.n} x={c.x} y={250} w={280} h={152} rot={c.rot} op={e.op * out(f, 286, 10)} sc={e.sc}>
                  <text x={c.x + 22} y={284} fontFamily={SANS} fontSize={20} letterSpacing="0.2em" fill={P.clay}>{c.n}</text>
                  <text x={c.x + 22} y={342} fontFamily={SERIF} fontSize={46} fill={P.ink}>{c.k}</text>
                  <text x={c.x + 22} y={382} fontFamily={SERIF} fontSize={32} fill={P.clay}>{c.v}</text>
                  <text x={c.x + 160} y={382} fontFamily={SANS} fontSize={20} fill={P.faint}>{c.s}</text>
                </Paper>
              );
            })}

            {/* ============ 光 ============ */}
            <g opacity={phoneIn.op}>
              <rect x={1220} y={400} width={120} height={166} rx={16} fill="#fffaf0" stroke={P.ink} strokeWidth={4} filter="url(#liftS)" />
              <rect x={1230} y={410} width={100} height={146} rx={9} fill={P.mustard} opacity={0.45 + 0.2 * Math.sin(f / 6)} />
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1={1216} y1={432 + i * 32} x2={1152} y2={454 + i * 8} stroke={P.mustard} strokeWidth={3} strokeDasharray={1} pathLength={1} strokeDashoffset={drawOn(f, 330 + i * 3, 14)} opacity={0.9} />
              ))}
            </g>

            <g opacity={barsIn.op * out(f, 484, 10)}>
              <line x1={1520} y1={740} x2={1840} y2={740} stroke={P.ink} strokeWidth={3} />
              <rect x={1550} y={470} width={110} height={270} fill="rgba(143,174,124,0.55)" stroke={P.ink} strokeWidth={3.4} />
              <rect x={1670} y={barTop} width={110} height={270 * bh} fill="rgba(196,83,47,0.45)" stroke={P.clay} strokeWidth={3.4} />
              <text x={1605} y={448} textAnchor="middle" fontFamily={SANS} fontSize={28} fill={P.soft}>睡前</text>
              <text x={1725} y={448} textAnchor="middle" fontFamily={SANS} fontSize={28} fill={P.clay}>1 小时后</text>
              <line x1={1650} y1={470} x2={1650} y2={barTop - 10} stroke={P.clay} strokeWidth={3.4} strokeLinecap="round" />
              <polygon points={`1650,${barTop} 1637,${barTop - 20} 1663,${barTop - 20}`} fill={P.clay} />
              <text x={1550} y={790} fontFamily={SANS} fontSize={24} fill={P.faint}>褪黑素分泌</text>
            </g>

            <g opacity={em(f, 402, 12).op * out(f, 484, 10)}>
              <text x={1550} y={392} fontFamily={SERIF} fontSize={92} fill={P.clay}>−20~50%</text>
            </g>

            <Paper x={1520} y={170} w={320} h={150} rot={-1.2} op={em(f, 434, 12).op * out(f, 484, 10)} sc={em(f, 434, 12).sc}>
              <text x={1552} y={248} fontFamily={SERIF} fontSize={62} fill={P.ink}>+30 分钟</text>
              <text x={1554} y={290} fontFamily={SANS} fontSize={24} fill={P.soft}>入睡平均推迟</text>
            </Paper>

            {/* ============ 声 · 分贝尺 ============ */}
            <g opacity={out(f, 668, 14)}>
              <line x1={2300} y1={340} x2={2300} y2={760} stroke={P.ink} strokeWidth={4} strokeDasharray={1} pathLength={1} strokeDashoffset={drawOn(f, 488, 14)} />
              {[0, 10, 20, 30, 40, 50, 60].map((db) => {
                const e = em(f, 494, 10);
                return (
                  <g key={db} opacity={e.op}>
                    <line x1={2276} y1={dbY(db)} x2={2316} y2={dbY(db)} stroke={P.ink} strokeWidth={3} />
                    <text x={2250} y={dbY(db) + 10} textAnchor="end" fontFamily={SANS} fontSize={28} fill={P.soft}>{db}</text>
                  </g>
                );
              })}
              {/* 参照物 */}
              <text x={2326} y={dbY(10) + 10} fontFamily={SANS} fontSize={26} fill={P.faint} opacity={em(f, 512, 12).op}>呼吸</text>
              <text x={2326} y={dbY(60) + 10} fontFamily={SANS} fontSize={26} fill={P.faint} opacity={em(f, 520, 12).op}>说话</text>
              {/* WHO 30 线 */}
              <line x1={2376} y1={dbY(30)} x2={2540} y2={dbY(30)} stroke={P.sage} strokeWidth={7} strokeLinecap="round" strokeDasharray={1} pathLength={1} strokeDashoffset={drawOn(f, 530, 14)} />
              <text x={2552} y={dbY(30) + 10} fontFamily={SANS} fontSize={28} fill={P.sage} opacity={em(f, 542, 12).op}>WHO 夜间 ≤ 30</text>
              {/* 国标 45 线 */}
              <line x1={2376} y1={dbY(45)} x2={2540} y2={dbY(45)} stroke={P.clay} strokeWidth={3} strokeDasharray="12 10" opacity={em(f, 552, 12).op} />
              <text x={2552} y={dbY(45) + 10} fontFamily={SANS} fontSize={26} fill={P.clay} opacity={em(f, 552, 12).op}>国标限值 45</text>
              {/* 指针 */}
              <g transform={`translate(0 ${dbY(ptr)})`} opacity={em(f, 500, 10).op}>
                <polygon points="2324,0 2368,-20 2368,20" fill={P.clay} stroke={P.ink} strokeWidth={3} />
              </g>
            </g>

            <Paper x={2400} y={150} w={420} h={180} rot={-1.2} op={em(f, 562, 12).op * out(f, 668, 14)} sc={em(f, 562, 12).sc}>
              <text x={2432} y={240} fontFamily={SERIF} fontSize={80} fill={P.clay}>38–42</text>
              <text x={2434} y={290} fontFamily={SANS} fontSize={26} fill={P.ink}>主流冰箱实测 dB</text>
            </Paper>

            {/* ============ 温 ============ */}
            <Paper x={2620} y={250} w={450} h={530} rot={0.8} op={em(f, 682, 14).op * out(f, 856, 14)}>
              <text x={2652} y={302} fontFamily={SANS} fontSize={24} letterSpacing="0.18em" fill={P.clay}>温度 · 三个数</text>
              <line x1={2700} y1={340} x2={2700} y2={690} stroke={P.ink} strokeWidth={3.4} strokeDasharray={1} pathLength={1} strokeDashoffset={drawOn(f, 686, 14)} />
              {/* 室温列 */}
              <g opacity={em(f, 722, 12).op}>
                <rect x={2700} y={tY(22)} width={54} height={tY(18) - tY(22)} fill="rgba(143,174,124,0.65)" stroke={P.ink} strokeWidth={2.6} />
                <rect x={2700} y={tY(18)} width={54} height={tY(10) - tY(18)} fill="rgba(43,38,34,0.06)" stroke={P.ink} strokeWidth={2.4} />
                <text x={2876} y={tY(20) + 9} fontFamily={SANS} fontSize={26} fill={P.ink}>室温 18–22</text>
              </g>
              {/* 太暖区 */}
              <g opacity={em(f, 754, 12).op}>
                <rect x={2700} y={340} width={54} height={tY(24) - 340} fill="url(#hatch)" />
                <line x1={2684} y1={tY(24)} x2={2700} y2={tY(24)} stroke={P.clay} strokeWidth={3} />
                <text x={2676} y={tY(24) + 9} textAnchor="end" fontFamily={SANS} fontSize={22} fill={P.clay}>24</text>
                <line x1={2762} y1={462} x2={2856} y2={462} stroke={P.clay} strokeWidth={1.6} strokeDasharray="6 5" opacity={0.75} />
                <text x={2876} y={470} fontFamily={SANS} fontSize={26} fill={P.clay}>太暖</text>
              </g>
              {/* 被窝列 */}
              <g opacity={em(f, 706, 12).op}>
                <rect x={2782} y={tY(34)} width={54} height={tY(32) - tY(34)} fill="rgba(196,83,47,0.55)" stroke={P.clay} strokeWidth={2.6} />
                <text x={2876} y={tY(33) + 9} fontFamily={SANS} fontSize={26} fill={P.clay}>被窝 32–34</text>
              </g>
              {[10, 20, 30, 36].map((t) => (
                <g key={t} opacity={em(f, 694, 10).op}>
                  <line x1={2684} y1={tY(t)} x2={2700} y2={tY(t)} stroke={P.ink} strokeWidth={2.6} />
                  <text x={2676} y={tY(t) + 9} textAnchor="end" fontFamily={SANS} fontSize={22} fill={P.faint}>{t}</text>
                </g>
              ))}
              {/* 温差说明 */}
              <g opacity={em(f, 762, 12).op}>
                <text x={2876} y={618} fontFamily={SANS} fontSize={22} fill={P.sage}>高 12–14℃</text>
                <text x={2876} y={646} fontFamily={SANS} fontSize={22} fill={P.faint}>被子只保温</text>
              </g>
              {/* 湿度 */}
              <g opacity={em(f, 780, 12).op}>
                <text x={2652} y={722} fontFamily={SANS} fontSize={22} fill={P.soft}>湿度</text>
                <rect x={2724} y={706} width={236} height={16} rx={8} fill="rgba(43,38,34,0.1)" stroke={P.ink} strokeWidth={2} />
                <rect x={2818} y={706} width={48} height={16} rx={4} fill="rgba(143,174,124,0.95)" />
                <text x={2978} y={722} fontFamily={SANS} fontSize={22} fill={P.faint}>40–60%</text>
              </g>
            </Paper>

            {/* ============ 压 ============ */}
            <Paper x={3160} y={356} w={510} h={424} rot={-0.9} op={em(f, 880, 14).op * out(f, 1020, 14)}>
              <text x={3192} y={408} fontFamily={SANS} fontSize={24} letterSpacing="0.18em" fill={P.clay}>分区 · 五个区</text>
              <text x={3192} y={444} fontFamily={SANS} fontSize={22} fill={P.faint} opacity={em(f, 968, 12).op}>按美国体型切分</text>
              <text x={3192} y={470} fontFamily={SANS} fontSize={22} fill={P.faint} opacity={em(f, 986, 12).op}>床垫是支撑，不是治疗</text>

              {/* 腰段悬空标注 */}
              <g opacity={em(f, 946, 12).op}>
                <text x={3448} y={510} textAnchor="middle" fontFamily={SANS} fontSize={22} fill={P.clay}>腰段悬空</text>
                <line x1={3448} y1={518} x2={3448} y2={546} stroke={P.clay} strokeWidth={2.6} />
              </g>

              {/* 身体：躺平，腰下没有支撑 */}
              <g opacity={em(f, 930, 12).op}>
                <circle cx={3240} cy={566} r={19} fill={P.paper} stroke={P.indigo} strokeWidth={4} />
                <path d="M 3262 566 L 3600 566" stroke={P.indigo} strokeWidth={24} strokeLinecap="round" />
              </g>

              {/* 床垫剖面：腰下留槽 */}
              <g opacity={em(f, 890, 12).op}>
                <path d="M 3192 582 L 3416 582 L 3416 610 L 3480 610 L 3480 582 L 3638 582 L 3638 700 L 3192 700 Z" fill="#fffaf0" stroke={P.ink} strokeWidth={3.6} strokeLinejoin="round" />
                <rect x={3417} y={583} width={62} height={26} fill="rgba(196,83,47,0.13)" />
                <rect x={3192} y={700} width={446} height={56} rx={6} fill={P.paper2} stroke={P.ink} strokeWidth={3.4} />
                <text x={3200} y={740} fontFamily={SANS} fontSize={21} fill={P.soft}>承重点在肩和髋，腰这一段是空的</text>
                {[1, 2, 3, 4].map((i) => {
                  const lx = 3192 + i * 89.2;
                  const top = lx > 3416 && lx < 3480 ? 610 : 582;
                  return (
                    <line key={i} x1={lx} y1={top} x2={lx} y2={700} stroke={P.ink} strokeWidth={2.2} strokeDasharray="10 8" opacity={em(f, 900 + i * 6, 10).op} />
                  );
                })}
              </g>
            </Paper>

{/* ============ 小人 ============ */}
            <Guide f={f} />

            {/* 被子拉上来 */}
            {(() => {
              const t = smooth(clamp01((f - 1276) / 30));
              if (t <= 0) return null;
              return (
                <g clipPath="url(#quiltClip)">
                <g transform={`translate(0 ${(1 - t) * 170})`} opacity={t}>
                  <rect x={430} y={612} width={330} height={96} rx={22} fill={P.sage} stroke={P.ink} strokeWidth={4} filter="url(#liftS)" />
                  <path d="M 448 656 Q 560 646 660 658 Q 720 666 742 656" fill="none" stroke={P.ink} strokeWidth={2.4} opacity={0.5} />
                </g>
                </g>
              );
            })()}
          </g>
        </g>

        {/* ============ 屏幕空间 ============ */}
        <g opacity={out(f, 116, 12)}>
          <text x={120} y={200} fontFamily={SANS} fontSize={30} letterSpacing="0.24em" fill={P.clay}>深睡自由</text>
          <text x={120} y={300} fontFamily={SERIF} fontSize={96} fill={P.ink}>睡不好，</text>
        </g>
        <g opacity={buOp} transform={`translate(0 ${bu.dy})`}>
          <text x={120} y={404} fontFamily={SERIF} fontSize={96} fill={P.ink}>不怪你。</text>
        </g>

        <Title k="四个变量" t="卧室是个系统" op={em(f, 130, 12).op * out(f, 284, 10)} size={86} />
        <Title k="变量一 · 光" t="睡前刷手机 1 小时" op={em(f, 292, 12).op * out(f, 476, 10)} />
        <Title k="变量二 · 声" t="夜里的标准是 30 分贝" op={em(f, 484, 12).op * out(f, 664, 10)} />
        <Title k="变量三 · 温" t="不是越暖越好" op={em(f, 676, 12).op * out(f, 852, 10)} />
        <Title k="变量四 · 压" t="分区，分的是别人的体型" op={em(f, 868, 12).op * out(f, 1020, 10)} size={80} />

        {/* 系统段的总结句 */}
        <text x={120} y={906} fontFamily={SANS} fontSize={34} fill={P.soft} opacity={em(f, 196, 12).op * out(f, 284, 10)}>
          四个变量同时作用，缺一个都睡不沉
        </text>

        {/* 优先级：按价钱排 —— 一张清单 */}
        {(() => {
          const rows = [
            { n: "01", k: "关灯、拉遮光帘", c: "0 元", w: "当晚", e: "褪黑素回升", b: 1054 },
            { n: "02", k: "冰箱离墙 10cm", c: "0 元", w: "当晚", e: "夜噪 ≤ 30dB", b: 1070 },
            { n: "03", k: "室温 18–22℃", c: "0 元", w: "当晚", e: "被窝 32–34", b: 1086 },
            { n: "04", k: "换分区床垫", c: "千元级", w: "1–2 周", e: "腰段有支撑", b: 1102 },
          ];
          const y = [330, 424, 518, 612];
          return (
            <g opacity={em(f, 1038, 12).op * out(f, 1182, 12)}>
              <Paper x={780} y={226} w={1050} h={506} rot={-0.5} fill="#fff8ea">
                <g opacity={em(f, 1038, 12).op}>
                  <text x={812} y={268} fontFamily={SANS} fontSize={20} letterSpacing="0.16em" fill={P.faint}>花费</text>
                  <text x={1392} y={268} fontFamily={SANS} fontSize={20} letterSpacing="0.16em" fill={P.faint}>生效</text>
                  <text x={1512} y={268} fontFamily={SANS} fontSize={20} letterSpacing="0.16em" fill={P.faint}>换来什么</text>
                  <line x1={812} y1={284} x2={1800} y2={284} stroke={P.line} strokeWidth={2} />
                </g>
                {rows.map((r, i) => {
                  const e = em(f, r.b, 12);
                  const dim = r.n === "04";
                  return (
                    <g key={r.n} opacity={e.op} transform={`translate(0 ${e.dy})`}>
                      <text x={812} y={y[i]} fontFamily={SANS} fontSize={22} letterSpacing="0.16em" fill={P.clay}>{r.n}</text>
                      <text x={876} y={y[i]} fontFamily={SERIF} fontSize={40} fill={dim ? P.soft : P.ink}>{r.k}</text>
                      <text x={1256} y={y[i]} fontFamily={SANS} fontSize={30} fill={dim ? P.clay : P.sage}>{r.c}</text>
                      <text x={1392} y={y[i]} fontFamily={SANS} fontSize={24} fill={P.soft}>{r.w}</text>
                      <text x={1512} y={y[i]} fontFamily={SANS} fontSize={25} fill={P.soft}>{r.e}</text>
                      <line x1={812} y1={y[i] + 34} x2={1800} y2={y[i] + 34} stroke={P.line} strokeWidth={1.6} />
                    </g>
                  );
                })}
                <text x={812} y={700} fontFamily={SANS} fontSize={28} fill={P.soft} opacity={em(f, 1118, 12).op}>
                  前三件今晚就能做，第四件排最后。
                </text>
              </Paper>
            </g>
          );
        })()}
        <Title k="今晚能做的" t="按价钱排" op={em(f, 1038, 12).op * out(f, 1182, 12)} />

        {/* 金句 */}
        <g opacity={em(f, 1198, 14).op}>
          <text x={960} y={212} textAnchor="middle" fontFamily={SERIF} fontSize={96} fill={P.ink}>白天向外消耗，</text>
        </g>
        <g opacity={em(f, 1230, 14).op}>
          <text x={960} y={344} textAnchor="middle" fontFamily={SERIF} fontSize={96} fill={P.clay}>夜里向内修复。</text>
        </g>
        <g opacity={em(f, 1262, 12).op}>
          <text x={960} y={1004} textAnchor="middle" fontFamily={SANS} fontSize={26} letterSpacing="0.3em" fill={P.soft}>深睡自由 · 居住观测</text>
        </g>

        {/* 脚注 */}
        <Foot t="数据：抖音商城 × 奥维云网 2026-10 · WHO 2026-08" op={out(f, 126, 12)} />
        <Foot t="变量命名取自趋势报告「深睡自由」，拆解为本片结构" op={em(f, 130, 12).op * out(f, 284, 10)} />
        <Foot t="褪黑素 −20~50%，入睡 +30 分钟 · 综述多项研究 2026-02" op={em(f, 292, 12).op * out(f, 476, 10)} />
        <Foot t="WHO 2026-08；冰箱实测 2026-10；国标限值 45" op={em(f, 484, 12).op * out(f, 664, 10)} />
        <Foot t="室温 18–22℃ / 被窝 32–34℃ / 湿度 40–60%" op={em(f, 676, 12).op * out(f, 852, 10)} />
        <Foot t="分区床垫源自美国体型研究 · 北京科技报 2026-10" op={em(f, 868, 12).op * out(f, 1020, 10)} />
        <Foot t="排序依据：花费 × 当晚能否生效 · 非厂商建议" op={em(f, 1038, 12).op * out(f, 1182, 12)} />
      </svg>

      <Audio src={staticFile("bgm-qn45.wav")} volume={0.85} />
    </AbsoluteFill>
  );
};

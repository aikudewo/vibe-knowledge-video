import React from "react";
import { AbsoluteFill } from "remotion";
import { SANS, SERIF } from "./Neon";

/* ============================================================
   封面 · 大字理论
   1080×1440（3:4，抖音主页列表比例）
   安全区：x 60–930 / y 60–1150（底部 290px 会被标题和作者名盖住）

   主体不是拼豆板，是这支片子的招牌镜头：斜的暗色仪表板 + 四个表盘。
   一张封面里同时给出这次的两个新风格——暗场、三维斜板。
   ============================================================ */

const P = {
  paper: "#f4ecdc",
  ink: "#2b2622",
  soft: "rgba(43,38,34,0.84)",
  faint: "rgba(43,38,34,0.64)",
  line: "rgba(43,38,34,0.28)",
  clay: "#c4532f",
};

const DK = {
  ink: "#f2eee4",
  soft: "rgba(242,238,228,0.78)",
  edge: "rgba(238,234,224,0.24)",
  indigo: "#8fb4e6",
  clay: "#e87848",
};

const W = 1080;
const H = 1440;
const SQ = 0.84;

const DIALS = [
  { cx: 392, cy: 792, val: "8421" },
  { cx: 688, cy: 786, val: "76" },
  { cx: 392, cy: 942, val: "1860" },
  { cx: 688, cy: 936, val: "22.4" },
];

const Dial: React.FC<{ cx: number; cy: number; val: string; ang: number }> = ({ cx, cy, val, ang }) => {
  const R = 74;
  const rad = (a: number) => (a * Math.PI) / 180;
  const pt = (a: number, r: number): [number, number] => [cx + Math.sin(rad(a)) * r, cy - Math.cos(rad(a)) * r * SQ];
  const [nx, ny] = pt(ang, R - 26);
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={R} ry={R * SQ} fill="rgba(143,180,230,0.06)" stroke={DK.ink} strokeWidth={3.2} />
      {Array.from({ length: 13 }, (_, i) => {
        const a = -120 + i * 20;
        const major = i % 3 === 0;
        const [x1, y1] = pt(a, R - 7);
        const [x2, y2] = pt(a, R - (major ? 20 : 14));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={major ? DK.indigo : DK.soft} strokeWidth={major ? 3 : 1.7} strokeLinecap="round" />;
      })}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={DK.clay} strokeWidth={5} strokeLinecap="round" filter="url(#cglow)" />
      <circle cx={cx} cy={cy} r={5.5} fill={DK.ink} />
      <text x={cx} y={cy + 44} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={34} fill={DK.ink} filter="url(#cglow)">{val}</text>
    </g>
  );
};

const Board: React.FC = () => (
  <g>
    {/* 顶面 + 前唇，和正片同一套透视 */}
    <path d="M 262 706 L 818 674 L 852 1010 L 226 1044 Z" fill="#1b2027" stroke={DK.edge} strokeWidth={4} strokeLinejoin="round" filter="url(#clift)" />
    <path d="M 226 1044 L 852 1010 L 852 1036 L 226 1070 Z" fill="#12161b" stroke={DK.edge} strokeWidth={4} strokeLinejoin="round" />
    <path d="M 272 722 L 808 692 L 840 996 L 240 1028 Z" fill="none" stroke="rgba(143,180,230,0.18)" strokeWidth={2} />
    {DIALS.map((d) => (
      <Dial key={d.val} cx={d.cx} cy={d.cy} val={d.val} ang={-46 + (d.cx % 90) + (d.cy % 70)} />
    ))}
  </g>
);

export const CoverDazi: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: P.paper }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id="cgrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.86" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <filter id="cglow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="clift" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#8a6a44" floodOpacity="0.34" />
          </filter>
          <radialGradient id="cglowbg" cx="0.5" cy="0.36" r="0.68">
            <stop offset="0" stopColor="#fffdf6" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fffdf6" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill={P.paper} />
        <rect width={W} height={H} fill="url(#cglowbg)" />
        <rect width={W} height={H} filter="url(#cgrain)" opacity={0.075} />

        {/* 顶部短横线 */}
        <line x1={W / 2 - 46} y1={150} x2={W / 2 + 46} y2={150} stroke={P.clay} strokeWidth={5} strokeLinecap="round" />

        {/* 标题（跟文案标题一致） */}
        <text x={W / 2} y={296} textAnchor="middle" fontFamily={SERIF} fontSize={100} fill={P.ink} letterSpacing="0.02em">
          这个字不是「多」，
        </text>
        <text x={W / 2} y={412} textAnchor="middle" fontFamily={SERIF} fontSize={100} fill={P.ink} letterSpacing="0.02em">
          是「不用量」。
        </text>

        {/* 分隔线 */}
        <line x1={W / 2 - 110} y1={484} x2={W / 2 + 110} y2={484} stroke={P.line} strokeWidth={2} />

        {/* 副标题：四个词 */}
        <text x={W / 2} y={556} textAnchor="middle" fontFamily={SANS} fontSize={42} fill={P.soft}>
          大水、大睡、大菜、大走
        </text>

        {/* 主体：斜的暗板 */}
        <Board />

        {/* 底部小字：解释板上的四个数字 */}
        <text x={W / 2} y={1112} textAnchor="middle" fontFamily={SANS} fontSize={30} fill={P.faint} letterSpacing="0.08em">
          步数 · 卡路里 · 睡眠分 · 体脂率
        </text>
      </svg>
    </AbsoluteFill>
  );
};

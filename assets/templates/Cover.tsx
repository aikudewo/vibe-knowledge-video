import React from "react";
import { AbsoluteFill } from "remotion";
import { SANS, SERIF } from "./Neon";

/* ============================================================
   封面 · 大人为什么开始玩小孩的玩具
   1080×1440（3:4，抖音主页列表比例）
   安全区：x 60–930 / y 60–1150（底部 290px 会被标题和作者名盖住）
   ============================================================ */

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

const W = 1080;
const H = 1440;

/* 7×7 心形 */
const HEART = [
  "0110110",
  "1111111",
  "1111111",
  "1111111",
  "0111110",
  "0011100",
  "0001000",
];

const Board: React.FC = () => {
  const size = 470;
  const x = (W - size) / 2;
  const y = 676;
  const pad = 24;
  const N = 9;
  const cell = (size - pad * 2) / N;
  const OFF = 1;

  const isOn = (r: number, c: number) => {
    const rr = r - OFF;
    const cc = c - OFF;
    if (rr < 0 || rr > 6 || cc < 0 || cc > 6) return false;
    return HEART[rr][cc] === "1";
  };

  return (
    <g>
      {/* 板身 */}
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        rx={12}
        fill="#e3d2b4"
        stroke={P.ink}
        strokeWidth={6}
      />
      {/* 内凹底面 */}
      <rect
        x={x + pad - 9}
        y={y + pad - 9}
        width={size - (pad - 9) * 2}
        height={size - (pad - 9) * 2}
        rx={7}
        fill="rgba(43,38,34,0.08)"
      />
      {Array.from({ length: N }).map((_, r) =>
        Array.from({ length: N }).map((__, c) => {
          const on = isOn(r, c);
          const cx = x + pad + c * cell;
          const cy = y + pad + r * cell;
          const s = cell - 7;
          return (
            <g key={`${r}-${c}`}>
              {on ? (
                <>
                  {/* 豆身 */}
                  <rect
                    x={cx + 3.5}
                    y={cy + 3.5}
                    width={s}
                    height={s}
                    rx={s * 0.3}
                    fill={P.clay}
                  />
                  {/* 中心孔 */}
                  <circle
                    cx={cx + 3.5 + s / 2}
                    cy={cy + 3.5 + s / 2}
                    r={s * 0.19}
                    fill="#8e3a20"
                  />
                  {/* 高光 */}
                  <rect
                    x={cx + 3.5 + s * 0.17}
                    y={cy + 3.5 + s * 0.12}
                    width={s * 0.3}
                    height={s * 0.18}
                    rx={s * 0.11}
                    fill="rgba(255,255,255,0.3)"
                  />
                </>
              ) : (
                <circle
                  cx={cx + cell / 2}
                  cy={cy + cell / 2}
                  r={s * 0.17}
                  fill="rgba(43,38,34,0.2)"
                />
              )}
            </g>
          );
        })
      )}
      {/* 四角压痕 */}
      <circle cx={x + 15} cy={y + 15} r={3.6} fill="rgba(43,38,34,0.24)" />
      <circle cx={x + size - 15} cy={y + 15} r={3.6} fill="rgba(43,38,34,0.24)" />
      <circle cx={x + 15} cy={y + size - 15} r={3.6} fill="rgba(43,38,34,0.24)" />
      <circle cx={x + size - 15} cy={y + size - 15} r={3.6} fill="rgba(43,38,34,0.24)" />
    </g>
  );
};

/* 散落的几颗豆子 */
const Loose: React.FC<{
  x: number;
  y: number;
  r: number;
  color: string;
  hole: string;
  rot?: number;
}> = ({ x, y, r, color, hole, rot = 0 }) => (
  <g transform={`rotate(${rot} ${x} ${y})`}>
    <rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={r * 0.34} fill={color} />
    <circle cx={x} cy={y} r={r * 0.34} fill={hole} />
    <rect
      x={x - r + r * 0.3}
      y={y - r + r * 0.24}
      width={r * 0.62}
      height={r * 0.36}
      rx={r * 0.18}
      fill="rgba(255,255,255,0.3)"
    />
  </g>
);

export const Cover: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: P.paper }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.86"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <radialGradient id="glow" cx="0.5" cy="0.4" r="0.66">
            <stop offset="0" stopColor="#fffdf6" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fffdf6" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill={P.paper} />
        <rect width={W} height={H} fill="url(#glow)" />
        <rect width={W} height={H} filter="url(#grain)" opacity={0.075} />

        {/* 顶部标记 */}
        <line
          x1={W / 2 - 46}
          y1={152}
          x2={W / 2 + 46}
          y2={152}
          stroke={P.clay}
          strokeWidth={5}
          strokeLinecap="round"
        />

        {/* 标题 */}
        <text
          x={W / 2}
          y={306}
          textAnchor="middle"
          fontFamily={SERIF}
          fontSize={124}
          fill={P.ink}
          letterSpacing="0.03em"
        >
          大人为什么
        </text>
        <text
          x={W / 2}
          y={452}
          textAnchor="middle"
          fontFamily={SERIF}
          fontSize={124}
          fill={P.ink}
          letterSpacing="0.03em"
        >
          玩小孩的玩具
        </text>

        {/* 分隔线 */}
        <line
          x1={W / 2 - 100}
          y1={524}
          x2={W / 2 + 100}
          y2={524}
          stroke={P.line}
          strokeWidth={2}
        />

        {/* 副标题 */}
        <text
          x={W / 2}
          y={600}
          textAnchor="middle"
          fontFamily={SANS}
          fontSize={44}
          fill={P.soft}
        >
          一年
          <tspan fontFamily={SANS} fontWeight={700} fontSize={54} fill={P.clay}>
            {" "}387 亿次{" "}
          </tspan>
          播放
        </text>

        {/* 主体 */}
        <Board />
        <Loose x={212} y={760} r={30} color={P.mustard} hole="#a97c1f" rot={-14} />
        <Loose x={168} y={872} r={24} color={P.sage} hole="#5c7048" rot={9} />
        <Loose x={236} y={962} r={20} color={P.indigo} hole="#232d42" rot={-22} />
        <Loose x={868} y={1046} r={28} color={P.mustard} hole="#a97c1f" rot={16} />
        <Loose x={912} y={936} r={22} color={P.clay} hole="#8e3a20" rot={-8} />

        {/* 底部小字（在安全区内） */}
        <text
          x={W / 2}
          y={1236}
          textAnchor="middle"
          fontFamily={SANS}
          fontSize={30}
          fill={P.faint}
          letterSpacing="0.18em"
        >
          成年人的解压方式
        </text>
      </svg>
    </AbsoluteFill>
  );
};

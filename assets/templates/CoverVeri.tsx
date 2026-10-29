import React from "react";
import { AbsoluteFill } from "remotion";

/* ============================================================
   封面 · 验牌 · 包豪斯版
   1080×1440（3:4，抖音主页列表比例）
   安全区：x 60–930 / y 60–1150（底部 290px 会被作者名盖住）

   主体从片子里挑招牌镜头：白底黑框的「说法牌」+ 红圆判定章，
   配上包豪斯三原色（蓝方块 / 黄三角 / 红圆章）。
   副标题是四枚判定章（多半不是 / 不合适 / 半真 / 半真），
   既是这支片子的签名，也直接复用了正片的判定语。
   标题跟文案主张一致：家里流传的那几句话，没有一句全对。
   底部 30px 小字是结尾金句。
   ============================================================ */

const C = {
  paper: "#f1e9da",
  card: "#faf6ec",
  red: "#d8322a",
  yellow: "#f2b51d",
  blue: "#1f4fa3",
  black: "#151515",
};

const W = 1080;
const H = 1440;

const F_BOLD = '"Microsoft YaHei","PingFang SC","Hiragino Sans GB",sans-serif';
const F_MONO = 'Consolas,"Courier New",monospace';

/* 四枚判定章（复刻正片段 7 的合计） */
const STAMPS = [
  { t: "多半不是", bg: C.red, fg: "#ffffff" },
  { t: "不合适", bg: C.red, fg: "#ffffff" },
  { t: "半真", bg: C.yellow, fg: C.black },
  { t: "半真", bg: C.yellow, fg: C.black },
];

const VerdictChips: React.FC = () => {
  const cw = 150;
  const ch = 54;
  const gap = 22;
  const total = STAMPS.length * cw + (STAMPS.length - 1) * gap;
  const x0 = (W - total) / 2;
  const cy = 604;
  return (
    <g>
      {STAMPS.map((s, i) => {
        const x = x0 + i * (cw + gap);
        const y = cy - ch / 2;
        return (
          <g key={s.t + i}>
            <rect x={x} y={y} width={cw} height={ch} rx={3} fill={s.bg} stroke={C.black} strokeWidth={2.5} />
            <text
              x={x + cw / 2}
              y={cy + 11}
              textAnchor="middle"
              fontFamily={F_BOLD}
              fontWeight={900}
              fontSize={30}
              fill={s.fg}
              letterSpacing="0.04em"
            >
              {s.t}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/* 主体：说法牌 + 包豪斯三原色 + 红圆判定章 */
const Plate: React.FC = () => {
  const cx = 540;
  const cardX = 150;
  const cardY = 706;
  const cardW = 780;
  const cardH = 360;
  return (
    <g>
      {/* 说法牌：白底黑框 */}
      <rect x={cardX} y={cardY} width={cardW} height={cardH} fill={C.card} stroke={C.black} strokeWidth={4} />
      {/* 左上角编号章 01 */}
      <rect x={cardX} y={cardY} width={96} height={96} fill={C.black} />
      <text
        x={cardX + 48}
        y={cardY + 62}
        textAnchor="middle"
        fontFamily={F_MONO}
        fontWeight={700}
        fontSize={46}
        fill="#ffffff"
      >
        01
      </text>

      {/* 包豪斯三原色：蓝方块 / 黄三角 / 红圆章 */}
      <rect x={300} y={842} width={122} height={122} fill={C.blue} />
      <polygon points={`${478},958 ${548},824 ${618},958`} fill={C.yellow} />

      {/* 红圆判定章（盖章感，压在牌的右半） */}
      <g>
        <circle cx={824} cy={892} r={104} fill={C.red} />
        <circle cx={824} cy={892} r={88} fill="none" stroke="#ffffff" strokeWidth={3} opacity={0.85} />
        <text
          x={824}
          y={892 + 20}
          textAnchor="middle"
          fontFamily={F_BOLD}
          fontWeight={900}
          fontSize={54}
          fill="#ffffff"
          letterSpacing="0.06em"
        >
          验牌
        </text>
      </g>
    </g>
  );
};

export const CoverVeri: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id="vgrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>

        {/* 背景纸 + 极淡网格 + 颗粒 */}
        <rect width={W} height={H} fill={C.paper} />
        <g stroke="rgba(21,21,21,0.05)" strokeWidth={1.2}>
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={i * 120} y1={0} x2={i * 120} y2={H} />
          ))}
          {Array.from({ length: 13 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 120} x2={W} y2={i * 120} />
          ))}
        </g>
        <rect width={W} height={H} filter="url(#vgrain)" opacity={0.05} />

        {/* 顶部短红线 */}
        <line x1={W / 2 - 48} y1={150} x2={W / 2 + 48} y2={150} stroke={C.red} strokeWidth={6} strokeLinecap="round" />

        {/* kicker */}
        <text
          x={W / 2}
          y={240}
          textAnchor="middle"
          fontFamily={F_BOLD}
          fontWeight={700}
          fontSize={30}
          fill="rgba(21,21,21,0.62)"
          letterSpacing="0.32em"
        >
          验牌 · 包豪斯版
        </text>

        {/* 标题（跟文案主张一致） */}
        <text
          x={W / 2}
          y={362}
          textAnchor="middle"
          fontFamily={F_BOLD}
          fontWeight={900}
          fontSize={80}
          fill={C.black}
          letterSpacing="0.01em"
        >
          家里流传的那几句话
        </text>
        <text
          x={W / 2}
          y={468}
          textAnchor="middle"
          fontFamily={F_BOLD}
          fontWeight={900}
          fontSize={80}
          fill={C.black}
          letterSpacing="0.01em"
        >
          没有一句全对。
        </text>

        {/* 分隔细线 */}
        <line x1={W / 2 - 150} y1={540} x2={W / 2 + 150} y2={540} stroke="rgba(21,21,21,0.25)" strokeWidth={2} />

        {/* 副标题：四枚判定章（这片的签名） */}
        <VerdictChips />

        {/* 主体：说法牌 + 三原色 + 红圆章 */}
        <Plate />

        {/* 底部金句（30px 小字） */}
        <text
          x={W / 2}
          y={1126}
          textAnchor="middle"
          fontFamily={F_BOLD}
          fontWeight={700}
          fontSize={28}
          fill="rgba(21,21,21,0.58)"
          letterSpacing="0.06em"
        >
          听来的都算传闻 · 查过的才算常识
        </text>
      </svg>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

/* 演唱会 · 封面 1080×1440（3:4）
   标题跟文案一致：越说没钱，票越抢不到。
   主体用片中招牌：一张票 + 售罄章 + 480→2000。暗底最跳。
*/

const W = 1080;
const H = 1440;
const C = {
  cream: "#f6eeda",
  gold: "#c79a55",
  clay: "#b8431f",
  red: "#f2543a",
  dark: "#14100d",
};
const F = "Microsoft YaHei, sans-serif";
const SERIF = '"Songti SC","SimSun",serif';

export const ConcertCover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.dark }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <radialGradient id="cg" cx="0.5" cy="0.44" r="0.62">
          <stop offset="0" stopColor="#f6dfa8" stopOpacity={0.42} />
          <stop offset="1" stopColor="#f6dfa8" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="cb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2c877" stopOpacity={0.38} />
          <stop offset="1" stopColor="#f2c877" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={C.dark} />
      <ellipse cx={540} cy={780} rx={580} ry={640} fill="url(#cg)" />
      <g opacity={0.5}>
        <polygon points="540,-40 250,1180 380,1180" fill="url(#cb)" />
        <polygon points="540,-40 700,1180 830,1180" fill="url(#cb)" />
      </g>

      {/* 顶部短横线 */}
      <line x1={494} y1={150} x2={586} y2={150} stroke={C.clay} strokeWidth={6} strokeLinecap="round" />

      {/* 标题（跟文案一致） */}
      <text x={540} y={306} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={104} fill={C.cream}>越说没钱，</text>
      <text x={540} y={424} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={104} fill={C.cream}>票越抢不到。</text>

      {/* 副标题 */}
      <text x={540} y={508} textAnchor="middle" fontFamily={F} fontSize={40} fill={C.gold} letterSpacing="0.12em">演唱会的口红效应</text>

      {/* 价格 */}
      <text x={318} y={1112} textAnchor="middle" fontFamily={F} fontSize={46} fill={C.cream} opacity={0.6}>480</text>
      <line x1={272} y1={1096} x2={364} y2={1096} stroke={C.cream} strokeWidth={3} opacity={0.6} />
      <text x={402} y={1112} textAnchor="middle" fontFamily={F} fontSize={46} fill={C.cream} opacity={0.6}>→</text>
      <text x={520} y={1112} textAnchor="middle" fontFamily={F} fontWeight={700} fontSize={66} fill={C.red}>2000</text>
      <text x={752} y={1104} textAnchor="middle" fontFamily={F} fontSize={28} fill={C.cream} opacity={0.55}>837 亿 · 3800 万人次</text>
    </svg>

    {/* 票 + 售罄章 */}
    <Img src={staticFile("concert/assets/ticket.png")} style={{ position: "absolute", left: 290, top: 548, width: 500, height: "auto", transform: "rotate(-8deg)", filter: "drop-shadow(0 30px 44px rgba(0,0,0,0.55))" }} />
    <div style={{ position: "absolute", left: 405, top: 700, transform: "rotate(-14deg)" }}>
      <div style={{ border: `10px solid #e5432f`, borderRadius: 12, padding: "6px 34px", color: "#e5432f", fontSize: 100, fontWeight: 900, fontFamily: F, letterSpacing: "0.06em", background: "rgba(20,16,13,0.12)" }}>售罄</div>
    </div>
  </AbsoluteFill>
);

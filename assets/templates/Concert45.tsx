import React from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from "remotion";

/* ============================================================
   演唱会 · 口红效应 · 45 秒（Concert45 / 1350 帧）
   每段满屏、底色不同；光爆转场；小人 + 追光当视觉锚点。
   ============================================================ */

const W = 1920;
const H = 1080;
const SEG = 1400;
const OX = 260;

const C = {
  paper: "#efe2c8",
  card: "#f7eeda",
  ink: "#17211d",
  clay: "#b8431f",
  teal: "#2f6b65",
  gold: "#b8863f",
  cream: "#f6eeda",
  dark: "#14100d",
};

const F = "Microsoft YaHei, sans-serif";
const FM = 'Consolas,"Courier New",monospace';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const snap = (f: number, at: number, dur = 9) => smooth(clamp01((f - at) / dur));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

const START = [0, 90, 180, 420, 570, 720, 900, 1080, 1230, 1350];
const BOUNDS = [90, 180, 420, 570, 720, 900, 1080, 1230];
const TW = 22;

const sceneAt = (f: number) => {
  let i = 0;
  for (let k = 0; k < 9; k++) if (f >= START[k]) i = k;
  let bloom = 0;
  for (const b of BOUNDS) {
    const d = Math.abs(f - b);
    if (d < TW / 2) bloom = Math.max(bloom, 1 - d / (TW / 2));
  }
  return { i, bloom: smooth(bloom) };
};

const T: React.FC<{
  x: number; y: number; s: number; fill: string; w?: number; a?: string;
  op?: number; ls?: string; ff?: string; children: React.ReactNode;
}> = ({ x, y, s, fill, w = 400, a = "middle", op = 1, ls, ff, children }) => (
  <text x={x} y={y} textAnchor={a} fontFamily={ff || F} fontSize={s} fontWeight={w} fill={fill} opacity={op} letterSpacing={ls}>
    {children}
  </text>
);

const SH = "drop-shadow(0 16px 20px rgba(60,38,16,0.3))";
const SHH = "drop-shadow(0 24px 28px rgba(50,32,12,0.34))";

const DOTS = Array.from({ length: 90 }, (_, i) => {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  const t = Math.sin(i * 78.233) * 12345.6789;
  return { x: 40 + Math.abs(s % 1) * (W - 80), y: 60 + Math.abs(t % 1) * 940, r: 2 + (i % 3) };
});

const SCATTER = Array.from({ length: 64 }, (_, i) => {
  const s = Math.sin(i * 91.7) * 43758.5;
  const t = Math.sin(i * 47.3 + 1.3) * 12345.6;
  const isTicket = i % 2 === 0;
  const w = 54 + (i % 4) * 16;
  const h = isTicket ? w * 0.98 : w * 2.18;
  return { x: 60 + Math.abs(s % 1) * (W - 200), y: 110 + Math.abs(t % 1) * 700, w, h, isTicket, rot: (i % 7 - 3) * 7, op: 0.16 + (i % 3) * 0.06 };
});

const FG = Array.from({ length: 30 }, (_, i) => {
  const s = Math.sin(i * 31.7 + 4.1) * 43758.5;
  const t = Math.sin(i * 63.3 + 2.7) * 12345.6;
  return { x: 80 + Math.abs(s % 1) * (W - 160), y: 100 + Math.abs(t % 1) * 880, r: 2.5 + (i % 3) * 1.2, sp: 0.3 + (i % 4) * 0.12 };
});

/* 全局纹理：纸 + 网点 + 网格 + 人群 + 散落道具 */
const BG: React.FC<{ f: number }> = ({ f }) => {
  const vs: number[] = [];
  for (let x = 0; x <= W; x += 120) vs.push(x);
  const hs: number[] = [];
  for (let y = 0; y <= H; y += 120) hs.push(y);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <pattern id="halftone" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.15" fill={C.ink} opacity={0.06} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={C.paper} />
      <rect width={W} height={H} fill="url(#halftone)" />
      <g stroke={C.ink} strokeOpacity={0.09} strokeWidth={1.2}>
        {vs.map((x) => <line key={`v${x}`} x1={x} y1={0} x2={x} y2={H} />)}
        {hs.map((y) => <line key={`h${y}`} x1={0} y1={y} x2={W} y2={y} />)}
      </g>
      {Array.from({ length: 5 }, (_, i) => (
        <image key={`cw${i}`} href={staticFile("concert/assets/crowd.png")} x={i * 400 - 40} y={826} width={400} height={240} opacity={0.16} />
      ))}
      {SCATTER.map((s, i) => (
        <image key={`sc${i}`} href={staticFile(s.isTicket ? "concert/assets/ticket.png" : "concert/assets/pricetag.png")}
          x={s.x} y={s.y} width={s.w} height={s.h} opacity={s.op}
          transform={`rotate(${s.rot} ${s.x + s.w / 2} ${s.y + s.h / 2})`} />
      ))}
      {DOTS.map((d, i) => {
        const dy = ((f * 0.28 + i * 31) % 80) - 40;
        return <circle key={i} cx={d.x} cy={d.y - dy} r={d.r} fill={C.gold} opacity={0.42} />;
      })}
    </svg>
  );
};

/* 视觉锚点：小人 + 追光，固定左下，每屏都在 */
const Stage: React.FC<{ f: number; dark?: boolean }> = ({ f, dark }) => {
  const x = 250, y = 930;
  const bob = Math.sin(f * 0.32) * 3;
  return (
    <g>
      <ellipse cx={x} cy={y - 150} rx={150} ry={210} fill={dark ? C.cream : C.gold} opacity={dark ? 0.26 : 0.16} />
      <ellipse cx={x} cy={y - 4} rx={70} ry={12} fill={C.ink} opacity={0.22} />
      <image href={staticFile("concert/assets/person_walk.png")} x={x - 68} y={y - 258 + bob} width={136} height={259} opacity={0.96} />
    </g>
  );
};

const Panel: React.FC = () => (
  <rect x={120} y={70} width={SEG - 240} height={940} rx={26} fill={C.teal} opacity={0.06} />
);

/* 四边框条 + 边角道具：填满 1920 的两侧留白 */
const Edge: React.FC<{ i: number }> = ({ i }) => {
  const ticks = Array.from({ length: 12 }, (_, k) => 130 + k * 70);
  const tops = Array.from({ length: 16 }, (_, k) => 120 + k * 110);
  return (
    <g>
      <circle cx={0} cy={0} r={200} fill={C.clay} opacity={0.1} />
      <circle cx={1920} cy={1080} r={240} fill={C.teal} opacity={0.1} />
      <image href={staticFile("concert/assets/ticket.png")} x={-110} y={210} width={320} height={315} opacity={0.5} transform="rotate(-14 50 370)" />
      <image href={staticFile("concert/assets/stub.png")} x={1720} y={560} width={320} height={263} opacity={0.48} transform="rotate(12 1880 690)" />
      <rect x={26} y={70} width={5} height={940} fill={C.clay} opacity={0.4} />
      <rect x={1889} y={70} width={5} height={940} fill={C.clay} opacity={0.4} />
      {ticks.map((y, k) => (
        <g key={k}>
          <line x1={36} y1={y} x2={k % 2 ? 54 : 72} y2={y} stroke={C.ink} strokeWidth={2} opacity={0.42} />
          <line x1={1884} y1={y} x2={k % 2 ? 1866 : 1848} y2={y} stroke={C.ink} strokeWidth={2} opacity={0.42} />
        </g>
      ))}
      {tops.map((x, k) => (
        <line key={k} x1={x} y1={10} x2={x} y2={k % 2 ? 26 : 38} stroke={C.ink} strokeWidth={2} opacity={0.35} />
      ))}
      <T x={74} y={62} s={26} fill={C.ink} w={700} a="start" op={0.72}>{String(i + 1).padStart(2, "0")}</T>
      <T x={1846} y={62} s={26} fill={C.ink} w={700} a="end" op={0.72}>/ 09</T>
    </g>
  );
};

/* 段1 · 钩子A */
const S1: React.FC<{ f: number }> = ({ f }) => {
  const a = snap(f, 4, 14), b = snap(f, 26, 14), c = snap(f, 40, 16);
  const flash = f >= 46 && f <= 54 ? 0.4 * (1 - (f - 46) / 8) : 0;
  return (
    <g>
      <rect x={-260} y={0} width={W} height={H} fill={C.dark} opacity={0.94} />
      <ellipse cx={700} cy={450} rx={680} ry={480} fill={C.gold} opacity={0.28} />
      <g opacity={0.7}>
        <polygon points="700,-40 340,900 480,900" fill="url(#sbeam)" />
        <polygon points="700,-40 600,900 680,900" fill="url(#sbeam)" />
        <polygon points="700,-40 720,900 800,900" fill="url(#sbeam)" />
        <polygon points="700,-40 920,900 1060,900" fill="url(#sbeam)" />
      </g>
      <rect x={-260} y={0} width={W} height={H} fill="#d8322a" opacity={flash} />
      <T x={820} y={300} s={96} fill={C.cream} w={700} op={a}>越说没钱。</T>
      <T x={820} y={420} s={44} fill={C.cream} op={b * 0.8}>可去年，演出卖了</T>
      <T x={820} y={620} s={160} fill="#f2543a" w={700} op={c} ff={FM}>{Math.round(837.22 * easeOut((f - 40) / 30))} 亿</T>
      <line x1={540} y1={680} x2={1100} y2={680} stroke="#f2543a" strokeWidth={3} opacity={c * 0.7} />
      <T x={820} y={790} s={34} fill={C.cream} op={c * 0.7}>全国演出市场 · 2025</T>
      <Stage f={f} dark />
    </g>
  );
};

/* 段2 · 钩子B */
const S2: React.FC<{ f: number }> = ({ f }) => {
  const n = f < 118 ? 3 : f < 138 ? 2 : 1;
  const segStart = f < 118 ? 90 : f < 138 ? 118 : 138;
  const segEnd = f < 118 ? 118 : f < 138 ? 138 : 156;
  const p = clamp01((f - segStart) / Math.max(1, segEnd - segStart));
  const R = 78, circ = 2 * Math.PI * R;
  const pulse = 1 + 0.055 * Math.sin(f * 0.95);
  const stamp = snap(f, 156, 8);
  const sScale = 1 + (1 - stamp) * 1.2;
  const flash = f >= 156 && f <= 164 ? 0.45 * (1 - (f - 156) / 8) : 0;
  return (
    <g>
      <rect x={-260} y={0} width={W} height={H} fill="#1a1410" opacity={0.95} />
      <ellipse cx={860} cy={420} rx={520} ry={470} fill={C.gold} opacity={0.2} />
      <g opacity={0.55}>
        <polygon points="860,-40 620,900 740,900" fill="url(#sbeam)" />
        <polygon points="860,-40 980,900 1100,900" fill="url(#sbeam)" />
      </g>
      <rect x={-260} y={0} width={W} height={H} fill="#e5432f" opacity={flash} />
      <T x={860} y={170} s={42} fill={C.cream} op={0.8}>你定好闹钟，点进去——</T>
      <rect x={740} y={230} width={240} height={470} rx={34} fill="none" stroke={C.cream} strokeWidth={4} opacity={0.55} />
      <rect x={756} y={268} width={208} height={396} rx={16} fill="#0b0908" opacity={0.6} />
      <circle cx={860} cy={430} r={R} fill="none" stroke="rgba(246,238,218,0.2)" strokeWidth={7} />
      <circle cx={860} cy={430} r={R} fill="none" stroke={C.clay} strokeWidth={7} strokeDasharray={circ}
        strokeDashoffset={circ * p} strokeLinecap="round" transform="rotate(-90 860 430)" opacity={stamp > 0 ? 0 : 1} />
      <T x={860} y={474} s={132 * pulse} fill={C.cream} w={700} ff={FM} op={stamp > 0 ? 0.1 : 1}>{n}</T>
      <g transform={`translate(860 500) scale(${sScale}) rotate(-8)`} opacity={stamp}>
        <rect x={-230} y={-90} width={460} height={180} rx={10} fill="none" stroke="#f2543a" strokeWidth={10} />
        <rect x={-210} y={-70} width={420} height={140} rx={6} fill="none" stroke="#f2543a" strokeWidth={4} />
        <T x={0} y={26} s={104} fill="#f2543a" w={700} ls="0.06em">售罄</T>
      </g>
      <T x={860} y={800} s={40} fill={C.cream} op={stamp}>3、2、1 —— 没了。</T>
      <Stage f={f} dark />
    </g>
  );
};

/* 段3 · 现象（暖赭市集） */
const S3: React.FC<{ f: number }> = ({ f }) => {
  const a = snap(f, 200, 14), b = snap(f, 250, 14), c = snap(f, 300, 14);
  const price = Math.round(480 + 1520 * easeOut((f - 250) / 40));
  return (
    <g>
      <rect x={-260} y={0} width={W} height={H} fill="#d8a86a" opacity={0.5} />
      {/* 市集棚子 */}
      <g opacity={0.5}>
        <polygon points="120,300 620,300 660,360 80,360" fill={C.clay} opacity={0.4} />
        <line x1={120} y1={360} x2={120} y2={760} stroke={C.ink} strokeWidth={3} />
        <line x1={620} y1={360} x2={620} y2={760} stroke={C.ink} strokeWidth={3} />
        <polygon points="780,300 1280,300 1320,360 740,360" fill={C.teal} opacity={0.35} />
        <line x1={780} y1={360} x2={780} y2={760} stroke={C.ink} strokeWidth={3} />
        <line x1={1280} y1={360} x2={1280} y2={760} stroke={C.ink} strokeWidth={3} />
      </g>
      <T x={820} y={168} s={40} fill={C.ink} op={0.7}>一张票，转手</T>
      <T x={400} y={470} s={120} fill={C.teal} w={700} ff={FM} op={a}>480</T>
      <T x={400} y={540} s={30} fill={C.ink} op={a * 0.65}>原价</T>
      <T x={1150} y={470} s={120} fill={C.clay} w={700} ff={FM} op={b}>{price}</T>
      <T x={1150} y={540} s={30} fill={C.ink} op={b * 0.65}>黄牛价</T>
      <line x1={560} y1={420} x2={990} y2={420} stroke={C.clay} strokeWidth={5} opacity={b} />
      <polygon points="990,406 1024,420 990,434" fill={C.clay} opacity={b} />
      <T x={820} y={700} s={46} fill={C.ink} w={700} op={c}>一边喊穷，一边加价抢。</T>
      <T x={820} y={780} s={34} fill={C.ink} op={c * 0.65}>跨城 · 请假 · 排队</T>
      <Stage f={f} />
    </g>
  );
};

/* 段4 · 数据1（青绿数据墙） */
const S4: React.FC<{ f: number }> = ({ f }) => {
  const a = snap(f, 436, 14);
  const big = 837.22 * easeOut((f - 436) / 40);
  const cnt = Math.round(2496 * easeOut((f - 470) / 30));
  const ppl = Math.round(3800 * easeOut((f - 490) / 30));
  return (
    <g>
      <rect x={-260} y={0} width={W} height={H} fill="#9fc6bd" opacity={0.4} />
      <T x={820} y={220} s={36} fill={C.ink} op={0.68}>2025 · 大型演唱会</T>
      <T x={820} y={410} s={132} fill={C.ink} w={700} ff={FM} op={a}>{big.toFixed(1)}<tspan fontSize={64}> 亿</tspan></T>
      <T x={480} y={570} s={76} fill={C.clay} w={700} ff={FM} op={snap(f, 470, 12)}>{cnt}</T>
      <T x={480} y={620} s={28} fill={C.ink} op={snap(f, 470, 12) * 0.65}>场</T>
      <T x={1080} y={570} s={76} fill={C.teal} w={700} ff={FM} op={snap(f, 490, 12)}>{ppl}<tspan fontSize={42}> 万</tspan></T>
      <T x={1080} y={620} s={28} fill={C.ink} op={snap(f, 490, 12) * 0.65}>人次</T>
      {Array.from({ length: 72 }, (_, i) => {
        const gx = 340 + (i % 12) * 82;
        const gy = 690 + Math.floor(i / 12) * 32;
        const on = clamp01((f - 470 - i * 0.5) / 6);
        return <rect key={i} x={gx} y={gy} width={58} height={13} rx={3} fill={C.teal} opacity={0.14 + 0.6 * on} />;
      })}
      <T x={820} y={960} s={30} fill={C.ink} op={0.55}>中国演出行业协会</T>
      <Stage f={f} />
    </g>
  );
};

/* 段5 · 数据2（陶土图表房） */
const S5: React.FC<{ f: number }> = ({ f }) => {
  const grow = easeOut((f - 590) / 46);
  const h1 = 190 * grow, h2 = 430 * grow;
  const over = snap(f, 650, 10);
  const flash = f >= 648 && f <= 660 ? 0.3 * (1 - (f - 648) / 12) : 0;
  const base = 800;
  return (
    <g>
      <rect x={-260} y={0} width={W} height={H} fill="#e0b090" opacity={0.42} />
      <rect x={-260} y={0} width={W} height={H} fill="#d8322a" opacity={flash} />
      <T x={820} y={190} s={38} fill={C.ink} op={0.7}>一边喊穷，一边抢票。</T>
      <line x1={420} y1={base} x2={1160} y2={base} stroke={C.ink} strokeWidth={3} opacity={0.45} />
      <rect x={540} y={base - h1} width={140} height={h1} fill={C.gold} />
      <rect x={840} y={base - h2} width={140} height={h2} fill={C.clay} />
      <T x={610} y={base - h1 - 26} s={54} fill={C.ink} w={700} ff={FM} op={grow}>+13.7%</T>
      <T x={610} y={base + 44} s={26} fill={C.ink} op={0.7}>票房</T>
      <T x={910} y={base - h2 - 26} s={54} fill={C.clay} w={700} ff={FM} op={grow}>+30.8%</T>
      <T x={910} y={base + 44} s={26} fill={C.ink} op={0.7}>人次</T>
      <T x={820} y={930} s={46} fill={C.clay} w={700} op={over}>进场的人，比票房涨得快。</T>
      <Stage f={f} />
    </g>
  );
};

/* 段6 · 数据3（暗场台阶） */
const S6: React.FC<{ f: number }> = ({ f }) => {
  const s1 = snap(f, 740, 12), s2 = snap(f, 776, 12), s3 = snap(f, 812, 12);
  const v3 = Math.round(250000 * easeOut((f - 812) / 40));
  return (
    <g>
      <rect x={-260} y={0} width={W} height={H} fill="#1c1611" opacity={0.88} />
      <ellipse cx={820} cy={560} rx={560} ry={460} fill={C.gold} opacity={0.14} />
      <T x={820} y={170} s={38} fill={C.cream} op={0.75}>同一张票，三个价</T>
      <rect x={300} y={690} width={260} height={120} fill={C.gold} opacity={0.95 * s1} />
      <T x={430} y={768} s={64} fill={C.ink} w={700} ff={FM} opacity={s1}>480</T>
      <T x={430} y={850} s={26} fill={C.cream} op={s1 * 0.7}>原价</T>
      <rect x={590} y={560} width={260} height={250} fill={C.clay} opacity={0.95 * s2} />
      <T x={720} y={700} s={64} fill="#fff" w={700} ff={FM} opacity={s2}>2000</T>
      <T x={720} y={850} s={26} fill={C.cream} op={s2 * 0.7}>转手 ×4.2</T>
      <rect x={880} y={360} width={260} height={450} fill="#0e0b09" opacity={0.95 * s3} stroke={C.gold} strokeWidth={3} />
      <T x={1010} y={600} s={56} fill={C.gold} w={700} ff={FM} opacity={s3}>{(v3 / 10000).toFixed(0)} 万</T>
      <T x={1010} y={850} s={26} fill={C.cream} op={s3 * 0.7}>内场 ×127</T>
      <T x={820} y={940} s={30} fill={C.cream} op={s3 * 0.6}>25 万为黄牛挂价，非成交</T>
      <Stage f={f} dark />
    </g>
  );
};

/* 段7 · 奥妙1 · 天平（纸面） */
const S7: React.FC<{ f: number }> = ({ f }) => {
  const a = snap(f, 916, 14);
  const tilt = easeOut((f - 930) / 40);
  const rot = -6 * tilt;
  return (
    <g>
      <Panel />
      <T x={820} y={168} s={40} fill={C.ink} op={0.68}>天平的两头</T>
      <g transform={`translate(820 560) rotate(${rot})`}>
        <line x1={-260} y1={0} x2={260} y2={0} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
        <line x1={-250} y1={0} x2={-250} y2={70} stroke={C.ink} strokeWidth={3} />
        <line x1={250} y1={0} x2={250} y2={70} stroke={C.ink} strokeWidth={3} />
        <ellipse cx={-250} cy={82} rx={92} ry={16} fill="none" stroke={C.ink} strokeWidth={3} />
        <ellipse cx={250} cy={82} rx={92} ry={16} fill="none" stroke={C.ink} strokeWidth={3} />
      </g>
      <T x={420} y={470} s={30} fill={C.ink} op={0.68}>房 + 车</T>
      <T x={420} y={790} s={64} fill={C.clay} w={700} op={a}>几十万</T>
      <T x={420} y={832} s={24} fill={C.ink} op={a * 0.6}>够不着</T>
      <T x={1240} y={470} s={30} fill={C.ink} op={0.68}>一张票</T>
      <T x={1240} y={790} s={64} fill={C.teal} w={700} op={a}>480</T>
      <T x={1240} y={832} s={24} fill={C.ink} op={a * 0.6}>够得着</T>
      <T x={820} y={960} s={46} fill={C.clay} w={700} op={snap(f, 980, 14)}>这叫口红效应。</T>
      <Stage f={f} />
    </g>
  );
};

/* 段8 · 奥妙2 · 时间带（暗） */
const S8: React.FC<{ f: number }> = ({ f }) => {
  const a = snap(f, 1100, 14);
  const grow = easeOut((f - 1110) / 40);
  const x0 = 260, x1 = 1300;
  const total = x1 - x0;
  const wA = total * 0.18, wB = total * 0.035, wC = total * 0.785;
  const pB = x0 + wA;
  return (
    <g>
      <rect x={-260} y={0} width={W} height={H} fill="#1a1610" opacity={0.86} />
      <ellipse cx={820} cy={560} rx={600} ry={420} fill={C.gold} opacity={0.1} />
      <T x={820} y={200} s={46} fill={C.cream} w={700} op={a}>你买的不是两小时。</T>
      <T x={820} y={300} s={42} fill="#f2543a" w={700} ff={FM} op={a}>2 小时</T>
      <line x1={660} y1={320} x2={pB + wB / 2} y2={430} stroke="#f2543a" strokeWidth={2} strokeDasharray="6 5" opacity={a} />
      <rect x={x0} y={440} width={wA * grow} height={76} fill={C.card} stroke={C.ink} strokeWidth={2} />
      <rect x={pB} y={440} width={wB} height={76} fill="#f2543a" opacity={a} />
      <rect x={pB + wB} y={440} width={wC * grow} height={76} fill={C.card} stroke={C.ink} strokeWidth={2} />
      <T x={x0 + wA / 2} y={406} s={26} fill={C.cream} op={0.8}>期待 7 天</T>
      <T x={pB + wB + wC / 2} y={406} s={26} fill={C.cream} op={0.8}>回味 30 天</T>
      <T x={820} y={650} s={30} fill={C.cream} op={a * 0.7}>票买的是这整段，不是那两小时。</T>
      <T x={820} y={760} s={34} fill={C.cream} op={snap(f, 1180, 14) * 0.85}>峰值 + 结尾，决定你记住什么</T>
      <T x={820} y={840} s={40} fill="#f2543a" w={700} op={snap(f, 1200, 14)}>这叫峰终定律。</T>
      <Stage f={f} dark />
    </g>
  );
};

/* 段9 · 奥妙3 · 票根 + 金句 */
const S9: React.FC<{ f: number }> = ({ f }) => {
  const a = snap(f, 1246, 16), b = snap(f, 1288, 18);
  const ls = 0.02 + 0.08 * easeOut((f - 1288) / 55);
  return (
    <g>
      <rect x={-260} y={0} width={W} height={H} fill="#0f0c09" opacity={0.96} />
      <ellipse cx={820} cy={560} rx={560} ry={470} fill={C.gold} opacity={0.16} />
      <g opacity={0.5}>
        <polygon points="820,-40 500,900 640,900" fill="url(#sbeam)" />
        <polygon points="820,-40 1000,900 1140,900" fill="url(#sbeam)" />
      </g>
      <T x={820} y={380} s={54} fill={C.cream} w={700} op={a}>你买的，是一个能记住的晚上。</T>
      <T x={820} y={620} s={72} fill={C.gold} w={700} op={b} ls={`${ls}em`}>越算得清的人，</T>
      <T x={820} y={734} s={72} fill={C.gold} w={700} op={b} ls={`${ls}em`}>越愿意糊涂一次。</T>
      <line x1={620} y1={804} x2={1020} y2={804} stroke={C.gold} strokeWidth={2} opacity={b * 0.6} />
      <T x={820} y={900} s={28} fill={C.cream} op={b * 0.55}>—— 完 ——</T>
      <Stage f={f} dark />
    </g>
  );
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8, S9];

/* 按屏铺不同道具：每屏元素种类不同，不是同一批票反复用 */
type PP = { a: string; x: number; y: number; s: number; r: number; o: number };
const SCENE_PROPS: PP[][] = [
  [{ a: "lightstick", x: 110, y: 180, s: 100, r: -18, o: 0.6 }, { a: "star", x: 1730, y: 220, s: 90, r: 10, o: 0.55 }],
  [{ a: "lightstick", x: 110, y: 220, s: 110, r: -15, o: 0.7 }, { a: "wristband", x: 1730, y: 240, s: 100, r: 8, o: 0.65 }, { a: "baton", x: 150, y: 720, s: 100, r: 12, o: 0.6 }],
  [{ a: "basket", x: 90, y: 520, s: 130, r: 6, o: 0.82 }, { a: "scale", x: 130, y: 760, s: 110, r: -6, o: 0.78 }, { a: "canopy", x: 1710, y: 170, s: 160, r: 4, o: 0.62 }, { a: "priceboard", x: 1730, y: 620, s: 120, r: -8, o: 0.78 }, { a: "box", x: 80, y: 860, s: 100, r: 10, o: 0.6 }, { a: "cart", x: 1720, y: 840, s: 130, r: -4, o: 0.6 }],
  [{ a: "calculator", x: 100, y: 240, s: 120, r: -8, o: 0.72 }, { a: "coins", x: 110, y: 700, s: 110, r: 6, o: 0.72 }, { a: "magnifier", x: 1720, y: 200, s: 110, r: 12, o: 0.68 }, { a: "target", x: 1730, y: 640, s: 110, r: 0, o: 0.62 }],
  [{ a: "target", x: 110, y: 300, s: 120, r: 0, o: 0.62 }, { a: "arrow", x: 1710, y: 300, s: 120, r: 8, o: 0.62 }, { a: "star", x: 100, y: 760, s: 90, r: -10, o: 0.52 }, { a: "triangle", x: 1730, y: 740, s: 90, r: 6, o: 0.52 }],
  [{ a: "coins", x: 110, y: 300, s: 110, r: 6, o: 0.72 }, { a: "card", x: 1720, y: 300, s: 120, r: -8, o: 0.68 }, { a: "receipt", x: 1700, y: 700, s: 110, r: 10, o: 0.62 }],
  [{ a: "coins", x: 110, y: 560, s: 110, r: 8, o: 0.72 }, { a: "card", x: 1720, y: 560, s: 120, r: -6, o: 0.68 }, { a: "calendar", x: 110, y: 220, s: 110, r: -8, o: 0.58 }],
  [{ a: "clock", x: 110, y: 300, s: 120, r: 0, o: 0.72 }, { a: "calendar", x: 1720, y: 300, s: 120, r: 8, o: 0.68 }, { a: "stringlight", x: 1700, y: 700, s: 140, r: 0, o: 0.58 }],
  [{ a: "stamp", x: 110, y: 220, s: 110, r: -12, o: 0.62 }, { a: "star", x: 1730, y: 240, s: 90, r: 10, o: 0.55 }],
];

const SceneProps: React.FC<{ i: number }> = ({ i }) => (
  <g>
    {SCENE_PROPS[i].map((p, k) => (
      <image key={k} href={staticFile(`concert/assets/${p.a}.png`)} x={p.x} y={p.y} width={p.s} height={p.s}
        preserveAspectRatio="xMidYMid meet" opacity={p.o} transform={`rotate(${p.r} ${p.x + p.s / 2} ${p.y + p.s / 2})`} />
    ))}
  </g>
);

export const Concert45: React.FC = () => {
  const f = useCurrentFrame();
  const { i, bloom } = sceneAt(f);
  const Scene = SCENES[i];
  const prog = clamp01((f - START[i]) / (START[i + 1] - START[i]));
  const sc = 1 + 0.035 * prog;
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <Audio src={staticFile("bgm-qn45.wav")} volume={0.8} />
      <BG f={f} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="sbeam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f2c877" stopOpacity={0.65} />
            <stop offset="1" stopColor="#f2c877" stopOpacity={0} />
          </linearGradient>
        </defs>
        <g transform={`translate(960 540) scale(${sc}) translate(-960 -540)`}>
          <g transform="translate(260 0) translate(700 540) scale(1.2) translate(-700 -540)">
            <Scene f={f} />
          </g>
        </g>
      </svg>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        {FG.map((d, k) => {
          const dy = ((f * d.sp + k * 23) % 120) - 60;
          return <circle key={k} cx={d.x} cy={d.y - dy} r={d.r} fill={C.gold} opacity={0.4} />;
        })}
      </svg>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <Edge i={i} />
        <SceneProps i={i} />
      </svg>
      {bloom > 0.002 && (
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 48%, #fff8ea 0%, #f6dfa8 55%, #d8a860 100%)", opacity: bloom }} />
      )}
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 44%, rgba(30,20,10,0.34) 100%)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, height: 5, width: `${(f / 1350) * 100}%`, background: C.clay }} />
    </AbsoluteFill>
  );
};

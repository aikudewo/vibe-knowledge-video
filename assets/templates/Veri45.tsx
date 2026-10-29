import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";

/* ============================================================
   验牌 · 包豪斯版 · 45 秒整片（Veri45 / 1350 帧）
   ------------------------------------------------------------
   八段，一条镜头 0 次硬切。整张海报当长卷横向滚，8 个版块。
   版块宽 760，间距 880。镜头每到一站停住，元素在停住的窗口里落定。

   全片只有一个时间常数：SNAP = 8.4 帧（0.28s）。进场退场都用它。

   每站五层：说法牌 / 大字号数字 / 对照表 / 图形 / 注释
   （第二版只有牌 + 数字 + 图形，右侧和数字右边都是空的，密度太低）

   数据出处见 项目/验牌-包豪斯版/脚本.md 的数据台账。
   ============================================================ */

const W = 1920;
const H = 1080;
const STAGE = 7400;
const BEAT = 15.957; // 112.8 BPM @30fps
const SNAP = 8.4;

const C = {
  paper: "#f1e9da",
  card: "#faf6ec",
  red: "#d8322a",
  yellow: "#f2b51d",
  blue: "#1f4fa3",
  black: "#151515",
};

const F_CN = '"Microsoft YaHei","PingFang SC","Hiragino Sans GB",sans-serif';
const F_MONO = 'Consolas,"Courier New",monospace';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const snap = (f: number, at: number, dur = SNAP) => smooth(clamp01((f - at) / dur));
const fade = (f: number, at: number, dur = SNAP) => 1 - smooth(clamp01((f - at) / dur));
/** 打样：还没到它的那一拍时以 12% 淡影印在版面上，到点压成满墨。
    这样镜头停在一站时，下一站的位置不是空纸，而是「已经印好、还没上墨」的下一页。 */
const ink = (f: number, at: number, dur = SNAP) => 0.12 + 0.88 * snap(f, at, dur);

/* ---------------- 版块坐标 ---------------- */
const CW = 760;
const COL = {
  s1: 60,
  s2: 1040,
  st1: 1920,
  st2: 2800,
  st3: 3680,
  st4: 4560,
  s7: 5440,
  s8: 6320,
};
const center = (x: number) => x - 120; // 当前列靠左，下一列完整可见；上一列整列出画

/* ---------------- 镜头 ---------------- */
const CAM: { f: number; x: number }[] = [
  { f: 0, x: 0 },
  { f: 100, x: 0 },
  { f: 190, x: center(COL.s2) },
  { f: 255, x: center(COL.s2) },
  { f: 330, x: center(COL.st1) },
  { f: 447, x: center(COL.st1) },
  { f: 522, x: center(COL.st2) },
  { f: 638, x: center(COL.st2) },
  { f: 713, x: center(COL.st3) },
  { f: 830, x: center(COL.st3) },
  { f: 905, x: center(COL.st4) },
  { f: 1021, x: center(COL.st4) },
  { f: 1080, x: center(COL.s7) },
  { f: 1117, x: center(COL.s7) },
  { f: 1160, x: center(COL.s8) },
  { f: 1350, x: center(COL.s8) },
];

const camX = (f: number) => {
  let x = CAM[CAM.length - 1].x;
  for (let i = 0; i < CAM.length - 1; i++) {
    const a = CAM[i];
    const b = CAM[i + 1];
    if (f <= b.f) {
      const t = smooth(clamp01((f - a.f) / Math.max(1, b.f - a.f)));
      x = a.x + (b.x - a.x) * t;
      break;
    }
  }
  // 三条不同频率的极缓摆动叠加：单条会在折返点停住，产生静止帧；线性漂移会累积跑偏
  return x + Math.sin(f * 0.04) * 2 + Math.sin(f * 0.13 + 1.7) * 1.2 + Math.sin(f * 0.29 + 0.6) * 0.6;
};

/* ---------------- 网格 ---------------- */
const Grid: React.FC = () => {
  const vs: number[] = [];
  for (let x = 0; x <= STAGE; x += 120) vs.push(x);
  const hs: number[] = [];
  for (let y = 0; y <= H; y += 120) hs.push(y);
  return (
    <g stroke="rgba(21,21,21,0.075)" strokeWidth={1.4}>
      {vs.map((x) => (
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={H} />
      ))}
      {hs.map((y) => (
        <line key={`h${y}`} x1={0} y1={y} x2={STAGE} y2={y} />
      ))}
    </g>
  );
};

/* ============================================================
   段 1 · 开场海报
   ============================================================ */
const P1 = { x: COL.s1, y: 96, w: 900, h: 764 };
const BARS1 = [
  { x: 70, h: 180, at: 0 },
  { x: 210, h: 300, at: 8 },
  { x: 350, h: 230, at: 16 },
  { x: 490, h: 380, at: 24 },
  { x: 630, h: 200, at: 32 },
  { x: 770, h: 270, at: 40 },
];

const Section1: React.FC<{ f: number }> = ({ f }) => {
  const op = fade(f, 118, 9);
  if (op <= 0.001) return null;
  const circ = snap(f, 52, 10);
  const TOP = 148;
  return (
    <g opacity={op}>
      <rect x={P1.x} y={P1.y} width={P1.w} height={P1.h} fill={C.card} stroke={C.black} strokeWidth={3} />
      <rect x={P1.x} y={P1.y} width={P1.w} height={44} fill={C.black} />
      <text x={P1.x + 20} y={P1.y + 31} fill={C.card} fontFamily={F_MONO} fontSize={20} fontWeight={700} letterSpacing="0.14em">
        01 / 04
      </text>
      <text x={P1.x + P1.w - 20} y={P1.y + 31} fill={C.card} fontFamily={F_CN} fontSize={18} fontWeight={700} textAnchor="end" letterSpacing="0.2em">
        家里流传的四句话
      </text>
      {BARS1.map((b, i) => {
        const p = snap(f, b.at);
        const g = 0.55 + 0.45 * p;
        const hh = b.h * g;
        const cap = clamp01((p - 0.8) / 0.2);
        return (
          <g key={i}>
            <rect x={P1.x + b.x} y={TOP} width={90} height={hh} fill={C.black} />
            <rect x={P1.x + b.x} y={TOP + hh} width={90 * cap} height={10} fill={C.red} opacity={cap} />
          </g>
        );
      })}
      {circ > 0.001 && <circle cx={P1.x + 830} cy={560} r={62 * circ} fill={C.red} opacity={circ} />}
      <text x={P1.x + 70} y={640} fill={C.black} fontFamily={F_CN} fontSize={68} fontWeight={900}>
        十点，
      </text>
      <text x={P1.x + 70} y={724} fill={C.black} fontFamily={F_CN} fontSize={68} fontWeight={900}>
        楼上又开始响。
      </text>
    </g>
  );
};

/* ============================================================
   段 2 · 四张索引卡
   ============================================================ */
const CLAIMS = [
  { no: "01", l1: "楼上的声音", l2: "是装修。" },
  { no: "02", l1: "牛奶放门架", l2: "没事。" },
  { no: "03", l1: "关窗睡觉", l2: "更安稳。" },
  { no: "04", l1: "衣服晾屋里", l2: "更省。" },
];
const CARD_W = 370;
const CARD_H = 190;
const CARD_POS = [
  { x: COL.s2, y: 240 },
  { x: COL.s2 + CARD_W + 20, y: 240 },
  { x: COL.s2, y: 470 },
  { x: COL.s2 + CARD_W + 20, y: 470 },
];

const Section2: React.FC<{ f: number }> = ({ f }) => {
  const op = 1;
  return (
    <g opacity={op}>
      <text x={COL.s2} y={190} fill="rgba(21,21,21,0.62)" fontFamily={F_CN} fontSize={24} fontWeight={700} letterSpacing="0.1em">
        待验 · 四句
      </text>
      {CLAIMS.map((c, i) => {
        const pos = CARD_POS[i];
        const p = snap(f, 190 + i * 14);
        return (
          <g key={c.no}>
            <rect x={pos.x} y={pos.y} width={CARD_W} height={CARD_H} fill={C.card} stroke={C.black} strokeWidth={3} />
            <rect x={pos.x} y={pos.y} width={62} height={32} fill={C.black} />
            <text x={pos.x + 31} y={pos.y + 23} fill={C.card} fontFamily={F_MONO} fontSize={19} fontWeight={700} textAnchor="middle" letterSpacing="0.08em">
              {c.no}
            </text>
            <rect x={pos.x + CARD_W - 106} y={pos.y + CARD_H - 56} width={88} height={38} fill="none" stroke={C.red} strokeWidth={2.4} strokeDasharray="7 6" />
            {p > 0.001 && (
              <g opacity={p} transform={`translate(0 ${(1 - p) * -18})`}>
                <text x={pos.x + 26} y={pos.y + 92} fill={C.black} fontFamily={F_CN} fontSize={34} fontWeight={900}>
                  {c.l1}
                </text>
                <text x={pos.x + 26} y={pos.y + 138} fill={C.black} fontFamily={F_CN} fontSize={34} fontWeight={900}>
                  {c.l2}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

/* ============================================================
   通用：说法牌 / 大数字 / 对照表 / 判定章
   ============================================================ */
const ClaimSlot: React.FC<{ x: number; no: string }> = ({ x, no }) => (
  <g>
    <rect x={x} y={140} width={CW} height={190} fill={C.card} stroke={C.black} strokeWidth={4} />
    <rect x={x} y={140} width={108} height={38} fill={C.black} />
    <text x={x + 54} y={167} fill={C.card} fontFamily={F_CN} fontSize={21} fontWeight={900} textAnchor="middle" letterSpacing="0.06em">
      验 {no}
    </text>
    <rect x={x + CW - 200} y={276} width={180} height={38} fill="none" stroke={C.red} strokeWidth={2.4} strokeDasharray="8 7" />
  </g>
);

const ClaimText: React.FC<{ f: number; x: number; l1: string; l2: string; at: number }> = ({ f, x, l1, l2, at }) => {
  const p = ink(f, at);
  return (
    <g opacity={p} transform={`translate(0 ${(1 - p) * -22})`}>
      <text x={x + 32} y={238} fill={C.black} fontFamily={F_CN} fontSize={42} fontWeight={900}>
        {l1}
      </text>
      <text x={x + 32} y={296} fill={C.black} fontFamily={F_CN} fontSize={42} fontWeight={900}>
        {l2}
      </text>
    </g>
  );
};

/** 大字号数字：这一站的数据锚 */
const BigNum: React.FC<{ f: number; x: number; at: number; num: string; unit: string; color?: string }> = ({
  f,
  x,
  at,
  num,
  unit,
  color = C.black,
}) => {
  const p = ink(f, at);
  return (
    <g opacity={p} transform={`translate(0 ${(1 - p) * -18})`}>
      <text x={x} y={500} fill={color} fontFamily={F_MONO} fontSize={124} fontWeight={700} letterSpacing="-0.02em">
        {num}
      </text>
      <text x={x + num.length * 74 + 14} y={500} fill={color} fontFamily={F_CN} fontSize={38} fontWeight={900}>
        {unit}
      </text>
    </g>
  );
};

/** 对照表：填大数字右边的空白，同时补上第二条数据 */
const DataTable: React.FC<{ f: number; x: number; at: number; rows: [string, string][] }> = ({ f, x, at, rows }) => {
  const p = ink(f, at);
  return (
    <g opacity={p}>
      <line x1={x + 400} y1={392} x2={x + 760} y2={392} stroke={C.black} strokeWidth={3} />
      {rows.map((r, i) => {
        const y = 436 + i * 62;
        return (
          <g key={i}>
            <text x={x + 400} y={y} fill="rgba(21,21,21,0.72)" fontFamily={F_CN} fontSize={23} fontWeight={700}>
              {r[0]}
            </text>
            <text x={x + 760} y={y} fill={C.black} fontFamily={F_MONO} fontSize={27} fontWeight={700} textAnchor="end">
              {r[1]}
            </text>
            <line x1={x + 400} y1={y + 16} x2={x + 760} y2={y + 16} stroke="rgba(21,21,21,0.18)" strokeWidth={1.5} />
          </g>
        );
      })}
    </g>
  );
};

const Verdict: React.FC<{ f: number; x: number; at: number; text: string; tone?: "red" | "yellow" }> = ({
  f,
  x,
  at,
  text,
  tone = "red",
}) => {
  const p = snap(f, at, 9);
  if (p <= 0) return null;
  const bg = tone === "red" ? C.red : C.yellow;
  const fg = tone === "red" ? C.card : C.black;
  return (
    <g opacity={p} transform={`translate(0 ${(1 - p) * -44})`}>
      <rect x={x + 440} y={270} width={320} height={86} fill={bg} />
      <text x={x + 600} y={327} fill={fg} fontFamily={F_CN} fontSize={42} fontWeight={900} textAnchor="middle" letterSpacing="0.06em">
        {text}
      </text>
    </g>
  );
};

/* ============================================================
   段 3 · 验牌 01 隔音
   ============================================================ */
const Station1: React.FC<{ f: number }> = ({ f }) => {
  const x = COL.st1;
  const slabs = ink(f, 345, 10);
  const scale = ink(f, 357, 10);
  const hx = (db: number) => x + 40 + ((db - 40) / 40) * 680;
  const ticks = [40, 50, 60, 70, 80];
  return (
    <g>
      <ClaimSlot x={x} no="01" />
      <ClaimText f={f} x={x} l1="楼上的声音，" l2="是装修。" at={330} />
      <BigNum f={f} x={x} at={337} num="65" unit="dB" />
      <DataTable
        f={f}
        x={x}
        at={344}
        rows={[
          ["楼板撞击声 上限", "65 dB"],
          ["夜间环境噪声", "45 dB"],
        ]}
      />
      {(
        <g opacity={slabs}>
          <rect x={x} y={560} width={CW} height={40} fill={C.black} />
          <rect x={x} y={666} width={CW} height={40} fill={C.black} />
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={x + 70 + i * 155} y1={600} x2={x + 70 + i * 155} y2={666} stroke={C.black} strokeWidth={3} opacity={0.55} />
          ))}
          <line x1={x + 20} y1={580} x2={x + 20 + 720 * slabs} y2={580} stroke={C.yellow} strokeWidth={6} />
          <path d={`M ${x + 20 + 720 * slabs} 580 l -22 -13 l 0 26 Z`} fill={C.yellow} opacity={slabs > 0.96 ? 1 : 0} />
          <text x={x + 20} y={545} fill="rgba(21,21,21,0.62)" fontFamily={F_CN} fontSize={21} fontWeight={700}>
            撞击声沿楼板传导，不经过空气
          </text>
        </g>
      )}
      {(
        <g opacity={scale}>
          <line x1={x + 40} y1={790} x2={x + 720} y2={790} stroke={C.black} strokeWidth={3} />
          {ticks.map((db) => (
            <g key={db}>
              <line x1={hx(db)} y1={782} x2={hx(db)} y2={798} stroke={C.black} strokeWidth={2.4} />
              <text x={hx(db)} y={832} fill={C.black} fontFamily={F_MONO} fontSize={20} textAnchor="middle">
                {db}
              </text>
            </g>
          ))}
          <line x1={hx(65)} y1={762} x2={hx(65)} y2={818} stroke={C.red} strokeWidth={5} />
          <text x={hx(65)} y={856} fill={C.red} fontFamily={F_MONO} fontSize={20} fontWeight={700} textAnchor="middle">
            楼板限值
          </text>
        </g>
      )}
      <Verdict f={f} x={x} at={390} text="多半不是" />
    </g>
  );
};

/* ============================================================
   段 4 · 验牌 02 冰箱门架
   ============================================================ */
const FRIDGE_T = [5, 4, 3, 2]; // 上层到下层：冷空气下沉，越往下越冷
const Station2: React.FC<{ f: number }> = ({ f }) => {
  const x = COL.st2;
  const body = ink(f, 537, 10);
  const marks = ink(f, 549, 10);
  return (
    <g>
      <ClaimSlot x={x} no="02" />
      <ClaimText f={f} x={x} l1="牛奶放门架，" l2="没事。" at={522} />
      <BigNum f={f} x={x} at={529} num="3-4" unit="℃" />
      <DataTable
        f={f}
        x={x}
        at={536}
        rows={[
          ["冷藏下层（最冷）", "2-3 ℃"],
          ["门架（最暖）", "5-7 ℃"],
        ]}
      />
      {body > 0.001 && (
        <g opacity={body}>
          <text x={x + 110} y={580} fill="rgba(21,21,21,0.62)" fontFamily={F_CN} fontSize={21} fontWeight={700}>
            冷藏室 · 上层到下层
          </text>
          <rect x={x + 110} y={594} width={250} height={240} fill={C.card} stroke={C.black} strokeWidth={4} />
          {FRIDGE_T.map((_, i) => (
            <line key={i} x1={x + 110} y1={594 + 60 * (i + 1)} x2={x + 360} y2={594 + 60 * (i + 1)} stroke={C.black} strokeWidth={2.4} opacity={0.5} />
          ))}
          {/* 门架单独画一列：它不是某一层，是门内侧，最暖且波动最大 */}
          <rect x={x + 480} y={594} width={80} height={240} fill="none" stroke={C.red} strokeWidth={3} strokeDasharray="9 7" />
          <text x={x + 520} y={580} fill={C.red} fontFamily={F_CN} fontSize={21} fontWeight={900} textAnchor="middle">
            门架
          </text>
          <text x={x + 520} y={700} fill={C.red} fontFamily={F_MONO} fontSize={30} fontWeight={700} textAnchor="middle">
            7℃
          </text>
          <text x={x + 520} y={740} fill={C.red} fontFamily={F_CN} fontSize={20} fontWeight={700} textAnchor="middle">
            最暖
          </text>
        </g>
      )}
      {marks > 0.001 && (
        <g opacity={marks}>
          {FRIDGE_T.map((t, i) => {
            const cy = 594 + 60 * i + 30;
            return (
              <g key={t}>
                <rect x={x + 380} y={cy - 14} width={30} height={28} fill={C.black} />
                <text x={x + 420} y={cy + 10} fill={C.black} fontFamily={F_MONO} fontSize={26} fontWeight={700}>
                  {t}℃
                </text>
              </g>
            );
          })}
          <text x={x + 380} y={866} fill="rgba(21,21,21,0.62)" fontFamily={F_CN} fontSize={21} fontWeight={700}>
            下层最冷
          </text>
        </g>
      )}
      <Verdict f={f} x={x} at={582} text="不合适" />
    </g>
  );
};

/* ============================================================
   段 5 · 验牌 03 关窗睡觉
   ============================================================ */
const Station3: React.FC<{ f: number }> = ({ f }) => {
  const x = COL.st3;
  const curve = ink(f, 728, 16);
  const limit = ink(f, 740, 10);
  const y0 = 860;
  const y1 = 580;
  const yOf = (ppm: number) => y0 - ((ppm - 400) / 1600) * (y0 - y1);
  const px = (t: number) => x + 70 + t * 660;
  const pts: string[] = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const v = 500 + 1400 * Math.pow(t, 1.7);
    pts.push(`${px(t * curve)},${yOf(v)}`);
  }
  return (
    <g>
      <ClaimSlot x={x} no="03" />
      <ClaimText f={f} x={x} l1="关窗睡觉，" l2="更安稳。" at={713} />
      <BigNum f={f} x={x} at={720} num="0.10" unit="%" />
      <DataTable
        f={f}
        x={x}
        at={727}
        rows={[
          ["国标 1 小时均值", "0.10 %"],
          ["新风量", "30 m³/h·人"],
        ]}
      />
      {(
        <g opacity={curve}>
          <line x1={x + 70} y1={y0} x2={x + 730} y2={y0} stroke={C.black} strokeWidth={3} />
          <line x1={x + 70} y1={y1} x2={x + 70} y2={y0} stroke={C.black} strokeWidth={3} />
          <polyline points={pts.join(" ")} fill="none" stroke={C.black} strokeWidth={6} />
          <text x={x + 70} y={y1 - 14} fill={C.black} fontFamily={F_MONO} fontSize={20}>
            2000
          </text>
          <text x={x + 70} y={y0 + 28} fill={C.black} fontFamily={F_MONO} fontSize={20}>
            400
          </text>
          <text x={x + 730} y={y0 + 28} fill="rgba(21,21,21,0.62)" fontFamily={F_CN} fontSize={21} fontWeight={700} textAnchor="end">
            关窗一夜 · 二氧化碳浓度
          </text>
        </g>
      )}
      {(
        <g opacity={limit}>
          <line x1={x + 70} y1={yOf(1000)} x2={x + 730} y2={yOf(1000)} stroke={C.red} strokeWidth={4} strokeDasharray="10 8" />
          <text x={x + 70} y={yOf(1000) - 12} fill={C.red} fontFamily={F_MONO} fontSize={22} fontWeight={700}>
            1000 ppm
          </text>
        </g>
      )}
      <Verdict f={f} x={x} at={773} text="半真" tone="yellow" />
    </g>
  );
};

/* ============================================================
   段 6 · 验牌 04 室内晾衣
   ============================================================ */
const Station4: React.FC<{ f: number }> = ({ f }) => {
  const x = COL.st4;
  const bars = ink(f, 920, 10);
  const marker = ink(f, 932, 10);
  const hx = (v: number) => x + 70 + ((v - 20) / 70) * 640;
  return (
    <g>
      <ClaimSlot x={x} no="04" />
      <ClaimText f={f} x={x} l1="衣服晾屋里，" l2="更省。" at={905} />
      <BigNum f={f} x={x} at={912} num="60" unit="%" />
      <DataTable
        f={f}
        x={x}
        at={919}
        rows={[
          ["冬季", "30-60 %"],
          ["夏季", "40-80 %"],
        ]}
      />
      {(
        <g opacity={bars}>
          <text x={x + 70} y={596} fill={C.black} fontFamily={F_CN} fontSize={24} fontWeight={700}>
            冬季
          </text>
          <rect x={hx(30)} y={610} width={(hx(60) - hx(30)) * bars} height={34} fill={C.black} />
          <text x={x + 70} y={700} fill={C.black} fontFamily={F_CN} fontSize={24} fontWeight={700}>
            夏季
          </text>
          <rect x={hx(40)} y={714} width={(hx(80) - hx(40)) * bars} height={34} fill={C.blue} />
          {[20, 30, 40, 60, 80].map((v) => (
            <text key={v} x={hx(v)} y={806} fill="rgba(21,21,21,0.72)" fontFamily={F_MONO} fontSize={20} textAnchor="middle">
              {v}
            </text>
          ))}
          <line x1={x + 70} y1={786} x2={x + 710} y2={786} stroke="rgba(21,21,21,0.28)" strokeWidth={2} />
          <text x={x + 710} y={852} fill="rgba(21,21,21,0.62)" fontFamily={F_CN} fontSize={21} fontWeight={700} textAnchor="end">
            相对湿度区间 · 单位 %
          </text>
        </g>
      )}
      {(
        <g opacity={marker}>
          <line x1={hx(75)} y1={580} x2={hx(75)} y2={780} stroke={C.red} strokeWidth={5} />
          <text x={hx(75)} y={564} fill={C.red} fontFamily={F_MONO} fontSize={26} fontWeight={700} textAnchor="middle">
            75%
          </text>
        </g>
      )}
      <Verdict f={f} x={x} at={965} text="半真" tone="yellow" />
    </g>
  );
};

/* ============================================================
   段 7 · 合计
   ============================================================ */
const SUM = [
  { no: "01", tone: C.red, t: "多半不是", d: "楼板 65 dB" },
  { no: "02", tone: C.red, t: "不合适", d: "门架 5-7℃" },
  { no: "03", tone: C.yellow, t: "半真", d: "CO₂ 0.10%" },
  { no: "04", tone: C.yellow, t: "半真", d: "湿度 60%" },
];
const Section7: React.FC<{ f: number }> = ({ f }) => {
  const x = COL.s7;
  const head = ink(f, 1072, 10);
  return (
    <g>
      {SUM.map((s, i) => {
        const p = ink(f, 1050 + i * 8);
        const px = x + (i % 2) * 390;
        const py = 150 + Math.floor(i / 2) * 200;
        return (
          <g key={s.no} opacity={p} transform={`translate(0 ${(1 - p) * -18})`}>
            <rect x={px} y={py} width={370} height={180} fill={C.card} stroke={C.black} strokeWidth={3} />
            <rect x={px} y={py} width={56} height={30} fill={C.black} />
            <text x={px + 28} y={py + 22} fill={C.card} fontFamily={F_MONO} fontSize={18} fontWeight={700} textAnchor="middle">
              {s.no}
            </text>
            <rect x={px + 30} y={py + 50} width={310} height={62} fill={s.tone} />
            <text x={px + 185} y={py + 94} fill={s.tone === C.red ? C.card : C.black} fontFamily={F_CN} fontSize={34} fontWeight={900} textAnchor="middle">
              {s.t}
            </text>
            <text x={px + 30} y={py + 150} fill="rgba(21,21,21,0.68)" fontFamily={F_MONO} fontSize={22} fontWeight={700}>
              {s.d}
            </text>
          </g>
        );
      })}
      {(
        <g opacity={head} transform={`translate(0 ${(1 - head) * -20})`}>
          <text x={x} y={640} fill={C.black} fontFamily={F_CN} fontSize={56} fontWeight={900}>
            四句话。
          </text>
          <text x={x} y={730} fill={C.black} fontFamily={F_CN} fontSize={56} fontWeight={900}>
            没有一句全对。
          </text>
          <text x={x} y={800} fill="rgba(21,21,21,0.62)" fontFamily={F_CN} fontSize={24} fontWeight={700}>
            两句不合适，两句只对一半。
          </text>
        </g>
      )}
    </g>
  );
};

/* ============================================================
   段 8 · 金句
   ============================================================ */
const FINAL_LIST = [
  { no: "01", t: "楼上的声音", v: "多半不是", tone: C.red },
  { no: "02", t: "牛奶放门架", v: "不合适", tone: C.red },
  { no: "03", t: "关窗睡觉", v: "半真", tone: C.yellow },
  { no: "04", t: "衣服晾屋里", v: "半真", tone: C.yellow },
];

const Section8: React.FC<{ f: number }> = ({ f }) => {
  const x = COL.s8;
  const l1 = ink(f, 1132, 10);
  const l2 = ink(f, 1192, 10);
  const seal = snap(f, 1266, 10);
  const ls = (base: number) => `${(base + 0.08 * smooth(clamp01((f - 1192) / 110))).toFixed(4)}em`;
  return (
    <g>
      <g opacity={l1} transform={`translate(0 ${(1 - l1) * -24})`}>
        <text x={x} y={384} fill={C.black} fontFamily={F_CN} fontSize={88} fontWeight={900} style={{ letterSpacing: ls(0.01) }}>
          听来的，
        </text>
        <text x={x} y={488} fill={C.black} fontFamily={F_CN} fontSize={88} fontWeight={900} style={{ letterSpacing: ls(0.01) }}>
          都算传闻。
        </text>
      </g>
      <g opacity={l2} transform={`translate(0 ${(1 - l2) * -24})`}>
        <text x={x} y={636} fill={C.red} fontFamily={F_CN} fontSize={88} fontWeight={900} style={{ letterSpacing: ls(0.01) }}>
          查过的，
        </text>
        <text x={x} y={740} fill={C.red} fontFamily={F_CN} fontSize={88} fontWeight={900} style={{ letterSpacing: ls(0.01) }}>
          才算常识。
        </text>
      </g>

      {/* 右侧结论清单：把结尾右边的空填掉，同时把四句再压一遍 */}
      <g opacity={snap(f, 1200, 14)}>
        <text x={x + 720} y={300} fill="rgba(21,21,21,0.72)" fontFamily={F_CN} fontSize={24} fontWeight={700} letterSpacing="0.08em">
          四句话 · 四组数字 · 三个国标
        </text>
        <line x1={x + 720} y1={322} x2={x + 1540} y2={322} stroke={C.black} strokeWidth={3} />
        {FINAL_LIST.map((r, i) => {
          const y = 386 + i * 96;
          return (
            <g key={r.no}>
              <text x={x + 720} y={y} fill="rgba(21,21,21,0.62)" fontFamily={F_MONO} fontSize={21} fontWeight={700}>
                {r.no}
              </text>
              <text x={x + 770} y={y} fill={C.black} fontFamily={F_CN} fontSize={26} fontWeight={900}>
                {r.t}
              </text>
              <rect x={x + 1310} y={y - 26} width={230} height={42} fill={r.tone} />
              <text
                x={x + 1425}
                y={y + 4}
                fill={r.tone === C.red ? C.card : C.black}
                fontFamily={F_CN}
                fontSize={24}
                fontWeight={900}
                textAnchor="middle"
              >
                {r.v}
              </text>
              <line x1={x + 720} y1={y + 26} x2={x + 1540} y2={y + 26} stroke="rgba(21,21,21,0.18)" strokeWidth={1.5} />
            </g>
          );
        })}
      </g>

      {seal > 0.001 && (
        <g opacity={seal} transform={`translate(0 ${(1 - seal) * -50})`}>
          <circle cx={x + 580} cy={560} r={56} fill={C.red} />
          <text x={x + 580} y={573} fill={C.card} fontFamily={F_MONO} fontSize={28} fontWeight={700} textAnchor="middle">
            验
          </text>
        </g>
      )}
    </g>
  );
};

/* ============================================================
   屏幕层
   ============================================================ */
const CropMarks: React.FC = () => {
  const m = 56;
  const len = 22;
  const pts = [
    [m, m],
    [W - m, m],
    [m, H - m],
    [W - m, H - m],
  ];
  return (
    <g stroke="rgba(21,21,21,0.22)" strokeWidth={2}>
      {pts.map(([x, y], i) => (
        <g key={i}>
          <line x1={x - len} y1={y} x2={x + len} y2={y} />
          <line x1={x} y1={y - len} x2={x} y2={y + len} />
        </g>
      ))}
    </g>
  );
};

const BeatCounter: React.FC<{ f: number }> = ({ f }) => {
  const n = Math.floor(f / BEAT) % 20;
  const cells: number[] = [];
  for (let i = 0; i < 20; i++) cells.push(i);
  return (
    <g>
      {cells.map((i) => {
        const lit = i < n;
        return (
          <rect
            key={i}
            x={1480 + i * 18}
            y={64}
            width={16}
            height={16}
            fill={lit ? C.black : "none"}
            stroke={lit ? C.black : "rgba(21,21,21,0.28)"}
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
};

const Progress: React.FC<{ f: number }> = ({ f }) => {
  const head = 120 + (1680 * f) / 1350;
  return (
    <g>
      <line x1={120} y1={1052} x2={1800} y2={1052} stroke="rgba(21,21,21,0.16)" strokeWidth={6} />
      <line x1={120} y1={1052} x2={head} y2={1052} stroke={C.black} strokeWidth={6} />
      <rect x={head - 7} y={1034} width={14} height={36} fill={C.black} />
    </g>
  );
};

const SUBS: { at: number; out: number; text: string }[] = [
  { at: 92, out: 116, text: "你以为是装修。" },
  { at: 150, out: 178, text: "家里有四句话。" },
  { at: 182, out: 210, text: "一句一句验。" },
  { at: 355, out: 380, text: "声音不靠空气走。" },
  { at: 384, out: 408, text: "它走墙，走楼板。" },
  { at: 412, out: 438, text: "楼板限值 65 分贝。" },
  { at: 547, out: 572, text: "冰箱里不是一个温度。" },
  { at: 576, out: 600, text: "上下差三到四度。" },
  { at: 604, out: 630, text: "门架最热，还总开。" },
  { at: 738, out: 763, text: "安静，是真的。" },
  { at: 767, out: 791, text: "但空气不换了。" },
  { at: 795, out: 822, text: "二氧化碳上限 0.10%。" },
  { at: 930, out: 955, text: "省的是电。" },
  { at: 959, out: 983, text: "涨的是湿度。" },
  { at: 987, out: 1014, text: "冬天上限 60%。" },
];

const Subtitles: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {SUBS.map((s) => {
      const op = snap(f, s.at, 10) * fade(f, s.out, 10);
      if (op <= 0.001) return null;
      return (
        <text
          key={`${s.at}-${s.text}`}
          x={120}
          y={948}
          fill={C.black}
          fontFamily={F_CN}
          fontSize={40}
          fontWeight={900}
          opacity={op}
          style={{ letterSpacing: "0.01em" }}
        >
          {s.text}
        </text>
      );
    })}
  </g>
);

const NOTES: { at: number; out: number; text: string }[] = [
  { at: 396, out: 440, text: "夜间环境噪声 45 dB（GB 3096 1 类区）" },
  { at: 588, out: 632, text: "冷藏室建议 4℃ 以下；门架 5-7℃" },
  { at: 779, out: 824, text: "二氧化碳 1 小时均值 0.10%；新风量 30 m³/(h·人)（GB/T 18883）" },
  { at: 971, out: 1016, text: "相对湿度 冬 30-60% / 夏 40-80%（GB/T 18883）" },
];

const Notes: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {NOTES.map((s) => {
      const op = snap(f, s.at, 12) * fade(f, s.out, 10);
      if (op <= 0.001) return null;
      return (
        <text key={s.at} x={120} y={1002} fill="rgba(21,21,21,0.62)" fontFamily={F_CN} fontSize={24} fontWeight={700} opacity={op}>
          {s.text}
        </text>
      );
    })}
  </g>
);

/* ============================================================
   主组件
   ============================================================ */
export const Veri45: React.FC = () => {
  const f = useCurrentFrame();
  const x = camX(f);

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <Audio src={staticFile("bgm-qn45.wav")} volume={0.8} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g transform={`translate(${-x} 0)`}>
          <Grid />
          <Section1 f={f} />
          <Section2 f={f} />
          <Station1 f={f} />
          <Station2 f={f} />
          <Station3 f={f} />
          <Station4 f={f} />
          <Section7 f={f} />
          <Section8 f={f} />
        </g>

        {/* 右缘纸色渐隐：世界层每列间距 880px，镜头停在某列时后面第二列会被画布右缘切成半截。
            渐隐带从 1804 起、1870 全实，"下下一列"边框落在 1876-1884，被彻底盖住。
            起点避开 1800：开场段 2 卡片右边框正好在 1800，不能被误伤。 */}
        <defs>
          <linearGradient id="edgeFade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={C.paper} stopOpacity={0} />
            <stop offset="0.569" stopColor={C.paper} stopOpacity={1} />
            <stop offset="1" stopColor={C.paper} stopOpacity={1} />
          </linearGradient>
          <linearGradient id="edgeFadeL" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={C.paper} stopOpacity={1} />
            <stop offset="1" stopColor={C.paper} stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect x={1804} y={0} width={116} height={H} fill="url(#edgeFade)" />
        {/* 左缘同理：上一列的卡片右边框正好落在 x=0，会被切成一条 3px 黑竖线。
            只做 36px 窄带，当前列内容最左在 x=120，不受影响。 */}
        <rect x={0} y={0} width={48} height={H} fill="url(#edgeFadeL)" />

        <CropMarks />
        <BeatCounter f={f} />
        <Progress f={f} />
        <Subtitles f={f} />
        <Notes f={f} />
      </svg>
    </AbsoluteFill>
  );
};

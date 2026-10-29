import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { SANS, SERIF } from "./Neon";

/* ============================================================
   深睡自由 · 纸感版 · 10 秒试片
   一条长镜头：小人从床边走到底、冰箱，再回床躺下。
   镜头跟着他平移 + 缓推，信息在他身边「浮现」。
   全程 0 次硬切。BGM《千年之后》0:00 起，112.8 BPM。
   一拍 = 0.5319s = 15.957 帧；小节 = 63.83 帧。
   ============================================================ */

const FPS = 30;
const BEAT = 0.5319 * FPS;   // 15.957
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

/* 关键帧插值 */
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

/* 浮现：淡入 + 从 0.94 放大 + 上移 */
const em = (f: number, start: number, dur = 12) => {
  const e = smooth(clamp01((f - start) / dur));
  return { op: e, sc: 0.94 + 0.06 * e, dy: (1 - e) * 16 };
};

/* 淡出 */
const out = (f: number, start: number, dur = 10) => 1 - smooth(clamp01((f - start) / dur));

/* 描线：1 → 0 */
const drawOn = (f: number, start: number, dur = 14) => 1 - smooth(clamp01((f - start) / dur));

/* ---------------- 摄像机 ----------------
   走 → 停 → 拍 → 再走：镜头在「停」的窗口里不动，信息就在这个窗口里浮现。
   k 全程单调递增，保证没有一帧是静止的。            */
const CAM = [
  { f: 0, cx: 640, cy: 545, k: 1.02 },
  { f: 56, cx: 640, cy: 545, k: 1.03 },
  { f: 84, cx: 950, cy: 545, k: 1.03 },
  { f: 126, cx: 950, cy: 545, k: 1.045 },
  { f: 156, cx: 1450, cy: 550, k: 1.05 },
  { f: 182, cx: 1450, cy: 550, k: 1.06 },
  { f: 210, cx: 2150, cy: 555, k: 1.065 },
  { f: 240, cx: 2150, cy: 555, k: 1.07 },
  { f: 300, cx: 620, cy: 545, k: 1.09 },
  { f: 320, cx: 600, cy: 545, k: 1.1 },
];

/* ---------------- 小人 ---------------- */
type GK = { f: number; x: number; hip: number; tRot: number; lRot: number; aR: number; aL: number; walk: number };
const GUIDE: GK[] = [
  { f: 0, x: 820, hip: 650, tRot: 0, lRot: 0, aR: 6, aL: -6, walk: 0 },
  { f: 34, x: 820, hip: 650, tRot: -3, lRot: 0, aR: 116, aL: -8, walk: 0 },
  { f: 56, x: 820, hip: 650, tRot: -3, lRot: 0, aR: 116, aL: -8, walk: 0 },
  { f: 80, x: 900, hip: 650, tRot: 0, lRot: 0, aR: 0, aL: 0, walk: 1 },
  { f: 96, x: 900, hip: 650, tRot: -4, lRot: 0, aR: 140, aL: -12, walk: 0 },
  { f: 126, x: 900, hip: 650, tRot: -4, lRot: 0, aR: 140, aL: -12, walk: 0 },
  { f: 152, x: 1180, hip: 650, tRot: 0, lRot: 0, aR: 0, aL: 0, walk: 1 },
  { f: 166, x: 1180, hip: 650, tRot: -5, lRot: 0, aR: 88, aL: -8, walk: 0 },
  { f: 188, x: 1180, hip: 650, tRot: -5, lRot: 0, aR: 88, aL: -8, walk: 0 },
  { f: 215, x: 1820, hip: 650, tRot: 0, lRot: 0, aR: 0, aL: 0, walk: 1 },
  { f: 228, x: 1820, hip: 650, tRot: -5, lRot: 0, aR: 76, aL: -8, walk: 0 },
  { f: 236, x: 1820, hip: 650, tRot: -5, lRot: 0, aR: 76, aL: -8, walk: 0 },
  { f: 296, x: 800, hip: 650, tRot: 0, lRot: 0, aR: 0, aL: 0, walk: 1 },
  { f: 304, x: 800, hip: 650, tRot: 0, lRot: 0, aR: -10, aL: -10, walk: 0 },
  { f: 308, x: 600, hip: 646, tRot: -90, lRot: 90, aR: -12, aL: -12, walk: 0 },
  { f: 320, x: 600, hip: 646, tRot: -90, lRot: 90, aR: -12, aL: -12, walk: 0 },
];

const Guide: React.FC<{ f: number }> = ({ f }) => {
  const g = kf(GUIDE, f);
  const sw = g.walk * Math.sin(f * 0.62) * 17;
  const bob = g.walk * Math.abs(Math.sin(f * 0.62)) * -5;
  const lying = Math.abs(g.tRot) > 45;
  const rad = (d: number) => (d * Math.PI) / 180;
  /* 躺下那一下腿会扫过床面——在被子里藏掉 */
  const legOp = Math.max(0, 1 - smooth(clamp01((f - 300) / 2)) + smooth(clamp01((f - 310) / 3)));

  return (
    <g transform={`translate(${g.x} ${g.hip + bob})`} filter="url(#liftS)">
      <ellipse cx={0} cy={lying ? 60 : 152} rx={lying ? 150 : 62} ry={lying ? 14 : 10} fill="rgba(90,70,45,0.16)" />
      {/* 腿 */}
      <g opacity={legOp}>
        <g transform={`rotate(${g.lRot + sw} -14 0)`}>
          <line x1={-14} y1={0} x2={-14} y2={150} stroke={P.ink} strokeWidth={12} strokeLinecap="round" />
        </g>
        <g transform={`rotate(${g.lRot - sw} 14 0)`}>
          <line x1={14} y1={0} x2={14} y2={150} stroke={P.ink} strokeWidth={12} strokeLinecap="round" />
        </g>
      </g>
      {/* 躯干 + 头 + 手 */}
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
        <line
          x1={26}
          y1={-136}
          x2={26 + Math.sin(rad(g.aR)) * 94}
          y2={-136 + Math.cos(rad(g.aR)) * 94}
          stroke={P.ink}
          strokeWidth={10}
          strokeLinecap="round"
        />
        <line
          x1={-26}
          y1={-136}
          x2={-26 + Math.sin(rad(g.aL)) * 94}
          y2={-136 + Math.cos(rad(g.aL)) * 94}
          stroke={P.ink}
          strokeWidth={10}
          strokeLinecap="round"
        />
      </g>
    </g>
  );
};

/* ---------------- 纸片（SVG 版） ---------------- */
const Paper: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  fill?: string;
  op?: number;
  sc?: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, rot = 0, fill = "#fff8ea", op = 1, sc = 1, children }) => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g opacity={op} transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${sc}) translate(${-cx} ${-cy})`}>
      <path
        d={`M ${x + 4} ${y + 3} L ${x + w - 5} ${y} L ${x + w} ${y + h - 4} L ${x + 3} ${y + h} Z`}
        fill={fill}
        filter="url(#lift)"
      />
      {children}
    </g>
  );
};

/* ---------------- 纸底 ---------------- */
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

export const Test10: React.FC = () => {
  const f = useCurrentFrame();
  const cam = kf(CAM, f);
  const camT = `translate(960 540) scale(${cam.k}) translate(${-cam.cx} ${-cam.cy})`;

  const c1 = em(f, -10, 14);
  const c1op = c1.op * out(f, 58, 8);
  const t1b = em(f, 34, 12);
  const t1bop = t1b.op * out(f, 58, 8);
  const t1aop = out(f, 56, 8);

  const cards = [
    { n: "01", k: "光", v: "屏幕与灯", x: 240, b: B(4), rot: -1.6 },
    { n: "02", k: "声", v: "冰箱与楼道", x: 660, b: B(5), rot: 1.2 },
    { n: "03", k: "温", v: "室温与被窝", x: 1080, b: B(6), rot: -1.1 },
    { n: "04", k: "压", v: "床垫支撑", x: 1500, b: B(7), rot: 1.5 },
  ];

  const bh = f < B(10) ? 0.62 : 0.38;
  const barTop = 470 + 270 * (1 - bh);
  const barsIn = em(f, 144, 12);

  return (
    <AbsoluteFill>
      <PaperBg />

      <svg width="1920" height="1080" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id="worldClip">
            <rect x="0" y="0" width="1920" height="1080" />
          </clipPath>
        </defs>

        <g clipPath="url(#worldClip)">
          <g transform={camT}>
            {/* ============ 房间（一直都在） ============ */}
            <rect x={-400} y={FLOOR} width={3600} height={400} fill={P.paper2} opacity={0.5} />
            <line
              x1={-400}
              y1={FLOOR}
              x2={3200}
              y2={FLOOR}
              stroke={P.ink}
              strokeWidth={4}
              strokeDasharray={1}
              pathLength={1}
              strokeDashoffset={drawOn(f, -10, 12)}
            />

            {/* 窗 */}
            <g opacity={em(f, 2, 14).op * out(f, 286, 20)}>
              <rect x={540} y={420} width={170} height={200} fill={P.paper} stroke={P.ink} strokeWidth={3.4} />
              <line x1={625} y1={420} x2={625} y2={620} stroke={P.ink} strokeWidth={2.6} />
              <line x1={540} y1={520} x2={710} y2={520} stroke={P.ink} strokeWidth={2.6} />
            </g>

            {/* 地毯：让一路平移过去不是一片空墙 */}
            <g opacity={em(f, 16, 14).op * out(f, 286, 20)}>
              <ellipse cx={1420} cy={812} rx={250} ry={20} fill="rgba(143,174,124,0.28)" stroke={P.ink} strokeWidth={2.4} />
            </g>

            {/* 床 */}
            <g>
              <rect x={180} y={700} width={580} height={108} rx={8} fill={P.paper2} stroke={P.ink} strokeWidth={4} filter="url(#liftS)" />
              <rect x={180} y={660} width={580} height={44} rx={6} fill="#fffaf0" stroke={P.ink} strokeWidth={4} />
              <rect x={250} y={614} width={170} height={46} rx={20} fill={P.paper} stroke={P.ink} strokeWidth={4} />
              <ellipse cx={600} cy={620} rx={110} ry={40} fill={P.sage} stroke={P.ink} strokeWidth={4} />
              <rect x={430} y={612} width={330} height={96} rx={22} fill={P.sage} stroke={P.ink} strokeWidth={4} />
              <path d="M 448 656 Q 560 646 660 658 Q 720 666 742 656" fill="none" stroke={P.ink} strokeWidth={2.4} opacity={0.5} />
            </g>

            {/* 壁挂搁板：手机放在上面，地面这条路是空的，小人走过去不会穿模 */}
            <g opacity={out(f, 180, 12)}>
              <rect x={1290} y={566} width={300} height={16} rx={4} fill={P.paper2} stroke={P.ink} strokeWidth={3.4} />
              <path d="M 1312 582 L 1312 622 L 1344 582 Z" fill={P.paper2} stroke={P.ink} strokeWidth={3} strokeLinejoin="round" />
              <path d="M 1568 582 L 1568 622 L 1536 582 Z" fill={P.paper2} stroke={P.ink} strokeWidth={3} strokeLinejoin="round" />
              <rect x={1520} y={530} width={44} height={36} rx={6} fill={P.clay} stroke={P.ink} strokeWidth={3.2} />
              <line x1={1542} y1={530} x2={1542} y2={486} stroke={P.ink} strokeWidth={4} />
              <path d="M 1542 508 Q 1510 492 1508 464 Q 1536 470 1542 496" fill={P.sage} stroke={P.ink} strokeWidth={2.6} strokeLinejoin="round" />
              <path d="M 1542 500 Q 1568 478 1574 452 Q 1548 460 1542 492" fill={P.sage} stroke={P.ink} strokeWidth={2.6} strokeLinejoin="round" />
            </g>

            {/* 冰箱 */}
            <g>
              <rect x={1900} y={470} width={190} height={330} rx={10} fill={P.paper2} stroke={P.ink} strokeWidth={4.4} filter="url(#liftS)" />
              <line x1={1900} y1={568} x2={2090} y2={568} stroke={P.ink} strokeWidth={3} />
              <rect x={2028} y={530} width={8} height={26} rx={4} fill={P.ink} />
              <rect x={2028} y={600} width={8} height={40} rx={4} fill={P.ink} />
            </g>

            {/* ============ 镜 1 · 钩子 ============ */}
            <Paper x={900} y={120} w={560} h={400} rot={-1.4} op={c1op} sc={c1.sc}>
              <text x={944} y={300} fontFamily={SERIF} fontSize={168} fill={P.clay}>
                48.5%
              </text>
              <text x={946} y={364} fontFamily={SANS} fontSize={34} fill={P.ink}>
                18 岁以上人群
              </text>
              <text x={946} y={408} fontFamily={SANS} fontSize={34} fill={P.soft}>
                睡眠困扰率
              </text>
              <text x={946} y={468} fontFamily={SANS} fontSize={30} fill={P.faint}>
                超 3 亿人
              </text>
            </Paper>

            {/* ============ 镜 2 · 四个变量 ============ */}
            {cards.map((c) => {
              const e = em(f, c.b, 12);
              return (
                <Paper key={c.n} x={c.x} y={290} w={240} h={112} rot={c.rot} op={e.op * out(f, 122, 10)} sc={e.sc}>
                  <text x={c.x + 22} y={324} fontFamily={SANS} fontSize={20} letterSpacing="0.2em" fill={P.clay}>
                    {c.n}
                  </text>
                  <text x={c.x + 22} y={384} fontFamily={SERIF} fontSize={46} fill={P.ink}>
                    {c.k}
                  </text>
                  <text x={c.x + 78} y={382} fontFamily={SANS} fontSize={24} fill={P.soft}>
                    {c.v}
                  </text>
                </Paper>
              );
            })}

            {/* ============ 镜 3 · 光 ============ */}
            <g opacity={em(f, 124, 12).op * out(f, 180, 12)}>
              <rect x={1330} y={400} width={120} height={166} rx={16} fill="#fffaf0" stroke={P.ink} strokeWidth={4} filter="url(#liftS)" />
              <rect x={1340} y={410} width={100} height={146} rx={9} fill={P.mustard} opacity={0.45 + 0.2 * Math.sin(f / 6)} />
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1={1326}
                  y1={430 + i * 32}
                  x2={1252}
                  y2={452 + i * 8}
                  stroke={P.mustard}
                  strokeWidth={3}
                  strokeDasharray={1}
                  pathLength={1}
                  strokeDashoffset={drawOn(f, 138 + i * 2, 12)}
                  opacity={0.9}
                />
              ))}
            </g>

            <g opacity={barsIn.op * out(f, 186, 12)}>
              <line x1={1570} y1={740} x2={1880} y2={740} stroke={P.ink} strokeWidth={3} />
              <rect x={1600} y={470} width={110} height={270} fill="rgba(143,174,124,0.55)" stroke={P.ink} strokeWidth={3.4} />
              <rect x={1720} y={barTop} width={110} height={270 * bh} fill="rgba(196,83,47,0.45)" stroke={P.clay} strokeWidth={3.4} />
              <text x={1655} y={448} textAnchor="middle" fontFamily={SANS} fontSize={30} fill={P.soft}>
                睡前
              </text>
              <text x={1775} y={448} textAnchor="middle" fontFamily={SANS} fontSize={30} fill={P.clay}>
                1 小时后
              </text>
              <line x1={1700} y1={470} x2={1700} y2={barTop - 10} stroke={P.clay} strokeWidth={3.4} strokeLinecap="round" />
              <polygon points={`1700,${barTop} 1687,${barTop - 20} 1713,${barTop - 20}`} fill={P.clay} />
            </g>

            <g opacity={em(f, B(10), 12).op * out(f, 186, 12)}>
              <text x={1600} y={386} fontFamily={SERIF} fontSize={96} fill={P.clay}>
                −20~50%
              </text>
            </g>

            {/* ============ 镜 4 · 声 ============ */}
            <g opacity={out(f, 246, 18)}>
              <line
                x1={2220}
                y1={360}
                x2={2220}
                y2={760}
                stroke={P.ink}
                strokeWidth={4}
                strokeDasharray={1}
                pathLength={1}
                strokeDashoffset={drawOn(f, 190, 12)}
              />
              {[0, 10, 20, 30, 40, 50].map((db) => {
                const e = em(f, 194, 10);
                return (
                  <g key={db} opacity={e.op}>
                    <line x1={2196} y1={760 - db * 8} x2={2236} y2={760 - db * 8} stroke={P.ink} strokeWidth={3} />
                    <text x={2170} y={770 - db * 8} textAnchor="end" fontFamily={SANS} fontSize={30} fill={P.soft}>
                      {db}
                    </text>
                  </g>
                );
              })}
              <line
                x1={2256}
                y1={520}
                x2={2500}
                y2={520}
                stroke={P.sage}
                strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray={1}
                pathLength={1}
                strokeDashoffset={drawOn(f, 198, 12)}
              />
              <text x={2520} y={512} fontFamily={SANS} fontSize={36} fill={P.sage} opacity={em(f, 204, 12).op}>
                WHO 夜间 ≤ 30
              </text>
              <g transform={`translate(0 ${760 - (f < B(13) ? 30 : 40) * 8})`} opacity={em(f, 195, 10).op}>
                <polygon points="2244,0 2288,-20 2288,20" fill={P.clay} stroke={P.ink} strokeWidth={3} />
              </g>
            </g>

            <Paper x={2350} y={150} w={460} h={180} rot={-1.2} op={em(f, 206, 12).op * out(f, 246, 18)} sc={em(f, 206, 12).sc}>
              <text x={2392} y={256} fontFamily={SERIF} fontSize={84} fill={P.clay}>
                38–42
              </text>
              <text x={2394} y={304} fontFamily={SANS} fontSize={28} fill={P.ink}>
                主流冰箱实测 dB
              </text>
            </Paper>

            {/* ============ 小人（全程在画面里） ============ */}
            <Guide f={f} />

            {/* 被子拉上来：盖住「躺下」那一下的姿态切换 */}
            {(() => {
              const t = smooth(clamp01((f - 294) / 14));
              if (t <= 0) return null;
              return (
                <g transform={`translate(0 ${(1 - t) * 170})`} opacity={t}>
                  <rect x={430} y={612} width={330} height={96} rx={22} fill={P.sage} stroke={P.ink} strokeWidth={4} filter="url(#liftS)" />
                  <path d="M 448 656 Q 560 646 660 658 Q 720 666 742 656" fill="none" stroke={P.ink} strokeWidth={2.4} opacity={0.5} />
                </g>
              );
            })()}
          </g>
        </g>

        {/* ============ 标题（屏幕空间，不跟着镜头跑） ============ */}
        <g opacity={out(f, 56, 8)}>
          <text x={120} y={200} fontFamily={SANS} fontSize={30} letterSpacing="0.24em" fill={P.clay}>
            深睡自由
          </text>
          <text x={120} y={300} fontFamily={SERIF} fontSize={96} fill={P.ink}>
            睡不好，
          </text>
        </g>
        <g opacity={t1bop} transform={`translate(0 ${t1b.dy})`}>
          <text x={120} y={404} fontFamily={SERIF} fontSize={96} fill={P.ink}>
            不怪你。
          </text>
        </g>

        <g opacity={em(f, 66, 12).op * out(f, 120, 10)}>
          <text x={120} y={140} fontFamily={SANS} fontSize={30} letterSpacing="0.24em" fill={P.clay}>
            四个变量
          </text>
          <text x={120} y={228} fontFamily={SERIF} fontSize={86} fill={P.ink}>
            卧室是个系统
          </text>
        </g>

        <g opacity={em(f, 130, 12).op * out(f, 186, 10)}>
          <text x={120} y={140} fontFamily={SANS} fontSize={30} letterSpacing="0.24em" fill={P.clay}>
            变量一 · 光
          </text>
          <text x={120} y={228} fontFamily={SERIF} fontSize={84} fill={P.ink}>
            睡前刷手机 1 小时
          </text>
        </g>

        <g opacity={em(f, 194, 12).op * out(f, 246, 10)}>
          <text x={120} y={140} fontFamily={SANS} fontSize={30} letterSpacing="0.24em" fill={P.clay}>
            变量二 · 声
          </text>
          <text x={120} y={228} fontFamily={SERIF} fontSize={84} fill={P.ink}>
            夜里的标准是 30 分贝
          </text>
        </g>

        <g opacity={out(f, 250, 12)}>
          <text x={120} y={1036} fontFamily={SANS} fontSize={28} fill={P.faint}>
            数据：抖音商城 × 奥维云网 2026-10 · WHO 2026-08
          </text>
        </g>

        {/* ============ 金句（屏幕空间） ============ */}
        <g opacity={em(f, 262, 14).op}>
          <text x={960} y={212} textAnchor="middle" fontFamily={SERIF} fontSize={96} fill={P.ink}>
            白天向外消耗，
          </text>
        </g>
        <g opacity={em(f, 278, 14).op}>
          <text x={960} y={344} textAnchor="middle" fontFamily={SERIF} fontSize={96} fill={P.clay}>
            夜里向内修复。
          </text>
        </g>
        <g opacity={em(f, 304, 12).op}>
          <text x={960} y={452} textAnchor="middle" fontFamily={SANS} fontSize={30} letterSpacing="0.26em" fill={P.soft}>
            深睡自由 · 居住观测
          </text>
        </g>
      </svg>

      <Audio src={staticFile("bgm-qn-intro.wav")} volume={0.85} />
    </AbsoluteFill>
  );
};

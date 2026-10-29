import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

export const W = 1920;
export const FPS = 30;

export const C = {
  cyan: "#78DCC8",
  cyanHi: "#BEF0DA",
  amber: "#D8BD5E",
  white: "#E4EEF6",
  mag: "#D27882",
  faint: "rgba(228,238,246,0.76)",
  dim: "rgba(228,238,246,0.24)",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const SANS = "Microsoft YaHei, PingFang SC, sans-serif";
export const SERIF = "SimSun, Songti SC, serif";

export const at = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], clamp);

export const glow = (color: string, s = 1) =>
  `0 0 ${7 * s}px ${color}77, 0 0 ${20 * s}px ${color}44, 0 0 ${40 * s}px ${color}22`;

/* ================= 背景：径向渐变 + 平移网格 ================= */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const off = (frame / FPS) * 16 % 64;
  const g: React.ReactNode[] = [];
  for (let x = -64; x <= W + 64; x += 64) {
    g.push(<line key={"v" + x} x1={x + off} y1={0} x2={x + off} y2={1080} />);
  }
  for (let y = -64; y <= 1080 + 64; y += 64) {
    g.push(<line key={"h" + y} x1={0} y1={y + off} x2={W} y2={y + off} />);
  }
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 72% 62% at 50% 46%, #141821 0%, #0C0E14 56%, #040609 100%)",
      }}
    >
      <svg width={W} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g stroke={C.cyan} strokeWidth={1} opacity={0.085} fill="none">
          {g}
        </g>
        {/* 四角框 */}
        <g stroke={C.cyan} strokeWidth={1.6} opacity={0.3} fill="none">
          <path d="M64 64 h44 M64 64 v44" />
          <path d={`M${W - 64} 64 h-44 M${W - 64} 64 v44`} />
          <path d="M64 1016 h44 M64 1016 v-44" />
          <path d={`M${W - 64} 1016 h-44 M${W - 64} 1016 v-44`} />
        </g>
        {/* 刻度 */}
        <g stroke={C.cyan} strokeWidth={1} opacity={0.22} fill="none">
          {Array.from({ length: 9 }, (_, i) => (
            <line key={"t" + i} x1={240 + i * 160} y1={1016} x2={240 + i * 160} y2={1004} />
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ================= 扫描光带 ================= */
export const Scan: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const x = -520 + ((t % 4.4) / 4.4) * (W + 1040);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: -100,
          width: 260,
          height: 1280,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(120,220,200,0.018) 40%, rgba(190,240,220,0.05) 50%, rgba(120,220,200,0.018) 60%, transparent 100%)",
          transform: "skewX(-14deg)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x + 130,
          top: 0,
          width: 1.5,
          height: 1080,
          background: C.cyan,
          opacity: 0.14,
          boxShadow: "0 0 22px rgba(120,220,200,0.5)",
          transform: "skewX(-14deg)",
          pointerEvents: "none",
        }}
      />
    </>
  );
};

/* ================= HUD 角标 ================= */
export const Hud: React.FC<{ opacity: number }> = ({ opacity }) => {
  const frame = useCurrentFrame();
  const tc = `00:${String(Math.floor(frame / FPS)).padStart(2, "0")}`;
  return (
    <>
      <div style={{ position: "absolute", left: 96, top: 54, opacity }}>
        <div style={{ width: 34, height: 1.5, background: C.cyan, opacity: 0.75 }} />
        <div
          style={{
            fontFamily: SANS,
            fontSize: 20,
            letterSpacing: "0.34em",
            color: C.cyan,
            marginTop: 12,
          }}
        >
          概念 / CONCEPT
        </div>
      </div>

      <div style={{ position: "absolute", right: 96, top: 54, opacity: opacity * 0.85 }}>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          {[0.3, 0.55, 0.9].map((o, i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: C.cyan,
                opacity: o,
              }}
            />
          ))}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 20,
            letterSpacing: "0.3em",
            color: C.faint,
            marginTop: 12,
            textAlign: "right",
          }}
        >
          NO. 001
        </div>
      </div>

      <div style={{ position: "absolute", left: 96, bottom: 60, opacity: opacity * 0.55 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 21,
            letterSpacing: "0.5em",
            color: C.faint,
            writingMode: "vertical-rl",
          }}
        >
          居住观测
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 96,
          bottom: 60,
          opacity: opacity * 0.55,
          fontFamily: SANS,
          fontSize: 20,
          letterSpacing: "0.22em",
          color: C.faint,
        }}
      >
        REC · {tc}
      </div>
    </>
  );
};

/* ================= 逐字点亮的标题 ================= */
export const Spell: React.FC<{
  text: string;
  from: number;
  size?: number;
  color?: string;
  step?: number;
  top: number;
}> = ({ text, from, size = 112, color = C.cyan, step = 8, top }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center" }}>
      <div style={{ display: "inline-flex", gap: 6 }}>
        {text.split("").map((ch, i) => (
          <span
            key={i}
            style={{
              fontFamily: SERIF,
              fontSize: size,
              color,
              letterSpacing: "0.06em",
              opacity: at(frame, from + i * step, from + i * step + 7),
              transform: `translateY(${(1 - at(frame, from + i * step, from + i * step + 7)) * 14}px)`,
              textShadow: glow(color),
            }}
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ================= 从左画出的横线 ================= */
export const Rule: React.FC<{ y: number; from: number; to: number; color?: string; width?: number }> = ({
  y,
  from,
  to,
  color = C.cyan,
  width = 1500,
}) => {
  const frame = useCurrentFrame();
  const p = at(frame, from, to);
  const x0 = (W - width) / 2;
  return (
    <svg width={W} height={1080} style={{ position: "absolute", inset: 0 }}>
      <line
        x1={x0}
        y1={y}
        x2={x0 + width}
        y2={y}
        stroke={color}
        strokeWidth={1.6}
        opacity={p * 0.8}
      />
      <line
        x1={x0}
        y1={y}
        x2={x0 + width}
        y2={y}
        stroke={color}
        strokeWidth={1.6}
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={100 * (1 - p)}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
};

/* ================= 3D 线框曲面 ================= */
export const Surface: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  const p = at(frame, from, from + 20);
  const e = 1 - Math.pow(1 - p, 3);
  const fadeIn = at(frame, from - 6, from + 4);
  const fadeOut = 1 - at(frame, to - 6, to);
  const spin = (frame / FPS) * 0.26;
  const cx = 520;
  const cy = 604;
  const NX = 13;
  const NZ = 9;
  const h = (x: number, z: number) =>
    Math.sin(x * 0.72 + spin) * Math.cos(z * 0.58) * 74 +
    Math.sin(x * 0.34 - spin * 0.7) * 26;
  const px = (x: number, z: number) => cx + (x - NX / 2) * 52 + z * 32;
  const py = (x: number, z: number) => cy + h(x, z) * e + (z - NZ / 2) * 30 - x * 6;
  const paths: React.ReactNode[] = [];
  for (let z = 0; z <= NZ; z++) {
    let d = "";
    for (let x = 0; x <= NX; x++) {
      d += (x ? " L" : "M") + px(x, z).toFixed(1) + " " + py(x, z).toFixed(1);
    }
    const dr = at(frame, from - 10 + z * 1.6, from + 4 + z * 1.6);
    paths.push(
      <path
        key={"a" + z}
        d={d}
        opacity={0.18 + (z / NZ) * 0.54}
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={100 * (1 - dr)}
      />
    );
  }
  for (let x = 0; x <= NX; x++) {
    let d = "";
    for (let z = 0; z <= NZ; z++) {
      d += (z ? " L" : "M") + px(x, z).toFixed(1) + " " + py(x, z).toFixed(1);
    }
    const dr = at(frame, from + 2 + x * 1.1, from + 14 + x * 1.1);
    paths.push(
      <path
        key={"b" + x}
        d={d}
        opacity={0.08 + (x / NX) * 0.2}
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={100 * (1 - dr)}
      />
    );
  }
  return (
    <svg width={W} height={1080} style={{ position: "absolute", inset: 0 }}>
      <g
        fill="none"
        stroke={C.cyan}
        strokeWidth={1.3}
        opacity={fadeIn * fadeOut}
        style={{ filter: "drop-shadow(0 0 5px rgba(120,220,200,0.55))" }}
      >
        {paths}
      </g>
      <g
        fill="none"
        stroke={C.cyanHi}
        strokeWidth={2.6}
        opacity={fadeIn * fadeOut * 0.09}
        style={{ filter: "blur(4px)" }}
      >
        {paths}
      </g>
      {/* 轴刻度标注 */}
      <g opacity={fadeIn * fadeOut * 0.55} fontFamily={SANS} fontSize={18} fill="rgba(228,238,246,0.64)">
        <text x={px(0, NZ) - 26} y={py(0, NZ) + 40} textAnchor="end">n = 0</text>
        <text x={px(NX, NZ) - 10} y={py(NX, NZ) + 40} textAnchor="middle">n = 12</text>
        <text x={px(NX / 2, NZ)} y={py(NX / 2, NZ) + 62} textAnchor="middle">
          次数 n →
        </text>
      </g>

    </svg>
  );
};

/* ================= 右侧数据面板 ================= */
export const Inset: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  const fadeIn = at(frame, from, from + 10);
  const fadeOut = 1 - at(frame, to - 6, to);
  const p = at(frame, from + 10, from + 34);
  const o = fadeIn * fadeOut;

  const gx0 = 1252;
  const gx1 = 1742;
  const base = 700;
  const peakX = 1500;
  const spike = (x: number) => base - 210 * Math.exp(-Math.pow((x - peakX) / 105, 2));

  let eff = "";
  for (let i = 0; i <= 44; i++) {
    const x = gx0 + ((gx1 - gx0) * i) / 44;
    eff += (i ? " L" : "M") + x.toFixed(1) + " " + spike(x).toFixed(1);
  }

  return (
    <svg width={W} height={1080} style={{ position: "absolute", inset: 0 }}>
      <g opacity={o}>
        <rect
          x={1180}
          y={220}
          width={640}
          height={540}
          fill="rgba(20,24,33,0.55)"
          stroke="rgba(120,220,200,0.3)"
          strokeWidth={1.2}
        />
        <text x={1208} y={264} fontFamily={SANS} fontSize={20} letterSpacing="0.3em" fill={C.faint}>
          读数 / READING
        </text>
        <line x1={1208} y1={286} x2={1792} y2={286} stroke="rgba(120,220,200,0.2)" strokeWidth={1} />

        {/* 纵轴刻度 */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={gx0 - 8}
            y1={base - i * 70}
            x2={gx0}
            y2={base - i * 70}
            stroke="rgba(120,220,200,0.3)"
            strokeWidth={1}
          />
        ))}
        <line x1={gx0} y1={base} x2={gx1} y2={base} stroke="rgba(228,238,246,0.24)" strokeWidth={1} />
        <line x1={gx0} y1={330} x2={gx0} y2={base} stroke="rgba(228,238,246,0.24)" strokeWidth={1} />
        {[
          { v: "50", y: base - 105 },
          { v: "100", y: base - 210 },
        ].map((k) => (
          <text
            key={k.v}
            x={gx0 - 12}
            y={k.y + 5}
            fontFamily={SANS}
            fontSize={18}
            fill="rgba(228,238,246,0.52)"
            textAnchor="end"
          >
            {k.v}
          </text>
        ))}

        {/* 总量：水平虚线 */}
        <line
          x1={gx0}
          y1={base}
          x2={gx1}
          y2={base}
          stroke={C.white}
          strokeWidth={1.6}
          strokeDasharray="8 8"
          opacity={0.55}
        />

        {/* 效率：尖峰 */}
        <path
          d={eff}
          fill="none"
          stroke={C.amber}
          strokeWidth={2.6}
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={100 * (1 - p)}
          style={{ filter: "drop-shadow(0 0 8px rgba(216,189,94,0.75))" }}
        />

        {/* 峰值标注 */}
        <g opacity={at(frame, from + 36, from + 48)}>
          <line
            x1={peakX}
            y1={spike(peakX) - 10}
            x2={peakX}
            y2={336}
            stroke="rgba(216,189,94,0.45)"
            strokeWidth={1}
            strokeDasharray="4 6"
          />
          <text x={peakX} y={322} fontFamily={SANS} fontSize={21} fill={C.amber} textAnchor="middle">
            峰值更高
          </text>
          <text x={peakX} y={744} fontFamily={SANS} fontSize={21} fill={C.white} opacity={0.6} textAnchor="middle">
            总量 ≈ 没变
          </text>
        </g>

        <text x={1208} y={678} fontFamily={SANS} fontSize={20} fill={C.white} opacity={0.55}>
          总量
        </text>
        <text x={1208} y={452} fontFamily={SANS} fontSize={20} fill={C.amber}>
          效率
        </text>
        <text x={gx1} y={736} fontFamily={SANS} fontSize={18} fill={C.faint} textAnchor="end">
          时间
        </text>
      </g>
    </svg>
  );
};

/* ================= 时间窗口 ================= */
export const Seg: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({
  from,
  to,
  children,
}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  return <AbsoluteFill>{children}</AbsoluteFill>;
};

/* ================= 主组件 ================= */
export const Neon: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Backdrop />
      <Scan />
      <Hud opacity={1} />

      {/* ---------- S1 开机 0-66 ---------- */}
      <Seg from={0} to={66}>
        <Rule y={430} from={-12} to={26} width={1620} />
        <Spell text="去家务化" from={-8} size={118} top={246} step={7} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 462,
            textAlign: "center",
            fontFamily: SANS,
            fontSize: 27,
            letterSpacing: "0.14em",
            color: C.faint,
            opacity: at(frame, 30, 46),
          }}
        >
          从源头减少家务量，而不是提高效率
        </div>
        <div
          style={{
            position: "absolute",
            right: 214,
            top: 176,
            fontFamily: SERIF,
            fontSize: 300,
            lineHeight: 1,
            color: C.cyan,
            opacity: 0.05,
            letterSpacing: "0.02em",
          }}
        >
          01
        </div>
        <div
          style={{
            position: "absolute",
            left: 178,
            top: 176,
            width: 1,
            height: 300,
            background: "rgba(120,220,200,0.26)",
            opacity: at(frame, 10, 30),
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 178,
            top: 176,
            width: 1,
            height: 300,
            background: "rgba(120,220,200,0.26)",
            opacity: at(frame, 14, 34),
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 862,
            textAlign: "center",
            fontFamily: SANS,
            fontSize: 20,
            letterSpacing: "0.46em",
            color: C.faint,
            opacity: at(frame, 42, 56),
          }}
        >
          居住 · 两个词
        </div>
      </Seg>

      {/* ---------- S2 曲面 + 读数 66-156 ---------- */}
      <Seg from={66} to={156}>
        <div style={{ position: "absolute", left: 130, top: 118, opacity: at(frame, 80, 94) }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 21,
              letterSpacing: "0.34em",
              color: C.amber,
            }}
          >
            家务量 / 不变
          </div>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 46,
              color: C.white,
              marginTop: 14,
              textShadow: "0 0 18px rgba(228,238,246,0.25)",
            }}
          >
            效率上去了，总量没下来
          </div>
        </div>
        <Surface from={66} to={156} />
        <Inset from={64} to={156} />
        <div style={{ position: "absolute", left: 1184, top: 806, opacity: at(frame, 94, 108) }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 19,
              letterSpacing: "0.34em",
              color: C.faint,
            }}
          >
            公式
          </div>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 40,
              color: C.amber,
              marginTop: 10,
              letterSpacing: "0.04em",
              textShadow: glow(C.amber, 0.7),
            }}
          >
            T = n × t
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 23,
              color: "rgba(228,238,246,0.68)",
              marginTop: 10,
              letterSpacing: "0.06em",
            }}
          >
            总量 = 次数 × 单次耗时
          </div>
        </div>
      </Seg>

      {/* ---------- S3 转折 156-212 ---------- */}
      <Seg from={156} to={208}>
        {/* 底纹：残留的网格线 */}
        <svg width={W} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g stroke={C.mag} strokeWidth={1} opacity={0.16} fill="none">
            {Array.from({ length: 11 }, (_, i) => (
              <line key={i} x1={180} y1={180 + i * 72} x2={1740} y2={180 + i * 72} />
            ))}
          </g>
          <line
            x1={180}
            y1={470}
            x2={180 + 1560 * at(frame, 158, 184)}
            y2={470}
            stroke={C.mag}
            strokeWidth={2}
            opacity={at(frame, 158, 166) * 0.85}
            style={{ filter: "drop-shadow(0 0 10px rgba(210,120,130,0.8))" }}
          />
        </svg>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 226,
            textAlign: "center",
            fontFamily: SERIF,
            fontSize: 250,
            lineHeight: 1,
            color: C.mag,
            opacity: at(frame, 152, 166),
            textShadow: glow(C.mag, 2.1),
          }}
        >
          但
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 560,
            textAlign: "center",
            fontFamily: SANS,
            fontSize: 36,
            letterSpacing: "0.1em",
            color: C.white,
            opacity: at(frame, 170, 184),
          }}
        >
          别人的方案，不一定适合你的手
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 638,
            display: "flex",
            justifyContent: "center",
            gap: 150,
            opacity: at(frame, 166, 180),
          }}
        >
          {[
            { k: "效率", v: "↑", c: C.amber },
            { k: "总量", v: "—", c: C.white },
          ].map((x) => (
            <div key={x.k} style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <span style={{ fontFamily: SANS, fontSize: 27, letterSpacing: "0.2em", color: C.faint }}>
                {x.k}
              </span>
              <span style={{ fontFamily: SERIF, fontSize: 40, color: x.c, textShadow: glow(x.c, 0.6) }}>
                {x.v}
              </span>
            </div>
          ))}
        </div>
      </Seg>

      {/* ---------- S4a 第二个词 212-272 ---------- */}
      <Seg from={208} to={272}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 132,
            textAlign: "center",
            fontFamily: SANS,
            fontSize: 21,
            letterSpacing: "0.42em",
            color: C.faint,
            opacity: at(frame, 202, 208),
          }}
        >
          第二个词
        </div>
        <Spell text="适我主义" from={196} size={120} color={C.amber} top={176} step={6} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 356,
            textAlign: "center",
            fontFamily: SERIF,
            fontSize: 40,
            color: "rgba(228,238,246,0.76)",
            opacity: at(frame, 224, 236),
          }}
        >
          我的家我做主，不追求标准答案
        </div>
        {[
          { t: "适老化", w: "为长辈", hi: false, y: 470 },
          { t: "适幼化", w: "为孩子", hi: false, y: 552 },
          { t: "适我化", w: "为自己", hi: true, y: 634 },
        ].map((r, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: r.y,
              display: "flex",
              justifyContent: "center",
              alignItems: "baseline",
              gap: 26,
              opacity: at(frame, 230 + i * 7, 242 + i * 7),
            }}
          >
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 64,
                color: r.hi ? C.amber : "rgba(228,238,246,0.24)",
                textShadow: r.hi ? glow(C.amber) : "none",
              }}
            >
              {r.t}
            </span>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 25,
                letterSpacing: "0.2em",
                color: r.hi ? C.white : "rgba(228,238,246,0.64)",
              }}
            >
              {r.w}
            </span>
          </div>
        ))}
      </Seg>

      {/* ---------- S4b 落版 272-300 ---------- */}
      <Seg from={272} to={301}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 210,
            textAlign: "center",
            fontFamily: SANS,
            fontSize: 21,
            letterSpacing: "0.42em",
            color: C.faint,
            opacity: at(frame, 262, 270),
          }}
        >
          关系
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 268,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: 70,
            opacity: at(frame, 262, 274),
          }}
        >
          <div style={{ width: 330, textAlign: "center" }}>
            <div style={{ fontFamily: SERIF, fontSize: 68, color: C.cyan, textShadow: glow(C.cyan, 0.8) }}>
              去家务化
            </div>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 25,
                letterSpacing: "0.28em",
                color: C.faint,
                marginTop: 26,
              }}
            >
              手段
            </div>
          </div>

          <div style={{ fontFamily: SANS, fontSize: 26, color: C.dim, paddingTop: 22 }}>→</div>

          <div style={{ width: 330, textAlign: "center" }}>
            <div style={{ fontFamily: SERIF, fontSize: 68, color: C.amber, textShadow: glow(C.amber, 0.8) }}>
              适我主义
            </div>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 25,
                letterSpacing: "0.28em",
                color: C.faint,
                marginTop: 26,
              }}
            >
              理念
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 540,
            textAlign: "center",
            fontFamily: SERIF,
            fontSize: 78,
            lineHeight: 1.6,
            color: C.white,
            opacity: at(frame, 272, 286),
          }}
        >
          不是把家收拾干净
          <br />
          <span style={{ color: C.amber, textShadow: glow(C.amber, 0.7) }}>是让家不需要被收拾</span>
        </div>
      </Seg>

      <Audio src={staticFile("bgm-neon.wav")} volume={0.82} />
    </AbsoluteFill>
  );
};



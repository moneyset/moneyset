"use client";

import { cn } from "@/lib/utils";

type MicroSparklineProps = {
  values: readonly number[];
  /** 0–100-ish scale hint; series is auto-scaled if flat. */
  className?: string;
  width?: number;
  height?: number;
  tone?: "danger" | "warning" | "flow" | "consensus" | "muted";
  /** Thinner stroke + lower contrast — mobile / dense surfaces. */
  weight?: "normal" | "hair";
  /** Accessible name — series is illustrative, not a full chart. */
  ariaLabel?: string;
  /** Mark last observation (read endpoint, not decoration). */
  showEndpoint?: boolean;
};

const toneClass: Record<NonNullable<MicroSparklineProps["tone"]>, string> = {
  danger: "text-ms-danger/68",
  warning: "text-ms-warning/62",
  flow: "text-ms-flow/62",
  consensus: "text-ms-consensus/62",
  muted: "text-ms-faint/72",
};

function seriesPath(
  values: readonly number[],
  w: number,
  h: number,
  pad: number,
): { points: string; lastX: number; lastY: number } | null {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length < 2) return null;
  const vmin = Math.min(...clean);
  const vmax = Math.max(...clean);
  const span = Math.max(1e-6, vmax - vmin);
  const pts = clean.map((v, i) => {
    const x = pad + (i / (clean.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - vmin) / span) * (h - pad * 2);
    return { x, y, s: `${x.toFixed(2)},${y.toFixed(2)}` };
  });
  const last = pts.at(-1)!;
  return { points: pts.map((p) => p.s).join(" "), lastX: last.x, lastY: last.y };
}

/** Tiny SVG read — supports cognition, not charting. */
export function MicroSparkline({
  values,
  className,
  width = 76,
  height = 22,
  tone = "muted",
  weight = "normal",
  ariaLabel,
  showEndpoint = false,
}: MicroSparklineProps) {
  const pad = 2;
  const path = seriesPath(values, width, height, pad);
  const hair = weight === "hair";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0 overflow-visible", toneClass[tone], className)}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      {path ? (
        <>
          <line
            x1={pad}
            y1={height / 2}
            x2={width - pad}
            y2={height / 2}
            stroke="currentColor"
            strokeWidth="0.65"
            opacity={hair ? 0.09 : 0.12}
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth={hair ? 0.85 : 1}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            opacity={hair ? 0.72 : 0.88}
            points={path.points}
          />
          {showEndpoint ? (
            <circle
              cx={path.lastX}
              cy={path.lastY}
              r={hair ? 1.35 : 1.75}
              fill="currentColor"
              opacity={hair ? 0.72 : 0.85}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </>
      ) : (
        <line
          x1={pad}
          y1={height / 2}
          x2={width - pad}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth="1"
          opacity={0.28}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

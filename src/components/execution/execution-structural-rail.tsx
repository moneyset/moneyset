"use client";

import { useId, useMemo, useSyncExternalStore } from "react";

import type {
  ExecutionMicroCognition,
  ExecutionStructuralZone,
  ExecutionStructuralZoneKind,
} from "@/lib/execution/derive-execution-layer";
import { formatPriceRange } from "@/lib/execution/derive-execution-layer";
import { executionZoneKindLabel } from "@/lib/execution/derive-execution-layer";
import { cognitionRailSessionWrapClass, executionRailSessionVeil } from "@/lib/cognition/session-visual";
import type { UiLocale } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";

const VB = { w: 420, h: 288 };
const M = { l: 58, r: 10, t: 12, b: 62 };

const RAIL_PRIORITY: ReadonlySet<ExecutionStructuralZoneKind> = new Set([
  "reclaim",
  "acceptance",
  "compression",
  "breakdown_trigger",
  "expansion_trigger",
  "objective",
]);

const DEFAULT_MICRO: ExecutionMicroCognition = {
  liquidityStress: 50,
  participationPressure: 50,
  structuralCoherence: 50,
  volImpulse: 50,
};

function useNarrowRail(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia("(max-width: 1023px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => (typeof window !== "undefined" ? window.matchMedia("(max-width: 1023px)").matches : false),
    () => false,
  );
}

function useMsDataTheme(): "light" | "dark" {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof document === "undefined") return () => {};
      const el = document.documentElement;
      const obs = new MutationObserver(() => onStoreChange());
      obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
      return () => obs.disconnect();
    },
    () => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"),
    () => "dark",
  );
}

function zonePaint(
  kind: ExecutionStructuralZoneKind,
  pid: string,
): { fill: string; stroke: string; strokeWidth: number; dash?: string; opacity: number; pattern?: string } {
  switch (kind) {
    case "acceptance":
      return {
        fill: `url(#${pid}-accept)`,
        stroke: "color-mix(in srgb, var(--ms-cognition) 28%, transparent)",
        strokeWidth: 0.55,
        opacity: 1,
      };
    case "reclaim":
      return {
        fill: `url(#${pid}-reclaim)`,
        stroke: "color-mix(in srgb, var(--ms-flow) 26%, transparent)",
        strokeWidth: 0.55,
        opacity: 1,
      };
    case "liquidity_lower":
    case "liquidity_upper":
      return {
        fill: `url(#${pid}-liq)`,
        stroke: "color-mix(in srgb, var(--ms-flow) 18%, transparent)",
        strokeWidth: 0.45,
        opacity: 1,
      };
    case "compression":
      return {
        fill: `url(#${pid}-compress)`,
        stroke: "color-mix(in srgb, var(--ms-border-mid) 32%, transparent)",
        strokeWidth: 0.85,
        dash: "3 3",
        opacity: 1,
      };
    case "expansion_trigger":
      return {
        fill: `url(#${pid}-expand)`,
        stroke: "color-mix(in srgb, var(--ms-warning) 22%, transparent)",
        strokeWidth: 0.5,
        opacity: 1,
      };
    case "breakdown_trigger":
      return {
        fill: "color-mix(in srgb, var(--ms-intel-deep) 14%, color-mix(in srgb, var(--ms-danger) 9%, transparent))",
        stroke: "color-mix(in srgb, var(--ms-danger) 16%, transparent)",
        strokeWidth: 0.55,
        opacity: 1,
      };
    case "objective":
      return {
        fill: "color-mix(in srgb, var(--ms-consensus) 11%, transparent)",
        stroke: "color-mix(in srgb, var(--ms-consensus) 20%, transparent)",
        strokeWidth: 0.48,
        dash: "5 4",
        opacity: 0.92,
      };
    case "extension":
      return {
        fill: "color-mix(in srgb, var(--ms-sentiment) 8%, transparent)",
        stroke: "color-mix(in srgb, var(--ms-border) 18%, transparent)",
        strokeWidth: 0.42,
        dash: "2 5",
        opacity: 0.78,
      };
    default:
      return {
        fill: "transparent",
        stroke: "var(--ms-border-subtle)",
        strokeWidth: 0.4,
        opacity: 0.5,
      };
  }
}

function fmtTick(p: number, locale: UiLocale): string {
  const ref = Math.abs(p);
  const decimals = ref >= 100_000 ? 0 : ref >= 1_000 ? 1 : 2;
  return p.toLocaleString(locale === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

type ExecutionStructuralRailProps = {
  zones: readonly ExecutionStructuralZone[];
  anchorPrice: number | null;
  locale: UiLocale;
  cadenceSeries: readonly number[];
  /** Environmental micro-depth — density bands, cadence weighting, drift tone. */
  microCognition?: ExecutionMicroCognition;
  /** When true, parent forces compact layout (e.g. density mode). */
  compact?: boolean;
  className?: string;
};

function topologyPath(
  zones: readonly ExecutionStructuralZone[],
  plot: { l: number; r: number; t: number; b: number },
  yAt: (p: number) => number,
): string | null {
  const order: ExecutionStructuralZoneKind[] = [
    "extension",
    "objective",
    "expansion_trigger",
    "breakdown_trigger",
    "acceptance",
    "reclaim",
    "liquidity_lower",
    "liquidity_upper",
    "compression",
  ];
  const pts: { x: number; y: number }[] = [];
  const w = plot.r - plot.l;
  let step = 0;
  for (const kind of order) {
    const z = zones.find((zz) => zz.kind === kind);
    if (!z) continue;
    const mid = (z.low + z.high) / 2;
    const y = yAt(mid);
    const t = ++step / Math.max(6, order.length);
    const x = plot.l + w * (0.12 + t * 0.76);
    pts.push({ x, y });
  }
  if (pts.length < 2) return null;
  let d = `M ${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]!;
    d += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }
  return d;
}

function cadenceStrip(
  series: readonly number[],
  plot: { l: number; r: number; t: number; b: number },
): { points: string; end: { x: number; y: number } } | null {
  if (series.length < 2) return null;
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const span = Math.max(1e-6, hi - lo);
  const stripT = plot.b - 30;
  const stripB = plot.b - 12;
  const sh = stripB - stripT;
  const w = plot.r - plot.l;
  const pts: string[] = [];
  series.forEach((v, i) => {
    const t = i / Math.max(1, series.length - 1);
    const x = plot.l + t * w;
    const nv = (v - lo) / span;
    const y = stripB - nv * sh;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  });
  const last = pts[pts.length - 1]!;
  const ex = Number(last.split(",")[0]);
  const ey = Number(last.split(",")[1]);
  if (!Number.isFinite(ex) || !Number.isFinite(ey)) {
    return { points: pts.join(" "), end: { x: plot.l + w * 0.5, y: stripB } };
  }
  return { points: pts.join(" "), end: { x: ex, y: ey } };
}

function cadenceStructureDrift(series: readonly number[]): "up" | "down" | "flat" {
  if (series.length < 4) return "flat";
  const a = series[0]!;
  const b = series[series.length - 1]!;
  const d = b - a;
  if (d > 2.5) return "up";
  if (d < -2.5) return "down";
  return "flat";
}

/** Vertical structural rail + topology + cadence — navigation, not a chart. */
export function ExecutionStructuralRail({
  zones,
  anchorPrice,
  locale,
  cadenceSeries,
  microCognition,
  compact: compactProp,
  className,
}: ExecutionStructuralRailProps) {
  const pid = useId().replace(/:/g, "");
  const narrow = useNarrowRail();
  const compact = compactProp ?? narrow;
  const isLight = useMsDataTheme() === "light";
  const micro = microCognition ?? DEFAULT_MICRO;

  const {
    minP,
    maxP,
    plot,
    yAt,
    sorted,
    topo,
    cadencePts,
    cadenceEnd,
    cadenceDrift,
    cadenceStrokeOpacity,
    cadenceStrokeWidth,
    liquidityEdgeOpacity,
    participationEdgeOpacity,
    vignetteOpacity,
    pocketOpacityScalar,
    topoStrokeOpacity,
    veil,
    reclaimMid,
    liquidityPockets,
  } = useMemo(() => {
    if (zones.length === 0 || anchorPrice === null) {
      const v0 = executionRailSessionVeil();
      return {
        minP: 0,
        maxP: 1,
        plot: null as null | { l: number; r: number; t: number; b: number },
        yAt: (_p: number) => 0,
        sorted: [] as ExecutionStructuralZone[],
        topo: null as string | null,
        cadencePts: null as string | null,
        cadenceEnd: null as { x: number; y: number } | null,
        cadenceDrift: "flat" as const,
        cadenceStrokeOpacity: 0.2,
        cadenceStrokeWidth: 0.7,
        liquidityEdgeOpacity: 0,
        participationEdgeOpacity: 0,
        vignetteOpacity: 0,
        pocketOpacityScalar: 0,
        topoStrokeOpacity: 0.11,
        veil: { ...v0, opacity: Math.min(0.088, v0.opacity * (isLight ? 1.16 : 1)) },
        reclaimMid: null as number | null,
        liquidityPockets: [] as readonly { y1: number; y2: number }[],
      };
    }
    let lo = Math.min(...zones.map((z) => z.low));
    let hi = Math.max(...zones.map((z) => z.high));
    const span = hi - lo;
    const pad = Math.max(span * 0.038, anchorPrice * 0.00014);
    lo -= pad;
    hi += pad;
    const l = M.l;
    const r = VB.w - M.r;
    const t = M.t;
    const b = VB.h - M.b;
    const h = b - t;
    const yAtFn = (p: number) => t + ((hi - p) / (hi - lo)) * h;
    const sortedZones = [...zones].sort((a, b) => b.high - b.low - (a.high - a.low));
    const pl = { l, r, t, b };
    const rz = zones.find((z) => z.kind === "reclaim");
    const reclaimM = rz ? (rz.low + rz.high) / 2 : null;
    const edgeDamp = compact ? 0.55 : 1;
    const lightBoost = isLight ? 1.22 : 1;
    const liquidityEdgeOpacity = Math.min(0.145, (0.03 + (micro.liquidityStress / 100) * 0.092) * edgeDamp * lightBoost);
    const participationEdgeOpacity = Math.min(
      0.145,
      (0.03 + (micro.participationPressure / 100) * 0.092) * edgeDamp * lightBoost,
    );
    const incoherent = (100 - micro.structuralCoherence) / 100;
    const vignetteOpacity = Math.min(0.1, (incoherent * 0.055 + (micro.volImpulse / 100) * 0.038) * edgeDamp);
    const pocketOpacityScalar = Math.min(0.12, (0.034 + (micro.liquidityStress / 100) * 0.068) * edgeDamp * lightBoost);
    const cadenceStrokeOpacity = Math.max(
      0.088,
      Math.min(0.33, (0.29 - micro.structuralCoherence / 480) * (compact ? 0.72 : 1) * (isLight ? 1.08 : 1)),
    );
    const cadenceStrokeWidth = (0.58 + (micro.volImpulse / 100) * 0.26) * (compact ? 0.82 : 1);
    const topoStrokeOpacity = (compact ? 0.068 : 0.1) * (isLight ? 1.12 : 1);
    const v0 = executionRailSessionVeil();
    const veil = { ...v0, opacity: Math.min(0.088, v0.opacity * (isLight ? 1.16 : 1)) };
    const cadenceGeom = cadenceStrip(cadenceSeries, pl);
    const pockets = zones
      .filter((z) => z.kind === "liquidity_lower" || z.kind === "liquidity_upper")
      .map((z) => ({ y1: yAtFn(z.high), y2: yAtFn(z.low) }));
    return {
      minP: lo,
      maxP: hi,
      plot: pl,
      yAt: yAtFn,
      sorted: sortedZones,
      topo: topologyPath(zones, pl, yAtFn),
      cadencePts: cadenceGeom?.points ?? null,
      cadenceEnd: cadenceGeom?.end ?? null,
      cadenceDrift: cadenceStructureDrift(cadenceSeries),
      cadenceStrokeOpacity,
      cadenceStrokeWidth,
      liquidityEdgeOpacity,
      participationEdgeOpacity,
      vignetteOpacity,
      pocketOpacityScalar,
      topoStrokeOpacity,
      veil,
      reclaimMid: reclaimM,
      liquidityPockets: pockets,
    };
  }, [zones, anchorPrice, cadenceSeries, micro, compact, isLight]);

  if (!plot || zones.length === 0 || anchorPrice === null) {
    return (
      <div
        className={cn(
          "flex w-full items-center justify-center rounded-ms-md border border-dashed border-ms-border/25 bg-ms-surface/6",
          compact ? "min-h-[112px]" : "min-h-[196px]",
          className,
        )}
        role="img"
        aria-label={
          locale === "ru" ? "Структурный рейл исполнения без привязки к цене" : "Structural execution rail awaiting anchor"
        }
      >
        <p className="max-w-[16rem] px-4 text-center text-[11px] leading-snug text-ms-faint">
          {locale === "ru"
            ? "Нет привязки к цене — карта появится при метке/последней сделке."
            : "No price anchor — structural map renders when mark/last is present."}
        </p>
      </div>
    );
  }

  const span = maxP - minP;
  const mid = (minP + maxP) / 2;
  const gridPrices = [minP + span * 0.25, minP + span * 0.5, minP + span * 0.75];
  const ya = yAt(anchorPrice);
  const w = plot.r - plot.l;
  const edgeW = compact ? 26 : 40;

  return (
    <div className={cn("relative w-full overflow-hidden rounded-ms-md", cognitionRailSessionWrapClass(), className)}>
      <svg
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        className={cn("relative z-[1] w-full text-ms-text", compact ? "max-h-[148px]" : "max-md:max-h-[min(38vh,220px)] max-h-[min(56vh,300px)]")}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={
          locale === "ru"
            ? "Структурная карта исполнения: полосы и каденс относительно метки"
            : "Structural execution map: bands and cadence vs anchor"
        }
      >
        <defs>
          <linearGradient id={`${pid}-env-liq`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--ms-flow)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--ms-flow)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${pid}-env-part`} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--ms-consensus)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--ms-consensus)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${pid}-pocket-v`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ms-flow)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--ms-flow)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--ms-flow)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${pid}-vig-top`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ms-warning)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${pid}-vig-bottom`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--ms-intel-deep)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${pid}-accept`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--ms-cognition)" stopOpacity="0.11" />
            <stop offset="100%" stopColor="var(--ms-cognition)" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={`${pid}-reclaim`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--ms-flow)" stopOpacity="0.09" />
            <stop offset="100%" stopColor="var(--ms-flow)" stopOpacity="0.17" />
          </linearGradient>
          <pattern id={`${pid}-liq`} width="6" height="6" patternUnits="userSpaceOnUse">
            <path
              d="M0 6 L6 0 M-1 1 L1 -1 M5 7 L7 5"
              stroke="var(--ms-flow)"
              strokeOpacity="0.14"
              strokeWidth="0.55"
            />
            <rect width="6" height="6" fill="color-mix(in srgb, var(--ms-flow) 5%, transparent)" />
          </pattern>
          <pattern id={`${pid}-compress`} width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M0 0 L5 5 M5 0 L0 5" stroke="var(--ms-border-mid)" strokeOpacity="0.2" strokeWidth="0.45" />
            <rect width="5" height="5" fill="color-mix(in srgb, var(--ms-bg-surface) 35%, transparent)" />
          </pattern>
          <pattern id={`${pid}-expand`} width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 7 H14" stroke="var(--ms-warning)" strokeOpacity="0.11" strokeWidth="0.5" />
            <rect width="14" height="14" fill="color-mix(in srgb, var(--ms-warning) 6%, transparent)" />
          </pattern>
        </defs>

        <rect
          x={plot.l}
          y={plot.t}
          width={w}
          height={plot.b - plot.t}
          fill="color-mix(in srgb, var(--ms-bg-surface) 20%, transparent)"
          rx={4}
        />
        <rect x={plot.l} y={plot.t} width={w} height={plot.b - plot.t} fill={veil.fill} fillOpacity={veil.opacity} rx={4} />

        {liquidityEdgeOpacity > 0.004 ? (
          <rect
            x={plot.l}
            y={plot.t}
            width={edgeW}
            height={plot.b - plot.t}
            fill={`url(#${pid}-env-liq)`}
            opacity={liquidityEdgeOpacity}
            rx={3}
          />
        ) : null}
        {participationEdgeOpacity > 0.004 ? (
          <rect
            x={plot.r - edgeW}
            y={plot.t}
            width={edgeW}
            height={plot.b - plot.t}
            fill={`url(#${pid}-env-part)`}
            opacity={participationEdgeOpacity}
            rx={3}
          />
        ) : null}

        {vignetteOpacity > 0.004 ? (
          <>
            <rect
              x={plot.l}
              y={plot.t}
              width={w}
              height={compact ? 11 : 14}
              fill={`url(#${pid}-vig-top)`}
              opacity={vignetteOpacity}
            />
            <rect
              x={plot.l}
              y={plot.b - (compact ? 11 : 14)}
              width={w}
              height={compact ? 11 : 14}
              fill={`url(#${pid}-vig-bottom)`}
              opacity={vignetteOpacity}
            />
          </>
        ) : null}

        {gridPrices.map((pv, i) => {
          const py = yAt(pv);
          return (
            <line
              key={i}
              x1={plot.l}
              x2={plot.r}
              y1={py}
              y2={py}
              stroke="var(--ms-border-subtle)"
              strokeOpacity={0.32}
              strokeDasharray="2 6"
              strokeWidth={0.55}
            />
          );
        })}

        {topo ? (
          <path
            d={topo}
            fill="none"
            stroke="var(--ms-cognition)"
            strokeOpacity={topoStrokeOpacity}
            strokeWidth={compact ? 0.95 : 1.05}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {sorted.map((z, i) => {
          const y1 = yAt(z.high);
          const y2 = yAt(z.low);
          const h = Math.max(1.4, y2 - y1);
          const paint = zonePaint(z.kind, pid);
          const dim = compact && !RAIL_PRIORITY.has(z.kind);
          const priorityLift = !compact && RAIL_PRIORITY.has(z.kind);
          const op = (dim ? paint.opacity * 0.38 : paint.opacity) * (priorityLift ? 1.06 : 1);
          return (
            <g key={`${z.kind}-${i}`} opacity={Math.min(1, op)}>
              <rect
                x={plot.l + 0.5}
                y={y1}
                width={w - 1}
                height={h}
                fill={paint.fill}
                stroke={paint.stroke}
                strokeWidth={priorityLift ? paint.strokeWidth + 0.06 : paint.strokeWidth}
                strokeDasharray={paint.dash}
                rx={2}
              />
            </g>
          );
        })}

        {pocketOpacityScalar > 0.004
          ? liquidityPockets.map((p, i) => {
              const ph = Math.max(2, p.y2 - p.y1);
              return (
                <rect
                  key={`pocket-${i}`}
                  x={plot.l + 1}
                  y={p.y1}
                  width={w - 2}
                  height={ph}
                  fill={`url(#${pid}-pocket-v)`}
                  opacity={pocketOpacityScalar * 0.92}
                  rx={2}
                />
              );
            })
          : null}

        {reclaimMid !== null ? (
          <line
            x1={plot.l + 1}
            x2={plot.l + 1}
            y1={yAt(reclaimMid) - 5}
            y2={yAt(reclaimMid) + 5}
            stroke="var(--ms-flow)"
            strokeOpacity={0.45}
            strokeWidth={1.2}
          />
        ) : null}

        {cadencePts ? (
          <g aria-hidden>
            <polyline
              points={cadencePts}
              fill="none"
              stroke="var(--ms-cognition)"
              strokeOpacity={cadenceStrokeOpacity}
              strokeWidth={cadenceStrokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {cadenceEnd ? (
              <circle
                className={cadenceDrift !== "flat" ? "ms-cadence-terminal-pulse" : undefined}
                cx={cadenceEnd.x}
                cy={cadenceEnd.y}
                r={compact ? 1.55 : 2.05}
                fill={
                  cadenceDrift === "up"
                    ? "var(--ms-consensus)"
                    : cadenceDrift === "down"
                      ? "var(--ms-warning)"
                      : "var(--ms-cognition)"
                }
                fillOpacity={0.4}
              />
            ) : null}
          </g>
        ) : null}
        <text
          x={plot.l + 2}
          y={plot.b - 32}
          fontSize={7}
          fill="var(--ms-text-faint)"
          fontFamily="var(--font-sans), system-ui, sans-serif"
        >
          {locale === "ru" ? "Каденс структуры" : "Structure cadence"}
        </text>

        <line
          x1={plot.l}
          x2={plot.r}
          y1={ya}
          y2={ya}
          stroke="var(--ms-text-primary)"
          strokeOpacity={0.38}
          strokeWidth={1}
        />
        <circle
          className={cn(!compact && "ms-exec-anchor-pulse")}
          cx={plot.r - 7}
          cy={ya}
          r={5.5}
          fill="none"
          stroke="var(--ms-text-primary)"
          strokeOpacity={0.35}
          strokeWidth={0.75}
        />
        <circle cx={plot.r - 7} cy={ya} r={2.6} fill="var(--ms-text-primary)" fillOpacity={0.55} />

        <text x={6} y={yAt(maxP) + 10} fontSize={8} fill="var(--ms-text-faint)" fontFamily="var(--font-mono), monospace">
          {fmtTick(maxP, locale)}
        </text>
        <text x={6} y={yAt(mid) + 3} fontSize={9} fill="var(--ms-text-tertiary)" fontFamily="var(--font-mono), monospace">
          {fmtTick(mid, locale)}
        </text>
        <text x={6} y={yAt(minP) + 10} fontSize={8} fill="var(--ms-text-faint)" fontFamily="var(--font-mono), monospace">
          {fmtTick(minP, locale)}
        </text>

        <text
          x={plot.l + 4}
          y={Math.max(plot.t + 9, ya - 6)}
          fontSize={8}
          fill="var(--ms-text-secondary)"
          fontFamily="var(--font-mono), monospace"
        >
          {fmtTick(anchorPrice, locale)}
        </text>
      </svg>
      <p className="mt-1.5 text-[10px] leading-snug text-ms-dim/90">
        {locale === "ru"
          ? "Карта: геометрия структуры и каденс — не график сделок и не индикаторы."
          : "Map: structural geometry and cadence — not an execution chart or indicators."}
      </p>
    </div>
  );
}

export function keyZoneCaption(locale: UiLocale, z: ExecutionStructuralZone | null): string | null {
  if (!z) return null;
  return `${executionZoneKindLabel(locale, z.kind)} · ${formatPriceRange(locale, z.low, z.high)}`;
}

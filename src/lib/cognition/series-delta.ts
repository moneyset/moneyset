/** Tiny delta classification for micro cognition visuals — not a trading signal. */

export type SeriesDeltaTrend = "rising" | "falling" | "flat";

function slope(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const a = values[0]!;
  const b = values[values.length - 1]!;
  return (b - a) / Math.max(1, values.length - 1);
}

/** Same spirit as temporal-evolution classify — tuned for short windows. */
export function classifySeriesDelta(values: readonly number[]): SeriesDeltaTrend {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length < 2) return "flat";
  const s = slope(clean);
  if (s > 0.38) return "rising";
  if (s < -0.38) return "falling";
  return "flat";
}

export function trendFromScalarDelta(delta: number, eps = 0.35): SeriesDeltaTrend {
  if (delta > eps) return "rising";
  if (delta < -eps) return "falling";
  return "flat";
}

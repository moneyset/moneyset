import type { OhlcCandle } from "@/types/market";

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function pctChange(from: number, to: number): number {
  if (!Number.isFinite(from) || from === 0) return 0;
  return ((to - from) / from) * 100;
}

/** Simple momentum proxy: slope of returns over last N closes. */
export function momentumFromCandles(candles: OhlcCandle[], lookback = 20): number | null {
  if (candles.length < lookback + 2) return null;
  const seg = candles.slice(-lookback - 1);
  const closes = seg.map((c) => c.close);
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const a = closes[i - 1]!;
    const b = closes[i]!;
    rets.push(Math.log(b / a));
  }
  // linear regression slope on index vs returns
  const n = rets.length;
  let sx = 0,
    sy = 0,
    sxx = 0,
    sxy = 0;
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = rets[i]!;
    sx += x;
    sy += y;
    sxx += x * x;
    sxy += x * y;
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const slope = (n * sxy - sx * sy) / denom;
  // scale to a compact -100..100 band
  return clamp(slope * 6800, -100, 100);
}

/** Realized vol proxy: stddev(log returns) annualized-ish to 0..100 band. */
export function realizedVolFromCandles(candles: OhlcCandle[], lookback = 60): number | null {
  if (candles.length < lookback + 2) return null;
  const seg = candles.slice(-lookback - 1);
  const closes = seg.map((c) => c.close);
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const a = closes[i - 1]!;
    const b = closes[i]!;
    rets.push(Math.log(b / a));
  }
  const n = rets.length;
  const mean = rets.reduce((a, b) => a + b, 0) / n;
  const var_ = rets.reduce((a, r) => a + (r - mean) * (r - mean), 0) / Math.max(1, n - 1);
  const sd = Math.sqrt(var_);
  // scale: tuned for crypto intraday vol, keep in a stable 0..100 band.
  return clamp(sd * 12500, 0, 100);
}


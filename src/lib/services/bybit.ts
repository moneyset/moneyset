/**
 * Bybit linear perps — cross-venue price / funding sanity checks.
 */

import { BYBIT_REST_BASE_DEFAULT, normalizeBybitCategory } from "@/services/bybit/config";
import { cacheGet, cacheSet, fetchJson, num } from "@/lib/services/shared/http";

export type BybitTickerSnapshot = Readonly<{
  symbol: string;
  lastPrice: number | null;
  markPrice: number | null;
  fundingRate: number | null;
  openInterest: number | null;
  ts: number;
}>;

function cleanSymbol(s: string): string {
  return (s || "BTCUSDT").trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() || "BTCUSDT";
}

export async function fetchBybitTickerSnapshot(
  symbol = "BTCUSDT",
  category?: string,
): Promise<BybitTickerSnapshot> {
  const sym = cleanSymbol(symbol);
  const cat = normalizeBybitCategory(category);
  const cacheKey = `bybit:ticker:${cat}:${sym}`;
  const cached = cacheGet<BybitTickerSnapshot>(cacheKey);
  if (cached) return cached;

  const base = process.env.BYBIT_REST_BASE?.trim() || BYBIT_REST_BASE_DEFAULT;
  const url = `${base}/v5/market/tickers?category=${cat}&symbol=${sym}`;
  const json = await fetchJson<{
    retCode?: number;
    result?: { list?: Array<Record<string, unknown>> };
  }>(url, { retries: 2, timeoutMs: 12_000 }).catch(() => ({ result: { list: [] } }));

  const row = json.result?.list?.[0] ?? {};
  const snap: BybitTickerSnapshot = {
    symbol: sym,
    lastPrice: num(row.lastPrice),
    markPrice: num(row.markPrice),
    fundingRate: num(row.fundingRate),
    openInterest: num(row.openInterest),
    ts: Date.now(),
  };
  cacheSet(cacheKey, snap, 25_000);
  return snap;
}

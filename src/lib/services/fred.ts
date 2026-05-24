/**
 * FRED macro series — DXY proxy + 10Y yield (server-side only).
 */

import { cacheGet, cacheSet, fetchJson, num } from "@/lib/services/shared/http";
import { env } from "@/lib/services/shared/env";

export type FredMacroSnapshot = Readonly<{
  dxyProxy: number | null;
  yield10y: number | null;
  ts: number;
}>;

async function fredLatest(seriesId: string, apiKey: string): Promise<number | null> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
  const json = await fetchJson<{
    observations?: Array<{ value?: string }>;
  }>(url, { retries: 1, timeoutMs: 15_000 });
  const v = json.observations?.[0]?.value;
  if (v === "." || v === undefined) return null;
  return num(v);
}

export async function fetchFredMacroSnapshot(): Promise<FredMacroSnapshot | null> {
  const apiKey = env("FRED_API_KEY");
  if (!apiKey) return null;

  const cacheKey = "fred:macro";
  const cached = cacheGet<FredMacroSnapshot>(cacheKey);
  if (cached) return cached;

  try {
    const [dxyProxy, yield10y] = await Promise.all([
      fredLatest("DTWEXBGS", apiKey),
      fredLatest("DGS10", apiKey),
    ]);
    const snap: FredMacroSnapshot = { dxyProxy, yield10y, ts: Date.now() };
    cacheSet(cacheKey, snap, 6 * 60 * 60_000);
    return snap;
  } catch {
    return null;
  }
}

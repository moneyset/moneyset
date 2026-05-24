/**
 * CoinGecko — global BTC reference (not primary tape).
 */

import { cacheGet, cacheSet, fetchJson, num } from "@/lib/services/shared/http";
import { env } from "@/lib/services/shared/env";

export type CoinGeckoBtcSnapshot = Readonly<{
  priceUsd: number | null;
  change24hPct: number | null;
  marketCapUsd: number | null;
  ts: number;
}>;

export async function fetchCoinGeckoBtcSnapshot(): Promise<CoinGeckoBtcSnapshot> {
  const cacheKey = "coingecko:btc";
  const cached = cacheGet<CoinGeckoBtcSnapshot>(cacheKey);
  if (cached) return cached;

  const apiKey = env("COINGECKO_API_KEY");
  const isProKey = Boolean(apiKey && !apiKey.startsWith("CG-"));
  const base = isProKey ? "https://pro-api.coingecko.com" : "https://api.coingecko.com";
  const url = `${base}/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;

  const headers: HeadersInit = { Accept: "application/json" };
  if (apiKey) {
    headers[isProKey ? "x-cg-pro-api-key" : "x-cg-demo-api-key"] = apiKey;
  }

  type CgPrice = { bitcoin?: { usd?: number; usd_24h_change?: number; usd_market_cap?: number } };
  const empty: CgPrice = {};
  const json = await fetchJson<CgPrice>(url, { init: { headers }, retries: 1 }).catch(() => empty);

  const btc = json.bitcoin ?? {};
  const snap: CoinGeckoBtcSnapshot = {
    priceUsd: num(btc.usd),
    change24hPct: num(btc.usd_24h_change),
    marketCapUsd: num(btc.usd_market_cap),
    ts: Date.now(),
  };
  cacheSet(cacheKey, snap, 60_000);
  return snap;
}

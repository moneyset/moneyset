/**
 * Coinalyze — derivatives positioning / liquidation context (when API key present).
 */

import { cacheGet, cacheSet, fetchJson, num } from "@/lib/services/shared/http";
import { env } from "@/lib/services/shared/env";

export type CoinalyzeSnapshot = Readonly<{
  symbol: string;
  openInterest: number | null;
  fundingRate: number | null;
  liquidationPressure: number | null;
  ts: number;
}>;

const BASE = "https://api.coinalyze.net/v1";

export async function fetchCoinalyzeSnapshot(symbol = "BTCUSDT"): Promise<CoinalyzeSnapshot | null> {
  const apiKey = env("COINALYZE_API_KEY");
  if (!apiKey) return null;

  const sym = symbol.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const cacheKey = `coinalyze:${sym}`;
  const cached = cacheGet<CoinalyzeSnapshot>(cacheKey);
  if (cached) return cached;

  const headers = { Accept: "application/json", api_key: apiKey };

  try {
    const funding = await fetchJson<unknown>(`${BASE}/funding-rate?symbols=${sym}.A`, {
      init: { headers },
      retries: 1,
    });
    const oi = await fetchJson<unknown>(`${BASE}/open-interest?symbols=${sym}.A`, {
      init: { headers },
      retries: 1,
    }).catch(() => null);

    const fundingRow = Array.isArray(funding) ? (funding[0] as Record<string, unknown>) : null;
    const oiRow = Array.isArray(oi) ? (oi[0] as Record<string, unknown>) : null;

    const fr = fundingRow ? num(fundingRow.value ?? fundingRow.funding_rate) : null;
    const oiVal = oiRow ? num(oiRow.value ?? oiRow.open_interest) : null;

    const snap: CoinalyzeSnapshot = {
      symbol: sym,
      openInterest: oiVal,
      fundingRate: fr,
      liquidationPressure: fr !== null && oiVal !== null ? Math.min(100, Math.abs(fr) * 1e6 + oiVal * 1e-8) : null,
      ts: Date.now(),
    };
    cacheSet(cacheKey, snap, 45_000);
    return snap;
  } catch {
    return null;
  }
}

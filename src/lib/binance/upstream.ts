import { fetchJson } from "@/lib/services/shared/http";

/** Maps legacy Bybit interval codes to Binance interval strings. */
export function intervalToBinance(iv: string): string {
  const v = iv.trim();
  switch (v) {
    case "1":
      return "1m";
    case "3":
      return "3m";
    case "5":
      return "5m";
    case "15":
      return "15m";
    case "60":
      return "1h";
    case "240":
      return "4h";
    case "1440":
    case "D":
      return "1d";
    default:
      if (/^[0-9]+m$/i.test(v)) return v;
      if (/^[0-9]+h$/i.test(v)) return v;
      if (/^[0-9]+d$/i.test(v)) return v;
      return "1h";
  }
}

export async function fetchBinanceJson<T>(url: string): Promise<T> {
  return fetchJson<T>(url, { timeoutMs: 12_000, retries: 2, backoffMs: 350 });
}

type RouteCacheEntry<T> = { value: T; ts: number };

const routeCache = new Map<string, RouteCacheEntry<unknown>>();

export function readBinanceRouteCache<T>(key: string, maxAgeMs: number): T | null {
  const hit = routeCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > maxAgeMs) return null;
  return hit.value as T;
}

export function writeBinanceRouteCache<T>(key: string, value: T): void {
  routeCache.set(key, { value, ts: Date.now() });
}

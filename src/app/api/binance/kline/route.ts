import { NextResponse } from "next/server";

import { BINANCE_FAPI_BASE } from "@/services/binance/constants";
import { fetchBinanceJson, intervalToBinance, readBinanceRouteCache, writeBinanceRouteCache } from "@/lib/binance/upstream";
import { applyRateLimit } from "@/lib/ops/api-guard-helpers";
import type { OhlcCandle } from "@/types/market";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_MS = 45_000;

export async function GET(req: Request) {
  const limited = applyRateLimit({ req, route: "binance/kline", limit: 40, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const { searchParams } = new URL(req.url);
    const symbol =
      searchParams.get("symbol")?.trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() || "BTCUSDT";
    const intervalSrc = searchParams.get("interval")?.trim() || "60";
    const interval = intervalToBinance(intervalSrc);

    const limitRaw = Number(searchParams.get("limit") ?? 280);
    const limit = Math.min(1500, Math.max(20, Number.isFinite(limitRaw) ? limitRaw : 280));

    const cacheKey = `kline:${symbol}:${interval}:${limit}`;
    const url = `${BINANCE_FAPI_BASE}/fapi/v1/klines?symbol=${symbol}&interval=${encodeURIComponent(interval)}&limit=${limit}`;

    try {
      const json = await fetchBinanceJson<unknown[]>(url);
      if (!Array.isArray(json)) {
        throw new Error("Binance kline invalid payload");
      }

      const candles: OhlcCandle[] = json
        .map((row): OhlcCandle | null => {
          if (!Array.isArray(row) || row.length < 6) return null;
          const tOpen = Number(row[0]);
          const open = Number(row[1]);
          const high = Number(row[2]);
          const low = Number(row[3]);
          const close = Number(row[4]);
          if (![tOpen, open, high, low, close].every((n) => Number.isFinite(n))) return null;
          return {
            time: Math.floor(tOpen / 1000),
            open,
            high,
            low,
            close,
          };
        })
        .filter((c): c is OhlcCandle => c !== null);

      candles.sort((a, b) => a.time - b.time);
      const payload = { ok: true as const, candles, stale: false as const };
      writeBinanceRouteCache(cacheKey, payload);
      return NextResponse.json(payload);
    } catch (upstreamError) {
      const cached = readBinanceRouteCache<{ ok: true; candles: OhlcCandle[] }>(cacheKey, CACHE_MS * 4);
      if (cached?.candles?.length) {
        return NextResponse.json({ ok: true, candles: cached.candles, stale: true });
      }
      throw upstreamError;
    }
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Binance kline error" },
      { status: 502 },
    );
  }
}

import { NextResponse } from "next/server";

import { readBinanceRouteCache, writeBinanceRouteCache } from "@/lib/binance/upstream";
import { applyRateLimit } from "@/lib/ops/api-guard-helpers";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { binancePremiumIndex } from "@/services/binance/rest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_MS = 45_000;

export async function GET(req: Request) {
  const limited = applyRateLimit({ req, route: "binance/premium-index", limit: 40, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const { searchParams } = new URL(req.url);
    const symbol =
      searchParams.get("symbol")?.trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() || "BTCUSDT";
    const cacheKey = `premium:${symbol}`;

    try {
      const data = await binancePremiumIndex(symbol);
      const payload = { ok: true as const, ...data, ts: Date.now(), stale: false as const };
      writeBinanceRouteCache(cacheKey, payload);
      return NextResponse.json(payload);
    } catch (upstreamError) {
      const cached = readBinanceRouteCache<{
        ok: true;
        markPrice: number | null;
        indexPrice: number | null;
        fundingRate: number | null;
        nextFundingTime: number | null;
        ts: number;
      }>(cacheKey, CACHE_MS * 4);
      if (cached) {
        const { ok: _ok, ...rest } = cached;
        return NextResponse.json({ ok: true, ...rest, stale: true });
      }
      throw upstreamError;
    }
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(e instanceof Error ? e.message : "Binance premiumIndex error") },
      { status: 502 },
    );
  }
}

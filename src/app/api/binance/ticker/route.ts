import { NextResponse } from "next/server";

import { applyRateLimit } from "@/lib/ops/api-guard-helpers";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { BINANCE_FAPI_BASE } from "@/services/binance/constants";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = applyRateLimit({ req, route: "binance/ticker", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const { searchParams } = new URL(req.url);
    const symbol =
      searchParams.get("symbol")?.trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() || "BTCUSDT";

    const url = `${BINANCE_FAPI_BASE}/fapi/v1/ticker/price?symbol=${symbol}`;
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as { price?: unknown };
    const lastPrice = typeof json.price === "string" ? Number(json.price) : Number(json.price);
    if (!res.ok || !Number.isFinite(lastPrice)) {
      return NextResponse.json({ ok: false, error: "Binance price fetch failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, lastPrice });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(e instanceof Error ? e.message : "Binance ticker error") },
      { status: 500 },
    );
  }
}

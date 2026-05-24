import { NextResponse } from "next/server";

import { fetchUnifiedMarketSnapshot } from "@/lib/intelligence/market-state-engine";
import { getCachedInference } from "@/lib/intelligence/inference-cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const market = await fetchUnifiedMarketSnapshot("BTCUSDT");
    const cached = getCachedInference();
    return NextResponse.json({
      ok: true,
      market,
      interpretation: cached?.interpretation ?? null,
      inferredAt: cached?.inferredAt ?? null,
      ts: Date.now(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "market-state error" },
      { status: 502 },
    );
  }
}

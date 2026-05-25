import { NextResponse } from "next/server";

import { loadRequestProfile, profileHasFullAccess } from "@/lib/access/api-guard";
import { fetchUnifiedMarketSnapshot } from "@/lib/intelligence/market-state-engine";
import { getCachedInference } from "@/lib/intelligence/inference-cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const profile = await loadRequestProfile(req);
    const full = profileHasFullAccess(profile);
    const market = await fetchUnifiedMarketSnapshot("BTCUSDT");
    const cached = getCachedInference();
    return NextResponse.json({
      ok: true,
      market,
      interpretation: full ? (cached?.interpretation ?? null) : null,
      inferredAt: full ? (cached?.inferredAt ?? null) : null,
      ts: Date.now(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "market-state error" },
      { status: 502 },
    );
  }
}

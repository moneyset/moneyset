import { NextResponse } from "next/server";

import { fetchUnifiedMarketSnapshot } from "@/lib/intelligence/market-state-engine";
import { refreshMarketStateOnly } from "@/lib/intelligence/orchestrator";
import { env } from "@/lib/services/shared/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const secret = env("CRON_SECRET");
  if (!secret) return process.env.NODE_ENV === "development";
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Scheduled market refresh — no AI. Wired via vercel.json cron.
 *
 * TEMPORARY (Vercel Hobby): vercel.json runs this once daily (`0 0 * * *`).
 * Production cadence: every 5 minutes (`*/5 * * * *`) when on Vercel Pro or external scheduler.
 */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const market = await fetchUnifiedMarketSnapshot("BTCUSDT");
    const bundle = await refreshMarketStateOnly();
    return NextResponse.json({
      ok: true,
      signature: market.signature,
      bundleUpdated: Boolean(bundle),
      ts: Date.now(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "cron refresh error" },
      { status: 502 },
    );
  }
}

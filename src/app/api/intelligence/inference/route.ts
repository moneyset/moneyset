import { NextResponse } from "next/server";

import { loadRequestProfile, profileHasFullAccess } from "@/lib/access/api-guard";
import { runIntelligenceOrchestrator } from "@/lib/intelligence/orchestrator";
import { getCachedInference, shouldRunHeavyInference } from "@/lib/intelligence/inference-cache";
import { fetchUnifiedMarketSnapshot } from "@/lib/intelligence/market-state-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  locale?: "en" | "ru";
  derived?: unknown;
  latent?: unknown;
  scenarioBook?: unknown;
  agentLattice?: unknown[];
  operationalLog?: unknown[];
  history?: unknown[];
  leadScenarioId?: string | null;
  force?: boolean;
};

/**
 * POST — run orchestrator when simulation context provided (cron / admin).
 * GET — return cached bundle or refresh market-only.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const refreshOnly = url.searchParams.get("refresh") === "market";
  const profile = await loadRequestProfile(req);
  const full = profileHasFullAccess(profile);

  try {
    if (refreshOnly) {
      const market = await fetchUnifiedMarketSnapshot("BTCUSDT");
      const cached = getCachedInference();
      return NextResponse.json({
        ok: true,
        market,
        cached: full ? (cached ?? null) : null,
      });
    }
    if (!full) {
      return NextResponse.json({ ok: false, error: "Premium access required" }, { status: 403 });
    }
    const cached = getCachedInference();
    if (cached) {
      return NextResponse.json({ ok: true, bundle: cached, source: "cache" });
    }
    const market = await fetchUnifiedMarketSnapshot("BTCUSDT");
    return NextResponse.json({
      ok: true,
      market,
      interpretation: null,
      source: "market-only",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "inference GET error" },
      { status: 502 },
    );
  }
}

export async function POST(req: Request) {
  const profile = await loadRequestProfile(req);
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const isCron = Boolean(cronSecret && authHeader === cronSecret);
  if (!isCron && !profileHasFullAccess(profile)) {
    return NextResponse.json({ ok: false, error: "Premium access required" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as Body;
    const market = await fetchUnifiedMarketSnapshot("BTCUSDT");

    if (!body.derived || !body.latent || !body.scenarioBook) {
      if (!shouldRunHeavyInference(market.signature, body.force)) {
        const cached = getCachedInference();
        return NextResponse.json({ ok: true, bundle: cached, source: "cache-skip" });
      }
      return NextResponse.json({
        ok: true,
        market,
        message: "Provide simulation context for full orchestration",
      });
    }

    const bundle = await runIntelligenceOrchestrator({
      locale: body.locale ?? "en",
      derived: body.derived as never,
      latent: body.latent as never,
      scenarioBook: body.scenarioBook as never,
      agentLattice: (body.agentLattice ?? []) as never,
      operationalLog: (body.operationalLog ?? []) as never,
      history: (body.history ?? []) as never,
      leadScenarioId: (body.leadScenarioId ?? null) as never,
      forceInference: body.force ?? false,
      runAi: true,
    });

    return NextResponse.json({ ok: true, bundle, source: "orchestrator" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "inference POST error" },
      { status: 502 },
    );
  }
}

import { NextResponse } from "next/server";

import { loadRequestProfile, profileHasFullAccess } from "@/lib/access/api-guard";
import { deriveDailyBriefDeterministic, generateDailyBrief } from "@/lib/intelligence/daily-brief";
import { runIntelligencePipeline } from "@/lib/intelligence/pipeline/run-pipeline";
import { fetchUnifiedMarketSnapshot } from "@/lib/intelligence/market-state-engine";
import { buildStructuredIntelligenceContext } from "@/lib/intelligence/structured-context";
import { cacheGet, cacheSet } from "@/lib/services/shared/http";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { evolveLatent, deriveFromLatent } from "@/lib/simulation/engine-evolve";
import { deriveScenarioEngineBook } from "@/lib/simulation/scenario-engine";
import type { UiLocale } from "@/store/ui-prefs-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BRIEF_TTL_MS = 6 * 60 * 60_000;

type BriefBody = {
  locale?: UiLocale;
};

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultDesk(locale: UiLocale) {
  const latent = evolveLatent(0);
  const derived = deriveFromLatent(latent, 0);
  const scenarioBook = deriveScenarioEngineBook({ tick: 0, latent, derived, locale });
  return { latent, derived, scenarioBook };
}

export async function GET() {
  const key = `daily-brief:${dayKey()}`;
  const hit = cacheGet<ReturnType<typeof deriveDailyBriefDeterministic>>(key);
  if (hit) return NextResponse.json({ ok: true, brief: hit, cached: true });
  return NextResponse.json({ ok: true, brief: null, cached: false });
}

export async function POST(req: Request) {
  const profile = await loadRequestProfile(req);
  if (!profileHasFullAccess(profile)) {
    return NextResponse.json({ ok: false, error: "Premium access required" }, { status: 403 });
  }

  const locale: UiLocale =
    ((await req.json().catch(() => ({}))) as BriefBody).locale === "ru" ? "ru" : "en";

  try {
    const key = `daily-brief:${dayKey()}:${locale}`;
    const hit = cacheGet<Awaited<ReturnType<typeof generateDailyBrief>>>(key);
    if (hit) return NextResponse.json({ ok: true, brief: hit, cached: true });

    const market = await fetchUnifiedMarketSnapshot("BTCUSDT");
    const { latent, derived, scenarioBook } = defaultDesk(locale);

    const pipeline = runIntelligencePipeline({
      locale,
      tape: market.tape,
      unified: market,
      derived,
      latent,
      history: [],
      scenarioBook,
      simTick: 0,
      orchestrator: null,
      aiAgents: [],
    });

    const primaryScenario = scenarioBook.cards[0]?.pathConvictionLine ?? "Base structural path";

    const ctx = buildStructuredIntelligenceContext({
      market,
      derived,
      latent,
      scenarioBook,
      agentLattice: [],
      operationalLog: [],
    });

    const brief = await generateDailyBrief({
      locale,
      pipeline,
      primaryScenarioTitle: primaryScenario,
      contextBlock: ctx.combined,
    });

    cacheSet(key, brief, BRIEF_TTL_MS);
    return NextResponse.json({ ok: true, brief, cached: false });
  } catch (e) {
    const { latent, derived, scenarioBook } = defaultDesk(locale);
    const pipeline = runIntelligencePipeline({
      locale,
      tape: {
        symbol: "BTCUSDT",
        price: null,
        ts: Date.now(),
        changePercent24h: null,
        markPrice: null,
        fundingRate: null,
        nextFundingTime: null,
        openInterest: null,
        realizedVol: null,
        momentum: null,
        connection: "disconnected",
        lastWsTs: null,
        lastRestTs: null,
        error: null,
      },
      unified: null,
      derived,
      latent,
      history: [],
      scenarioBook,
      simTick: 0,
      orchestrator: null,
      aiAgents: [],
    });
    const brief = deriveDailyBriefDeterministic(
      locale,
      pipeline,
      scenarioBook.cards[0]?.pathConvictionLine ?? "Base structural path",
    );
    return NextResponse.json({
      ok: true,
      brief,
      error: sanitizeApiError(e instanceof Error ? e.message : "brief failed"),
      failsafe: true,
    });
  }
}

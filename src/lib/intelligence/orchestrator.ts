/**
 * Intelligence orchestrator — periodic / event-driven heavy reasoning.
 */

import { deriveExecutionInterpretation } from "@/lib/execution/derive-execution-interpretation";
import { deriveExecutionLayerSurface } from "@/lib/execution/derive-execution-layer";
import { fetchUnifiedMarketSnapshot } from "@/lib/intelligence/market-state-engine";
import { buildStructuredIntelligenceContext } from "@/lib/intelligence/structured-context";
import {
  getCachedInference,
  setCachedInference,
  shouldRunHeavyInference,
} from "@/lib/intelligence/inference-cache";
import type { CachedInferenceBundle, ExecutionInterpretationOutput } from "@/lib/intelligence/types";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import type { ScenarioEngineBook } from "@/lib/simulation/scenario-engine";
import type {
  AgentLatticeRow,
  CognitiveSnapshot,
  OperationalLogEntry,
} from "@/lib/simulation/cognition-types";
import type { ScenarioId } from "@/lib/simulation/scenario-engine";
import type { UiLocale } from "@/store/ui-prefs-store";
import { deepSeekChat } from "@/lib/services/deepseek";
import { env } from "@/lib/services/shared/env";

export type OrchestratorInput = Readonly<{
  locale: UiLocale;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  scenarioBook: ScenarioEngineBook;
  agentLattice: AgentLatticeRow[];
  operationalLog: OperationalLogEntry[];
  history: readonly CognitiveSnapshot[];
  leadScenarioId: ScenarioId | null;
  forceInference?: boolean;
  runAi?: boolean;
}>;

function interpretationFromSurface(
  locale: UiLocale,
  surface: ReturnType<typeof deriveExecutionLayerSurface>,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  scenarioBook: ScenarioEngineBook,
): ExecutionInterpretationOutput {
  const bundle = deriveExecutionInterpretation({
    locale,
    surface,
    derived,
    latent,
    leadScenario: scenarioBook.cards[0] ?? null,
  });
  return {
    posture: bundle.currentPosture,
    acceptanceZone: bundle.acceptanceZone.line,
    defensiveZone: bundle.defensiveZone.line,
    executionBias: bundle.executionBias,
    tacticalFramework: bundle.tacticalFramework.map((z) => `${z.title} · ${z.rangeLabel} — ${z.framing}`),
    scenarioImplication: bundle.scenarioImplication,
    rationale: bundle.postureRationale,
  };
}

async function optionalDeepSeekSummary(context: string): Promise<string | null> {
  if (!env("DEEPSEEK_API_KEY")) return null;
  try {
    const raw = await deepSeekChat({
      temperature: 0.2,
      max_tokens: 320,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an institutional BTC execution intelligence analyst. Output JSON only: {posture, acceptance, defensive, bias, scenario}. Probabilistic framing. No buy/sell. No price targets as trade calls.",
        },
        { role: "user", content: context.slice(0, 6000) },
      ],
    });
    return raw;
  } catch {
    return null;
  }
}

export async function runIntelligenceOrchestrator(
  input: OrchestratorInput,
): Promise<CachedInferenceBundle> {
  const market = await fetchUnifiedMarketSnapshot("BTCUSDT");

  const surface = deriveExecutionLayerSurface({
    locale: input.locale,
    market: market.tape,
    derived: input.derived,
    latent: input.latent,
    history: input.history,
    leadCard: input.scenarioBook.cards[0] ?? null,
  });

  const interpretation = interpretationFromSurface(
    input.locale,
    surface,
    input.derived,
    input.latent,
    input.scenarioBook,
  );

  const cached = getCachedInference();
  const runHeavy =
    input.runAi !== false &&
    shouldRunHeavyInference(market.signature, input.forceInference ?? false);

  let aiOrchestrator: unknown | null = cached?.aiOrchestrator ?? null;

  if (runHeavy) {
    const ctx = buildStructuredIntelligenceContext({
      market,
      derived: input.derived,
      latent: input.latent,
      scenarioBook: input.scenarioBook,
      agentLattice: input.agentLattice,
      operationalLog: input.operationalLog,
    });
    aiOrchestrator = await optionalDeepSeekSummary(ctx.combined);
  }

  const bundle: CachedInferenceBundle = {
    market,
    interpretation,
    aiOrchestrator,
    inferredAt: Date.now(),
    marketSignature: market.signature,
  };

  setCachedInference(bundle);
  return bundle;
}

/** Lightweight refresh — market only, reuses deterministic interpretation path. */
export async function refreshMarketStateOnly(): Promise<CachedInferenceBundle | null> {
  const prev = getCachedInference();
  const market = await fetchUnifiedMarketSnapshot("BTCUSDT");
  if (!prev) return null;
  const next: CachedInferenceBundle = {
    ...prev,
    market,
    marketSignature: market.signature,
    inferredAt: Date.now(),
  };
  setCachedInference(next);
  return next;
}

/**
 * Intelligence pipeline: DATA → NORMALIZATION → AGENT ANALYSIS → POSTURE → EXECUTION → UI
 */

import { deriveExecutionLayerSurface } from "@/lib/execution/derive-execution-layer";
import type { AgentOutput, OrchestratorOutput } from "@/lib/openrouter/prompts";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { CognitiveSnapshot, LatentDrivers } from "@/lib/simulation/cognition-types";
import type { ScenarioEngineBook } from "@/lib/simulation/scenario-engine";
import type { UnifiedMarketSnapshot } from "@/lib/intelligence/types";
import type { NormalizedMarketState } from "@/types/market-state";
import type { UiLocale } from "@/store/ui-prefs-store";

import { normalizeIntelligenceInput } from "./normalize";
import { synthesizeMarketPosture } from "./posture-synthesis";
import type { IntelligencePipelineResult } from "./types";

export function runIntelligencePipeline(args: {
  locale: UiLocale;
  tape: NormalizedMarketState;
  unified: UnifiedMarketSnapshot | null;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  history: readonly CognitiveSnapshot[];
  scenarioBook: ScenarioEngineBook;
  simTick: number;
  orchestrator: OrchestratorOutput | null;
  aiAgents: readonly AgentOutput[];
}): IntelligencePipelineResult {
  const leadCard = args.scenarioBook.cards[0] ?? null;

  const surface = deriveExecutionLayerSurface({
    locale: args.locale,
    market: args.tape,
    derived: args.derived,
    latent: args.latent,
    history: args.history,
    leadCard,
  });

  const normalized = normalizeIntelligenceInput({
    locale: args.locale,
    tape: args.tape,
    unified: args.unified,
    derived: args.derived,
    simLatent: args.latent,
    surface,
    simTick: args.simTick,
  });

  const posture = synthesizeMarketPosture({
    locale: args.locale,
    derived: normalized.derived,
    latent: normalized.blendedLatent,
    agentLattice: normalized.agentLattice,
    history: args.history,
    surface,
    leadCard,
    orchestrator: args.orchestrator,
    aiAgents: args.aiAgents,
    domainAnalyses: normalized.domainAnalyses,
  });

  const hasAi = args.orchestrator !== null || args.aiAgents.length > 0;

  return {
    posture,
    domainAnalyses: normalized.domainAnalyses,
    executionImplication: posture.executionImplication,
    signature: normalized.signature,
    source: hasAi ? "deterministic+ai" : "deterministic",
    aiAvailable: hasAi,
    orchestrator: args.orchestrator,
    aiAgents: args.aiAgents,
    inferredAt: Date.now(),
  };
}

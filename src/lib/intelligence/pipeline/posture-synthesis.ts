/**
 * Posture synthesis — single source of truth combining agent domains + execution surface.
 */

import {
  deriveMarketPosture,
  type MarketPostureSnapshot,
} from "@/lib/intelligence/market-posture-engine";
import type { ExecutionLayerSurface } from "@/lib/execution/derive-execution-layer";
import type { AgentOutput, OrchestratorOutput } from "@/lib/openrouter/prompts";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { AgentLatticeRow, CognitiveSnapshot, LatentDrivers } from "@/lib/simulation/cognition-types";
import type { ScenarioEngineCard } from "@/lib/simulation/scenario-engine";
import type { UiLocale } from "@/store/ui-prefs-store";

import { deriveExecutionImplication } from "./execution-implication";
import type { AgentDomainAnalysis } from "./types";

export function synthesizeMarketPosture(args: {
  locale: UiLocale;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  agentLattice: readonly AgentLatticeRow[];
  history: readonly CognitiveSnapshot[];
  surface: ExecutionLayerSurface;
  leadCard: ScenarioEngineCard | null;
  orchestrator: OrchestratorOutput | null;
  aiAgents?: readonly AgentOutput[];
  domainAnalyses?: readonly AgentDomainAnalysis[];
}): MarketPostureSnapshot & { executionImplication: string } {
  const posture = deriveMarketPosture({
    locale: args.locale,
    derived: args.derived,
    latent: args.latent,
    agentLattice: args.agentLattice,
    history: args.history,
    surface: args.surface,
    leadCard: args.leadCard,
    orchestrator: args.orchestrator,
    aiAgents: args.aiAgents,
  });

  const executionImplication = deriveExecutionImplication({
    locale: args.locale,
    derived: args.derived,
    surface: args.surface,
    leadCard: args.leadCard,
    bias: posture.executionBias,
    orchestrator: args.orchestrator,
  });

  return { ...posture, executionImplication };
}

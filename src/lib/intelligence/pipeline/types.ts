import type { MarketPostureSnapshot } from "@/lib/intelligence/market-posture-engine";
import type { UnifiedMarketSnapshot } from "@/lib/intelligence/types";
import type { AgentOutput, OrchestratorOutput } from "@/lib/openrouter/prompts";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { AgentLatticeRow, LatentDrivers } from "@/lib/simulation/cognition-types";
import type { NormalizedMarketState } from "@/types/market-state";

/** Six existing agent domains — structure synthesized into flow/execution reads. */
export type AgentDomainId = "structure" | "liquidity" | "flow" | "sentiment" | "risk" | "macro";

export type AgentDomainAnalysis = Readonly<{
  id: AgentDomainId;
  headline: string;
  read: string;
  confidencePct: number;
  factors: readonly string[];
}>;

export type NormalizedIntelligenceInput = Readonly<{
  tape: NormalizedMarketState;
  unified: UnifiedMarketSnapshot | null;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  blendedLatent: LatentDrivers;
  agentLattice: readonly AgentLatticeRow[];
  domainAnalyses: readonly AgentDomainAnalysis[];
  signature: string;
}>;

export type IntelligencePipelineResult = Readonly<{
  posture: MarketPostureSnapshot;
  domainAnalyses: readonly AgentDomainAnalysis[];
  executionImplication: string;
  signature: string;
  source: "deterministic" | "deterministic+ai";
  aiAvailable: boolean;
  orchestrator: OrchestratorOutput | null;
  aiAgents: readonly AgentOutput[];
  inferredAt: number;
}>;

export type DailyBrief = Readonly<{
  marketPosture: string;
  keyRisk: string;
  primaryScenario: string;
  executionImplication: string;
  supportingReasons: readonly [string, string, string];
  generatedAt: number;
  source: "deterministic" | "deepseek";
}>;

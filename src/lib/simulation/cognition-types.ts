/** Cognitive simulation & operational log — modular types (no persistence / no APIs). */

export type LogPriority = "informational" | "important" | "elevated" | "critical";

export type LogEntryType =
  | "FLOW"
  | "RISK"
  | "CONSENSUS"
  | "REGIME"
  | "SENTIMENT"
  | "VOLATILITY"
  | "LIQUIDITY"
  | "MACRO"
  | "SCENARIO"
  | "ORCHESTRATOR";

export type MarketPhaseId =
  | "stable_expansion"
  | "controlled_trend"
  | "overheated_momentum"
  | "fragile_continuation"
  | "liquidity_compression"
  | "volatility_expansion"
  | "distribution_phase"
  | "panic_risk"
  | "regime_transition";

export type ConsensusEvolutionLabel =
  | "consensus_strengthening"
  | "consensus_weakening"
  | "divergence_increasing"
  | "risk_layer_escalating"
  | "macro_dominance_rising";

export type DangerBandId = "calm" | "moderate" | "elevated" | "dangerous" | "critical";

export type VolatilityTone = "compressing" | "neutral" | "expanding";

/** Dynamic read on structural path weight — not a retail probability score. */
export type ScenarioEvolutionState =
  | "strengthening"
  | "weakening"
  | "stabilizing"
  | "deteriorating"
  | "transitioning"
  | "rebuilding";

export type DominantHeadlineKey =
  | "liquidity_stressed"
  | "controlled_expansion"
  | "fragile_continuation"
  | "momentum_exhaustion_risk"
  | "overheated_participation"
  | "trend_intact"
  | "bullish_fragile"
  | "defensive_tilt";

export type MainRiskKey = "forced_move" | "reversal_vol" | "reversal_fade";

export type TopScenarioWireId =
  | "Controlled Bullish Expansion"
  | "Liquidity Sweep Before Continuation"
  | "Structural Breakdown Risk"
  | "Volatility Compression";

/** Semantic payload for operational log — localized at render time. */
export type OpLogMessage =
  | { kind: "regime_phase"; from: MarketPhaseId; to: MarketPhaseId }
  | { kind: "consensus"; consensus: ConsensusEvolutionLabel }
  | { kind: "danger_shift"; prev: DangerBandId; next: DangerBandId; agingFading?: boolean }
  | { kind: "vol_tone"; tone: VolatilityTone; prev: VolatilityTone }
  | { kind: "liquidity_shock" }
  | { kind: "flow_extension" }
  | { kind: "macro_shift" }
  | { kind: "scenario_rebalance"; scenarioId: TopScenarioWireId; prob: number }
  | { kind: "orchestrator_weights"; phase: MarketPhaseId }
  | { kind: "sentiment_overheat" }
  | { kind: "bootstrap" }
  | { kind: "mkt_vol"; band: "compressing" | "neutral" | "expanding" }
  | { kind: "mkt_momentum"; band: "pos" | "neg" | "neutral" }
  | { kind: "mkt_funding" }
  | { kind: "mkt_dislocation" }
  | { kind: "ai_orchestrator"; headline: string; summary: string; whyMatters?: string };

export type OperationalLogEntry = {
  id: string;
  simTick: number;
  simulatedClockLabel: string;
  entryType: LogEntryType;
  priority: LogPriority;
  headline: string;
  summary: string;
  whyMatters?: string;
  agingNote?: string;
  message?: OpLogMessage;
};

export type LatentDrivers = {
  positioningPressure: number;
  liquidityStructuralStress: number;
  volatilityImpulse: number;
  sentimentThermal: number;
  macroLiquidityBackdrop: number;
};

export type AgentLatticeRole =
  | "Macro"
  | "Flow"
  | "Risk"
  | "Sentiment"
  | "Liquidity"
  | "Orchestrator";

export type AgentLatticeRow = {
  role: AgentLatticeRole;
  confidencePct: number;
  alignmentLabel: string;
  divergenceLabel: string;
  stateLabel: string;
  analyticLine: string;
  accent: "cognition" | "flow" | "danger" | "sentiment" | "consensus" | "warning";
};

export type AgentHistoryPoint = {
  simTick: number;
  macro: number;
  flow: number;
  liquidity: number;
  risk: number;
  sentiment: number;
  orchestrator: number;
  divergenceIndex: number;
};

export type CognitiveSnapshot = {
  simTick: number;
  simulatedClockLabel: string;
  phase: MarketPhaseId;
  consensus: ConsensusEvolutionLabel;
  dangerBand: DangerBandId;
  /** For compact in-app trend read — not persisted to archive v1. */
  dangerScore: number;
  divergenceIndex: number;
  consensusSpreadPct: number;
  volatilityImpulse: number;
  positioningPressure: number;
  liquidityStructuralStress: number;
  /** Lead path weight at capture — for temporal scenario momentum. */
  leadScenarioProb: number;
};

export type DominantSurface = {
  headlineKey: DominantHeadlineKey;
  liquidity: number;
  leverage: number;
};

export type ScenarioRiskLevel = "low" | "medium" | "elevated" | "high";
export type ScenarioConfidenceLevel = "low" | "medium" | "high";

export type TopScenarioSurface = {
  scenarioId: TopScenarioWireId;
  probabilityPct: number;
};

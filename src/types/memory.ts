import type { DangerBandId, MarketPhaseId, OperationalLogEntry } from "@/lib/simulation/cognition-types";
import type { ConsensusEvolutionLabel } from "@/lib/simulation/cognition-types";
import type { MarketRegimeId } from "@/lib/intelligence/market-index-engine";
import type { NormalizedMarketState } from "@/types/market-state";
import type { ScenarioId } from "@/lib/simulation/scenario-engine";

export type RegimeTransitionKind =
  | "risk_escalation"
  | "risk_easing"
  | "structural_break"
  | "recovery_attempt"
  | "failed_continuation"
  | "consensus_fracture"
  | "scenario_rotation"
  | "regime_shift"
  | "stable_hold";

export type MemoryPeriodId = "today" | "yesterday" | "week" | "month" | "all";

export type MemorySnapshot = Readonly<{
  id: string;
  ts: number; // ms
  symbol: string;
  /** Market */
  price: number | null;
  realizedVol: number | null;
  momentum: number | null;
  fundingRate: number | null;
  openInterest: number | null;
  connection: NormalizedMarketState["connection"];

  /** Cognition state at capture time */
  phase: MarketPhaseId;
  dangerBand: DangerBandId;
  dangerScore: number;
  consensus: ConsensusEvolutionLabel;
  divergenceIndex: number;

  /** Scenarios (top N) — ids for localized titles at display time */
  scenarios: Array<{ id: ScenarioId; p: number }>;

  /** Most recent orchestrator line (if available) */
  orchestratorLine?: string;

  /** A few recent operational entries (high signal) */
  ops: Array<
    Pick<OperationalLogEntry, "entryType" | "priority" | "headline" | "summary" | "simulatedClockLabel" | "message">
  >;

  /** Phase 7 — enriched memory envelope (optional for legacy snapshots) */
  regimeId?: MarketRegimeId;
  regimeLabel?: string;
  intelligenceBullets?: readonly string[];
  transitionKind?: RegimeTransitionKind;
  executionPosture?: string;
  primaryRiskLine?: string;
  leadScenarioId?: ScenarioId;
  liquidityStress?: number;
  participationPressure?: number;
}>;

export type JournalDirection = "long" | "short" | "flat" | "other";

/** Desk-style transition lines auto-captured at save time (vs prior snapshot). */
export type JournalCognitiveLayers = Readonly<{
  stateShift: string;
  structuralChange: string;
  postureChange: string;
  invalidationOrConfirmation: string;
  scenarioEvolution: string;
}>;

/** Structured intelligence record — replayable desk archive per entry. */
export type JournalIntelligenceRecord = Readonly<{
  regimeState: string;
  scenarioState: string;
  primaryRisks: string;
  structuralInterpretation: string;
  executionImplication: string;
  intelligenceSummary: readonly string[];
}>;

export type JournalEntry = Readonly<{
  id: string;
  ts: number;
  symbol: string;
  direction: JournalDirection;
  entryPrice?: number;
  exitPrice?: number;
  sizeNote?: string;

  reasoning: string;
  emotion?: string;
  confidencePct?: number;
  riskPerception?: "calm" | "moderate" | "elevated" | "dangerous";
  outcome?: "win" | "loss" | "scratch" | "open";
  lessons?: string;

  /** Link to cognition snapshot id captured at entry time */
  snapshotId?: string;

  /** Derived interpretation deltas at capture — cognitive replay payload */
  cognitiveLayers?: JournalCognitiveLayers;

  /** Phase 7 — structured institutional memory at capture */
  intelligenceRecord?: JournalIntelligenceRecord;
}>;

export type InsightReport = Readonly<{
  id: string;
  ts: number;
  title: string;
  summary: string;
  bullets: string[];
  scope: "journal" | "cognition" | "combined";
}>;


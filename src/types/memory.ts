import type { DangerBandId, MarketPhaseId, OperationalLogEntry } from "@/lib/simulation/cognition-types";
import type { ConsensusEvolutionLabel } from "@/lib/simulation/cognition-types";
import type { NormalizedMarketState } from "@/types/market-state";
import type { ScenarioId } from "@/lib/simulation/scenario-engine";

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
}>;

export type InsightReport = Readonly<{
  id: string;
  ts: number;
  title: string;
  summary: string;
  bullets: string[];
  scope: "journal" | "cognition" | "combined";
}>;


import type { ConsensusEvolutionLabel, DangerBandId, MarketPhaseId } from "@/lib/simulation/cognition-types";

export const PHASE_LABEL: Record<MarketPhaseId, string> = {
  stable_expansion: "Stable",
  controlled_trend: "Trend",
  overheated_momentum: "Overheat",
  fragile_continuation: "Fragile",
  liquidity_compression: "Tight range",
  volatility_expansion: "Vol ↑",
  distribution_phase: "Distribution",
  panic_risk: "Disorderly",
  regime_transition: "Transition",
};

export function phaseSummary(id: MarketPhaseId): string {
  const summaries: Record<MarketPhaseId, string> = {
    stable_expansion: "Trend orderly.",
    controlled_trend: "Trend stable.",
    overheated_momentum: "Participation hot.",
    fragile_continuation: "Trend unstable.",
    liquidity_compression: "Range tight.",
    volatility_expansion: "Vol widening.",
    distribution_phase: "Supply active.",
    panic_risk: "Tape disorderly.",
    regime_transition: "Transition. Coherence down.",
  };
  return summaries[id];
}

export const CONSENSUS_LABEL_DISPLAY: Record<ConsensusEvolutionLabel, string> = {
  consensus_strengthening: "Alignment ↑",
  consensus_weakening: "Alignment ↓",
  divergence_increasing: "Split ↑",
  risk_layer_escalating: "Stress leads",
  macro_dominance_rising: "Macro leads",
};

export const CONSENSUS_SUMMARY: Record<ConsensusEvolutionLabel, string> = {
  consensus_strengthening: "Confirmation up.",
  consensus_weakening: "Confirmation down.",
  divergence_increasing: "Inputs conflict.",
  risk_layer_escalating: "Stress dominates.",
  macro_dominance_rising: "Macro impulse.",
};

export const DANGER_LABEL: Record<DangerBandId, string> = {
  calm: "Controlled",
  moderate: "Watch",
  elevated: "Elevated",
  dangerous: "Danger",
  critical: "Critical",
};

export function dangerSignals(band: DangerBandId): string[] {
  if (band === "calm") return ["Balance intact", "Orderly flow"];
  if (band === "moderate") return ["Tail risk rising", "Leverage watch"];
  if (band === "elevated") return ["Sweep risk", "Positioning tight"];
  if (band === "dangerous") return ["Forced flows", "Thin liquidity"];
  return ["Cascade risk", "Disorderly conditions"];
}

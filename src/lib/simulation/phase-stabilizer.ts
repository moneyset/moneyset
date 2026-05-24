import type { MarketPhaseId } from "@/lib/simulation/cognition-types";

/** Require two consecutive agreeing observations before committing phase — avoids jitter spam. */

export type PhaseStabilizerState = {
  committed: MarketPhaseId;
  candidate: MarketPhaseId;
  agreeTicks: number;
};

export function initPhaseStabilizer(initialCommitted: MarketPhaseId): PhaseStabilizerState {
  return {
    committed: initialCommitted,
    candidate: initialCommitted,
    agreeTicks: 2,
  };
}

export function updatePhaseStabilizer(state: PhaseStabilizerState, observed: MarketPhaseId): PhaseStabilizerState {
  if (observed === state.candidate) {
    const agreeTicks = state.agreeTicks + 1;
    if (agreeTicks >= 2 && observed !== state.committed) {
      return { committed: observed, candidate: observed, agreeTicks: 0 };
    }
    return { ...state, agreeTicks };
  }

  return { committed: state.committed, candidate: observed, agreeTicks: 1 };
}

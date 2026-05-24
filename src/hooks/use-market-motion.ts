"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { deriveMarketMotionBundle, type MarketMotionBundle } from "@/lib/motion/market-motion-engine";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";

export function useMarketMotion(breathPhase: number): MarketMotionBundle {
  const sim = useCognitionSimulationStore(
    useShallow((s) => ({
      simTick: s.simTick,
      derived: s.derived,
      latent: s.latent,
      history: s.history,
      prevDangerBand: s.prevDangerBand,
      prevVolTone: s.prevVolTone,
      prevConsensus: s.prevConsensus,
      prevCommittedPhase: s.prevCommittedPhase,
    })),
  );

  return useMemo(
    () =>
      deriveMarketMotionBundle({
        simTick: sim.simTick,
        derived: sim.derived,
        latent: sim.latent,
        history: sim.history,
        breathPhase,
        prevDangerBand: sim.prevDangerBand,
        prevVolTone: sim.prevVolTone,
        prevConsensus: sim.prevConsensus,
        prevPhase: sim.prevCommittedPhase,
      }),
    [sim, breathPhase],
  );
}

"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { deriveMemoryConstellationBundle } from "@/lib/intelligence/memory-constellation-engine";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function useMemoryConstellation() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const sim = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      history: s.history,
      agentLattice: s.agentLattice,
      agentHistory: s.agentHistory,
      scenarioBook: s.scenarioBook,
      simTick: s.simTick,
    })),
  );

  return useMemo(
    () =>
      deriveMemoryConstellationBundle({
        locale,
        latent: sim.latent,
        derived: sim.derived,
        history: sim.history,
        agentLattice: sim.agentLattice,
        agentHistory: sim.agentHistory,
        scenarioCards: sim.scenarioBook.cards,
        simTick: sim.simTick,
      }),
    [locale, sim],
  );
}

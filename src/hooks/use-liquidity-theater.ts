"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { deriveLiquidityTheaterBundle } from "@/lib/intelligence/liquidity-topology-theater";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function useLiquidityTheater() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const sim = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      history: s.history,
      agentHistory: s.agentHistory,
      agentLattice: s.agentLattice,
      scenarioBook: s.scenarioBook,
      simTick: s.simTick,
    })),
  );

  return useMemo(
    () =>
      deriveLiquidityTheaterBundle({
        locale,
        latent: sim.latent,
        derived: sim.derived,
        history: sim.history,
        agentHistory: sim.agentHistory,
        agentLattice: sim.agentLattice,
        scenarioCards: sim.scenarioBook.cards,
        simTick: sim.simTick,
      }),
    [locale, sim],
  );
}

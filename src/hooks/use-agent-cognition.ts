"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { deriveAgentCognitionBundle } from "@/lib/agents/agent-cognition-engine";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function useAgentCognition() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const sim = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      agentLattice: s.agentLattice,
      agentHistory: s.agentHistory,
      history: s.history,
      scenarioBook: s.scenarioBook,
      simTick: s.simTick,
    })),
  );

  return useMemo(
    () =>
      deriveAgentCognitionBundle({
        locale,
        latent: sim.latent,
        derived: sim.derived,
        agentLattice: sim.agentLattice,
        agentHistory: sim.agentHistory,
        history: sim.history,
        scenarioCards: sim.scenarioBook.cards,
        simTick: sim.simTick,
      }),
    [locale, sim],
  );
}

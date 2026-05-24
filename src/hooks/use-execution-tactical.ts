"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { deriveExecutionTacticalBundle } from "@/lib/execution/execution-tactical-engine";
import { useExecutionSurface } from "@/hooks/use-execution-surface";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function useExecutionTactical() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const surface = useExecutionSurface();
  const sim = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      history: s.history,
      scenarioBook: s.scenarioBook,
      topScenario: s.topScenario,
      simTick: s.simTick,
      agentLattice: s.agentLattice,
      agentHistory: s.agentHistory,
    })),
  );

  return useMemo(
    () =>
      deriveExecutionTacticalBundle({
        locale,
        surface,
        derived: sim.derived,
        latent: sim.latent,
        history: sim.history,
        scenarioBook: sim.scenarioBook,
        leadScenarioId: sim.topScenario.scenarioId,
        simTick: sim.simTick,
        agentLattice: sim.agentLattice,
        agentHistory: sim.agentHistory,
      }),
    [locale, surface, sim],
  );
}

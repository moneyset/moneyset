"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { deriveExecutionTerrainBundle } from "@/lib/execution/execution-terrain-engine";
import { useExecutionSurface } from "@/hooks/use-execution-surface";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function useExecutionTerrain() {
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
    })),
  );

  return useMemo(
    () =>
      deriveExecutionTerrainBundle({
        locale,
        surface,
        derived: sim.derived,
        latent: sim.latent,
        history: sim.history,
        scenarioBook: sim.scenarioBook,
        leadScenarioId: sim.topScenario.scenarioId,
        simTick: sim.simTick,
      }),
    [locale, surface, sim],
  );
}

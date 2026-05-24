"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { deriveReplayCinemaBundle } from "@/lib/intelligence/replay-cinema-engine";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function useReplayCinema() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const sim = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      history: s.history,
      agentHistory: s.agentHistory,
      topScenario: s.topScenario,
    })),
  );

  return useMemo(
    () =>
      deriveReplayCinemaBundle({
        locale,
        history: sim.history,
        agentHistory: sim.agentHistory,
        topScenarioId: sim.topScenario.scenarioId,
        derived: sim.derived,
      }),
    [locale, sim],
  );
}

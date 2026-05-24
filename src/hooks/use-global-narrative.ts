"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import {
  deriveGlobalNarrativeBundle,
  type GlobalNarrativeLens,
} from "@/lib/intelligence/global-narrative-engine";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function useGlobalNarrative(lens: GlobalNarrativeLens = "unified") {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const sim = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      history: s.history,
      simTick: s.simTick,
    })),
  );

  return useMemo(
    () =>
      deriveGlobalNarrativeBundle({
        locale,
        latent: sim.latent,
        derived: sim.derived,
        history: sim.history,
        simTick: sim.simTick,
        lens,
      }),
    [locale, sim, lens],
  );
}

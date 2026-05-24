"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { deriveCognitionDramaBundle } from "@/lib/cognition/cognition-drama-engine";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function useCognitionDrama() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const sim = useCognitionSimulationStore(
    useShallow((s) => ({
      simTick: s.simTick,
      derived: s.derived,
      latent: s.latent,
      history: s.history,
    })),
  );

  return useMemo(
    () =>
      deriveCognitionDramaBundle({
        locale,
        derived: sim.derived,
        latent: sim.latent,
        history: sim.history,
        simTick: sim.simTick,
      }),
    [locale, sim],
  );
}

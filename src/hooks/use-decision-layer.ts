"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { deriveDecisionLayer } from "@/lib/intelligence/decision-layer-engine";
import { useMarketPosture } from "@/hooks/use-market-posture";
import { useExecutionSurface } from "@/hooks/use-execution-surface";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

/** Execution decision layer inputs — posture + scenario + structural surface. */
export function useDecisionLayer() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const posture = useMarketPosture();
  const surface = useExecutionSurface();
  const sim = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      scenarioBook: s.scenarioBook,
      topScenario: s.topScenario,
    })),
  );

  const leadCard =
    sim.scenarioBook.cards.find((c) => c.id === sim.topScenario.scenarioId) ??
    sim.scenarioBook.cards[0] ??
    null;

  return useMemo(
    () =>
      deriveDecisionLayer({
        locale,
        posture,
        derived: sim.derived,
        latent: sim.latent,
        surface,
        leadCard,
      }),
    [locale, posture, surface, sim.derived, sim.latent, leadCard],
  );
}

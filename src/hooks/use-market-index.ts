"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { deriveMarketIndexBundle } from "@/lib/intelligence/market-index-engine";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function useMarketIndex() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const snap = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      history: s.history,
      agentLattice: s.agentLattice,
      topScenario: s.topScenario,
      scenarioBook: s.scenarioBook,
      dominant: s.dominant,
      mainRisk: s.mainRisk,
    })),
  );

  return useMemo(
    () =>
      deriveMarketIndexBundle({
        locale,
        derived: snap.derived,
        latent: snap.latent,
        history: snap.history,
        agentLattice: snap.agentLattice,
        topScenario: snap.topScenario,
        scenarioCards: snap.scenarioBook.cards,
        dominantHeadlineKey: snap.dominant.headlineKey,
        mainRisk: snap.mainRisk,
      }),
    [locale, snap],
  );
}

"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { deriveExecutionLayerSurface } from "@/lib/execution/derive-execution-layer";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useMarketStore } from "@/store/market-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function useExecutionSurface() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const market = useMarketStore(
    useShallow((s) => ({
      symbol: s.symbol,
      price: s.price,
      markPrice: s.markPrice,
      realizedVol: s.realizedVol,
      momentum: s.momentum,
    })),
  );
  const { derived, latent, history, scenarioBook, topScenario } = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      history: s.history,
      scenarioBook: s.scenarioBook,
      topScenario: s.topScenario,
    })),
  );

  const leadCard =
    scenarioBook.cards.find((c) => c.id === topScenario.scenarioId) ?? scenarioBook.cards[0] ?? null;

  return useMemo(
    () =>
      deriveExecutionLayerSurface({
        locale,
        market,
        derived,
        latent,
        history,
        leadCard,
      }),
    [locale, market, derived, latent, history, leadCard],
  );
}

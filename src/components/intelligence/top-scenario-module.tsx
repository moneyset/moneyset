"use client";

import { useMemo } from "react";

import { CognitionPanel } from "@/components/ui/panel";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { scenarioTitle, topScenarioSummary } from "@/lib/i18n/cognition-dict";
import { deriveLiveTemporalSurface } from "@/lib/cognition/temporal-evolution";
import { useShallow } from "zustand/react/shallow";

export function TopScenarioModule() {
  const { topScenario, history, scenarioBook } = useCognitionSimulationStore(
    useShallow((s) => ({ topScenario: s.topScenario, history: s.history, scenarioBook: s.scenarioBook })),
  );
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const temporal = useMemo(() => deriveLiveTemporalSurface(locale, history), [locale, history]);

  return (
    <CognitionPanel eyebrow="Scenarios" accent="consensus" title="Lead scenario">
      <p className="ms-scenario-title">{scenarioTitle(locale, topScenario.scenarioId)}</p>
      <p className="mt-2 font-mono text-[10px] tabular-nums leading-snug text-ms-muted">
        {scenarioBook.cards[0]?.pathConvictionLine ??
          topScenarioSummary(locale, topScenario.scenarioId, topScenario.probabilityPct)}
      </p>
      {temporal.scenarioTemporalLine ? (
        <p className="mt-2 border-l border-ms-consensus/30 pl-2 text-[10px] leading-snug text-ms-muted">
          {temporal.scenarioTemporalLine}
        </p>
      ) : null}
    </CognitionPanel>
  );
}

"use client";

import { useMemo } from "react";

import { SparklineDeltaPair } from "@/components/cognition/sparkline-delta-pair";
import { CognitionPanel } from "@/components/ui/panel";
import {
  intelligencePanelEyebrow,
  intelligencePanelTitle,
  phaseLabel,
  phaseSummaryLine,
  pickLocale,
  regimeMetricLabels,
} from "@/lib/i18n/cognition-dict";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { RegimePhaseStrip } from "@/components/cognition/regime-phase-strip";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function MarketRegimePlaceholder() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const derived = useCognitionSimulationStore((s) => s.derived);
  const latent = useCognitionSimulationStore((s) => s.latent);
  const history = useCognitionSimulationStore((s) => s.history);
  const liqSeries = useMemo(() => history.slice(-18).map((h) => h.liquidityStructuralStress), [history]);
  const volSeries = useMemo(() => history.slice(-18).map((h) => h.volatilityImpulse), [history]);
  const m = regimeMetricLabels(locale);

  return (
    <CognitionPanel
      eyebrow={intelligencePanelEyebrow(locale, "marketRegime")}
      accent="flow"
      title={intelligencePanelTitle(locale, "marketRegime")}
    >
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4" lang={locale}>
        <p className="text-[14px] font-semibold leading-tight text-ms-text">{phaseLabel(locale, derived.phase)}</p>
        <p className="max-w-xl flex-1 font-mono text-[10px] tabular-nums leading-snug text-ms-muted">
          {phaseSummaryLine(locale, derived.phase)}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2" lang={locale}>
        <p className="font-mono text-[10px] tabular-nums leading-snug text-ms-muted">
          {m.liq} {Math.round(latent.liquidityStructuralStress)}
          <span className="text-ms-faint"> · </span>
          {m.vol} {Math.round(latent.volatilityImpulse)}
        </p>
        <div className="flex items-center gap-2 opacity-[0.72] max-md:opacity-[0.68]">
          <SparklineDeltaPair
            values={liqSeries}
            tone="muted"
            width={52}
            height={13}
            restrained
            ariaLabel={pickLocale(locale, "Liquidity stress micro-trend", "Микротренд стресса ликвидности")}
          />
          <SparklineDeltaPair
            values={volSeries}
            tone="muted"
            width={52}
            height={13}
            restrained
            ariaLabel={pickLocale(locale, "Volatility impulse micro-trend", "Микротренд импульса волы")}
          />
        </div>
      </div>
      <div className="mt-4 border-t border-ms-border/25 pt-4" lang={locale}>
        <p className="ms-data-label text-ms-faint">{m.recentPath}</p>
        <div className="mt-1.5">
          <RegimePhaseStrip history={history} max={8} />
        </div>
      </div>
    </CognitionPanel>
  );
}

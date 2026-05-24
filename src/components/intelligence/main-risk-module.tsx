"use client";

import { useMemo } from "react";

import { SparklineDeltaPair } from "@/components/cognition/sparkline-delta-pair";
import { CognitionPanel } from "@/components/ui/panel";
import { deriveMainRiskCausal } from "@/lib/cognition/strategic-read";
import { mainRiskDisplay, pickLocale } from "@/lib/i18n/cognition-dict";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function MainRiskModule() {
  const mainRisk = useCognitionSimulationStore((s) => s.mainRisk);
  const derived = useCognitionSimulationStore((s) => s.derived);
  const latent = useCognitionSimulationStore((s) => s.latent);
  const history = useCognitionSimulationStore((s) => s.history);
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const mr = mainRiskDisplay(locale, mainRisk.riskKey, mainRisk.dangerScore);

  const causal = useMemo(
    () => deriveMainRiskCausal(locale, mainRisk.riskKey, latent, derived, history),
    [locale, mainRisk.riskKey, latent, derived, history],
  );

  const stressSeries = useMemo(() => history.slice(-16).map((h) => h.dangerScore), [history]);

  return (
    <CognitionPanel
      eyebrow={pickLocale(locale, "Risk", "Риск")}
      accent="danger"
      title={pickLocale(locale, "Main risk", "Главный риск")}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="ms-danger-title min-w-0 flex-1">{mr.headline}</p>
        <SparklineDeltaPair
          values={stressSeries}
          tone="danger"
          width={40}
          height={11}
          restrained
          ariaLabel={pickLocale(locale, "Stress micro-trend", "Микротренд стресса")}
        />
      </div>
      <p className="mt-2 font-mono text-[10px] leading-snug text-ms-muted">{mr.summary}</p>
      <div className="mt-3" lang={locale}>
        <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Basis", "Основание")}</p>
        <ul className="mt-1.5 space-y-1 text-[10px] leading-snug text-ms-muted">
          {causal.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ms-danger/45" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </CognitionPanel>
  );
}

"use client";

import { useMemo } from "react";
import { m } from "framer-motion";

import { CognitionPanel } from "@/components/ui/panel";
import {
  consensusDriversSectionLabel,
  consensusLabel,
  consensusMeterLabels,
  consensusSummaryLine,
  intelligencePanelEyebrow,
  intelligencePanelTitle,
  pickLocale,
} from "@/lib/i18n/cognition-dict";
import { deriveConsensusDrivers } from "@/lib/cognition/strategic-read";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { msTransition } from "@/lib/theme";
import { SparklineDeltaPair } from "@/components/cognition/sparkline-delta-pair";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function ConsensusPlaceholder() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const mode = useUiPrefsStore((s) => s.cognitionMode);
  const compact = mode === "compressed";
  const derived = useCognitionSimulationStore((s) => s.derived);
  const latent = useCognitionSimulationStore((s) => s.latent);
  const agentLattice = useCognitionSimulationStore((s) => s.agentLattice);
  const spread = useCognitionSimulationStore((s) => s.consensusSpreadDisplay);
  const history = useCognitionSimulationStore((s) => s.history);
  const agreementPct = Math.round(derived.consensusSpreadPct);
  const divergencePct = Math.round(derived.divergenceIndex);
  const agreeSeries = useMemo(() => history.slice(-18).map((h) => h.consensusSpreadPct), [history]);
  const divSeries = useMemo(() => history.slice(-18).map((h) => h.divergenceIndex), [history]);

  const lab = consensusMeterLabels(locale);

  const drivers = useMemo(
    () => deriveConsensusDrivers(locale, derived.consensus, derived, latent, agentLattice),
    [locale, derived, latent, agentLattice],
  );

  return (
    <CognitionPanel
      eyebrow={intelligencePanelEyebrow(locale, "consensus")}
      accent="consensus"
      title={intelligencePanelTitle(locale, "consensus")}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2" lang={locale}>
        <m.h2
          layout
          className="ms-headline text-ms-consensus"
          transition={msTransition.medium}
          key={derived.consensus}
        >
          {consensusLabel(locale, derived.consensus)}
        </m.h2>
        <p className="text-right text-[11px] text-ms-muted">
          {lab.spread} <span className="font-mono tabular-nums text-ms-text">{spread}</span>
        </p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" lang={locale}>
        <div className="space-y-2">
          <p className="ms-data-label text-ms-faint">{lab.agreement}</p>
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-ms-pill bg-ms-border/80">
                <m.div
                  layout
                  className="h-full rounded-ms-pill bg-ms-consensus/70"
                  style={{ width: `${agreementPct}%` }}
                  transition={msTransition.slow}
                />
              </div>
              <p className="mt-1 text-[10px] font-medium text-ms-faint">
                {derived.consensus.includes("strengthening")
                  ? pickLocale(locale, "Broad", "Широко")
                  : derived.consensus.includes("weakening")
                    ? pickLocale(locale, "Thin", "Тонко")
                    : pickLocale(locale, "Mixed", "Смешано")}
              </p>
            </div>
            <SparklineDeltaPair
              values={agreeSeries}
              tone="consensus"
              width={compact ? 56 : 68}
              height={compact ? 14 : 16}
              restrained={compact}
              ariaLabel={lab.sparkAgreementAria}
            />
          </div>
        </div>
        <div className="space-y-2">
          <p className="ms-data-label text-ms-faint">{lab.divergence}</p>
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-ms-pill bg-ms-border/80">
                <m.div
                  layout
                  className="h-full rounded-ms-pill bg-ms-warning/55"
                  style={{ width: `${divergencePct}%` }}
                  transition={msTransition.slow}
                />
              </div>
              <p className="mt-1 text-[10px] font-medium text-ms-faint">
                {derived.consensus.includes("divergence") ? pickLocale(locale, "Wide", "Широко") : pickLocale(locale, "Contained", "Сдержано")}
              </p>
            </div>
            <SparklineDeltaPair
              values={divSeries}
              tone="warning"
              width={compact ? 56 : 68}
              height={compact ? 14 : 16}
              restrained={compact}
              ariaLabel={lab.sparkDivergenceAria}
            />
          </div>
        </div>
      </div>
      {mode === "deep" && !compact ? (
        <>
          <m.p
            layout
            className="ms-intelligence-summary mt-3 leading-snug"
            transition={msTransition.medium}
            key={derived.consensus + "-sum"}
            lang={locale}
          >
            {consensusSummaryLine(locale, derived.consensus)}
          </m.p>
          <div className="mt-3" lang={locale}>
            <p className="ms-data-label text-ms-faint">{consensusDriversSectionLabel(locale)}</p>
            <ul className="mt-1.5 space-y-1 text-[11px] leading-snug text-ms-muted">
              {drivers.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ms-consensus/45" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </CognitionPanel>
  );
}

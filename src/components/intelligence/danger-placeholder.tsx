"use client";

import { useMemo } from "react";

import { CognitionPanel } from "@/components/ui/panel";
import { DangerIndicator } from "@/components/ui/danger-indicator";
import { deriveStressCausalNotes } from "@/lib/cognition/strategic-read";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import {
  dangerBandLabel,
  dangerPlaceholderTelemetry,
  dangerSignalsLocalized,
  intelligencePanelEyebrow,
  intelligencePanelTitle,
} from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function DangerPlaceholder() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const derived = useCognitionSimulationStore((s) => s.derived);
  const latent = useCognitionSimulationStore((s) => s.latent);
  const history = useCognitionSimulationStore((s) => s.history);

  const signals = dangerSignalsLocalized(locale, derived.dangerBand);
  const tel = dangerPlaceholderTelemetry(locale);

  const prev = history.length >= 2 ? history.at(-2)! : null;
  const liqDelta =
    prev && Number.isFinite(prev.liquidityStructuralStress)
      ? Math.round(latent.liquidityStructuralStress) - Math.round(prev.liquidityStructuralStress)
      : 0;
  const volDelta =
    prev && Number.isFinite(prev.volatilityImpulse)
      ? Math.round(latent.volatilityImpulse) - Math.round(prev.volatilityImpulse)
      : 0;

  const arrow = (d: number) => (Math.abs(d) < 2 ? "→" : d > 0 ? "↑" : "↓");

  const stressBasis = useMemo(
    () => deriveStressCausalNotes(locale, derived, latent, history),
    [locale, derived, latent, history],
  );

  return (
    <CognitionPanel
      eyebrow={intelligencePanelEyebrow(locale, "danger")}
      accent="danger"
      title={intelligencePanelTitle(locale, "danger")}
    >
      <DangerIndicator
        band={derived.dangerBand}
        label={dangerBandLabel(locale, derived.dangerBand)}
      />
      <p className="ms-intelligence-summary mt-3 font-mono tabular-nums leading-snug text-ms-muted" lang={locale}>
        {pickLocale(locale, "Liq", "Ликв")}{" "}
        <span className="text-ms-text">{Math.round(latent.liquidityStructuralStress)}</span>
        <span className="ml-1 text-ms-faint">{arrow(liqDelta)}</span>
        <span className="text-ms-faint"> · </span>
        {pickLocale(locale, "Vol", "Вол")}{" "}
        <span className="text-ms-text">{Math.round(latent.volatilityImpulse)}</span>
        <span className="ml-1 text-ms-faint">{arrow(volDelta)}</span>
      </p>
      {/* No synthetic scoring readouts */}
      <div className="mt-3" lang={locale}>
        <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Basis", "База")}</p>
        <ul className="mt-1.5 space-y-1 text-[10px] leading-snug text-ms-muted">
          {stressBasis.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ms-warning/50" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ms-faint" lang={locale}>
        {signals.join(" · ")}
      </p>
    </CognitionPanel>
  );
}

"use client";

import type { ExecutionLayerSurface } from "@/lib/execution/derive-execution-layer";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";

type Confidence = "strengthening" | "stable" | "weakening" | "fragile" | "rebuilding";

function confidenceFromSurface(surface: ExecutionLayerSurface): Confidence {
  const { structuralCoherence: coh } = surface.microCognition;
  const d = surface.scenarioWeightDelta;
  if (surface.dangerBand === "critical" || surface.dangerBand === "dangerous") return "fragile";
  if (d > 1.15 && coh >= 58) return "strengthening";
  if (d < -1.1) return "weakening";
  if (coh < 48 && surface.dangerBand === "elevated") return "rebuilding";
  if (coh < 52) return "fragile";
  return "stable";
}

function confidenceAria(locale: UiLocale, c: Confidence): string {
  const m: Record<Confidence, { en: string; ru: string }> = {
    strengthening: { en: "Execution confidence strengthening", ru: "Уверенность исполнения усиливается" },
    stable: { en: "Execution confidence stable", ru: "Уверенность исполнения стабильна" },
    weakening: { en: "Execution confidence weakening", ru: "Уверенность исполнения слабеет" },
    fragile: { en: "Execution confidence fragile", ru: "Уверенность исполнения хрупкая" },
    rebuilding: { en: "Execution confidence rebuilding", ru: "Уверенность исполнения восстанавливается" },
  };
  return pickLocale(locale, m[c].en, m[c].ru);
}

/** Coherence + participation + expansion readiness — replaces long prose blocks. */
export function ExecutionCognitionStrips({
  locale,
  surface,
  latent,
  className,
}: {
  locale: UiLocale;
  surface: ExecutionLayerSurface;
  latent: LatentDrivers;
  className?: string;
}) {
  const co = Math.max(0, Math.min(1, surface.microCognition.structuralCoherence / 100));
  const pt = Math.max(0, Math.min(1, latent.positioningPressure / 100));
  const volN = Math.max(0, Math.min(1, surface.microCognition.volImpulse / 100));
  const expansionReadiness =
    surface.volTone === "compressing" ? Math.max(0, Math.min(1, 0.35 + (1 - volN) * 0.55)) : Math.max(0, Math.min(1, 0.28 + volN * 0.62));
  const conf = confidenceFromSurface(surface);

  const segOpacity: Record<Confidence, [number, number, number, number, number]> = {
    strengthening: [0.92, 0.78, 0.55, 0.38, 0.22],
    stable: [0.55, 0.62, 0.7, 0.62, 0.55],
    weakening: [0.35, 0.45, 0.55, 0.68, 0.45],
    fragile: [0.28, 0.32, 0.38, 0.42, 0.35],
    rebuilding: [0.4, 0.52, 0.68, 0.52, 0.4],
  };

  return (
    <div
      className={cn(
        "ms-exec-cognition-strips rounded-ms-md border border-ms-border/14 bg-ms-surface/6 px-2.5 py-2 sm:px-3 sm:py-2.5",
        className,
      )}
      role="region"
      aria-label={pickLocale(locale, "Structural cognition strips", "Полосы структурного познания")}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-[9px] font-medium text-ms-faint">
            {pickLocale(locale, "Align", "Связь")}
          </span>
          <div className="ms-exec-strip-track h-1 flex-1 overflow-hidden rounded-full bg-ms-border/18">
            <div
              className="ms-exec-strip-fill ms-exec-strip-coh h-full rounded-full bg-gradient-to-r from-ms-consensus/25 to-ms-consensus/60"
              style={{ width: `${Math.round(co * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-[9px] font-medium text-ms-faint">
            {pickLocale(locale, "Breadth", "Ширина")}
          </span>
          <div className="ms-exec-strip-track h-1 flex-1 overflow-hidden rounded-full bg-ms-border/18">
            <div
              className="ms-exec-strip-fill ms-exec-strip-part h-full rounded-full bg-gradient-to-r from-ms-flow/20 to-ms-flow/55"
              style={{ width: `${Math.round(pt * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-[9px] font-medium text-ms-faint">
            {pickLocale(locale, "Expand", "Разгон")}
          </span>
          <div className="ms-exec-strip-track h-1 flex-1 overflow-hidden rounded-full bg-ms-border/18">
            <div
              className="ms-exec-strip-fill ms-exec-strip-exp h-full rounded-full bg-gradient-to-r from-ms-warning/18 to-ms-warning/52"
              style={{ width: `${Math.round(expansionReadiness * 100)}%` }}
            />
          </div>
        </div>
      </div>
      <div
        className="mt-2 flex justify-between gap-0.5 border-t border-ms-border/10 pt-2"
        role="img"
        aria-label={confidenceAria(locale, conf)}
      >
        {segOpacity[conf].map((op, i) => (
          <div
            key={i}
            className="ms-exec-confidence-seg h-1.5 min-w-0 flex-1 rounded-sm bg-ms-cognition/80"
            style={{ opacity: op }}
          />
        ))}
      </div>
    </div>
  );
}

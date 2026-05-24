"use client";

import { useMemo } from "react";
import { m } from "framer-motion";

import { useAttentionPlane } from "@/components/cognition/attention-priority-context";
import { SparklineDeltaPair } from "@/components/cognition/sparkline-delta-pair";

import type { ScenarioEngineCard as ScenarioEngineCardModel } from "@/lib/simulation/scenario-engine";
import type { ScenarioCardTier } from "@/lib/i18n/cognition-dict";
import type { ScenarioEvolutionState } from "@/lib/simulation/cognition-types";
import { msTransition } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useT } from "@/lib/i18n/use-t";
import {
  localizeDriverLine,
  localizeFragilityLine,
  pickLocale,
  scenarioEvolutionStateLabel,
  scenarioRiskLevelLabel,
  scenarioTierEyebrow,
  scenarioTitle,
} from "@/lib/i18n/cognition-dict";

function evolutionAccent(s: ScenarioEvolutionState): string {
  if (s === "strengthening" || s === "transitioning") return "bg-ms-flow/55";
  if (s === "weakening" || s === "deteriorating") return "bg-ms-warning/55";
  if (s === "stabilizing") return "bg-ms-consensus/45";
  return "bg-ms-faint/40";
}

function evolutionBorder(s: ScenarioEvolutionState): string {
  if (s === "strengthening" || s === "transitioning") return "border-l-ms-flow/35";
  if (s === "weakening" || s === "deteriorating") return "border-l-ms-warning/35";
  if (s === "stabilizing") return "border-l-ms-consensus/30";
  return "border-l-ms-border/40";
}

type ScenarioEngineCardProps = {
  card: ScenarioEngineCardModel;
  /** Visual tier from deck order — drives emphasis, not forecast rank. */
  tier?: ScenarioCardTier;
  className?: string;
};

export function ScenarioEngineCard({ card, tier: tierProp, className }: ScenarioEngineCardProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const mode = useUiPrefsStore((s) => s.cognitionMode);
  const history = useCognitionSimulationStore((s) => s.history);
  const divergenceSeries = useMemo(() => history.slice(-16).map((h) => h.divergenceIndex), [history]);
  const att = useAttentionPlane();
  const t = useT();
  const tier = tierProp ?? "secondary";
  const eyebrow = scenarioTierEyebrow(locale, tier);

  const shell = cn(
    "relative overflow-hidden rounded-ms-xl border transition-[border-color,background-color,opacity] duration-500 ease-out",
    evolutionBorder(card.evolutionState),
    "border-l-[3px]",
    tier === "primary" && "border-ms-border/45 bg-ms-surface/32 p-4 shadow-ms-xs sm:p-6",
    tier === "secondary" && "border-ms-border/22 bg-ms-surface/20 p-3.5 sm:p-5",
    tier === "tail" && "border-ms-border/16 bg-ms-surface/12 p-3 sm:p-4",
    att.scenarioLeadWeakening && tier !== "primary" && "opacity-[0.88]",
    className,
  );

  const titleClass = cn(
    "mt-1 pr-2 font-semibold tracking-[-0.02em] text-ms-text",
    tier === "primary" && "text-[14px] leading-snug sm:text-[15px]",
    tier === "secondary" && "ms-scenario-title",
    tier === "tail" && "text-[12.5px] leading-snug sm:text-[13px]",
  );

  const sectionLabel = (en: string, ru: string) => (
    <p className="ms-data-label text-ms-faint/90">{pickLocale(locale, en, ru)}</p>
  );

  return (
    <m.article
      transition={msTransition.medium}
      data-ms-evo={tier === "primary" ? card.evolutionState : undefined}
      className={cn(shell, tier === "primary" && "ms-scenario-evoshell")}
    >
      <header className="relative flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "ms-eyebrow",
              tier === "primary" && "text-ms-text/75",
              tier === "secondary" && "text-ms-faint",
              tier === "tail" && "text-ms-faint/90",
            )}
          >
            {eyebrow}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-0.5" aria-hidden title={scenarioEvolutionStateLabel(locale, card.evolutionState)}>
              <span className={cn("size-[3px] rounded-[1px]", evolutionAccent(card.evolutionState))} />
              <span className={cn("size-[3px] rounded-[1px] opacity-80", evolutionAccent(card.evolutionState))} />
              <span className={cn("size-[3px] rounded-[1px] opacity-60", evolutionAccent(card.evolutionState))} />
            </div>
            <SparklineDeltaPair
              values={divergenceSeries}
              tone="warning"
              width={tier === "primary" ? 42 : tier === "secondary" ? 36 : 32}
              height={tier === "primary" ? 12 : 11}
              restrained={tier !== "primary"}
              ariaLabel={pickLocale(
                locale,
                "Divergence micro-trend (structural split pressure)",
                "Микротренд разноса (давление распада структуры)",
              )}
            />
          </div>
        </div>
        <h3 className={titleClass}>{scenarioTitle(locale, card.id)}</h3>
        <p className="text-[10px] leading-snug text-ms-muted sm:text-[11px]">{card.pathConvictionLine}</p>
        <p className="font-mono text-[10px] tabular-nums text-ms-faint">
          {scenarioEvolutionStateLabel(locale, card.evolutionState)}
          <span className="text-ms-faint"> · </span>
          <span className={cn("font-medium", tapeStressClass(card.riskLevel))}>
            {scenarioRiskLevelLabel(locale, card.riskLevel)}
          </span>
        </p>
      </header>

      <div className={cn("mt-3 space-y-3", tier === "tail" && "mt-2.5 space-y-2.5")}>
        <div>
          {sectionLabel("Path", "Путь")}
          <p className={cn("mt-1 leading-snug text-ms-text/90", tier === "tail" ? "text-[10px]" : "text-[11px] sm:text-[12px]")}>
            {card.structuralPath}
          </p>
        </div>

        <div>
          {sectionLabel("Conditions", "Условия")}
          <ul className="mt-1 space-y-0.5">
            {card.conditionLines.map((line) => (
              <li key={line} className="text-[10px] leading-snug text-ms-muted sm:text-[11px]">
                <span className="text-ms-faint">· </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div>
          {sectionLabel("Structural support", "Структурная опора")}
          <ul className="mt-1 space-y-0.5">
            {card.structuralSupport.map((d) => (
              <li key={d} className="text-[10px] leading-snug text-ms-muted sm:text-[11px]">
                <span className="text-ms-faint">· </span>
                {localizeDriverLine(locale, d)}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div>
            {sectionLabel("Invalidation", "Инвалидация")}
            <p className={cn("mt-1 leading-relaxed text-ms-text/90", tier === "tail" ? "text-[10px]" : "text-[11px]")}>
              {card.invalidation}
            </p>
            {card.invalidationPressure.length > 0 ? (
              <ul className="mt-1.5 space-y-0.5">
                {card.invalidationPressure.map((d) => (
                  <li key={d} className="text-[9px] leading-snug text-ms-faint sm:text-[10px]">
                    {localizeFragilityLine(locale, d)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div>
            {sectionLabel("Execution", "Исполнение")}
            <p className={cn("mt-1 leading-relaxed text-ms-muted", tier === "tail" ? "text-[10px]" : "text-[11px]")}>
              {card.executionImplication}
            </p>
          </div>
        </div>

        {tier === "primary" && card.sessionContext ? (
          <p className="hidden text-[9px] leading-snug text-ms-faint sm:block sm:text-[10px]">{card.sessionContext}</p>
        ) : null}

        {mode === "deep" ? (
          <div className="hidden border-t border-ms-border/15 pt-3 sm:block">
            {sectionLabel("Tape read", "Чтение ленты")}
            <p className="mt-1 text-[11px] leading-relaxed text-ms-muted">{card.strategicSummary}</p>
          </div>
        ) : null}
      </div>

      <details className={cn("relative mt-3 border-t border-ms-border/12 pt-2 sm:hidden", mode === "compressed" && "hidden")}>
        <summary className="ms-focus-ring cursor-pointer list-none rounded-ms-md bg-ms-elevated/25 px-2.5 py-1.5 text-[10px] font-medium text-ms-muted">
          {t("scenario.details")}
        </summary>
        <div className="mt-2 space-y-2 text-[10px] leading-snug text-ms-muted">
          <p>{card.strategicSummary}</p>
          {tier === "primary" && card.sessionContext ? <p className="text-ms-faint">{card.sessionContext}</p> : null}
        </div>
      </details>
    </m.article>
  );
}

function tapeStressClass(level: ScenarioEngineCardModel["riskLevel"]): string {
  if (level === "high") return "text-ms-danger/78";
  if (level === "elevated") return "text-ms-warning/85";
  if (level === "medium") return "text-ms-cognition/85";
  return "text-ms-muted";
}

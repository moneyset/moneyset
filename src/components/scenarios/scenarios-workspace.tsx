"use client";

import { useEffect, useMemo, useState } from "react";

import { ExecutionInterpretationBridge } from "@/components/execution/execution-interpretation-bridge";
import { ScenarioEngineCard } from "@/components/ui/scenario-engine-card";
import { PremiumGate } from "@/components/premium/premium-gate";
import { useExtendedCognitionAccess } from "@/hooks/use-extended-cognition-access";
import { useUpgradeModalStore } from "@/store/upgrade-modal-store";
import {
  pickLocale,
  scenarioConfidenceLabel,
  scenarioEvolutionStateLabel,
  scenarioPathRotationLine,
  scenarioTitle,
} from "@/lib/i18n/cognition-dict";
import {
  buildStructuralTriggerLines,
  pickTailRiskCard,
  rotationEngineSummary,
} from "@/lib/cognition/scenarios-workspace-derive";
import { cn } from "@/lib/utils";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type ScenariosWorkspaceProps = {
  className?: string;
};

function useIsMobileLayout() {
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const go = () => setIsMobile(mq.matches);
    go();
    mq.addEventListener("change", go);
    return () => mq.removeEventListener("change", go);
  }, []);
  return isMobile;
}

function PathFlowBand({ role }: { role: "primary" | "secondary" | "tail" }) {
  const grad =
    role === "primary"
      ? "from-ms-cognition/18 via-ms-flow/10 to-transparent"
      : role === "secondary"
        ? "from-ms-flow/12 via-ms-consensus/8 to-transparent"
        : "from-ms-border/30 via-ms-muted/8 to-transparent";
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-ms-xl bg-gradient-to-r opacity-[0.85]",
        grad,
      )}
    />
  );
}

function SectionHeader({
  kicker,
  title,
  hint,
}: {
  kicker: string;
  title: string;
  hint?: string;
}) {
  return (
    <header className="mb-3 space-y-1">
      <p className="ms-data-label text-ms-faint">{kicker}</p>
      <h2 className="text-[13px] font-medium tracking-tight text-ms-text/92">{title}</h2>
      {hint ? <p className="max-w-prose text-[10px] leading-snug text-ms-muted">{hint}</p> : null}
    </header>
  );
}

export function ScenariosWorkspace({ className }: ScenariosWorkspaceProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const book = useCognitionSimulationStore((s) => s.scenarioBook);
  const derived = useCognitionSimulationStore((s) => s.derived);
  const extended = useExtendedCognitionAccess();
  const openUpgrade = useUpgradeModalStore((s) => s.openUpgrade);
  const isMobile = useIsMobileLayout();

  const freeCount = 2;
  const visible = extended ? book.cards : book.cards.slice(0, freeCount);
  const primary = visible[0] ?? null;
  const secondary = visible[1] ?? null;
  const tailResolved = useMemo(() => pickTailRiskCard(book.cards), [book.cards]);

  const triggerPaths = useMemo(() => {
    const base: NonNullable<typeof primary>[] = [];
    if (primary) base.push(primary);
    if (secondary) base.push(secondary);
    if (extended && tailResolved) base.push(tailResolved);
    return base;
  }, [extended, primary, secondary, tailResolved]);

  const triggers = useMemo(
    () => buildStructuralTriggerLines(locale, derived, triggerPaths),
    [locale, derived, triggerPaths],
  );

  const rotation = useMemo(() => {
    if (!primary) {
      return { headline: "", body: "" };
    }
    return rotationEngineSummary(locale, book, primary, secondary);
  }, [locale, book, primary, secondary]);

  const secondarySection = (
    <section aria-labelledby="sc-secondary-path">
      <SectionHeader
        kicker={pickLocale(locale, "02", "02")}
        title={pickLocale(locale, "Secondary path", "Вторичный путь")}
        hint={pickLocale(
          locale,
          "Credible alternative evolution — challenges dominance without retail certainty framing.",
          "Допустимая альтернатива — бросает вызов доминанте без «точного прогноза».",
        )}
      />
      {secondary ? (
        <div className="relative overflow-hidden rounded-ms-xl border border-ms-border/20 bg-ms-surface/16">
          <PathFlowBand role="secondary" />
          <ScenarioEngineCard card={secondary} tier="secondary" className="border-0 bg-transparent shadow-none" />
        </div>
      ) : (
        <p className="text-[11px] text-ms-faint">{pickLocale(locale, "No alternate path in view.", "Альтернативы нет.")}</p>
      )}
    </section>
  );

  const tailSection = (
    <section aria-labelledby="sc-tail-path" className="scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)]">
      <SectionHeader
        kicker={pickLocale(locale, "03", "03")}
        title={pickLocale(locale, "Tail risk path", "Хвостовой риск")}
        hint={pickLocale(
          locale,
          "Low-likelihood, high-impact structural lens — operational, not alarmist.",
          "Редкий, тяжёлый сценарий — операционно, без паники.",
        )}
      />
      {tailResolved ? (
        extended ? (
          <div className="relative overflow-hidden rounded-ms-xl border border-ms-border/18 bg-ms-surface/12">
            <PathFlowBand role="tail" />
            <ScenarioEngineCard card={tailResolved} tier="tail" className="border-0 bg-transparent shadow-none" />
          </div>
        ) : (
          <PremiumGate onUnlock={openUpgrade} className="w-full">
            <div className="relative overflow-hidden rounded-ms-xl border border-ms-border/18 bg-ms-surface/12">
              <PathFlowBand role="tail" />
              <ScenarioEngineCard card={tailResolved} tier="tail" className="border-0 bg-transparent shadow-none" />
            </div>
          </PremiumGate>
        )
      ) : null}
    </section>
  );

  const convictionSection = (
    <section aria-labelledby="sc-conviction">
      <SectionHeader
        kicker={pickLocale(locale, "04", "04")}
        title={pickLocale(locale, "Conviction evolution", "Эволюция убеждённости")}
        hint={pickLocale(
          locale,
          "Ordinal read — how path coherence drifts, not percentage forecasts.",
          "Порядковое чтение — дрейф связности путей, не проценты.",
        )}
      />
      <div className="rounded-ms-xl border border-ms-border/16 bg-ms-elevated/18 p-3 sm:p-4">
        <ul className="space-y-3">
          {primary ? (
            <li className="grid gap-1 border-b border-ms-border/10 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-x-4">
              <div>
                <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Primary", "База")}</p>
                <p className="mt-0.5 text-[12px] font-medium text-ms-text/90">{scenarioTitle(locale, primary.id)}</p>
                <p className="mt-1 text-[10px] leading-snug text-ms-muted">{primary.pathConvictionLine}</p>
              </div>
              <div className="text-[10px] leading-snug text-ms-muted sm:text-end">
                <p>{scenarioEvolutionStateLabel(locale, primary.evolutionState)}</p>
                <p className="mt-0.5 text-ms-faint">{scenarioConfidenceLabel(locale, primary.confidence)}</p>
              </div>
            </li>
          ) : null}
          {secondary ? (
            <li className="grid gap-1 border-b border-ms-border/10 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-x-4">
              <div>
                <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Secondary", "Вторичный")}</p>
                <p className="mt-0.5 text-[12px] font-medium text-ms-text/88">{scenarioTitle(locale, secondary.id)}</p>
                <p className="mt-1 text-[10px] leading-snug text-ms-muted">{secondary.pathConvictionLine}</p>
              </div>
              <div className="text-[10px] leading-snug text-ms-muted sm:text-end">
                <p>{scenarioEvolutionStateLabel(locale, secondary.evolutionState)}</p>
                <p className="mt-0.5 text-ms-faint">{scenarioConfidenceLabel(locale, secondary.confidence)}</p>
              </div>
            </li>
          ) : null}
          {tailResolved && extended ? (
            <li className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-x-4">
              <div>
                <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Tail lens", "Хвост")}</p>
                <p className="mt-0.5 text-[12px] font-medium text-ms-text/85">{scenarioTitle(locale, tailResolved.id)}</p>
                <p className="mt-1 text-[10px] leading-snug text-ms-muted">{tailResolved.pathConvictionLine}</p>
              </div>
              <div className="text-[10px] leading-snug text-ms-muted sm:text-end">
                <p>{scenarioEvolutionStateLabel(locale, tailResolved.evolutionState)}</p>
                <p className="mt-0.5 text-ms-faint">{scenarioConfidenceLabel(locale, tailResolved.confidence)}</p>
              </div>
            </li>
          ) : null}
          {!extended && tailResolved ? (
            <li className="rounded-ms-md border border-ms-border/12 bg-ms-surface/14 px-3 py-2 text-[10px] text-ms-muted">
              {pickLocale(
                locale,
                "Tail conviction strip expands with full structural book.",
                "Полоса хвоста — с полной колодой.",
              )}
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );

  const triggersSection = (
    <section aria-labelledby="sc-triggers">
      <SectionHeader
        kicker={pickLocale(locale, "05", "05")}
        title={pickLocale(locale, "Structural triggers", "Структурные триггеры")}
        hint={pickLocale(
          locale,
          "Conditions that reweight paths — updates when tape regime or participation shifts materially.",
          "Условия переразвешивания — при смене режима или участия.",
        )}
      />
      <ul className="rounded-ms-xl border border-ms-border/14 bg-ms-surface/10 px-3 py-3 sm:px-4">
        {triggers.map((line) => (
          <li
            key={line}
            className="border-b border-ms-border/8 py-1.5 text-[10px] leading-relaxed text-ms-muted last:border-b-0 sm:text-[11px]"
          >
            <span className="text-ms-faint">· </span>
            {line}
          </li>
        ))}
      </ul>
    </section>
  );

  const rotationSection = (
    <section aria-labelledby="sc-rotation">
      <SectionHeader
        kicker={pickLocale(locale, "06", "06")}
        title={pickLocale(locale, "Scenario rotation engine", "Двигатель ротации")}
        hint={pickLocale(
          locale,
          "Detects leadership handoff and primary softening — quiet cadence, not hype.",
          "Фиксирует смену лидера и ослабление базы — спокойный темп.",
        )}
      />
      <div className="rounded-ms-xl border border-ms-border/16 bg-ms-elevated/16 px-3 py-3 sm:px-4 sm:py-4">
        <p className="text-[11px] font-medium text-ms-text/88">{rotation.headline}</p>
        <p className="mt-2 text-[10px] leading-relaxed text-ms-muted sm:text-[11px]">{rotation.body}</p>
        {book.rotationPair ? (
          <p className="mt-3 text-[10px] leading-snug text-ms-warning/75 sm:text-[11px]">
            {scenarioPathRotationLine(locale, book.rotationPair.from, book.rotationPair.to)}
          </p>
        ) : null}
      </div>
    </section>
  );

  const primaryBlock = primary ? (
    <section aria-labelledby="sc-primary-path">
      <SectionHeader
        kicker={pickLocale(locale, "01", "01")}
        title={pickLocale(locale, "Primary path", "Основной путь")}
        hint={pickLocale(
          locale,
          "Dominant structural trajectory — execution implication is binding context, not a bet.",
          "Доминантная траектория — импликация для исполнения как контекст, не ставка.",
        )}
      />
      <div className="relative overflow-hidden rounded-ms-xl border border-ms-border/28 bg-ms-surface/28 shadow-ms-xs">
        <PathFlowBand role="primary" />
        <ScenarioEngineCard card={primary} tier="primary" className="border-0 bg-transparent shadow-none" />
      </div>
    </section>
  ) : null;

  if (!primary) {
    return (
      <p className="text-[11px] text-ms-faint">
        {pickLocale(locale, "Scenario book initializing…", "Колода сценариев инициализируется…")}
      </p>
    );
  }

  const mobileCollapsed = (
    <>
      {secondarySection}
      {tailSection}
      {convictionSection}
      {triggersSection}
      {rotationSection}
    </>
  );

  return (
    <div
      id="scenario-layer"
      data-ms-focus
      className={cn("scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)] space-y-[var(--ms-section-gap)]", className)}
    >
      <p className="max-w-2xl text-[11px] leading-relaxed text-ms-muted sm:text-[12px]">
        {pickLocale(
          locale,
          "Competing structural paths evolve together. The deck ranks relative structural advantage — not point forecasts or retail certainty.",
          "Пути конкурируют. Колода упорядочивает относительное преимущество — не точечный прогноз и не «уверенность в процентах».",
        )}
      </p>

      <ExecutionInterpretationBridge />

      {isMobile ? (
        <>
          {primaryBlock}
          <details className="group rounded-ms-xl border border-ms-border/18 bg-ms-elevated/10">
            <summary className="ms-focus-ring cursor-pointer list-none px-4 py-3 text-[11px] font-medium text-ms-muted marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-2">
                {pickLocale(locale, "Structural framework", "Структурный каркас")}
                <span className="font-mono text-[10px] text-ms-faint group-open:hidden">+</span>
                <span className="hidden font-mono text-[10px] text-ms-faint group-open:inline">−</span>
              </span>
            </summary>
            <div className="space-y-[var(--ms-section-gap)] border-t border-ms-border/12 px-3 pb-4 pt-3 sm:px-4">
              {mobileCollapsed}
            </div>
          </details>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-[var(--ms-section-gap)] lg:grid-cols-2 lg:items-start">
            <div className="min-w-0">{primaryBlock}</div>
            <div className="min-w-0">{secondarySection}</div>
          </div>
          <div className="space-y-[var(--ms-section-gap)]">
            {tailSection}
            <div className="grid grid-cols-1 gap-[var(--ms-section-gap)] xl:grid-cols-2 xl:items-start">
              <div className="min-w-0">{convictionSection}</div>
              <div className="min-w-0">{triggersSection}</div>
            </div>
            {rotationSection}
          </div>
        </>
      )}
    </div>
  );
}

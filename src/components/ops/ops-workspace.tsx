"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Download } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { CognitionExplainStrip } from "@/components/cognition/cognition-explain-strip";
import { PremiumGate } from "@/components/premium/premium-gate";
import { useExtendedCognitionAccess } from "@/hooks/use-extended-cognition-access";
import { useExecutionSurface } from "@/hooks/use-execution-surface";
import { cognitionExportBlob, downloadTextFile } from "@/lib/export/cognition-snapshot-download";
import { deriveLiveTemporalSurface } from "@/lib/cognition/temporal-evolution";
import { pickLocale, logEntryTypeLabel } from "@/lib/i18n/cognition-dict";
import { localizeOperationalLogEntry } from "@/lib/i18n/cognition-oplog-format";
import {
  catalystFallbackLine,
  deriveParticipationEvolutionLines,
  derivePressureMigrationLines,
  deriveRegimeShiftLine,
  selectCatalystEntries,
  selectStructuralTimelineEntries,
} from "@/lib/operational/ops-workspace-derive";
import type { LogEntryType, OperationalLogEntry } from "@/lib/simulation/cognition-types";
import { cn } from "@/lib/utils";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useMemoryStore } from "@/store/memory-store";
import { useUpgradeModalStore } from "@/store/upgrade-modal-store";
import { useUiPrefsStore, type UiLocale } from "@/store/ui-prefs-store";

type OpsWorkspaceProps = {
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

function railDot(entryType: LogEntryType): string {
  const m: Partial<Record<LogEntryType, string>> = {
    RISK: "bg-ms-danger/55",
    REGIME: "bg-ms-flow/50",
    VOLATILITY: "bg-ms-cognition/45",
    LIQUIDITY: "bg-ms-cognition/50",
    FLOW: "bg-ms-flow/45",
    CONSENSUS: "bg-ms-consensus/50",
    MACRO: "bg-ms-warning/45",
    SCENARIO: "bg-ms-consensus/40",
    SENTIMENT: "bg-ms-sentiment/45",
  };
  return m[entryType] ?? "bg-ms-border/50";
}

function MicroTrail({ values, className }: { values: readonly number[]; className?: string }) {
  const heights = useMemo(() => {
    if (values.length < 2) return values.map(() => 8);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const span = Math.max(1e-6, hi - lo);
    return values.map((v) => Math.round(4 + ((v - lo) / span) * 14));
  }, [values]);
  return (
    <div className={cn("flex h-5 max-w-[6.5rem] items-end gap-px opacity-85", className)} aria-hidden>
      {heights.map((h, i) => (
        <div key={i} className="w-px rounded-sm bg-ms-border/60" style={{ height: h }} />
      ))}
    </div>
  );
}

function OpsPanel({
  kicker,
  title,
  hint,
  trail,
  children,
}: {
  kicker: string;
  title: string;
  hint?: string;
  trail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-ms-xl border border-ms-border/14 bg-ms-elevated/10 px-3 py-3 sm:px-4 sm:py-3.5">
      <div className="flex items-start justify-between gap-3">
        <header className="min-w-0 space-y-1">
          <p className="ms-data-label text-ms-faint">{kicker}</p>
          <h3 className="text-[12px] font-medium tracking-tight text-ms-text/90">{title}</h3>
          {hint ? <p className="max-w-prose text-[10px] leading-snug text-ms-muted">{hint}</p> : null}
        </header>
        {trail ? <div className="shrink-0 pt-0.5">{trail}</div> : null}
      </div>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((line) => (
        <li key={line} className="border-l border-ms-border/20 pl-2.5 text-[10px] leading-relaxed text-ms-muted sm:text-[11px]">
          {line}
        </li>
      ))}
    </ul>
  );
}

function TimelineNode({
  entry,
  locale,
  executionLabel,
}: {
  entry: OperationalLogEntry;
  locale: UiLocale;
  executionLabel: string;
}) {
  const loc = useMemo(() => localizeOperationalLogEntry(locale, entry), [locale, entry]);
  return (
    <li className="relative pl-5">
      <span className={cn("absolute left-0 top-1.5 size-1.5 rounded-full", railDot(entry.entryType))} aria-hidden />
      <div className="border-b border-ms-border/10 pb-3 pt-0.5 last:border-b-0 last:pb-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="hidden font-mono text-[9px] text-ms-faint/80 sm:inline">{entry.simulatedClockLabel}</span>
          <span className="text-[9px] text-ms-faint">{logEntryTypeLabel(locale, entry.entryType)}</span>
        </div>
        <p className="mt-1 text-[11px] font-medium leading-snug text-ms-text/92">{loc.headline}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-ms-muted">{loc.summary}</p>
        {loc.whyMatters ? (
          <p className="mt-1.5 text-[10px] leading-snug text-ms-faint">
            <span className="font-medium text-ms-faint/90">{executionLabel}: </span>
            {loc.whyMatters}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function OpsWorkspace({ className }: OpsWorkspaceProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const mode = useUiPrefsStore((s) => s.cognitionMode);
  const operationalLog = useCognitionSimulationStore((s) => s.operationalLog);
  const history = useCognitionSimulationStore((s) => s.history);
  const derived = useCognitionSimulationStore((s) => s.derived);
  const exec = useExecutionSurface();
  const temporal = useMemo(() => deriveLiveTemporalSurface(locale, history), [locale, history]);
  const extended = useExtendedCognitionAccess();
  const openUpgrade = useUpgradeModalStore((s) => s.openUpgrade);
  const latestSnapshot = useMemoryStore((s) => s.snapshots[0] ?? null);
  const isMobile = useIsMobileLayout();

  const structuralAll = useMemo(() => selectStructuralTimelineEntries(operationalLog, 24), [operationalLog]);
  const freeCap = 6;
  const visibleStructural = extended ? structuralAll : structuralAll.slice(0, freeCap);
  const gatedStructural = extended ? [] : structuralAll.slice(freeCap);

  const catalystEntries = useMemo(() => selectCatalystEntries(operationalLog, 6), [operationalLog]);

  const pressureLines = useMemo(() => derivePressureMigrationLines(locale, history), [locale, history]);
  const participationLines = useMemo(
    () => deriveParticipationEvolutionLines(locale, history, derived.consensus),
    [locale, history, derived.consensus],
  );
  const regimeLine = useMemo(() => deriveRegimeShiftLine(locale, history, derived.phase), [locale, history, derived.phase]);

  const stressTrail = useMemo(() => history.slice(-18).map((h) => h.dangerScore), [history]);

  const executionLabel = pickLocale(locale, "Execution", "Исполнение");
  const evolutionPanels = (
    <>
      <OpsPanel
        kicker="02"
        title={pickLocale(locale, "Execution state evolution", "Эволюция исполнения")}
        hint={pickLocale(
          locale,
          "How posture shifts affect sizing and invalidation discipline — not alerts.",
          "Как поза влияет на объём и дисциплину инвалидации — не алерты.",
        )}
        trail={<MicroTrail values={exec.stressSeries} />}
      >
        <p className="text-[11px] font-medium text-ms-text/88">{exec.executionPosture}</p>
        <p className="text-[10px] leading-relaxed text-ms-muted">{exec.evolutionHeadline}</p>
        {exec.evolutionLines.length > 0 ? (
          <ul className="mt-1 space-y-1.5 text-[10px] leading-snug text-ms-muted">
            {exec.evolutionLines.map((ln) => (
              <li key={ln} className="border-l border-ms-border/18 pl-2">
                {ln}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-[10px] text-ms-faint">{exec.executionBiasLabel}</p>
      </OpsPanel>

      <OpsPanel
        kicker="03"
        title={pickLocale(locale, "Session transition layer", "Сессионный слой")}
        hint={pickLocale(
          locale,
          "Desk session framing — liquidity and vol handoffs across UTC windows.",
          "Сессии UTC — передачи ликвидности и волы.",
        )}
        trail={<MicroTrail values={temporal.volSeries} />}
      >
        <BulletList
          items={[
            temporal.sessionLine ?? pickLocale(locale, "Session line pending.", "Сессия уточняется."),
            exec.sessionLine ?? pickLocale(locale, "Execution session read pending.", "Исполнение: сессия уточняется."),
          ]}
        />
      </OpsPanel>

      <OpsPanel
        kicker="04"
        title={pickLocale(locale, "Pressure migration", "Миграция давления")}
        hint={pickLocale(locale, "Spatial drift of stress, leverage, and coherence.", "Дрейф стресса, плеча, связности.")}
        trail={<MicroTrail values={temporal.liquiditySeries} />}
      >
        <BulletList items={pressureLines} />
        {temporal.lines.length > 0 ? (
          <p className="text-[10px] leading-snug text-ms-faint">{temporal.lines[0]}</p>
        ) : null}
      </OpsPanel>

      <OpsPanel
        kicker="05"
        title={pickLocale(locale, "Participation evolution", "Эволюция участия")}
        hint={pickLocale(locale, "Breadth, consensus, and crowding quality over the window.", "Ширина, сборка, скопление.")}
        trail={<MicroTrail values={temporal.participationSeries} />}
      >
        <BulletList items={participationLines} />
      </OpsPanel>

      <OpsPanel
        kicker="06"
        title={pickLocale(locale, "Regime shift detection", "Детекция смены режима")}
        hint={pickLocale(locale, "Major phase and volatility transitions.", "Фаза и волатильность.")}
        trail={<MicroTrail values={stressTrail} />}
      >
        <p className="text-[10px] leading-relaxed text-ms-muted">{regimeLine}</p>
      </OpsPanel>

      <OpsPanel
        kicker="07"
        title={pickLocale(locale, "Catalyst impact", "Влияние катализаторов")}
        hint={pickLocale(locale, "Macro and scenario deck shifts — compressed structural notes only.", "Макро и колода — только структурные ноты.")}
      >
        {catalystEntries.length === 0 ? (
          <p className="text-[10px] leading-relaxed text-ms-muted">{catalystFallbackLine(locale)}</p>
        ) : (
          <ul className="space-y-2">
            {catalystEntries.map((e) => {
              const loc = localizeOperationalLogEntry(locale, e);
              return (
                <li key={e.id} className="border-l border-ms-border/20 pl-2.5">
                  <p className="text-[10px] font-medium text-ms-text/85">{loc.headline}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-ms-muted">{loc.summary}</p>
                  {loc.whyMatters ? (
                    <p className="mt-1 text-[10px] leading-snug text-ms-faint">
                      {executionLabel}: {loc.whyMatters}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </OpsPanel>
    </>
  );

  const explainCtx = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      agentLattice: s.agentLattice,
    })),
  );

  return (
    <section
      id="operational-feed"
      data-ms-focus
      className={cn("scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)]", className)}
    >
      <div className="rounded-ms-xl border border-ms-border/16 bg-ms-elevated/8 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="ms-title font-medium tracking-tight text-ms-muted/95">
              {pickLocale(locale, "Operational evolution", "Операционная эволюция")}
            </h2>
            <p className="mt-1 max-w-xl text-[10px] leading-relaxed text-ms-faint sm:text-[11px]">
              {pickLocale(
                locale,
                "Structural timeline — material tape evolution only. Updates cluster when regime, pressure, participation, or execution posture moves.",
                "Структурная шкала времени — только существенные изменения. Обновления при сдвиге режима, давления, участия или позы исполнения.",
              )}
            </p>
          </div>
          <button
            type="button"
            title={pickLocale(locale, "Export snapshot", "Экспорт снимка")}
            onClick={() => {
              const { filename, body } = cognitionExportBlob(latestSnapshot);
              downloadTextFile(filename, body);
            }}
            className="ms-focus-ring inline-flex min-h-10 shrink-0 touch-manipulation items-center gap-1 rounded-ms-md px-2.5 py-2 text-[10px] font-medium text-ms-faint transition-[color,background-color] duration-200 ease-out hover:bg-ms-elevated/22 hover:text-ms-muted sm:min-h-8"
          >
            <Download className="size-3 shrink-0 opacity-70" strokeWidth={1.5} aria-hidden />
            <span className="max-sm:sr-only">{pickLocale(locale, "Export", "Экспорт")}</span>
          </button>
        </div>

        {mode === "deep" ? (
          <CognitionExplainStrip
            derived={explainCtx.derived}
            latent={explainCtx.latent}
            rows={explainCtx.agentLattice}
            className="mt-4"
          />
        ) : null}

        <div className="mt-5 space-y-[var(--ms-section-gap)]">
          <OpsPanel
            kicker="01"
            title={pickLocale(locale, "Live structural timeline", "Живая структурная шкала")}
            hint={pickLocale(
              locale,
              "Important developments only — no orchestrator noise, no bootstrap chatter.",
              "Только важное — без шума оркестратора и старта.",
            )}
            trail={<MicroTrail values={stressTrail} />}
          >
            {visibleStructural.length === 0 ? (
              <p className="text-[11px] text-ms-muted">
                {pickLocale(locale, "Structural channel quiet — waiting for material handoff.", "Структурный канал тих — ждём смену.")}
              </p>
            ) : (
              <div className="relative border-l border-ms-border/15 pl-1">
                <ol className="space-y-0">
                  {visibleStructural.map((e) => (
                    <TimelineNode key={e.id} entry={e} locale={locale} executionLabel={executionLabel} />
                  ))}
                </ol>
              </div>
            )}
            {gatedStructural.length > 0 ? (
              <div className="mt-4">
                <PremiumGate onUnlock={openUpgrade}>
                  <div className="relative border-l border-ms-border/15 pl-1 opacity-95">
                    <ol className="space-y-0">
                      {gatedStructural.slice(0, 10).map((e) => (
                        <TimelineNode key={e.id} entry={e} locale={locale} executionLabel={executionLabel} />
                      ))}
                    </ol>
                  </div>
                </PremiumGate>
              </div>
            ) : null}
          </OpsPanel>

          {isMobile ? (
            <details className="group rounded-ms-xl border border-ms-border/16 bg-ms-surface/8">
              <summary className="ms-focus-ring cursor-pointer list-none px-4 py-3 text-[11px] font-medium text-ms-muted marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  {pickLocale(locale, "Evolution layers", "Слои эволюции")}
                  <span className="font-mono text-[10px] text-ms-faint group-open:hidden">+</span>
                  <span className="hidden font-mono text-[10px] text-ms-faint group-open:inline">−</span>
                </span>
              </summary>
              <div className="space-y-[var(--ms-block-gap)] border-t border-ms-border/12 px-3 pb-4 pt-3 sm:px-4">
                {evolutionPanels}
              </div>
            </details>
          ) : (
            <div className="grid grid-cols-1 gap-[var(--ms-block-gap)] lg:grid-cols-2">{evolutionPanels}</div>
          )}
        </div>
      </div>
    </section>
  );
}

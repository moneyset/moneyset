"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";

import { CognitionPrimaryState } from "@/components/cognition/cognition-primary-state";
import { SignatureMomentBanner } from "@/components/cognition/signature-moment-banner";
import { useSystemicFragility } from "@/hooks/use-systemic-fragility";
import { useLiveSurfaceMotion } from "@/hooks/use-live-surface-motion";
import {
  systemicRiskStateClass,
  type SystemicFragilityLens,
  type TopologyCell,
  type TopologyCellKind,
} from "@/lib/intelligence/systemic-fragility-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const CELL_CLASS: Record<TopologyCellKind, string> = {
  contagion_path: "ms-systemic-cell--contagion",
  instability_field: "ms-systemic-cell--instability",
  sponsorship_decay: "ms-systemic-cell--sponsor",
  vol_stress: "ms-systemic-cell--vol",
  liquidity_fracture: "ms-systemic-cell--liquidity",
  fragility_pulse: "ms-systemic-cell--pulse",
  transmission_hub: "ms-systemic-cell--hub",
  leverage_cluster: "ms-systemic-cell--leverage",
};

function TopologyCellBlock({ cell }: { cell: TopologyCell }) {
  return (
    <article
      className={cn(
        "ms-systemic-cell",
        CELL_CLASS[cell.kind],
        cell.tone === "stress" && "ms-systemic-cell--stress",
        cell.tone === "support" && "ms-systemic-cell--support",
        cell.pulsing && "ms-systemic-cell--pulse",
      )}
      style={
        {
          left: `${cell.x}%`,
          top: `${cell.y}%`,
          width: `${cell.w}%`,
          height: `${cell.h}%`,
          "--ms-cell-emphasis": cell.emphasis,
        } as CSSProperties
      }
      title={cell.read}
    >
      <span className="ms-systemic-cell__label text-pretty">{cell.label}</span>
    </article>
  );
}

export function SystemicRiskTopology({
  className,
  lens = "unified",
}: {
  className?: string;
  lens?: SystemicFragilityLens;
}) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useSystemicFragility(lens);
  const live = useLiveSurfaceMotion(lens === "transmission" ? "transmission" : "risk");
  const [topologyMode, setTopologyMode] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);

  const style = useMemo(
    () =>
      ({
        "--ms-systemic-breath": bundle.breathPhase,
        "--ms-systemic-instab": bundle.instabilityPulse,
        "--ms-systemic-contagion": bundle.contagionSpread,
        "--ms-systemic-sponsor-fade": bundle.sponsorshipFade,
        "--ms-systemic-tick": bundle.simTick,
      }) as CSSProperties,
    [bundle],
  );

  const showRisk = lens !== "transmission";
  const showTransmission = lens !== "risk";

  return (
    <section
      className={cn(
        "ms-systemic-topology min-w-0",
        live.className,
        systemicRiskStateClass(bundle.riskState.id),
        topologyMode && "ms-systemic-topology--mode-on",
        focusMode && "ms-systemic-topology--focus",
        bundle.tension === "critical" && "ms-systemic-topology--critical",
        className,
      )}
      style={{ ...live.style, ...style }}
      data-ms-motion-phase={live.phase}
      aria-label={pickLocale(locale, "Systemic risk topology", "Топология системного риска")}
    >
      <SignatureMomentBanner world={lens === "transmission" ? "transmission" : "risk"} />
      <div className="ms-systemic-topology__void" aria-hidden />
      <div className="ms-systemic-topology__pulse-wave" aria-hidden />

      <div className="ms-systemic-topology__toolbar relative z-[3] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn("ms-exec-terrain-toggle", topologyMode && "ms-exec-terrain-toggle--on")}
            onClick={() => setTopologyMode((v) => !v)}
          >
            {pickLocale(locale, "Risk topology", "Топология риска")}
          </button>
          <button
            type="button"
            className={cn("ms-exec-terrain-toggle", focusMode && "ms-exec-terrain-toggle--on")}
            onClick={() => setFocusMode((v) => !v)}
          >
            {pickLocale(locale, "Fragility focus", "Фокус хрупкости")}
          </button>
        </div>
        <p className="ms-metadata tabular-nums">T{bundle.simTick}</p>
      </div>

      <CognitionPrimaryState
        label={pickLocale(locale, "Systemic fragility", "Системная хрупкость")}
        state={bundle.primaryState}
        subline={bundle.primarySubline}
        tension={bundle.tension}
        className="relative z-[2] mt-4"
      />

      {showRisk && !focusMode ? (
        <p className="relative z-[2] mt-2 text-[10px] font-medium uppercase tracking-wide text-ms-danger/75">
          {bundle.riskState.headline}
        </p>
      ) : null}

      {!focusMode ? (
        <ul className="relative z-[2] mt-3 space-y-1 border-l border-ms-danger/25 pl-2.5">
          {bundle.hiddenSignals.map((s) => (
            <li
              key={s.id}
              className={cn(
                "text-[10px] leading-snug",
                s.severity === "critical" ? "text-ms-danger/90" : s.severity === "elevated" ? "text-ms-warning/85" : "text-ms-muted",
              )}
            >
              {s.line}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="ms-systemic-topology__stage relative z-[1] mt-4">
        <div
          className="ms-systemic-topology__canvas"
          aria-label={pickLocale(locale, "Hidden fragility field", "Поле скрытой хрупкости")}
        >
          <div className="ms-systemic-topology__grid" aria-hidden />
          <div className="ms-systemic-topology__tectonic" aria-hidden />

          <svg className="ms-systemic-topology__arcs" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {showTransmission
              ? bundle.contagionArcs.map((arc) => (
                  <line
                    key={arc.id}
                    className="ms-systemic-topology__arc"
                    x1={arc.fromX}
                    y1={arc.fromY}
                    x2={arc.toX}
                    y2={arc.toY}
                    style={{ opacity: arc.intensity / 110 }}
                  />
                ))
              : null}
          </svg>

          {topologyMode
            ? bundle.cells
                .filter((c) => !focusMode || c.pulsing || c.kind === "instability_field" || c.kind === "fragility_pulse")
                .map((cell) => <TopologyCellBlock key={cell.id} cell={cell} />)
            : null}
        </div>

        {!focusMode ? (
          <aside className="ms-systemic-topology__aside">
            {showTransmission ? (
              <>
                <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Pressure transmission", "Передача давления")}</p>
                <ul className="mt-2 space-y-2">
                  {bundle.transmissions.slice(0, 4).map((t) => (
                    <li key={t.id} className="ms-systemic-trans-chip">
                      <div className="flex min-w-0 justify-between gap-2">
                        <span className="min-w-0 text-pretty text-[10px] font-medium leading-snug text-ms-text sm:text-[11px]">
                          {t.label}
                        </span>
                        <span className="shrink-0 tabular-nums text-[10px] text-ms-faint">{t.tensionPct}</span>
                      </div>
                      <p className="mt-0.5 text-pretty text-[10px] leading-snug text-ms-muted line-clamp-3 sm:text-[11px]">
                        {t.read}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Risk evolution", "Эволюция риска")}</p>
                <ul className="mt-2 space-y-1.5">
                  {bundle.risk.evolution.map((line) => (
                    <li key={line} className="text-[10px] leading-snug text-ms-muted sm:text-[11px]">
                      {line}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </aside>
        ) : null}
      </div>

      {!focusMode ? (
        <>
          <div className="relative z-[2] mt-4">
            <h3 className="ms-data-label text-ms-faint">{pickLocale(locale, "Agent fragility reactions", "Реакции агентов на хрупкость")}</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {bundle.agentReactions.map((a) => (
                <li
                  key={a.id}
                  className={cn(
                    "ms-systemic-agent",
                    a.escalation === "critical" && "ms-systemic-agent--critical",
                    a.escalation === "elevated" && "ms-systemic-agent--elevated",
                  )}
                >
                  <span className="text-[10px] font-semibold uppercase text-ms-faint">{a.agentId}</span>
                  <p className="mt-0.5 text-[10px] leading-snug text-ms-muted">{a.line}</p>
                </li>
              ))}
            </ul>
          </div>

          <ul className="relative z-[2] mt-4 space-y-1">
            {bundle.crossLinks.map((line) => (
              <li key={line} className="text-[10px] text-ms-faint">
                {line}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <details
        className="group relative z-[2] mt-5"
        open={replayOpen}
        onToggle={(e) => setReplayOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="ms-focus-ring cursor-pointer list-none rounded-ms-lg border border-ms-border/25 bg-ms-elevated/12 px-3 py-2.5 text-[11px] font-medium text-ms-text [&::-webkit-details-marker]:hidden">
          <span className="mr-1.5 inline-block text-ms-faint transition-transform group-open:rotate-90" aria-hidden>
            ›
          </span>
          {pickLocale(locale, "Temporal fragility evolution", "Временная эволюция хрупкости")}
        </summary>
        <ol className="mt-3 ms-systemic-evolution">
          {bundle.evolution.map((frame) => (
            <li
              key={frame.tick}
              className={cn(
                "ms-systemic-evolution__frame",
                frame.phase === "cascade" && "ms-systemic-evolution__frame--cascade",
                frame.phase === "buildup" && "ms-systemic-evolution__frame--buildup",
              )}
            >
              <span className="tabular-nums text-ms-faint">{frame.headline}</span>
              <p className="text-[10px] leading-snug text-ms-muted">{frame.note}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 flex flex-wrap gap-3 text-[10px]">
          <Link href="/execution" className="text-ms-flow/85 hover:underline">
            {pickLocale(locale, "Execution", "Исполнение")}
          </Link>
          <Link href="/agents" className="text-ms-flow/85 hover:underline">
            {pickLocale(locale, "Agents", "Агенты")}
          </Link>
          {lens === "risk" ? (
            <Link href="/cross-asset" className="text-ms-flow/85 hover:underline">
              {pickLocale(locale, "Cross-asset", "Кросс-активы")}
            </Link>
          ) : (
            <Link href="/risk-radar" className="text-ms-flow/85 hover:underline">
              {pickLocale(locale, "Risk Radar", "Risk Radar")}
            </Link>
          )}
        </p>
      </details>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";

import { CognitionInstantChips } from "@/components/cognition/cognition-instant-chips";
import { CognitionPrimaryState } from "@/components/cognition/cognition-primary-state";
import { SignatureMomentBanner } from "@/components/cognition/signature-moment-banner";
import { useGlobalNarrative } from "@/hooks/use-global-narrative";
import { useLiveSurfaceMotion } from "@/hooks/use-live-surface-motion";
import {
  globalMacroRegimeClass,
  narrativeRegimeClass,
  type GlobalNarrativeLens,
  type PressureFieldCell,
  type PressureFieldKind,
} from "@/lib/intelligence/global-narrative-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const FIELD_CLASS: Record<PressureFieldKind, string> = {
  macro_pressure: "ms-global-field--macro",
  narrative_tension: "ms-global-field--narrative",
  geo_instability: "ms-global-field--geo",
  liquidity_climate: "ms-global-field--liquidity",
  vol_topology: "ms-global-field--vol",
  policy_gravity: "ms-global-field--policy",
  crowd_band: "ms-global-field--crowd",
  transmission_arc: "ms-global-field--transmission",
};

function PressureFieldBlock({ cell }: { cell: PressureFieldCell }) {
  return (
    <article
      className={cn(
        "ms-global-field",
        FIELD_CLASS[cell.kind],
        cell.tone === "stress" && "ms-global-field--stress",
        cell.tone === "support" && "ms-global-field--support",
        cell.pulsing && "ms-global-field--pulse",
      )}
      style={
        {
          left: `${cell.x}%`,
          top: `${cell.y}%`,
          width: `${cell.w}%`,
          height: `${cell.h}%`,
          "--ms-field-emphasis": cell.emphasis,
        } as CSSProperties
      }
      title={cell.read}
    >
      <span className="ms-global-field__label">{cell.label}</span>
    </article>
  );
}

export function GlobalPressureMatrix({
  className,
  lens = "unified",
}: {
  className?: string;
  lens?: GlobalNarrativeLens;
}) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useGlobalNarrative(lens);
  const live = useLiveSurfaceMotion(lens === "sentiment" ? "sentiment" : "macro");
  const [matrixMode, setMatrixMode] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);

  const theaterStyle = useMemo(
    () =>
      ({
        "--ms-global-breath": bundle.breathPhase,
        "--ms-global-narr-accel": bundle.narrativeAcceleration,
        "--ms-global-macro-instab": bundle.macroInstability,
        "--ms-global-geo-stress": bundle.geoStress,
        "--ms-global-tick": bundle.simTick,
      }) as CSSProperties,
    [bundle],
  );

  const showMacro = lens !== "sentiment";
  const showSentiment = lens !== "macro";

  return (
    <section
      className={cn(
        "ms-global-matrix",
        "ms-signature-surface",
        "ms-planetary-matrix",
        live.className,
        globalMacroRegimeClass(bundle.macroRegime.id),
        narrativeRegimeClass(bundle.narrativeRegime.id),
        matrixMode && "ms-global-matrix--mode-on",
        focusMode && "ms-global-matrix--focus",
        bundle.tension === "critical" && "ms-global-matrix--critical",
        className,
      )}
      style={{ ...live.style, ...theaterStyle }}
      data-ms-motion-phase={live.phase}
      aria-label={pickLocale(locale, "Global pressure matrix", "Глобальная матрица давления")}
    >
      <SignatureMomentBanner world={lens === "sentiment" ? "sentiment" : "macro"} />
      <div className="ms-global-matrix__atmosphere" aria-hidden />
      <div className="ms-global-matrix__orbit" aria-hidden />
      <div className="ms-global-matrix__wave" aria-hidden />

      <div className="ms-global-matrix__toolbar relative z-[3] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn("ms-exec-terrain-toggle", matrixMode && "ms-exec-terrain-toggle--on")}
            onClick={() => setMatrixMode((v) => !v)}
          >
            {pickLocale(locale, "Pressure matrix", "Матрица давления")}
          </button>
          <button
            type="button"
            className={cn("ms-exec-terrain-toggle", focusMode && "ms-exec-terrain-toggle--on")}
            onClick={() => setFocusMode((v) => !v)}
          >
            {pickLocale(locale, "Narrative focus", "Фокус нарратива")}
          </button>
        </div>
        <p className="ms-metadata tabular-nums">T{bundle.simTick}</p>
      </div>

      <CognitionPrimaryState
        label={pickLocale(locale, "Global market story", "Глобальная рыночная история")}
        state={bundle.primaryState}
        subline={bundle.primarySubline}
        tension={bundle.tension}
        className="relative z-[2] mt-4"
      />

      <CognitionInstantChips className="relative z-[2] mt-3" />

      <div className="ms-global-matrix__stage relative z-[1] mt-4">
        <div
          className="ms-global-matrix__canvas"
          aria-label={pickLocale(locale, "Macro and sentiment pressure field", "Поле макро и настроений")}
        >
          <div className="ms-global-matrix__grid" aria-hidden />
          <div className="ms-global-matrix__orb" aria-hidden />

          {matrixMode ? bundle.pressureFields.map((cell) => <PressureFieldBlock key={cell.id} cell={cell} />) : null}

          <svg className="ms-global-matrix__arcs" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {bundle.transmissions.map((t) => (
              <line
                key={t.id}
                className="ms-global-matrix__arc"
                x1={t.fromX}
                y1={t.fromY}
                x2={t.toX}
                y2={t.toY}
                style={{ opacity: t.intensity / 120 }}
              />
            ))}
          </svg>

          {bundle.eventGravity.map((ev) => (
            <div
              key={ev.id}
              className={cn("ms-global-event-gravity", `ms-global-event-gravity--${ev.id}`)}
              style={
                {
                  left: `${ev.x}%`,
                  top: `${ev.y}%`,
                  width: `${ev.w}%`,
                  "--ms-event-distortion": ev.distortion,
                } as CSSProperties
              }
              title={ev.deformation}
            >
              <span className="ms-global-event-gravity__label">{ev.label}</span>
            </div>
          ))}

          {(focusMode ? bundle.divergences.slice(0, 2) : bundle.divergences).map((d) => (
            <p
              key={d.id}
              className={cn(
                "ms-global-divergence text-pretty",
                d.severity === "critical" && "ms-global-divergence--critical",
                d.severity === "elevated" && "ms-global-divergence--elevated",
              )}
              style={
                {
                  left: `${d.x}%`,
                  top: `${d.y}%`,
                  width: `${d.w}%`,
                } as CSSProperties
              }
            >
              {d.line}
            </p>
          ))}
        </div>

        {!focusMode ? (
          <aside className="ms-global-matrix__aside">
            {showMacro ? (
              <div className="ms-global-matrix__regime-card">
                <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Macro regime", "Макро-режим")}</p>
                <p className="mt-1 text-[11px] font-medium text-ms-text">{bundle.macroRegime.headline}</p>
              </div>
            ) : null}
            {showSentiment ? (
              <div className="ms-global-matrix__regime-card">
                <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Narrative regime", "Нарративный режим")}</p>
                <p className="mt-1 text-[11px] font-medium text-ms-text">{bundle.narrativeRegime.headline}</p>
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>

      {!focusMode ? (
        <>
          <details className="relative z-[2] mt-4 ms-global-event-panel">
            <summary className="ms-focus-ring ms-cognition-density__summary">
              {pickLocale(locale, "Event gravity", "Гравитация событий")}
            </summary>
            <ul className="mt-2 grid gap-2 sm:grid-cols-3">
              {bundle.eventGravity.map((ev) => (
                <li key={ev.id} className="ms-global-event-panel__cell">
                  <p className="text-[10px] font-medium text-ms-cognition/90">{ev.label}</p>
                  <p className="mt-1 text-[9px] tabular-nums text-ms-faint">{ev.distortion}</p>
                </li>
              ))}
            </ul>
            <ul className="mt-3 space-y-1 border-l border-ms-flow/20 pl-2">
              {bundle.storyBeats.map((beat) => (
                <li key={beat.id} className="ms-exec-implication text-pretty">
                  {beat.line}
                </li>
              ))}
            </ul>
          </details>

          <ul className="relative z-[2] mt-4 ms-global-cross">
            {bundle.crossLinks.map((line) => (
              <li key={line} className="text-[10px] leading-snug text-ms-faint">
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
          {pickLocale(locale, "Temporal narrative replay", "Временной реплей нарратива")}
        </summary>
        <ol className="mt-3 ms-global-replay">
          {bundle.replay.map((frame) => (
            <li key={frame.tick} className="ms-global-replay__frame">
              <span className="tabular-nums text-ms-faint">T{frame.tick}</span>
              <p className="text-[10px] leading-snug text-ms-muted">{frame.storyLine}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 flex flex-wrap gap-3 text-[10px]">
          <Link href="/execution" className="text-ms-flow/85 hover:underline">
            {pickLocale(locale, "Execution", "Исполнение")}
          </Link>
          <Link href="/cross-asset" className="text-ms-flow/85 hover:underline">
            {pickLocale(locale, "Cross-asset", "Кросс-активы")}
          </Link>
        </p>
      </details>
    </section>
  );
}

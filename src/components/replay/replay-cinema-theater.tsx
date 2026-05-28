"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

import { SignatureMomentBanner } from "@/components/cognition/signature-moment-banner";
import { ReplayStateComparisonPanel } from "@/components/replay/replay-state-comparison";
import { ReplayTimelineNav } from "@/components/replay/replay-timeline-nav";
import { useLiveSurfaceMotion } from "@/hooks/use-live-surface-motion";
import type { ReplayCinemaBundle } from "@/lib/intelligence/replay-cinema-engine";
import type { CriticalMomentKind } from "@/lib/intelligence/replay-cinema-engine";
import {
  buildStateComparison,
  previousSlot,
  slotForFrameIndex,
} from "@/lib/intelligence/replay-timeline-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const MOMENT_CLASS: Record<CriticalMomentKind, string> = {
  continuation_collapse: "ms-replay-moment--collapse",
  sponsorship_failure: "ms-replay-moment--sponsor",
  leverage_cascade: "ms-replay-moment--leverage",
  volatility_expansion: "ms-replay-moment--vol",
  reclaim_rejection: "ms-replay-moment--reclaim",
  instability_emergence: "ms-replay-moment--instab",
  consensus_fracture: "ms-replay-moment--fracture",
  scenario_rotation: "ms-replay-moment--scenario",
};

const LAYER_KEYS = ["structure", "liquidity", "agents", "macro", "sentiment", "execution"] as const;

const LAYER_LABELS: Record<(typeof LAYER_KEYS)[number], { en: string; ru: string }> = {
  structure: { en: "Structure", ru: "Структура" },
  liquidity: { en: "Liquidity", ru: "Ликвидность" },
  agents: { en: "Agents", ru: "Агенты" },
  macro: { en: "Macro", ru: "Макро" },
  sentiment: { en: "Sentiment", ru: "Настроение" },
  execution: { en: "Execution", ru: "Исполнение" },
};

type ReplayCinemaTheaterProps = {
  bundle: ReplayCinemaBundle;
  className?: string;
};

export function ReplayCinemaTheater({ bundle, className }: ReplayCinemaTheaterProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const mobileReduced = useUiPrefsStore((s) => s.replayMobileDetail === "reduced");
  const live = useLiveSurfaceMotion("replay");
  const [frameIndex, setFrameIndex] = useState(() => Math.max(0, bundle.frameCount - 1));
  const [playing, setPlaying] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(true);
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    structure: true,
    liquidity: true,
    agents: true,
    macro: true,
    sentiment: false,
    execution: true,
  });

  const maxIndex = Math.max(0, bundle.frameCount - 1);
  const frame = bundle.frames[frameIndex] ?? bundle.frames[0];
  const progress = maxIndex > 0 ? frameIndex / maxIndex : 0;

  const activeSlot = useMemo(
    () => slotForFrameIndex(bundle.timeline, frameIndex),
    [bundle.timeline, frameIndex],
  );

  const comparison = useMemo(() => {
    if (!activeSlot) return null;
    const prev = previousSlot(bundle.timeline, activeSlot);
    return buildStateComparison(locale, bundle.frames, activeSlot, prev);
  }, [activeSlot, bundle.frames, bundle.timeline, locale]);

  useEffect(() => {
    setFrameIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (bundle.frameCount > 0) {
      setFrameIndex(bundle.frameCount - 1);
    }
  }, [bundle.frameCount]);

  useEffect(() => {
    if (!playing || bundle.frameCount <= 1) return;
    const id = window.setInterval(() => {
      setFrameIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 900);
    return () => window.clearInterval(id);
  }, [playing, maxIndex, bundle.frameCount]);

  const goToFrame = useCallback(
    (fi: number) => {
      setFrameIndex(Math.max(0, Math.min(maxIndex, fi)));
      setPlaying(false);
    },
    [maxIndex],
  );

  const theaterStyle = useMemo(
    () =>
      ({
        "--ms-replay-progress": progress,
        "--ms-replay-pressure": frame?.pressurePct ?? 50,
        "--ms-replay-instability": frame?.instabilityPct ?? 40,
        "--ms-replay-sponsorship": frame?.sponsorshipPct ?? 60,
      }) as CSSProperties,
    [progress, frame],
  );

  if (!frame) return null;

  const showDeepPanels = !mobileReduced;

  return (
    <section
      className={cn(
        "ms-replay-cinema",
        "ms-signature-surface",
        live.className,
        cinemaMode && "ms-replay-cinema--on",
        mobileReduced && "ms-replay-cinema--reduced",
        className,
      )}
      style={{ ...live.style, ...theaterStyle }}
      data-ms-motion-phase={live.phase}
      aria-label={pickLocale(locale, "Replay cinema", "Кинотеатр реплея")}
    >
      <SignatureMomentBanner world="replay" />
      <div className="ms-replay-cinema__curtain" aria-hidden />
      <div className="ms-replay-cinema__veil" aria-hidden />
      <div className="ms-replay-cinema__echo" aria-hidden />

      <header className="relative z-[2]">
        <p className="ms-replay-cinema__tag">
          {pickLocale(locale, "Market memory terminal", "Терминал рыночной памяти")}
        </p>
        <h2 className="ms-replay-cinema__title">{bundle.headline}</h2>
        <p className="ms-replay-cinema__subline">{bundle.subline}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={cn("ms-replay-cinema-btn", playing && "ms-replay-cinema-btn--on")}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? pickLocale(locale, "Pause", "Пауза") : pickLocale(locale, "Play", "Воспроизведение")}
          </button>
          <button
            type="button"
            className={cn("ms-replay-cinema-btn", cinemaMode && "ms-replay-cinema-btn--on")}
            onClick={() => setCinemaMode((v) => !v)}
          >
            {pickLocale(locale, "Cinema mode", "Режим кино")}
          </button>
        </div>
      </header>

      {/* T-3 → NOW structural timeline */}
      <div className="relative z-[2] mt-5">
        <ReplayTimelineNav
          slots={bundle.timeline}
          activeFrameIndex={frameIndex}
          onSelect={goToFrame}
          compact={mobileReduced}
        />
      </div>

      <div className="ms-replay-cinema__scrub relative z-[2] mt-4">
        <input
          type="range"
          min={0}
          max={maxIndex}
          value={frameIndex}
          onChange={(e) => {
            setPlaying(false);
            setFrameIndex(Number(e.target.value));
          }}
          className="ms-replay-cinema__slider w-full"
          aria-label={pickLocale(locale, "Timeline scrub", "Прокрутка таймлайна")}
        />
        <div className="mt-1 flex justify-between text-[9px] tabular-nums text-ms-faint">
          <span>{activeSlot?.offset ?? "—"} · {frame.clock}</span>
          <span>
            {frameIndex + 1} / {bundle.frameCount}
          </span>
        </div>
      </div>

      {/* Active frame + state comparison */}
      <div className="relative z-[1] mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="ms-replay-cinema__frame ms-replay-cinema__stage">
          <p className="ms-replay-cinema__frame-clock">
            {activeSlot?.offset ?? "—"} · {frame.clock}
          </p>
          <h3 className="ms-replay-cinema__frame-headline">{frame.headline}</h3>
          <p className="ms-replay-cinema__frame-read">{frame.structuralRead}</p>
          <p className="mt-2 border-l-2 border-ms-consensus/30 pl-2 text-[10px] leading-snug text-ms-cognition/88">
            {frame.executionDrift}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="ms-replay-cinema__gauge">
              <span className="ms-data-label text-ms-faint">{pickLocale(locale, "Pressure", "Давление")}</span>
              <span className="tabular-nums text-ms-text">{frame.pressurePct}</span>
            </div>
            <div className="ms-replay-cinema__gauge">
              <span className="ms-data-label text-ms-faint">{pickLocale(locale, "Instability", "Нестабильность")}</span>
              <span className="tabular-nums text-ms-text">{frame.instabilityPct}</span>
            </div>
            <div className="ms-replay-cinema__gauge">
              <span className="ms-data-label text-ms-faint">{pickLocale(locale, "Sponsorship", "Спонсорство")}</span>
              <span className="tabular-nums text-ms-text">{frame.sponsorshipPct}</span>
            </div>
          </div>

          <div className="ms-replay-cinema__layers mt-4" aria-label={pickLocale(locale, "Synchronized layers", "Синхронизированные слои")}>
            <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Evolution layers", "Слои эволюции")}</p>
            <ul className="mt-2 space-y-2">
              {LAYER_KEYS.map((key) => {
                const on = activeLayers[key] !== false;
                const val = frame.layers[key];
                const label = LAYER_LABELS[key];
                return (
                  <li key={key} className={cn("ms-replay-layer-row", on && "ms-replay-layer-row--on")}>
                    <button
                      type="button"
                      className="ms-replay-layer-toggle"
                      onClick={() => setActiveLayers((s) => ({ ...s, [key]: !on }))}
                    >
                      {pickLocale(locale, label.en, label.ru)}
                    </button>
                    <div className="ms-replay-layer-bar" aria-hidden>
                      <span style={{ width: on ? `${val}%` : "4%" }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </article>

        {comparison && activeSlot ? (
          <ReplayStateComparisonPanel
            comparison={comparison}
            metadata={{
              regimeShift: activeSlot.regimeShift,
              consensusShift: activeSlot.consensusShift,
              confidenceShift: activeSlot.confidenceShift,
              scenarioChange: activeSlot.scenarioChange,
            }}
          />
        ) : null}
      </div>

      {showDeepPanels && bundle.criticalMoments.length > 0 ? (
        <section className="relative z-[2] mt-6">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ms-consensus/80">
            {pickLocale(locale, "Structural moments", "Структурные моменты")}
          </h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {bundle.criticalMoments.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={cn("ms-replay-moment w-full text-left", MOMENT_CLASS[m.kind])}
                  onClick={() => goToFrame(m.frameIndex)}
                >
                  <span className="font-mono text-[9px] text-ms-faint">{m.clock}</span>
                  <p className="mt-0.5 text-[11px] font-medium text-ms-text">{m.headline}</p>
                  <p className="mt-1 text-[10px] leading-snug text-ms-muted">{m.detail}</p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showDeepPanels ? (
        <section className="relative z-[2] mt-6 grid gap-5 lg:grid-cols-2">
          <div className="ms-replay-cinema-panel">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ms-consensus/80">
              {pickLocale(locale, "Cognition drift", "Дрейф прочтения")}
            </h3>
            <ul className="mt-2 space-y-1.5">
              {bundle.cognitionDrift.map((d) => (
                <li
                  key={d.id}
                  className={cn(
                    "text-[10px] leading-snug",
                    d.severity === "critical" ? "text-ms-danger/90" : d.severity === "elevated" ? "text-ms-warning/90" : "text-ms-muted",
                  )}
                >
                  {d.line}
                </li>
              ))}
            </ul>
          </div>
          <div className="ms-replay-cinema-panel">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ms-consensus/80">
              {pickLocale(locale, "Agent replay", "Реплей агентов")}
            </h3>
            <ol className="mt-2 space-y-2">
              {bundle.agentEpochs.map((ep) => (
                <li key={ep.tick} className="flex gap-2 border-l border-ms-cognition/20 pl-2 text-[10px]">
                  <span className="shrink-0 font-mono text-ms-faint">{ep.clock}</span>
                  <div>
                    <p className="font-medium text-ms-text">
                      {ep.leaderId}
                      {ep.fracture ? " · fracture" : ""}
                      {ep.riskEscalated ? " · risk↑" : ""}
                    </p>
                    <p className="text-ms-muted">{ep.note}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/agents" className="mt-3 inline-block text-[10px] text-ms-cognition/85 hover:underline">
              {pickLocale(locale, "Open Agents war room", "Открыть зал агентов")}
            </Link>
          </div>
        </section>
      ) : null}

      <p className="relative z-[2] mt-6 flex flex-wrap gap-3 text-[10px] text-ms-faint">
        <Link href="/labs/chart" className="hover:text-ms-cognition/85">
          {pickLocale(locale, "Chart terrain", "Рельеф chart")}
        </Link>
        <Link href="/labs/liquidity" className="hover:text-ms-cognition/85">
          {pickLocale(locale, "Liquidity theater", "Театр ликвидности")}
        </Link>
        <Link href="/memory" className="hover:text-ms-cognition/85">
          {pickLocale(locale, "Strategy memory", "Память стратегии")}
        </Link>
      </p>
    </section>
  );
}

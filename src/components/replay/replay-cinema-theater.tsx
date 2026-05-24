"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

import { SignatureMomentBanner } from "@/components/cognition/signature-moment-banner";
import { useReplayCinema } from "@/hooks/use-replay-cinema";
import { useLiveSurfaceMotion } from "@/hooks/use-live-surface-motion";
import type { CriticalMomentKind } from "@/lib/intelligence/replay-cinema-engine";
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

export function ReplayCinemaTheater({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useReplayCinema();
  const live = useLiveSurfaceMotion("replay");
  const [frameIndex, setFrameIndex] = useState(0);
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

  useEffect(() => {
    setFrameIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (!playing || bundle.frameCount <= 1) return;
    const id = window.setInterval(() => {
      setFrameIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 900);
    return () => window.clearInterval(id);
  }, [playing, maxIndex, bundle.frameCount]);

  const goToMoment = useCallback(
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

  return (
    <section
      className={cn(
        "ms-replay-cinema",
        "ms-signature-surface",
        live.className,
        cinemaMode && "ms-replay-cinema--on",
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
        <p className="ms-replay-cinema__tag">{pickLocale(locale, "Temporal cognition cinema", "Кинотеатр временного прочтения")}</p>
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

      <div className="ms-replay-cinema__scrub relative z-[2] mt-5">
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
          <span>{frame.clock}</span>
          <span>
            {frameIndex + 1} / {bundle.frameCount}
          </span>
        </div>
      </div>

      <article className="ms-replay-cinema__stage relative z-[1] mt-5">
        <div className="ms-replay-cinema__frame">
          <p className="ms-replay-cinema__frame-clock">{frame.clock}</p>
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
        </div>

        <div className="ms-replay-cinema__layers" aria-label={pickLocale(locale, "Synchronized layers", "Синхронизированные слои")}>
          <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Market memory layers", "Слои рыночной памяти")}</p>
          <ul className="mt-2 space-y-2">
            {LAYER_KEYS.map((key) => {
              const on = activeLayers[key] !== false;
              const val = frame.layers[key];
              return (
                <li key={key} className={cn("ms-replay-layer-row", on && "ms-replay-layer-row--on")}>
                  <button
                    type="button"
                    className="ms-replay-layer-toggle"
                    onClick={() => setActiveLayers((s) => ({ ...s, [key]: !on }))}
                  >
                    {key}
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

      {bundle.criticalMoments.length > 0 ? (
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
                  onClick={() => goToMoment(m.frameIndex)}
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

      <details className="group relative z-[2] mt-6 lg:hidden">
        <summary className="ms-focus-ring cursor-pointer list-none rounded-ms-lg border border-ms-border/25 bg-ms-elevated/12 px-3 py-2.5 text-[11px] font-medium [&::-webkit-details-marker]:hidden">
          <span className="mr-1.5 inline-block text-ms-faint transition-transform group-open:rotate-90" aria-hidden>
            ›
          </span>
          {pickLocale(locale, "Deep layer archives", "Архив глубоких слоёв")}
        </summary>
        <p className="mt-3 text-[10px] text-ms-faint">
          {pickLocale(locale, "Use desktop width for full six-lens archive.", "На широком экране — полный архив из шести линз.")}
        </p>
      </details>

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

"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";

import { CognitionPrimaryState } from "@/components/cognition/cognition-primary-state";
import { useExecutionTerrain } from "@/hooks/use-execution-terrain";
import type { ScenarioPathLane, TerrainBand, TerrainLayerKind } from "@/lib/execution/execution-terrain-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const LAYER_CLASS: Record<TerrainLayerKind, string> = {
  shelf: "ms-exec-terrain-band--shelf",
  invalidation: "ms-exec-terrain-band--invalidation",
  pressure: "ms-exec-terrain-band--pressure",
  participation: "ms-exec-terrain-band--participation",
  sponsorship: "ms-exec-terrain-band--sponsorship",
  corridor: "ms-exec-terrain-band--corridor",
  fragility: "ms-exec-terrain-band--fragility",
  acceptance: "ms-exec-terrain-band--acceptance",
};

const PATH_CLASS: Record<ScenarioPathLane["rank"], string> = {
  dominant: "ms-exec-path--dominant",
  secondary: "ms-exec-path--secondary",
  failure: "ms-exec-path--failure",
  volatility: "ms-exec-path--volatility",
  instability: "ms-exec-path--instability",
};

function TerrainBandBlock({ band }: { band: TerrainBand }) {
  return (
    <article
      className={cn(
        "ms-exec-terrain-band",
        LAYER_CLASS[band.kind],
        band.tone === "stress" && "ms-exec-terrain-band--stress",
        band.tone === "support" && "ms-exec-terrain-band--support",
      )}
      style={
        {
          top: `${band.y}%`,
          height: `${band.h}%`,
          "--ms-band-emphasis": band.emphasis,
        } as CSSProperties
      }
    >
      <span className="ms-exec-terrain-band__label">{band.label}</span>
      {band.priceBand ? <span className="ms-exec-terrain-band__price tabular-nums">{band.priceBand}</span> : null}
    </article>
  );
}

export function ExecutionTerrainTheater({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useExecutionTerrain();
  const [focusMode, setFocusMode] = useState(false);
  const [terrainMode, setTerrainMode] = useState(true);
  const [replayOpen, setReplayOpen] = useState(false);

  const theaterStyle = useMemo(
    () =>
      ({
        "--ms-exec-breath": bundle.breathPhase,
        "--ms-exec-continuation": bundle.continuationQuality,
        "--ms-exec-sponsorship": bundle.sponsorshipIntegrity,
        "--ms-exec-divergence": bundle.scenarioDivergence,
        "--ms-exec-migration": bundle.pathMigration,
        "--ms-exec-tick": bundle.simTick,
      }) as CSSProperties,
    [bundle],
  );

  const dominantPath = bundle.paths.find((p) => p.rank === "dominant");

  return (
    <section
      className={cn(
        "ms-exec-terrain-theater",
        terrainMode && "ms-exec-terrain-theater--mode-on",
        focusMode && "ms-exec-terrain-theater--focus",
        bundle.tension === "critical" && "ms-exec-terrain-theater--critical",
        className,
      )}
      style={theaterStyle}
      aria-label={pickLocale(locale, "Execution terrain engine", "Движок рельефа исполнения")}
    >
      <div className="ms-exec-terrain-theater__atmosphere" aria-hidden />
      <div className="ms-exec-terrain-theater__scan" aria-hidden />

      <div className="ms-exec-terrain-theater__toolbar relative z-[3] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn("ms-exec-terrain-toggle", terrainMode && "ms-exec-terrain-toggle--on")}
            onClick={() => setTerrainMode((v) => !v)}
          >
            {pickLocale(locale, "Terrain mode", "Режим рельефа")}
          </button>
          <button
            type="button"
            className={cn("ms-exec-terrain-toggle", focusMode && "ms-exec-terrain-toggle--on")}
            onClick={() => setFocusMode((v) => !v)}
          >
            {pickLocale(locale, "Execution focus", "Фокус исполнения")}
          </button>
        </div>
        <p className="text-[10px] tabular-nums text-ms-faint">
          {bundle.symbol}
          {bundle.hasTape ? "" : ` · ${pickLocale(locale, "awaiting tape", "ждём ленту")}`}
        </p>
      </div>

      <CognitionPrimaryState
        label={pickLocale(locale, "Execution posture", "Поза исполнения")}
        state={bundle.posture}
        subline={bundle.headline}
        tension={bundle.tension}
        className="relative z-[2] mt-4"
      />

      {!focusMode ? (
        <div className="relative z-[2] mt-3 grid gap-2 sm:grid-cols-3">
          <div className="ms-exec-terrain-metric">
            <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Continuation quality", "Качество продолжения")}</p>
            <p className="ms-exec-terrain-metric__value tabular-nums">{bundle.continuationQuality}</p>
          </div>
          <div className="ms-exec-terrain-metric">
            <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Sponsorship integrity", "Целостность спонсорства")}</p>
            <p className="ms-exec-terrain-metric__value tabular-nums">{bundle.sponsorshipIntegrity}</p>
          </div>
          <div className="ms-exec-terrain-metric">
            <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Scenario divergence", "Расхождение сценариев")}</p>
            <p className="ms-exec-terrain-metric__value tabular-nums">{bundle.scenarioDivergence}</p>
          </div>
        </div>
      ) : null}

      <div className="ms-exec-terrain-theater__stage relative z-[1] mt-4">
        <div className="ms-exec-terrain-theater__overlay-stack" aria-hidden>
          {bundle.overlays.map((o) => (
            <div
              key={o.id}
              className={cn("ms-exec-terrain-overlay", o.migrating && "ms-exec-terrain-overlay--migrate")}
              style={{ opacity: o.opacity / 100 }}
            >
              <span className="ms-exec-terrain-overlay__label">{o.label}</span>
            </div>
          ))}
        </div>

        <div
          className="ms-exec-terrain-theater__canvas"
          aria-label={pickLocale(locale, "Structural execution terrain", "Структурный рельеф исполнения")}
        >
          <div className="ms-exec-terrain-canvas__grid" aria-hidden />
          <div className="ms-exec-terrain-canvas__ridge" aria-hidden />

          <svg className="ms-exec-terrain-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {bundle.paths.map((p, idx) => (
              <path
                key={p.id}
                className={cn("ms-exec-terrain-path", PATH_CLASS[p.rank], p.evolving && "ms-exec-terrain-path--evolve")}
                d={`M 4 ${p.yAnchor} Q 50 ${p.yAnchor - 6 - idx * 2} 96 ${p.yAnchor + (idx % 2 === 0 ? 4 : -3)}`}
                fill="none"
                strokeWidth="0.55"
              />
            ))}
          </svg>

          {terrainMode
            ? bundle.bands.map((band) => <TerrainBandBlock key={band.id} band={band} />)
            : null}

          {bundle.annotations.slice(0, focusMode ? 3 : 5).map((a) => (
            <p
              key={a.id}
              className={cn(
                "ms-exec-terrain-annotation",
                a.severity === "critical" && "ms-exec-terrain-annotation--critical",
                a.severity === "elevated" && "ms-exec-terrain-annotation--elevated",
              )}
              style={{ top: `${a.canvasY}%` } as CSSProperties}
            >
              {a.line}
            </p>
          ))}
        </div>

        {dominantPath ? (
          <aside className="ms-exec-terrain-path-card">
            <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Dominant path", "Доминирующий путь")}</p>
            <p className="mt-1 text-[12px] font-medium text-ms-text">{dominantPath.title}</p>
            <p className="mt-1 text-[10px] leading-snug text-ms-muted">{dominantPath.pathLine}</p>
            <p className="mt-2 text-[10px] leading-snug text-ms-cognition/85">{dominantPath.conviction}</p>
          </aside>
        ) : null}
      </div>

      {!focusMode ? (
        <>
          <ul className="relative z-[2] mt-4 ms-exec-terrain-path-legend">
            {bundle.paths.map((p) => (
              <li key={`leg-${p.id}`} className={cn("ms-exec-terrain-path-legend__item", PATH_CLASS[p.rank])}>
                <span className="font-medium">{p.title}</span>
                <span className="text-ms-faint">{p.rank}</span>
              </li>
            ))}
          </ul>

          <div className="relative z-[2] mt-4 grid gap-3 lg:grid-cols-2">
            <div className="ms-exec-terrain-panel">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ms-flow/90">
                {pickLocale(locale, "Structural overlays", "Структурные оверлеи")}
              </h3>
              <ul className="mt-2 space-y-2">
                {bundle.overlays.map((o) => (
                  <li key={`o-${o.id}`} className="text-[10px] leading-snug text-ms-muted">
                    <span className="font-medium text-ms-text">{o.label}</span>
                    <span className="text-ms-border/40"> — </span>
                    {o.read}
                  </li>
                ))}
              </ul>
            </div>
            <div className="ms-exec-terrain-panel">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ms-flow/90">
                {pickLocale(locale, "Execution gravity", "Гравитация исполнения")}
              </h3>
              <ul className="mt-2 space-y-1.5 border-l border-ms-flow/25 pl-2">
                {bundle.executionImplications.map((line) => (
                  <li key={line} className="text-[10px] leading-snug text-ms-muted">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
          {pickLocale(locale, "Structural replay — cognition window", "Структурный реплей — окно прочтения")}
        </summary>
        <ol className="mt-3 ms-exec-terrain-replay">
          {bundle.replay.map((frame) => (
            <li key={frame.tick} className="ms-exec-terrain-replay__frame">
              <span className="tabular-nums text-ms-faint">{frame.headline}</span>
              <p className="text-[10px] leading-snug text-ms-muted">{frame.note}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[10px]">
          <Link href="/replay" className="text-ms-flow/85 hover:underline">
            {pickLocale(locale, "Open Replay Studio", "Открыть Replay Studio")}
          </Link>
        </p>
      </details>

      <p className="relative z-[2] mt-4 flex flex-wrap gap-3 text-[10px] text-ms-faint lg:hidden">
        <span>{pickLocale(locale, "Pinch terrain · swipe paths", "Сведите пальцы · свайп путей")}</span>
      </p>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";

import { CognitionPrimaryState } from "@/components/cognition/cognition-primary-state";
import { useExecutionTerrain } from "@/hooks/use-execution-terrain";
import { useMapFocus } from "@/hooks/use-map-focus";
import type { ScenarioPathLane, TerrainBand, TerrainLayerKind } from "@/lib/execution/execution-terrain-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore, type UiLocale } from "@/store/ui-prefs-store";

const LAYER_CLASS: Record<TerrainLayerKind, string> = {
  shelf:         "ms-exec-terrain-band--shelf",
  invalidation:  "ms-exec-terrain-band--invalidation",
  pressure:      "ms-exec-terrain-band--pressure",
  participation: "ms-exec-terrain-band--participation",
  sponsorship:   "ms-exec-terrain-band--sponsorship",
  corridor:      "ms-exec-terrain-band--corridor",
  fragility:     "ms-exec-terrain-band--fragility",
  acceptance:    "ms-exec-terrain-band--acceptance",
};

const PATH_CLASS: Record<ScenarioPathLane["rank"], string> = {
  dominant:    "ms-exec-terrain-path--dominant",
  secondary:   "ms-exec-path--secondary",
  failure:     "ms-exec-terrain-path--failure",
  volatility:  "ms-exec-terrain-path--volatility",
  instability: "ms-exec-terrain-path--instability",
};

/** Kind → short readable category */
function kindLabel(locale: UiLocale, kind: TerrainLayerKind): string {
  const m: Record<TerrainLayerKind, { en: string; ru: string }> = {
    shelf:         { en: "Shelf",          ru: "Полка" },
    invalidation:  { en: "Invalidation",   ru: "Инвалидация" },
    pressure:      { en: "Pressure",       ru: "Давление" },
    participation: { en: "Participation",  ru: "Участие" },
    sponsorship:   { en: "Sponsorship",    ru: "Спонсорство" },
    corridor:      { en: "Corridor",       ru: "Коридор" },
    fragility:     { en: "Fragility",      ru: "Хрупкость" },
    acceptance:    { en: "Acceptance",     ru: "Принятие" },
  };
  const e = m[kind];
  return locale === "ru" ? e.ru : e.en;
}

type BandBlockProps = {
  band: TerrainBand;
  isPriority: boolean;
  isExpanded: boolean;
  onTap: () => void;
};

function TerrainBandBlock({ band, isPriority, isExpanded, onTap }: BandBlockProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={band.label}
      className={cn(
        "ms-exec-terrain-band cursor-pointer select-none",
        LAYER_CLASS[band.kind],
        band.tone === "stress"   && "ms-exec-terrain-band--stress",
        band.tone === "support"  && "ms-exec-terrain-band--support",
        isPriority               && "ms-exec-terrain-band--priority-1",
        isExpanded               && "ms-exec-terrain-band--expanded",
      )}
      style={
        {
          top: `${band.y}%`,
          height: `${band.h}%`,
          "--ms-band-emphasis": band.emphasis,
        } as CSSProperties
      }
      onClick={onTap}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onTap(); }}
    >
      {isPriority && !isExpanded ? (
        <span className="mr-1 inline-block size-1.5 rounded-full bg-ms-flow/80" aria-hidden />
      ) : null}
      <span className="ms-exec-terrain-band__label">{band.label}</span>
      {band.priceBand ? (
        <span className="ms-exec-terrain-band__price tabular-nums">{band.priceBand}</span>
      ) : null}
      {isExpanded ? (
        <span className="ms-exec-terrain-band__read">{band.read}</span>
      ) : null}
    </article>
  );
}

/** Context for each of the 4 priority zones */
function useZoneContext(locale: UiLocale, bundle: ReturnType<typeof useExecutionTerrain>) {
  return useMemo(() => {
    const sortedBands = [...bundle.bands].sort((a, b) => b.emphasis - a.emphasis);
    const topBand     = sortedBands[0] ?? null;
    const riskBand    = sortedBands.find((b) => b.kind === "invalidation" || b.tone === "stress") ?? null;
    const oppBand     = sortedBands.find((b) => b.kind === "shelf" || b.kind === "acceptance" || b.tone === "support") ?? null;
    const invalidBand = sortedBands.find((b) => b.kind === "invalidation") ?? riskBand;

    return {
      mostImportant: topBand
        ? { label: topBand.label, read: topBand.framing }
        : { label: pickLocale(locale, "Primary zone forming", "Основная зона формируется"), read: "" },
      currentLocation: {
        label: bundle.posture,
        read: bundle.headline,
      },
      riskArea: riskBand
        ? { label: riskBand.label, read: riskBand.framing }
        : { label: pickLocale(locale, "Risk zone below current structure", "Зона риска ниже текущей структуры"), read: bundle.headline },
      opportunityArea: oppBand
        ? { label: oppBand.label, read: oppBand.framing }
        : { label: pickLocale(locale, "Opportunity zone aligning", "Зона возможности выстраивается"), read: "" },
      invalidationArea: invalidBand
        ? { label: invalidBand.label, read: invalidBand.read }
        : { label: pickLocale(locale, "Structural invalidation zone", "Зона структурной инвалидации"), read: "" },
    };
  }, [locale, bundle]);
}

function MetricCell({
  label,
  value,
  context,
}: {
  label: string;
  value: number;
  context: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const toneClass =
    pct >= 70 ? "text-ms-flow/90"
    : pct <= 35 ? "text-ms-danger/85"
    : "text-ms-text/90";

  return (
    <div className="ms-exec-terrain-metric">
      <p className="ms-data-label text-ms-faint">{label}</p>
      <p className={cn("ms-exec-terrain-metric__value tabular-nums", toneClass)}>
        {value}
        <span className="text-[11px] font-normal text-ms-faint/70">/100</span>
      </p>
      <p className="ms-exec-terrain-metric__context">{context}</p>
    </div>
  );
}

export function ExecutionTerrainTheater({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useExecutionTerrain();
  const [focusMode, setFocusMode]         = useState(false);
  const [terrainMode, setTerrainMode]     = useState(true);
  const [replayOpen, setReplayOpen]       = useState(false);
  const { activeId: expandedBandId, toggle: toggleBand, containerRef: mapContainerRef } = useMapFocus<string>();

  const theaterStyle = useMemo(
    () =>
      ({
        "--ms-exec-breath":       bundle.breathPhase,
        "--ms-exec-continuation": bundle.continuationQuality,
        "--ms-exec-sponsorship":  bundle.sponsorshipIntegrity,
        "--ms-exec-divergence":   bundle.scenarioDivergence,
        "--ms-exec-migration":    bundle.pathMigration,
        "--ms-exec-tick":         bundle.simTick,
      }) as CSSProperties,
    [bundle],
  );

  // Sort bands by emphasis — highest emphasis = most important zone
  const sortedBands = useMemo(
    () => [...bundle.bands].sort((a, b) => b.emphasis - a.emphasis),
    [bundle.bands],
  );

  // Top band gets priority marker
  const priorityBandId = sortedBands[0]?.id ?? null;

  // Show max 5 bands normally, 4 in focus mode
  const visibleBands = focusMode ? sortedBands.slice(0, 4) : sortedBands.slice(0, 5);

  // Limit annotations: 3 normally, 2 in focus mode
  const visibleAnnotations = bundle.annotations
    .slice(0, focusMode ? 2 : 3);

  const dominantPath = bundle.paths.find((p) => p.rank === "dominant");

  const zoneCtx = useZoneContext(locale, bundle);

  // Metric context strings
  const continuationCtx = bundle.continuationQuality >= 65
    ? pickLocale(locale, "Strong continuation signal", "Сильный сигнал продолжения")
    : bundle.continuationQuality <= 40
      ? pickLocale(locale, "Weak — caution on size", "Слабый — осторожно с объёмом")
      : pickLocale(locale, "Moderate", "Умеренный");

  const sponsorshipCtx = bundle.sponsorshipIntegrity >= 65
    ? pickLocale(locale, "Price acceptance holding", "Принятие цены держится")
    : bundle.sponsorshipIntegrity <= 40
      ? pickLocale(locale, "Thin — widen invalidation", "Тонкое — шире инвалидация")
      : pickLocale(locale, "Moderate", "Умеренный");

  const divergenceCtx = bundle.scenarioDivergence >= 65
    ? pickLocale(locale, "High path disagreement — edge cases live", "Высокое расхождение — граничные случаи активны")
    : bundle.scenarioDivergence <= 35
      ? pickLocale(locale, "Paths aligned — higher conviction", "Пути сходятся — выше убеждённость")
      : pickLocale(locale, "Moderate divergence", "Умеренное расхождение");

  return (
    <section
      ref={mapContainerRef}
      className={cn(
        "ms-exec-terrain-theater",
        terrainMode && "ms-exec-terrain-theater--mode-on",
        focusMode   && "ms-exec-terrain-theater--focus",
        bundle.tension === "critical" && "ms-exec-terrain-theater--critical",
        className,
      )}
      style={theaterStyle}
      aria-label={pickLocale(locale, "Execution terrain", "Рельеф исполнения")}
    >
      <div className="ms-exec-terrain-theater__atmosphere" aria-hidden />
      <div className="ms-exec-terrain-theater__scan" aria-hidden />

      {/* Toolbar */}
      <div className="ms-exec-terrain-theater__toolbar relative z-[3] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn("ms-exec-terrain-toggle", terrainMode && "ms-exec-terrain-toggle--on")}
            onClick={() => setTerrainMode((v) => !v)}
            aria-pressed={terrainMode}
          >
            {pickLocale(locale, "Terrain", "Рельеф")}
          </button>
          <button
            type="button"
            className={cn("ms-exec-terrain-toggle", focusMode && "ms-exec-terrain-toggle--on")}
            onClick={() => { setFocusMode((v) => !v); }}
            aria-pressed={focusMode}
          >
            {pickLocale(locale, "Focus", "Фокус")}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[10px] tabular-nums text-ms-faint">
            {bundle.symbol}
            {bundle.hasTape ? "" : ` · ${pickLocale(locale, "awaiting tape", "ждём ленту")}`}
          </p>
          <p className="hidden text-[9px] text-ms-faint/60 sm:block">
            {pickLocale(locale, "Tap zone to reveal detail", "Нажмите зону для детали")}
          </p>
        </div>
      </div>

      {/* Posture headline */}
      <CognitionPrimaryState
        label={pickLocale(locale, "Execution posture", "Поза исполнения")}
        state={bundle.posture}
        subline={bundle.headline}
        tension={bundle.tension}
        className="relative z-[2] mt-4"
      />

      {/* Metrics — with context */}
      {!focusMode ? (
        <div className="relative z-[2] mt-3 grid gap-2 sm:grid-cols-3">
          <MetricCell
            label={pickLocale(locale, "Continuation quality", "Качество продолжения")}
            value={bundle.continuationQuality}
            context={continuationCtx}
          />
          <MetricCell
            label={pickLocale(locale, "Sponsorship integrity", "Целостность спонсорства")}
            value={bundle.sponsorshipIntegrity}
            context={sponsorshipCtx}
          />
          <MetricCell
            label={pickLocale(locale, "Scenario divergence", "Расхождение сценариев")}
            value={bundle.scenarioDivergence}
            context={divergenceCtx}
          />
        </div>
      ) : null}

      {/* Main stage */}
      <div className="ms-exec-terrain-theater__stage relative z-[1] mt-4">
        {/* Overlay stack — hidden in focus mode */}
        {!focusMode ? (
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
        ) : null}

        <div
          className="ms-exec-terrain-theater__canvas"
          aria-label={pickLocale(locale, "Structural terrain map", "Структурная карта рельефа")}
        >
          <div className="ms-exec-terrain-canvas__grid" aria-hidden />
          <div className="ms-exec-terrain-canvas__ridge" aria-hidden />

          {/* Scenario paths */}
          <svg className="ms-exec-terrain-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {bundle.paths.map((p, idx) => (
              <path
                key={p.id}
                className={cn(
                  "ms-exec-terrain-path",
                  PATH_CLASS[p.rank],
                  p.evolving && "ms-exec-terrain-path--evolve",
                )}
                d={`M 4 ${p.yAnchor} Q 50 ${p.yAnchor - 6 - idx * 2} 96 ${p.yAnchor + (idx % 2 === 0 ? 4 : -3)}`}
                fill="none"
                strokeWidth="0.55"
              />
            ))}
          </svg>

          {/* Terrain bands — sorted by importance, limited count */}
          {terrainMode
            ? visibleBands.map((band) => (
                <TerrainBandBlock
                  key={band.id}
                  band={band}
                  isPriority={band.id === priorityBandId}
                  isExpanded={expandedBandId === band.id}
                  onTap={() => toggleBand(band.id)}
                />
              ))
            : null}

          {/* Annotations — limited to max 3 */}
          {visibleAnnotations.map((a) => (
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

        {/* Dominant path card */}
        {dominantPath ? (
          <aside className="ms-exec-terrain-path-card">
            <p className="ms-data-label text-ms-faint">
              {pickLocale(locale, "Dominant path", "Доминирующий путь")}
            </p>
            <p className="mt-1 text-[12px] font-semibold text-ms-text">{dominantPath.title}</p>
            <p className="mt-1 text-[10px] leading-snug text-ms-muted">{dominantPath.pathLine}</p>
            <p className="mt-2 text-[10px] leading-snug text-ms-cognition/85">{dominantPath.conviction}</p>
          </aside>
        ) : null}
      </div>

      {/* Path legend — simplified */}
      {!focusMode ? (
        <ul className="relative z-[2] mt-4 ms-exec-terrain-path-legend" aria-label={pickLocale(locale, "Scenario paths", "Сценарные пути")}>
          {bundle.paths.map((p) => (
            <li key={`leg-${p.id}`} className={cn("ms-exec-terrain-path-legend__item", PATH_CLASS[p.rank])}>
              <span className="font-medium">{p.title}</span>
              <span className="text-ms-faint/80">{p.rank}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Interpretation Layer — the 5 key zones explained */}
      <div className="relative z-[2] mt-4 ms-exec-terrain-interpret">
        <div className="border-b border-ms-border/20 px-4 py-2.5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ms-flow/80">
            {pickLocale(locale, "Zone interpretation", "Интерпретация зон")}
          </p>
        </div>
        <div className="ms-exec-terrain-interpret__grid">
          {[
            {
              n: "1",
              q: pickLocale(locale, "Most important zone", "Важнейшая зона"),
              label: zoneCtx.mostImportant.label,
              read: zoneCtx.mostImportant.read,
              color: "text-ms-flow/85",
            },
            {
              n: "2",
              q: pickLocale(locale, "Current location", "Текущее положение"),
              label: zoneCtx.currentLocation.label,
              read: zoneCtx.currentLocation.read,
              color: "text-ms-cognition/85",
            },
            {
              n: "3",
              q: pickLocale(locale, "Risk area", "Зона риска"),
              label: zoneCtx.riskArea.label,
              read: zoneCtx.riskArea.read,
              color: "text-ms-danger/80",
            },
            {
              n: "4",
              q: pickLocale(locale, "Structural invalidation", "Структурная инвалидация"),
              label: zoneCtx.invalidationArea.label,
              read: zoneCtx.invalidationArea.read,
              color: "text-ms-warning/80",
            },
          ].map((z) => (
            <div key={z.n} className="ms-exec-terrain-interpret__cell">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-[9px] text-ms-faint/60">{z.n}</span>
                <p className="ms-data-label text-ms-faint">{z.q}</p>
              </div>
              <p className={cn("mt-1 text-[11px] font-medium leading-snug", z.color)}>{z.label}</p>
              {z.read ? (
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-ms-faint">{z.read}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Analysis panels — behind details on mobile, side-by-side on desktop */}
      {!focusMode ? (
        <>
          {/* Desktop: two-column grid */}
          <div className="relative z-[2] mt-4 hidden gap-3 lg:grid lg:grid-cols-2">
            <AnalysisPanels bundle={bundle} locale={locale} />
          </div>

          {/* Mobile: collapsible */}
          <details className="group relative z-[2] mt-4 lg:hidden">
            <summary className="ms-focus-ring cursor-pointer list-none rounded-ms-lg border border-ms-border/25 bg-ms-elevated/12 px-3 py-2.5 text-[11px] font-medium text-ms-text [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-2">
                {pickLocale(locale, "Structural overlays & execution gravity", "Оверлеи и гравитация исполнения")}
                <span className="font-mono text-[10px] text-ms-faint group-open:hidden">+</span>
                <span className="hidden font-mono text-[10px] text-ms-faint group-open:inline">−</span>
              </span>
            </summary>
            <div className="mt-3 grid gap-3">
              <AnalysisPanels bundle={bundle} locale={locale} />
            </div>
          </details>
        </>
      ) : null}

      {/* Replay — collapsible */}
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
            {pickLocale(locale, "Open Replay Studio →", "Открыть Replay Studio →")}
          </Link>
        </p>
      </details>

      {/* Mobile usage hint */}
      <p className="relative z-[2] mt-4 text-[10px] text-ms-faint lg:hidden">
        {pickLocale(locale, "Tap a zone to reveal its read.", "Нажмите зону, чтобы увидеть прочтение.")}
      </p>
    </section>
  );
}

/** Analysis panels — structural overlays + execution gravity */
function AnalysisPanels({
  bundle,
  locale,
}: {
  bundle: ReturnType<typeof useExecutionTerrain>;
  locale: UiLocale;
}) {
  return (
    <>
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
    </>
  );
}

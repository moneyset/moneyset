"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";

import { CognitionPrimaryState } from "@/components/cognition/cognition-primary-state";
import { SignatureMomentBanner } from "@/components/cognition/signature-moment-banner";
import { useExecutionTactical } from "@/hooks/use-execution-tactical";
import { useLiveSurfaceMotion } from "@/hooks/use-live-surface-motion";
import {
  executionRegimeClass,
  type ExecutionRegimeId,
  type TacticalGeometry,
  type TacticalGeometryKind,
} from "@/lib/execution/execution-tactical-engine";
import type {
  ScenarioPathLane,
  TerrainBand,
  TerrainLayerKind,
} from "@/lib/execution/execution-terrain-engine";
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

const GEOMETRY_CLASS: Record<TacticalGeometryKind, string> = {
  continuation_lane: "ms-exec-tactical-geo--lane",
  pressure_corridor: "ms-exec-tactical-geo--corridor",
  invalidation_wall: "ms-exec-tactical-geo--wall",
  fragility_pocket: "ms-exec-tactical-geo--pocket",
  sponsorship_rail: "ms-exec-tactical-geo--rail",
  rejection_zone: "ms-exec-tactical-geo--reject",
  sweep_pathway: "ms-exec-tactical-geo--sweep",
  absorption_region: "ms-exec-tactical-geo--absorb",
};

const PATH_CLASS: Record<ScenarioPathLane["rank"], string> = {
  dominant: "ms-exec-path--dominant",
  secondary: "ms-exec-path--secondary",
  failure: "ms-exec-path--failure",
  volatility: "ms-exec-path--volatility",
  instability: "ms-exec-path--instability",
};

const REGIME_LABEL: Record<ExecutionRegimeId, [string, string]> = {
  stable_continuation: ["Stable continuation", "Стабильное продолжение"],
  fragile_continuation: ["Fragile continuation", "Хрупкое продолжение"],
  compression: ["Compression", "Сжатие"],
  expansion: ["Expansion", "Расширение"],
  instability: ["Instability", "Нестабильность"],
  liquidity_trap_risk: ["Liquidity trap risk", "Риск ловушки ликвидности"],
  sponsorship_breakdown: ["Sponsorship breakdown", "Распад спонсорства"],
  volatility_escalation: ["Volatility escalation", "Эскалация волатильности"],
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

function GeometryBlock({ geo }: { geo: TacticalGeometry }) {
  return (
    <div
      className={cn(
        "ms-exec-tactical-geo",
        GEOMETRY_CLASS[geo.kind],
        geo.tone === "stress" && "ms-exec-tactical-geo--stress",
        geo.tone === "support" && "ms-exec-tactical-geo--support",
        geo.migrating && "ms-exec-tactical-geo--migrate",
      )}
      style={
        {
          left: `${geo.x}%`,
          top: `${geo.y}%`,
          width: `${geo.w}%`,
          height: `${geo.h}%`,
          "--ms-geo-emphasis": geo.emphasis,
        } as CSSProperties
      }
      title={geo.read}
    >
      <span className="ms-exec-tactical-geo__label">{geo.label}</span>
    </div>
  );
}

function DecisionGravityBar({
  locale,
  gravity,
}: {
  locale: ReturnType<typeof useUiPrefsStore.getState>["uiLocale"];
  gravity: ReturnType<typeof useExecutionTactical>["decisionGravity"];
}) {
  const axes: { key: keyof typeof gravity; en: string; ru: string }[] = [
    { key: "danger", en: "Danger", ru: "Опасность" },
    { key: "fragility", en: "Fragility", ru: "Хрупкость" },
    { key: "opportunity", en: "Opportunity", ru: "Возможность" },
    { key: "instability", en: "Instability", ru: "Нестабильность" },
    { key: "compression", en: "Compression", ru: "Сжатие" },
    { key: "expansion", en: "Expansion", ru: "Расширение" },
  ];

  return (
    <div className="ms-exec-tactical-gravity" aria-label={pickLocale(locale, "Decision gravity", "Гравитация решения")}>
      {axes.map(({ key, en, ru }) => {
        const val = gravity[key] as number;
        const dominant = gravity.dominant === key;
        return (
          <div key={key} className={cn("ms-exec-tactical-gravity__axis", dominant && "ms-exec-tactical-gravity__axis--dominant")}>
            <div className="flex items-center justify-between gap-2">
              <span className="ms-data-label text-ms-faint">{pickLocale(locale, en, ru)}</span>
              <span className="tabular-nums text-[10px] text-ms-muted">{val}</span>
            </div>
            <div className="ms-exec-tactical-gravity__track">
              <div className="ms-exec-tactical-gravity__fill" style={{ width: `${val}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ExecutionTacticalTheater({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useExecutionTactical();
  const [focusMode, setFocusMode] = useState(false);
  const [terrainMode, setTerrainMode] = useState(true);

  const live = useLiveSurfaceMotion("execution");
  const { terrain } = bundle;
  const theaterStyle = useMemo(
    () =>
      ({
        "--ms-exec-breath": bundle.breathPhase,
        "--ms-exec-continuation": bundle.continuationQuality,
        "--ms-exec-sponsorship": bundle.sponsorshipIntegrity,
        "--ms-exec-divergence": bundle.scenarioDivergence,
        "--ms-exec-migration": bundle.pathMigration,
        "--ms-exec-tick": bundle.simTick,
        "--ms-exec-gravity-danger": bundle.decisionGravity.danger,
        "--ms-exec-gravity-fragility": bundle.decisionGravity.fragility,
      }) as CSSProperties,
    [bundle],
  );

  const dominantPath = terrain.paths.find((p) => p.rank === "dominant");
  const regimeLabel = REGIME_LABEL[bundle.regime.id];

  return (
    <section
      className={cn(
        "ms-exec-tactical-theater",
        "ms-signature-surface",
        "ms-exec-battlefield",
        live.className,
        executionRegimeClass(bundle.regime.id),
        terrainMode && "ms-exec-tactical-theater--terrain-on",
        focusMode && "ms-exec-tactical-theater--focus",
        bundle.tension === "critical" && "ms-exec-tactical-theater--critical",
        className,
      )}
      style={{ ...live.style, ...theaterStyle }}
      data-ms-motion-phase={live.phase}
      aria-label={pickLocale(locale, "Tactical execution environment", "Тактическая среда исполнения")}
    >
      <SignatureMomentBanner world="execution" />
      <div className="ms-exec-tactical-theater__atmosphere" aria-hidden />
      <div className="ms-exec-tactical-theater__pulse-field" aria-hidden>
        {bundle.pressurePulses.map((p) => (
          <span
            key={p.id}
            className={cn("ms-exec-tactical-pulse", `ms-exec-tactical-pulse--${p.kind}`)}
            style={{ "--ms-pulse-intensity": p.intensity } as CSSProperties}
          />
        ))}
      </div>

      <div className="ms-exec-tactical-theater__toolbar relative z-[3] flex flex-wrap items-center justify-between gap-2">
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
        <p className="ms-metadata tabular-nums">
          {bundle.symbol}
          {bundle.hasTape ? "" : ` · ${pickLocale(locale, "awaiting tape", "ждём ленту")}`}
        </p>
      </div>

      <CognitionPrimaryState
        label={pickLocale(locale, regimeLabel[0], regimeLabel[1])}
        state={bundle.regime.headline}
        subline={bundle.posture}
        tension={bundle.tension}
        className="relative z-[2] mt-4"
      />

      {!focusMode ? (
        <>
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
          <DecisionGravityBar locale={locale} gravity={bundle.decisionGravity} />
        </>
      ) : (
        <ul className="relative z-[2] mt-3 space-y-1 border-l border-ms-flow/20 pl-2.5">
          {bundle.focusHints.map((hint) => (
            <li key={hint} className="text-[10px] leading-snug text-ms-muted">
              {hint}
            </li>
          ))}
        </ul>
      )}

      <div className="ms-exec-tactical-theater__stage relative z-[1] mt-4">
        <div
          className="ms-exec-tactical-theater__canvas"
          aria-label={pickLocale(locale, "Execution geometry battlefield", "Поле тактической геометрии")}
        >
          <div className="ms-exec-terrain-canvas__grid" aria-hidden />
          <div className="ms-exec-terrain-canvas__ridge" aria-hidden />

          {terrainMode
            ? bundle.geometry.map((geo) => <GeometryBlock key={geo.id} geo={geo} />)
            : null}

          <svg className="ms-exec-terrain-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {terrain.paths.map((p: ScenarioPathLane, idx: number) => (
              <path
                key={p.id}
                className={cn("ms-exec-terrain-path", PATH_CLASS[p.rank], p.evolving && "ms-exec-terrain-path--evolve")}
                d={`M 4 ${p.yAnchor} Q 50 ${p.yAnchor - 6 - idx * 2} 96 ${p.yAnchor + (idx % 2 === 0 ? 4 : -3)}`}
                fill="none"
                strokeWidth="0.55"
              />
            ))}
          </svg>

          {terrainMode ? terrain.bands.map((band) => <TerrainBandBlock key={band.id} band={band} />) : null}

          {(focusMode ? bundle.warnings.slice(0, 3) : bundle.warnings.slice(0, 5)).map((w) => (
            <p
              key={w.id}
              className={cn(
                "ms-exec-terrain-annotation",
                w.severity === "critical" && "ms-exec-terrain-annotation--critical",
                w.severity === "elevated" && "ms-exec-terrain-annotation--elevated",
              )}
              style={{ top: `${w.canvasY}%` } as CSSProperties}
            >
              {w.line}
            </p>
          ))}
        </div>

        {dominantPath && !focusMode ? (
          <aside className="ms-exec-terrain-path-card">
            <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Dominant path", "Доминирующий путь")}</p>
            <p className="mt-1 text-[12px] font-medium text-ms-text">{dominantPath.title}</p>
            <p className="mt-1 text-[10px] leading-snug text-ms-muted">{dominantPath.pathLine}</p>
          </aside>
        ) : null}
      </div>

      {!focusMode ? (
        <>
          <div className="relative z-[2] mt-4 ms-exec-tactical-live">
            <h3 className="ms-data-label text-ms-faint">{pickLocale(locale, "Live execution conditions", "Живые условия исполнения")}</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {bundle.liveConditions.map((c) => (
                <li key={c.id} className="ms-exec-tactical-live__cell">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium text-ms-text">{c.label}</span>
                    <span
                      className={cn(
                        "ms-exec-tactical-trend text-[9px] uppercase tracking-wide",
                        c.trend === "rising" && "ms-exec-tactical-trend--up",
                        c.trend === "falling" && "ms-exec-tactical-trend--down",
                      )}
                    >
                      {c.trend}
                    </span>
                  </div>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums text-ms-flow/90">{c.value}</p>
                  <p className="mt-0.5 text-[9px] leading-snug text-ms-faint">{c.read}</p>
                </li>
              ))}
            </ul>
          </div>

          <ul className="relative z-[2] mt-4 ms-exec-tactical-cross">
            {bundle.crossLinks.map((link) => (
              <li key={link.id}>
                <Link href={link.href} className="ms-exec-tactical-cross__link">
                  <span className="ms-exec-tactical-cross__system">{link.system}</span>
                  <span>{link.line}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="relative z-[2] mt-4 grid gap-3 lg:grid-cols-2">
            <div className="ms-exec-terrain-panel">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ms-flow/90">
                {pickLocale(locale, "Structural overlays", "Структурные оверлеи")}
              </h3>
              <ul className="mt-2 space-y-2">
                {terrain.overlays.map((o) => (
                  <li key={o.id} className="text-[10px] leading-snug text-ms-muted">
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
                {terrain.executionImplications.map((line) => (
                  <li key={line} className="text-[10px] leading-snug text-ms-muted">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

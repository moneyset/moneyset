"use client";

import { useMemo, useState, type CSSProperties } from "react";

import { CognitionDensityPanel } from "@/components/cognition/cognition-density-panel";
import { CognitionNavRail } from "@/components/cognition/cognition-nav-rail";
import { CognitionInstantChips } from "@/components/cognition/cognition-instant-chips";
import { CognitionMetricGlyph } from "@/components/cognition/cognition-metric-glyph";
import { CognitionPrimaryState } from "@/components/cognition/cognition-primary-state";
import { SignatureMomentBanner } from "@/components/cognition/signature-moment-banner";
import { ExecutionInterpretationBridge } from "@/components/execution/execution-interpretation-bridge";
import { LiquidityPhysicsLayer } from "@/components/liquidity/liquidity-physics-layer";
import { useLiquidityTheater } from "@/hooks/use-liquidity-theater";
import { useLiveSurfaceMotion } from "@/hooks/use-live-surface-motion";
import type { LiquidityRegimeId, TerrainFeature } from "@/lib/intelligence/liquidity-topology-theater";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const REGIME_CLASS: Record<LiquidityRegimeId, string> = {
  balanced: "ms-liq-theater--balanced",
  thin_continuation: "ms-liq-theater--thin",
  compression: "ms-liq-theater--compression",
  cascade_vulnerable: "ms-liq-theater--cascade",
  sponsorship_decay: "ms-liq-theater--decay",
  fragility_expansion: "ms-liq-theater--fragility",
  aggressive_absorption: "ms-liq-theater--absorption",
  forced_rotation: "ms-liq-theater--rotation",
};

function featureClass(f: TerrainFeature): string {
  if (f.tone === "stress") return "ms-liq-feature--stress";
  if (f.tone === "support") return "ms-liq-feature--support";
  return "ms-liq-feature--neutral";
}

export function LiquidityTopologyTheater({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useLiquidityTheater();
  const live = useLiveSurfaceMotion("liquidity");
  const [replayOpen, setReplayOpen] = useState(false);

  const theaterStyle = useMemo(
    () =>
      ({
        "--ms-liq-gravity": bundle.gravity,
        "--ms-liq-distortion": bundle.distortion,
        "--ms-liq-breath": bundle.breathPhase,
        "--ms-liq-sponsorship": bundle.sponsorshipStrength,
        "--ms-liq-fragility": bundle.participationFragility,
        "--ms-liq-tick": bundle.simTick ?? 0,
      }) as CSSProperties,
    [bundle],
  );

  return (
    <section
      className={cn(
        "ms-liq-theater",
        "ms-liq-topology-theater",
        "ms-signature-surface",
        live.className,
        REGIME_CLASS[bundle.regime.id],
        bundle.tension === "critical" && "ms-liq-theater--legendary",
        className,
      )}
      style={{ ...live.style, ...theaterStyle }}
      data-ms-motion-phase={live.phase}
      aria-label={pickLocale(locale, "Liquidity topology theater", "Театр топологии ликвидности")}
    >
      <div className="ms-liq-theater__atmosphere" aria-hidden />
      <div className="ms-liq-theater__fog" aria-hidden />
      <div className="ms-liq-theater__gravity-well" aria-hidden />
      <SignatureMomentBanner world="liquidity" />

      <CognitionPrimaryState
        label={pickLocale(locale, "Liquidity regime", "Режим ликвидности")}
        state={bundle.primaryState}
        subline={bundle.primarySubline}
        tension={bundle.tension}
        className="relative z-[2]"
      />
      <CognitionInstantChips className="relative z-[2] mt-3" />

      <ExecutionInterpretationBridge className="relative z-[2] mt-4" compact />

      <div className="ms-liq-glyphs relative z-[2] mt-4">
        <CognitionMetricGlyph
          label={pickLocale(locale, "Gravity", "Гравитация")}
          value={bundle.gravity}
          meter={bundle.gravity}
          tone={bundle.gravity >= 70 ? "critical" : bundle.gravity >= 52 ? "stress" : "neutral"}
        />
        <CognitionMetricGlyph
          label={pickLocale(locale, "Sponsorship", "Спонсорство")}
          value={bundle.sponsorshipStrength}
          meter={bundle.sponsorshipStrength}
          tone={bundle.sponsorshipStrength < 45 ? "stress" : "support"}
        />
        <CognitionMetricGlyph
          label={pickLocale(locale, "Fragility", "Хрупкость")}
          value={bundle.participationFragility}
          meter={bundle.participationFragility}
          tone={bundle.participationFragility >= 60 ? "stress" : "neutral"}
        />
      </div>

      <div
        className="ms-liq-theater__terrain"
        aria-label={pickLocale(locale, "Pressure terrain", "Рельеф давления")}
      >
        <LiquidityPhysicsLayer />
        <div className="ms-liq-terrain__contour" aria-hidden />
        <div className="ms-liq-terrain__ridge-layer" aria-hidden />
        {bundle.migrations.map((path) => (
          <svg key={path.id} className="ms-liq-migration" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id={`grad-${path.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--ms-cognition)" stopOpacity="0" />
                <stop offset="50%" stopColor="var(--ms-cognition)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--ms-cognition)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`M ${path.fromX} ${path.fromY} Q ${(path.fromX + path.toX) / 2} ${(path.fromY + path.toY) / 2 - 8} ${path.toX} ${path.toY}`}
              fill="none"
              stroke={`url(#grad-${path.id})`}
              strokeWidth="0.6"
              className="ms-liq-migration__path"
            />
          </svg>
        ))}
        {bundle.features.map((f, idx) => (
          <article
            key={f.id}
            className={cn("ms-liq-feature", `ms-liq-feature--${f.kind}`, featureClass(f))}
            style={
              {
                left: `${f.x}%`,
                top: `${f.y}%`,
                width: `${f.w}%`,
                height: `${f.h}%`,
                "--ms-feature-emphasis": f.emphasis,
                animationDelay: `${(idx * 1.7 + (bundle.breathPhase * 4) % 3).toFixed(2)}s`,
              } as CSSProperties
            }
          >
            <p className="ms-liq-feature__label text-pretty">{f.label}</p>
            <p className="ms-liq-feature__read text-pretty">{f.read}</p>
          </article>
        ))}
        <div className="ms-liq-cascade-zone" aria-hidden />
      </div>

      <CognitionDensityPanel
        className="relative z-[2] mt-4"
        deep={
          <>
            <p className="ms-exec-implication ms-exec-implication--primary text-pretty">{bundle.cascadeRead}</p>
            <p className="ms-exec-implication text-pretty">{bundle.clusterRead}</p>
            <p className="ms-exec-implication text-pretty">{bundle.gravityRead}</p>
            <ul>
              {bundle.executionImplications.map((line) => (
                <li key={line} className="ms-exec-implication text-pretty">
                  {line}
                </li>
              ))}
            </ul>
            {bundle.crossLinks.map((link) => (
              <p key={link} className="ms-metadata text-pretty">
                {link}
              </p>
            ))}
          </>
        }
        telemetry={
          <p className="ms-metadata tabular-nums">
            T{bundle.simTick} · distortion {bundle.distortion}
          </p>
        }
      />

      <CognitionNavRail
        className="relative z-[2]"
        links={[
          { href: "/agents", labelEn: "Agents", labelRu: "Агенты" },
          { href: "/macro", labelEn: "Macro", labelRu: "Макро" },
          { href: "/risk-radar", labelEn: "Risk", labelRu: "Риск" },
          { href: "/execution", labelEn: "Execution", labelRu: "Исполнение" },
        ]}
      />


      <details
        className="group relative z-[2] mt-5"
        open={replayOpen}
        onToggle={(e) => setReplayOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="ms-focus-ring cursor-pointer list-none rounded-ms-lg border border-ms-border/25 bg-ms-elevated/12 px-3 py-2.5 text-[11px] font-medium text-ms-text [&::-webkit-details-marker]:hidden">
          <span className="mr-1.5 inline-block text-ms-faint transition-transform group-open:rotate-90" aria-hidden>
            ›
          </span>
          {pickLocale(locale, "Liquidity replay — temporal pressure", "Реплей ликвидности — давление во времени")}
        </summary>
        <ol className="mt-3 ms-liq-replay">
          {bundle.replay.length === 0 ? (
            <li className="text-[11px] text-ms-muted">
              {pickLocale(locale, "Accumulating capture window…", "Накопление окна захвата…")}
            </li>
          ) : (
            bundle.replay.map((frame) => (
              <li key={frame.tick} className={cn("ms-liq-replay__frame", REGIME_CLASS[frame.regime])}>
                <span className="ms-liq-replay__tick">T{frame.tick}</span>
                <div>
                  <p className="text-[11px] font-medium text-ms-text">{frame.note}</p>
                  <p className="text-[10px] tabular-nums text-ms-faint">
                    {pickLocale(locale, "gravity", "гравитация")} {frame.gravity}
                  </p>
                </div>
              </li>
            ))
          )}
        </ol>
      </details>
    </section>
  );
}

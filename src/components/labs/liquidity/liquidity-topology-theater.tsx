"use client";

import { useMemo, useState, type CSSProperties } from "react";

import { CognitionNavRail } from "@/components/cognition/cognition-nav-rail";
import { CognitionPrimaryState } from "@/components/cognition/cognition-primary-state";
import { SignatureMomentBanner } from "@/components/cognition/signature-moment-banner";
import { LiquidityPhysicsLayer } from "@/components/liquidity/liquidity-physics-layer";
import { useLiquidityTheater } from "@/hooks/use-liquidity-theater";
import { useLiveSurfaceMotion } from "@/hooks/use-live-surface-motion";
import type { LiquidityRegimeId, TerrainFeature } from "@/lib/intelligence/liquidity-topology-theater";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore, type UiLocale } from "@/store/ui-prefs-store";

const REGIME_CLASS: Record<LiquidityRegimeId, string> = {
  balanced:             "ms-liq-theater--balanced",
  thin_continuation:    "ms-liq-theater--thin",
  compression:          "ms-liq-theater--compression",
  cascade_vulnerable:   "ms-liq-theater--cascade",
  sponsorship_decay:    "ms-liq-theater--decay",
  fragility_expansion:  "ms-liq-theater--fragility",
  aggressive_absorption:"ms-liq-theater--absorption",
  forced_rotation:      "ms-liq-theater--rotation",
};

function featureToneClass(f: TerrainFeature): string {
  if (f.tone === "stress")   return "ms-liq-feature--stress";
  if (f.tone === "support")  return "ms-liq-feature--support";
  return "ms-liq-feature--neutral";
}

/** Rank label for feature priority */
function priorityClass(rank: number): string {
  if (rank === 0) return "ms-liq-feature--priority-1";
  if (rank <= 2)  return "ms-liq-feature--priority-2";
  return "ms-liq-feature--bg";
}

/** Metric context — what the number means */
function gravityContext(locale: UiLocale, v: number): string {
  if (v >= 72) return pickLocale(locale, "Critical pull — forced participation likely", "Критическое притяжение — вынужденное участие вероятно");
  if (v >= 55) return pickLocale(locale, "Elevated pull — widen invalidation", "Высокое притяжение — расширьте инвалидацию");
  if (v <= 35) return pickLocale(locale, "Low gravity — structure stable", "Низкое притяжение — структура стабильна");
  return pickLocale(locale, "Moderate — monitor for escalation", "Умеренное — следите за эскалацией");
}

function sponsorshipContext(locale: UiLocale, v: number): string {
  if (v >= 68) return pickLocale(locale, "Strong acceptance — continuation favored", "Сильное принятие — продолжение предпочтительно");
  if (v >= 48) return pickLocale(locale, "Moderate — thesis intact but watch breadth", "Умеренное — тезис цел, следите за шириной");
  return pickLocale(locale, "Thin — participation may not sustain move", "Тонкое — участие может не удержать движение");
}

function fragilityContext(locale: UiLocale, v: number): string {
  if (v >= 68) return pickLocale(locale, "High fragility — widen stops, reduce size", "Высокая хрупкость — расширьте стопы, снизьте объём");
  if (v >= 45) return pickLocale(locale, "Moderate — edge-case invalidation active", "Умеренная — граничная инвалидация активна");
  return pickLocale(locale, "Low fragility — structure is holding", "Низкая хрупкость — структура держится");
}

function metricTone(v: number, kind: "gravity" | "sponsorship" | "fragility"): string {
  if (kind === "gravity")
    return v >= 68 ? "text-ms-danger/90" : v >= 52 ? "text-ms-warning/85" : "text-ms-text/90";
  if (kind === "sponsorship")
    return v >= 65 ? "text-ms-flow/90" : v < 45 ? "text-ms-danger/85" : "text-ms-text/90";
  // fragility
  return v >= 65 ? "text-ms-danger/90" : v >= 45 ? "text-ms-warning/80" : "text-ms-text/90";
}

type MetricCellProps = {
  label: string;
  value: number;
  context: string;
  kind: "gravity" | "sponsorship" | "fragility";
};

function MetricCell({ label, value, context, kind }: MetricCellProps) {
  const tone = metricTone(value, kind);
  return (
    <div className="rounded-ms-xl border border-ms-border/18 bg-ms-elevated/10 px-3 py-3">
      <p className="ms-data-label text-ms-faint">{label}</p>
      <p className={cn("mt-1 text-[1.1rem] font-semibold leading-none tabular-nums tracking-tight", tone)}>
        {value}
        <span className="ml-0.5 text-[11px] font-normal text-ms-faint/70">/100</span>
      </p>
      <p className="ms-liq-metric__context mt-1">{context}</p>
    </div>
  );
}

type FeatureBlockProps = {
  feature: TerrainFeature;
  rank: number;
  expanded: boolean;
  onTap: () => void;
  idx: number;
};

function TerrainFeatureBlock({ feature: f, rank, expanded, onTap, idx }: FeatureBlockProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={f.label}
      className={cn(
        "ms-liq-feature",
        `ms-liq-feature--${f.kind}`,
        featureToneClass(f),
        priorityClass(rank),
        expanded && "ms-liq-feature--expanded",
        "cursor-pointer",
      )}
      style={
        {
          left: `${f.x}%`,
          top: `${f.y}%`,
          width: `${f.w}%`,
          height: `${f.h}%`,
          "--ms-feature-emphasis": f.emphasis,
          animationDelay: `${(idx * 1.7) % 3}s`,
        } as CSSProperties
      }
      onClick={onTap}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onTap(); }}
    >
      {rank === 0 ? (
        <span className="mb-0.5 inline-block size-1 rounded-full bg-ms-cognition/80" aria-hidden />
      ) : null}
      <p className="ms-liq-feature__label text-pretty">{f.label}</p>
      <p className="ms-liq-feature__read text-pretty">{f.read}</p>
    </article>
  );
}

/** Decision block answering the 5 key questions */
function LiquidityDecisionBlock({
  bundle,
  locale,
}: {
  bundle: ReturnType<typeof useLiquidityTheater>;
  locale: UiLocale;
}) {
  const implication = bundle.executionImplications[0]
    ?? bundle.cascadeRead
    ?? pickLocale(locale, "Monitor structure — no immediate action signal.", "Следите за структурой — немедленных сигналов нет.");

  const gravityQ  = pickLocale(locale, "Liquidity condition", "Условие ликвидности");
  const riskQ     = pickLocale(locale, "Liquidity risk", "Риск ликвидности");
  const sponsorQ  = pickLocale(locale, "Sponsorship strength", "Сила спонсорства");
  const fragilityQ = pickLocale(locale, "Fragility level", "Уровень хрупкости");
  const implQ     = pickLocale(locale, "Decision implication", "Импликация решения");

  const gravityVal  = gravityContext(locale, bundle.gravity);
  const sponsorVal  = sponsorshipContext(locale, bundle.sponsorshipStrength);
  const fragilVal   = fragilityContext(locale, bundle.participationFragility);
  const riskVal     = bundle.regime.headline;

  return (
    <div className="ms-liq-decision-block">
      <div className="ms-liq-decision-block__header">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ms-cognition/80">
          {pickLocale(locale, "Liquidity intelligence", "Аналитика ликвидности")}
        </p>
        <p className="font-mono text-[9px] text-ms-faint/60">
          {pickLocale(locale, "Read this first", "Читайте сначала")}
        </p>
      </div>
      <div className="ms-liq-decision-block__grid">
        {[
          { n: "1", q: gravityQ,    v: gravityVal,  color: metricTone(bundle.gravity, "gravity") },
          { n: "2", q: riskQ,       v: riskVal,      color: "text-ms-warning/85" },
          { n: "3", q: sponsorQ,    v: sponsorVal,   color: metricTone(bundle.sponsorshipStrength, "sponsorship") },
          { n: "4", q: fragilityQ,  v: fragilVal,    color: metricTone(bundle.participationFragility, "fragility") },
          { n: "5", q: implQ,       v: implication,  color: "text-ms-cognition/90" },
        ].map((cell) => (
          <div key={cell.n} className="ms-liq-decision-block__cell">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-[9px] text-ms-faint/50">{cell.n}</span>
              <p className="ms-data-label text-ms-faint">{cell.q}</p>
            </div>
            <p className={cn("mt-1 text-[12px] font-medium leading-snug", cell.color)}>{cell.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Key reads — inline, not hidden */
function KeyReads({
  bundle,
  locale,
}: {
  bundle: ReturnType<typeof useLiquidityTheater>;
  locale: UiLocale;
}) {
  const reads = [
    { label: pickLocale(locale, "Cascade read",  "Каскадное прочтение"),  text: bundle.cascadeRead },
    { label: pickLocale(locale, "Cluster read",  "Кластерное прочтение"), text: bundle.clusterRead },
    { label: pickLocale(locale, "Gravity read",  "Прочтение гравитации"), text: bundle.gravityRead },
    ...bundle.executionImplications.slice(0, 2).map((imp, i) => ({
      label: pickLocale(locale, i === 0 ? "Primary execution note" : "Secondary note", i === 0 ? "Основная заметка" : "Дополнительно"),
      text: imp,
    })),
  ].filter((r) => r.text);

  if (reads.length === 0) return null;

  return (
    <div className="ms-liq-key-reads">
      {reads.map((r) => (
        <div key={r.label} className="ms-liq-key-reads__item">
          <p className="ms-data-label text-ms-faint">{r.label}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-ms-muted">{r.text}</p>
        </div>
      ))}
    </div>
  );
}

export function LiquidityTopologyTheater({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useLiquidityTheater();
  const live   = useLiveSurfaceMotion("liquidity");
  const [replayOpen, setReplayOpen]       = useState(false);
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);

  const theaterStyle = useMemo(
    () =>
      ({
        "--ms-liq-gravity":       bundle.gravity,
        "--ms-liq-distortion":    bundle.distortion,
        "--ms-liq-breath":        bundle.breathPhase,
        "--ms-liq-sponsorship":   bundle.sponsorshipStrength,
        "--ms-liq-fragility":     bundle.participationFragility,
        "--ms-liq-tick":          bundle.simTick ?? 0,
      }) as CSSProperties,
    [bundle],
  );

  // Sort features by emphasis — highest = most important
  const sortedFeatures = useMemo(
    () => [...bundle.features].sort((a, b) => b.emphasis - a.emphasis),
    [bundle.features],
  );

  // Max 6 features on screen at once to reduce clutter
  const visibleFeatures = sortedFeatures.slice(0, 6);

  const toggleFeature = (id: string) =>
    setExpandedFeatureId((prev) => (prev === id ? null : id));

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
      <div className="ms-liq-theater__fog"         aria-hidden />
      <div className="ms-liq-theater__gravity-well" aria-hidden />
      <SignatureMomentBanner world="liquidity" />

      {/* Primary state header */}
      <CognitionPrimaryState
        label={pickLocale(locale, "Liquidity regime", "Режим ликвидности")}
        state={bundle.primaryState}
        subline={bundle.primarySubline}
        tension={bundle.tension}
        className="relative z-[2]"
      />

      {/* Decision-first block — 5 priority signals */}
      <div className="relative z-[2] mt-4">
        <LiquidityDecisionBlock bundle={bundle} locale={locale} />
      </div>

      {/* Metrics — Gravity · Sponsorship · Fragility with context */}
      <div className="ms-liq-glyphs relative z-[2] mt-4">
        <MetricCell
          label={pickLocale(locale, "Gravity",      "Гравитация")}
          value={bundle.gravity}
          context={gravityContext(locale, bundle.gravity)}
          kind="gravity"
        />
        <MetricCell
          label={pickLocale(locale, "Sponsorship",  "Спонсорство")}
          value={bundle.sponsorshipStrength}
          context={sponsorshipContext(locale, bundle.sponsorshipStrength)}
          kind="sponsorship"
        />
        <MetricCell
          label={pickLocale(locale, "Fragility",    "Хрупкость")}
          value={bundle.participationFragility}
          context={fragilityContext(locale, bundle.participationFragility)}
          kind="fragility"
        />
      </div>

      {/* Terrain map */}
      <div
        className="ms-liq-theater__terrain"
        aria-label={pickLocale(locale, "Pressure terrain map — tap zones for detail", "Карта давления — нажмите зону для детали")}
      >
        <LiquidityPhysicsLayer />
        <div className="ms-liq-terrain__contour" aria-hidden />
        <div className="ms-liq-terrain__ridge-layer" aria-hidden />

        {/* Migration paths */}
        {bundle.migrations.map((path) => (
          <svg key={path.id} className="ms-liq-migration" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id={`grad-${path.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="var(--ms-cognition)" stopOpacity="0" />
                <stop offset="50%"  stopColor="var(--ms-cognition)" stopOpacity="0.35" />
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

        {/* Features — sorted by importance, limited to 6, tap-to-reveal */}
        {visibleFeatures.map((f, idx) => {
          const rank = sortedFeatures.indexOf(f);
          return (
            <TerrainFeatureBlock
              key={f.id}
              feature={f}
              rank={rank}
              expanded={expandedFeatureId === f.id}
              onTap={() => toggleFeature(f.id)}
              idx={idx}
            />
          );
        })}

        <div className="ms-liq-cascade-zone" aria-hidden />
      </div>

      {/* Tap hint */}
      <p className="relative z-[2] mt-2 ms-liq-tap-hint">
        {pickLocale(locale, "Tap any zone to reveal its read.", "Нажмите зону, чтобы увидеть прочтение.")}
      </p>

      {/* Key reads — inline, always visible */}
      <div className="relative z-[2] mt-4">
        <KeyReads bundle={bundle} locale={locale} />
      </div>

      {/* Navigation rail */}
      <CognitionNavRail
        className="relative z-[2] mt-4"
        links={[
          { href: "/agents",    labelEn: "Agents",    labelRu: "Агенты" },
          { href: "/macro",     labelEn: "Macro",     labelRu: "Макро" },
          { href: "/risk-radar",labelEn: "Risk",      labelRu: "Риск" },
          { href: "/execution", labelEn: "Execution", labelRu: "Исполнение" },
        ]}
      />

      {/* Cross-links — behind details on mobile */}
      {bundle.crossLinks.length > 0 ? (
        <details className="group relative z-[2] mt-4">
          <summary className="ms-focus-ring cursor-pointer list-none rounded-ms-lg border border-ms-border/22 bg-ms-elevated/10 px-3 py-2 text-[11px] font-medium text-ms-text [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              {pickLocale(locale, "Cross-market links", "Кросс-рыночные связи")}
              <span className="font-mono text-[10px] text-ms-faint group-open:hidden">+</span>
              <span className="hidden font-mono text-[10px] text-ms-faint group-open:inline">−</span>
            </span>
          </summary>
          <ul className="mt-2 space-y-1.5 px-1">
            {bundle.crossLinks.map((link) => (
              <li key={link} className="text-[11px] leading-relaxed text-ms-muted">{link}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {/* Replay — collapsible */}
      <details
        className="group relative z-[2] mt-5"
        open={replayOpen}
        onToggle={(e) => setReplayOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="ms-focus-ring cursor-pointer list-none rounded-ms-lg border border-ms-border/25 bg-ms-elevated/12 px-3 py-2.5 text-[11px] font-medium text-ms-text [&::-webkit-details-marker]:hidden">
          <span className="mr-1.5 inline-block text-ms-faint transition-transform group-open:rotate-90" aria-hidden>›</span>
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
                    {pickLocale(locale, "gravity", "гравитация")} {frame.gravity}/100
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

"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";

import { CognitionEchoRail } from "@/components/cognition/cognition-echo-rail";
import { CognitionPrimaryState } from "@/components/cognition/cognition-primary-state";
import { SignatureMomentBanner } from "@/components/cognition/signature-moment-banner";
import { useMemoryConstellation } from "@/hooks/use-memory-constellation";
import { useLiveSurfaceMotion } from "@/hooks/use-live-surface-motion";
import type { ConstellationNode, ConstellationNodeKind } from "@/lib/intelligence/memory-constellation-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const NODE_CLASS: Record<ConstellationNodeKind, string> = {
  archetype: "ms-memory-node--archetype",
  analog: "ms-memory-node--analog",
  cluster: "ms-memory-node--cluster",
  lineage: "ms-memory-node--lineage",
  fragility: "ms-memory-node--fragility",
  sponsorship: "ms-memory-node--sponsorship",
  volatility: "ms-memory-node--volatility",
  execution: "ms-memory-node--execution",
};

function ConstellationNodeDot({ node }: { node: ConstellationNode }) {
  return (
    <article
      className={cn(
        "ms-memory-node",
        NODE_CLASS[node.kind],
        node.tone === "stress" && "ms-memory-node--stress",
        node.tone === "support" && "ms-memory-node--support",
        node.resonating && "ms-memory-node--resonate",
      )}
      style={
        {
          left: `${node.x}%`,
          top: `${node.y}%`,
          "--ms-node-emphasis": node.emphasis,
        } as CSSProperties
      }
      title={node.read}
    >
      <span className="ms-memory-node__core" aria-hidden />
      <span className="ms-memory-node__label">{node.label}</span>
    </article>
  );
}

export function MarketMemoryConstellation({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useMemoryConstellation();
  const live = useLiveSurfaceMotion("memory");
  const [constellationMode, setConstellationMode] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);

  const style = useMemo(
    () =>
      ({
        "--ms-memory-breath": bundle.breathPhase,
        "--ms-memory-echo": bundle.echoPulse,
        "--ms-memory-drift": bundle.historicalDrift,
        "--ms-memory-tick": bundle.simTick,
      }) as CSSProperties,
    [bundle],
  );

  return (
    <section
      className={cn(
        "ms-memory-constellation",
        "ms-signature-surface",
        "ms-memory-galaxy",
        live.className,
        constellationMode && "ms-memory-constellation--mode-on",
        focusMode && "ms-memory-constellation--focus",
        bundle.tension === "critical" && "ms-memory-constellation--critical",
        className,
      )}
      style={{ ...live.style, ...style }}
      data-ms-motion-phase={live.phase}
      aria-label={pickLocale(locale, "Market memory constellation", "Созвездие рыночной памяти")}
    >
      <SignatureMomentBanner world="memory" />
      <div className="ms-memory-constellation__void" aria-hidden />
      <div className="ms-memory-constellation__galaxy-spiral" aria-hidden />
      <div className="ms-memory-constellation__echo-ring" aria-hidden />

      <div className="ms-memory-constellation__toolbar relative z-[3] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn("ms-exec-terrain-toggle", constellationMode && "ms-exec-terrain-toggle--on")}
            onClick={() => setConstellationMode((v) => !v)}
          >
            {pickLocale(locale, "Constellation map", "Карта созвездия")}
          </button>
          <button
            type="button"
            className={cn("ms-exec-terrain-toggle", focusMode && "ms-exec-terrain-toggle--on")}
            onClick={() => setFocusMode((v) => !v)}
          >
            {pickLocale(locale, "Resonance focus", "Фокус резонанса")}
          </button>
        </div>
        <p className="text-[10px] tabular-nums text-ms-faint">
          {bundle.analogClock ? bundle.analogClock : pickLocale(locale, "no analog", "нет аналога")}
        </p>
      </div>

      <CognitionPrimaryState
        label={pickLocale(locale, "Institutional archive", "Институциональный архив")}
        state={bundle.headline}
        subline={bundle.subline}
        tension={bundle.tension}
        className="relative z-[2] mt-4"
      />

      {!focusMode ? (
        <CognitionEchoRail
          className="relative z-[2] mt-3"
          items={bundle.echoes.map((e) => ({
            id: e.id,
            severity: e.severity,
            weight: e.severity === "critical" ? 0.9 : e.severity === "elevated" ? 0.65 : 0.4,
          }))}
          titles={Object.fromEntries(bundle.echoes.map((e) => [e.id, e.line]))}
        />
      ) : null}

      <div className="ms-memory-constellation__stage relative z-[1] mt-4">
        <div
          className="ms-memory-constellation__canvas"
          aria-label={pickLocale(locale, "Pattern constellation web", "Сеть паттерн-созвездия")}
        >
          <div className="ms-memory-constellation__starfield" aria-hidden />

          <svg className="ms-memory-constellation__web" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {bundle.edges.map((e) => {
              const from = bundle.nodes.find((n) => n.id === e.fromId);
              const to = bundle.nodes.find((n) => n.id === e.toId);
              if (!from || !to) return null;
              return (
                <line
                  key={e.id}
                  className="ms-memory-constellation__edge"
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  style={{ opacity: e.strength / 100 }}
                />
              );
            })}
          </svg>

          {constellationMode
            ? bundle.nodes
                .filter((n) => !focusMode || n.resonating || n.kind === "archetype" || n.kind === "analog")
                .map((node) => <ConstellationNodeDot key={node.id} node={node} />)
            : null}
        </div>

        {!focusMode ? (
          <aside className="ms-memory-constellation__aside">
            <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Environment recall", "Отзыв среды")}</p>
            <ul className="mt-2 space-y-2">
              {bundle.environmentAnalogs.slice(0, 3).map((a) => (
                <li key={a.id} className="ms-memory-analog-chip">
                  <div className="flex justify-between gap-2">
                    <span className="text-[10px] font-medium text-ms-text">{a.label}</span>
                    <span className="tabular-nums text-[9px] text-ms-faint">{a.similarity}</span>
                  </div>
                  <p className="mt-0.5 text-[9px] leading-snug text-ms-muted sr-only">{a.read}</p>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>

      {!focusMode ? (
        <>
          <div className="relative z-[2] mt-4">
            <h3 className="ms-data-label text-ms-faint">
              {pickLocale(locale, "Success / failure intelligence", "Интеллект успеха / провала")}
            </h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {bundle.survivalIntel.map((s) => (
                <li
                  key={s.id}
                  className={cn(
                    "ms-memory-survival",
                    s.outcome === "survived" && "ms-memory-survival--survived",
                    s.outcome === "failed" && "ms-memory-survival--failed",
                  )}
                >
                  <p className="text-[10px] font-medium text-ms-text">{s.title}</p>
                  <p className="mt-1 text-[9px] leading-snug text-ms-muted">{s.read}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-[2] mt-4">
            <h3 className="ms-data-label text-ms-faint">{pickLocale(locale, "Agent memory", "Память агентов")}</h3>
            <ul className="mt-2 space-y-2">
              {bundle.agentMemory.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "ms-memory-agent-note",
                    n.accountability === "fractured" && "ms-memory-agent-note--fractured",
                  )}
                >
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-ms-faint">{n.agentLabel}</span>
                  <p className="mt-0.5 text-[10px] leading-snug text-ms-muted">{n.line}</p>
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
          {pickLocale(locale, "Temporal pattern evolution", "Временная эволюция паттерна")}
        </summary>
        <ol className="mt-3 ms-memory-evolution">
          {bundle.evolution.map((frame) => (
            <li
              key={frame.tick}
              className={cn(
                "ms-memory-evolution__frame",
                frame.phase === "collapse" && "ms-memory-evolution__frame--collapse",
                frame.phase === "fragility" && "ms-memory-evolution__frame--fragility",
              )}
            >
              <span className="tabular-nums text-ms-faint">{frame.headline}</span>
              <p className="text-[10px] leading-snug text-ms-muted">{frame.note}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 flex flex-wrap gap-3 text-[10px]">
          <Link href="/replay" className="text-ms-flow/85 hover:underline">
            {pickLocale(locale, "Replay Studio", "Replay Studio")}
          </Link>
          <Link href="/agents" className="text-ms-flow/85 hover:underline">
            {pickLocale(locale, "Agents", "Агенты")}
          </Link>
        </p>
      </details>
    </section>
  );
}

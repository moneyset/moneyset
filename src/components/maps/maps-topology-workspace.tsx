"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import { useShallow } from "zustand/react/shallow";

import { InterpretationLayer } from "@/components/intelligence/interpretation-blocks";
import type { MapsTopologyCell, MapsTopologyLayer } from "@/lib/intelligence/maps-topology-view";
import { deriveMapsTopologyBundle } from "@/lib/intelligence/maps-topology-view";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

function cellClass(tone: MapsTopologyCell["tone"]): string {
  if (tone === "stress") {
    return "border-ms-warning/22 bg-gradient-to-br from-ms-warning/[0.07] to-ms-surface/20 text-ms-text";
  }
  if (tone === "support") {
    return "border-ms-consensus/20 bg-gradient-to-br from-ms-consensus/[0.08] to-ms-surface/20 text-ms-text";
  }
  return "border-ms-border/25 bg-gradient-to-br from-ms-cognition/[0.06] to-ms-surface/15 text-ms-text";
}

function TopologyField({
  cells,
  simTick,
  compact,
}: {
  cells: readonly MapsTopologyCell[];
  simTick: number;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative ms-maps-field overflow-hidden rounded-ms-lg border border-ms-border/18 bg-ms-surface/8",
        compact ? "aspect-[16/11] min-h-[11rem]" : "aspect-[16/10] min-h-[12.5rem] sm:min-h-[14rem]",
      )}
      style={{ "--maps-tick": simTick } as CSSProperties}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] ms-maps-field-grid" aria-hidden />
      {cells.map((c, idx) => (
        <div
          key={c.id}
          className={cn(
            "ms-maps-cell absolute min-h-0 min-w-0 overflow-hidden rounded-ms-md border px-2.5 py-2 shadow-none backdrop-blur-[1px] transition-[opacity,transform] duration-700 ease-out",
            cellClass(c.tone),
            "ms-maps-cell-drift",
          )}
          style={
            {
              left: `${c.x}%`,
              top: `${c.y}%`,
              width: `${c.w}%`,
              height: `${c.h}%`,
              opacity: 0.22 + (c.emphasis / 100) * 0.62,
              animationDelay: `${(idx * 2.1 + (simTick % 7) * 0.08).toFixed(2)}s`,
            } as CSSProperties
          }
        >
          <p className="text-pretty text-[9px] font-semibold leading-tight tracking-tight text-ms-text/90">{c.label}</p>
          <p
            className={cn(
              "mt-0.5 text-pretty text-[8.5px] leading-snug text-ms-muted/95",
              compact ? "line-clamp-2" : "line-clamp-3",
            )}
          >
            {c.readLine}
          </p>
        </div>
      ))}
    </div>
  );
}

function TopologyLayerPanel({
  layer,
  simTick,
  locale,
  compact,
}: {
  layer: MapsTopologyLayer;
  simTick: number;
  locale: ReturnType<typeof useUiPrefsStore.getState>["uiLocale"];
  compact?: boolean;
}) {
  return (
    <InterpretationLayer title={layer.title}>
      <p className="text-[10px] leading-snug text-ms-faint">{layer.synopsis}</p>
      <TopologyField cells={layer.cells} simTick={simTick} compact={compact} />
      <p className="mt-2 text-[9px] leading-snug text-ms-muted/90">
        {pickLocale(locale, "Execution tie-in:", "Связь с исполнением:")}{" "}
        <span className="text-ms-text/88">{layer.executionImplication}</span>
      </p>
      <ul className="mt-2 space-y-1 border-t border-ms-border/10 pt-2">
        {layer.cells.map((c) => (
          <li key={`${c.id}-ex`} className="text-[9px] leading-snug text-ms-muted/95">
            <span className="font-medium text-ms-faint">{c.label}</span>
            <span className="text-ms-border/40"> — </span>
            {c.executionNote}
          </li>
        ))}
      </ul>
    </InterpretationLayer>
  );
}

export function MapsTopologyWorkspace({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const compressed = useUiPrefsStore((s) => s.cognitionMode === "compressed");
  const { derived, latent, history, simTick } = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      history: s.history,
      simTick: s.simTick,
    })),
  );

  const bundle = useMemo(
    () => deriveMapsTopologyBundle(locale, latent, derived, history, simTick),
    [locale, latent, derived, history, simTick],
  );

  const synthesis = pickLocale(
    locale,
    "Topology read: structural stability, liquidity density, and volatility envelope jointly constrain execution style.",
    "Прочтение топологии: стабильность структуры, плотность ликвидности и конверт волатильности совместно задают стиль исполнения.",
  );

  const desktopGrid = (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <TopologyLayerPanel layer={bundle.structural} simTick={simTick} locale={locale} />
        <TopologyLayerPanel layer={bundle.participation} simTick={simTick} locale={locale} />
        <TopologyLayerPanel layer={bundle.volatility} simTick={simTick} locale={locale} />
      </div>
      <div className="space-y-5">
        <TopologyLayerPanel layer={bundle.liquidity} simTick={simTick} locale={locale} />
        <TopologyLayerPanel layer={bundle.imbalance} simTick={simTick} locale={locale} />
        <TopologyLayerPanel layer={bundle.evolution} simTick={simTick} locale={locale} />
      </div>
    </div>
  );

  const mobileStack = (
    <div className="space-y-5">
      <TopologyLayerPanel layer={bundle.structural} simTick={simTick} locale={locale} compact={compressed} />
      <details className="group rounded-ms-lg border border-ms-border/25 bg-ms-elevated/8">
        <summary className="ms-focus-ring cursor-pointer list-none px-3 py-2.5 text-[11px] font-medium text-ms-text [&::-webkit-details-marker]:hidden">
          <span className="mr-1.5 inline-block text-ms-faint transition-transform group-open:rotate-90" aria-hidden>
            ›
          </span>
          {pickLocale(
            locale,
            "Liquidity · participation · imbalance · volatility · evolution",
            "Ликвидность · участие · дисбаланс · вола · эволюция",
          )}
        </summary>
        <div className="space-y-5 border-t border-ms-border/15 p-3 pt-4">
          <TopologyLayerPanel layer={bundle.liquidity} simTick={simTick} locale={locale} compact />
          <TopologyLayerPanel layer={bundle.participation} simTick={simTick} locale={locale} compact />
          <TopologyLayerPanel layer={bundle.imbalance} simTick={simTick} locale={locale} compact />
          <TopologyLayerPanel layer={bundle.volatility} simTick={simTick} locale={locale} compact />
          <TopologyLayerPanel layer={bundle.evolution} simTick={simTick} locale={locale} compact />
        </div>
      </details>
    </div>
  );

  return (
    <section
      id="maps-topology-workspace"
      data-ms-focus
      className={cn("scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)]", className)}
      aria-label={pickLocale(locale, "Structural maps workspace", "Рабочее пространство карт")}
    >
      <div className="ms-maps-workspace rounded-ms-2xl border border-ms-border/20 bg-ms-surface/6 p-4 sm:p-5 lg:p-6">
        <div className="rounded-ms-lg border border-ms-border/15 bg-ms-elevated/10 px-3 py-2.5 sm:px-4">
          <p className="text-[10px] font-medium text-ms-cognition/90">{pickLocale(locale, "Field synthesis", "Сводка поля")}</p>
          <p className="mt-1 text-[11px] leading-snug text-ms-muted">{synthesis}</p>
        </div>

        <div className="mt-5 lg:hidden">{mobileStack}</div>
        <div className="mt-5 hidden lg:block">{desktopGrid}</div>

        <p className="mt-6 text-[10px] leading-snug text-ms-faint">
          {pickLocale(
            locale,
            "Maps are institutional spatial cognition — motion reflects live pressure drift, not decoration.",
            "Карты — институциональное пространственное прочтение; движение отражает дрейф давления, не декор.",
          )}{" "}
          <Link href="/execution" className="text-ms-cognition/80 underline-offset-2 hover:underline">
            {pickLocale(locale, "Execution", "Исполнение")}
          </Link>
        </p>
      </div>
    </section>
  );
}

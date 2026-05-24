"use client";

import { useMemo, memo } from "react";
import type { CSSProperties } from "react";

import { executionSessionKind } from "@/lib/cognition/session-visual";
import { deriveExecutionMapView } from "@/lib/execution/derive-execution-map";
import type { ExecutionLayerSurface } from "@/lib/execution/derive-execution-layer";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import type { UiLocale } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";
import { pickLocale } from "@/lib/i18n/cognition-dict";

type ExecutionMapSurfaceProps = {
  locale: UiLocale;
  surface: ExecutionLayerSurface;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  className?: string;
};

function clampTilt(n: number): number {
  return Math.max(-14, Math.min(14, n));
}

export const ExecutionMapSurface = memo(function ExecutionMapSurface({
  locale,
  surface,
  derived,
  latent,
  className,
}: ExecutionMapSurfaceProps) {
  const map = useMemo(
    () => deriveExecutionMapView({ locale, surface, derived, latent }),
    [locale, surface, derived, latent],
  );
  const session = executionSessionKind();

  const stressSeries = surface.stressSeries;
  const stabSeries = surface.stabilitySeries;
  const ribbonTilt = useMemo(() => {
    if (stressSeries.length < 2 || stabSeries.length < 2) return 0;
    const ds = (stressSeries[stressSeries.length - 1]! - stressSeries[0]!) / 100;
    const dst = (stabSeries[stabSeries.length - 1]! - stabSeries[0]!) / 100;
    return clampTilt((ds - dst * 0.6) * 18);
  }, [stressSeries, stabSeries]);

  const invalidateSoft =
    surface.dangerBand === "elevated" ||
    surface.dangerBand === "dangerous" ||
    surface.dangerBand === "critical";

  const depthHeights = useMemo(() => {
    const m = Math.max(0.1, ...map.lanes.map((l) => l.pressure));
    return map.lanes.map((l) => l.pressure / m);
  }, [map.lanes]);

  if (surface.zones.length === 0) {
    return (
      <div
        className={cn(
          "rounded-ms-md border border-dashed border-ms-border/25 bg-ms-surface/6 px-3 py-6 text-center",
          className,
        )}
      >
        <p className="text-[11px] leading-snug text-ms-faint">
          {pickLocale(locale, "Execution map renders when mark/last anchors the tape.", "Карта исполнения появится при метке/последней на ленте.")}
        </p>
      </div>
    );
  }

  return (
    <div
      id="execution-map-mode"
      className={cn(
        "ms-exec-map-surface relative overflow-hidden rounded-ms-xl border border-ms-border/20 bg-ms-surface/8",
        `ms-exec-map-surface--${session}`,
        invalidateSoft && "ms-exec-map--invalidate-soft",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-ms-cognition/[0.04] blur-3xl opacity-[0.38]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-ms-flow/[0.035] blur-2xl opacity-[0.34]"
        aria-hidden
      />

      <div className="relative px-3 pt-2 sm:px-4" aria-hidden>
        <div
          className="ms-exec-map-structural-ribbon h-1 w-full origin-left rounded-full bg-gradient-to-r from-ms-flow/20 via-ms-cognition/38 to-ms-warning/22"
          style={{ transform: `skewX(${ribbonTilt}deg)` }}
        />
      </div>

      <div className="relative border-b border-ms-border/12 px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-1">
            <p className="ms-data-label text-ms-faint">
              {pickLocale(locale, "Live execution map", "Живая карта исполнения")}
            </p>
            <p className="text-[11px] font-medium leading-snug text-ms-text sm:text-[12px]">{map.responseState.headline}</p>
            <p className="line-clamp-2 max-w-prose text-[10px] leading-relaxed text-ms-muted/95 max-md:line-clamp-1 sm:max-w-prose">
              {map.responseState.subline}
            </p>
          </div>
          <div className="flex max-h-[5rem] shrink-0 flex-col gap-1 overflow-hidden max-md:[&>p:not(:first-child)]:hidden sm:max-h-none sm:items-end">
            {map.timingLines.map((line, i) => (
              <p
                key={i}
                className="max-w-[16rem] rounded-ms-sm border border-ms-border/12 bg-ms-elevated/10 px-2 py-1 text-end text-[10px] leading-snug text-ms-muted/95 sm:text-[11px]"
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="relative max-md:max-h-none max-md:overflow-visible md:max-h-[min(56vh,30rem)] md:overflow-y-auto md:overscroll-y-contain">
        <div className="flex px-1 sm:px-2">
          <div className="flex shrink-0 flex-col justify-start gap-0.5 border-r border-ms-border/8 py-2 pr-1.5 sm:py-2.5" aria-hidden>
            {depthHeights.map((h, i) => (
              <div
                key={i}
                className="ms-exec-depth-cell ms-exec-depth-stack w-2 rounded-sm bg-gradient-to-t from-ms-cognition/15 to-ms-flow/35"
                style={{ height: `${Math.max(6, Math.round(h * 48))}px` }}
              />
            ))}
          </div>
          <ul className="min-w-0 flex-1 divide-y divide-ms-border/10 py-1 sm:py-2">
          {map.lanes.map((lane) => {
            const primary = map.primaryKind !== null && lane.kind === map.primaryKind;
            const isPocket = lane.kind === "liquidity_lower" || lane.kind === "liquidity_upper";
            const glow = isPocket ? lane.pocketGlow : 0;
            return (
              <li key={lane.kind} className={cn("list-none", primary ? "py-2.5 sm:py-3" : "py-1.5 sm:py-2")}>
                <article
                  className={cn(
                    "relative rounded-ms-md border border-transparent px-2 py-2 sm:px-2.5 sm:py-2",
                    primary && "ms-exec-map-lane--focus border-ms-border/22 bg-ms-elevated/12",
                    !primary && "opacity-[0.9]",
                  )}
                  style={
                    glow > 0.04
                      ? ({
                          boxShadow: `0 0 ${10 + glow * 22}px color-mix(in srgb, var(--ms-flow) ${12 + glow * 28}%, transparent)`,
                        } as CSSProperties)
                      : undefined
                  }
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span
                      className={cn(
                        "mt-1 h-8 w-1 shrink-0 rounded-full bg-ms-border/40 sm:h-9",
                        primary && "bg-ms-cognition/60",
                        lane.kind === "breakdown_trigger" && "bg-ms-danger/45",
                        (lane.kind === "liquidity_lower" || lane.kind === "liquidity_upper") && "bg-ms-flow/50",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                        <h3
                          className={cn(
                            "text-[10px] font-semibold tracking-tight text-ms-muted sm:text-[11px]",
                            primary && "text-ms-text/92",
                          )}
                        >
                          {lane.ladderTitle}
                        </h3>
                        <p className="tabular-nums text-[10px] text-ms-text/88 sm:text-[11px]">{lane.rangeLabel}</p>
                      </div>
                      <div className="ms-exec-map-pressure-track h-1.5 w-full overflow-hidden rounded-full bg-ms-border/12 sm:h-2">
                        <div
                          className="ms-exec-map-pressure-ribbon h-full rounded-full bg-gradient-to-r from-ms-cognition/40 via-ms-flow/35 to-ms-consensus/25"
                          style={{ width: `${Math.max(6, Math.round(lane.pressure * 100))}%` }}
                        />
                      </div>
                      <p className="line-clamp-2 text-[10px] leading-snug text-ms-muted/95 sm:line-clamp-none sm:text-[10.5px]">
                        {lane.behavioralLine}
                      </p>
                      <p className="hidden text-[9px] leading-snug text-ms-dim/95 md:block">{lane.interactionLabel}</p>
                      <div className="max-md:hidden flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] leading-snug text-ms-faint/90">
                        <span>{lane.convictionLabel}</span>
                        <span className="text-ms-border/50">·</span>
                        <span>{lane.participationNote}</span>
                      </div>
                      <div className="flex max-w-sm gap-1 pt-0.5" aria-hidden>
                        <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-ms-border/18" title="Coherence">
                          <div
                            className="h-full rounded-full bg-ms-consensus/50"
                            style={{ width: `${Math.round(lane.stripCoherence * 100)}%` }}
                          />
                        </div>
                        <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-ms-border/18" title="Participation tension">
                          <div
                            className="h-full rounded-full bg-ms-flow/50"
                            style={{ width: `${Math.round(lane.stripParticipation * 100)}%` }}
                          />
                        </div>
                        <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-ms-border/18" title="Expansion readiness">
                          <div
                            className="h-full rounded-full bg-ms-warning/45"
                            style={{ width: `${Math.round(lane.stripExpansion * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
        </div>
      </div>
    </div>
  );
});

"use client";

import { useMemo } from "react";

import { MicroSparkline } from "@/components/cognition/micro-sparkline";
import type { ExecutionLayerSurface, ExecutionStructuralZone } from "@/lib/execution/derive-execution-layer";
import {
  formatPriceRange,
  pickSparkSeries,
  sparkProfileForExecutionZone,
} from "@/lib/execution/derive-execution-layer";
import type { UiLocale } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";

type StructuralExecutionLadderProps = {
  zones: readonly ExecutionStructuralZone[];
  surface: Pick<
    ExecutionLayerSurface,
    | "stressSeries"
    | "liquiditySeries"
    | "volSeries"
    | "participationSeries"
    | "scenarioSeries"
    | "stabilitySeries"
  >;
  /** Live anchor band — receives primary emphasis. */
  primaryKind: ExecutionStructuralZone["kind"] | null;
  locale: UiLocale;
  className?: string;
};

function mid(z: ExecutionStructuralZone): number {
  return (z.low + z.high) / 2;
}

export function StructuralExecutionLadder({
  zones,
  surface,
  primaryKind,
  locale,
  className,
}: StructuralExecutionLadderProps) {
  const ordered = useMemo(() => {
    if (zones.length === 0) return [];
    if (!primaryKind) return [...zones].sort((a, b) => mid(a) - mid(b));
    const prim = zones.find((z) => z.kind === primaryKind);
    const rest = zones.filter((z) => z.kind !== primaryKind);
    rest.sort((a, b) => mid(a) - mid(b));
    return prim ? [prim, ...rest] : [...zones].sort((a, b) => mid(a) - mid(b));
  }, [zones, primaryKind]);

  if (ordered.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex flex-col gap-2 lg:gap-2.5",
          "max-md:flex-row max-md:gap-3 max-md:overflow-x-auto max-md:overscroll-x-contain max-md:pb-1 max-md:[scrollbar-width:thin]",
          "max-md:snap-x max-md:snap-mandatory",
        )}
      >
        {ordered.map((z, idx) => {
          const primary = primaryKind !== null && z.kind === primaryKind;
          const { key, tone } = sparkProfileForExecutionZone(z.kind);
          const series = pickSparkSeries(surface, key);
          return (
            <article
              key={`${z.kind}-${idx}`}
              className={cn(
                "ms-exec-ladder-rung relative flex min-w-0 flex-col gap-1.5 rounded-ms-md border bg-ms-surface/8 px-2.5 py-2 sm:px-3 sm:py-2.5",
                primary
                  ? "ms-exec-ladder-rung--primary border-ms-border/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:py-3"
                  : "border-ms-border/12 py-2 opacity-[0.88] sm:py-2 lg:py-2",
                "max-md:w-[min(88vw,17.75rem)] max-md:flex-shrink-0 max-md:snap-start",
              )}
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-0.5 h-7 w-0.5 shrink-0 rounded-full bg-ms-border/35",
                    primary ? "ms-exec-ladder-marker--primary bg-ms-cognition/55" : "opacity-70",
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <h3
                    className={cn(
                      "text-[10px] font-semibold leading-tight tracking-tight text-ms-muted sm:text-[11px]",
                      primary && "text-ms-text/95 lg:text-[12px]",
                    )}
                  >
                    {z.ladderTitle}
                  </h3>
                  <p
                    className={cn(
                      "tabular-nums text-[11px] text-ms-text/90 sm:text-[12px]",
                      primary && "lg:text-[13px]",
                    )}
                  >
                    {formatPriceRange(locale, z.low, z.high)}
                  </p>
                </div>
                <MicroSparkline
                  values={series}
                  tone={tone}
                  width={primary ? 72 : 56}
                  height={primary ? 20 : 16}
                  weight="hair"
                  showEndpoint
                  className="shrink-0 opacity-90"
                  ariaLabel={z.ladderTitle}
                />
              </div>
              <p className="line-clamp-2 pl-3 text-[10px] leading-snug text-ms-muted/95 sm:line-clamp-none sm:pl-3.5">
                {z.microLine}
              </p>
              <p className="hidden pl-3 text-[9px] leading-snug text-ms-faint/90 sm:block sm:pl-3.5">
                {z.ladderImportance}
              </p>
              <p className="hidden pl-3 text-[9px] leading-snug text-ms-dim/95 sm:block sm:pl-3.5">{z.ladderFraming}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

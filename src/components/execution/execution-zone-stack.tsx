"use client";

import { useMemo } from "react";

import { MicroSparkline } from "@/components/cognition/micro-sparkline";
import type { ExecutionLayerSurface, ExecutionStructuralZone } from "@/lib/execution/derive-execution-layer";
import {
  formatPriceRange,
  pickSparkSeries,
  sparkProfileForExecutionZone,
} from "@/lib/execution/derive-execution-layer";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";

type ExecutionZoneStackProps = {
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
  primaryKind: ExecutionStructuralZone["kind"] | null;
  locale: UiLocale;
  className?: string;
};

function mid(z: ExecutionStructuralZone): number {
  return (z.low + z.high) / 2;
}

function zonePressureWidth(series: readonly number[]): number {
  if (series.length === 0) return 38;
  const v = series[series.length - 1] ?? 50;
  return Math.max(18, Math.min(100, Math.round(v)));
}

/** Large institutional execution bands — dominant scan surface, not signal cards. */
export function ExecutionZoneStack({ zones, surface, primaryKind, locale, className }: ExecutionZoneStackProps) {
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
    <div
      className={cn("space-y-2.5 lg:space-y-3.5", className)}
      aria-label={pickLocale(locale, "Execution zone stack", "Стек зон исполнения")}
    >
      <p className="ms-data-label text-ms-faint">
        {pickLocale(locale, "Live execution bands", "Живые полосы исполнения")}
      </p>
      <div className="flex flex-col gap-2.5 lg:gap-3">
        {ordered.map((z, idx) => {
          const primary = primaryKind !== null && z.kind === primaryKind;
          const { key, tone } = sparkProfileForExecutionZone(z.kind);
          const series = pickSparkSeries(surface, key);
          const ribbonW = zonePressureWidth(series);

          return (
            <article
              key={`${z.kind}-${idx}`}
              className={cn(
                "ms-exec-zone-band relative overflow-hidden rounded-ms-lg border transition-[opacity,box-shadow] duration-300",
                primary
                  ? "ms-exec-zone-band--primary border-ms-border/35 bg-ms-surface/14"
                  : "ms-exec-zone-band--secondary border-ms-border/14 bg-ms-surface/6",
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-ms-md",
                  primary ? "bg-ms-cognition/55" : "bg-ms-border/40",
                )}
                aria-hidden
              />
              <div className={cn("relative pl-4", primary ? "px-4 pb-4 pt-3.5 sm:px-5 sm:pb-5 sm:pt-4" : "px-3.5 pb-3 pt-2.5 sm:px-4")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3
                      className={cn(
                        "font-semibold leading-tight tracking-tight text-ms-muted",
                        primary ? "text-[13px] text-ms-text sm:text-sm lg:text-[15px]" : "text-[11px] sm:text-[12px]",
                      )}
                    >
                      {z.ladderTitle}
                    </h3>
                    <p
                      className={cn(
                        "tabular-nums font-medium tracking-tight text-ms-text",
                        primary ? "text-[clamp(1.15rem,3.2vw,1.65rem)] sm:text-[1.5rem]" : "text-[1.05rem] sm:text-[1.15rem]",
                      )}
                    >
                      {formatPriceRange(locale, z.low, z.high)}
                    </p>
                  </div>
                  <MicroSparkline
                    values={series}
                    tone={tone}
                    width={primary ? 88 : 64}
                    height={primary ? 24 : 18}
                    weight="hair"
                    showEndpoint
                    className={cn("shrink-0 opacity-90", !primary && "opacity-[0.72]")}
                    ariaLabel={z.ladderTitle}
                  />
                </div>

                <div
                  className={cn(
                    "mt-3 h-1 overflow-hidden rounded-full bg-ms-border/18",
                    primary ? "sm:mt-3.5" : "mt-2",
                  )}
                  role="presentation"
                  aria-hidden
                >
                  <div
                    className="ms-exec-zone-pressure-ribbon h-full rounded-full bg-gradient-to-r from-ms-cognition/45 via-ms-flow/35 to-ms-consensus/22"
                    style={{ width: `${ribbonW}%` }}
                  />
                </div>

                <p
                  className={cn(
                    "mt-2.5 text-pretty leading-snug text-ms-text/92",
                    primary ? "text-[12px] sm:text-[13px]" : "text-[11px] text-ms-muted/95 sm:text-[12px]",
                  )}
                >
                  {z.ladderFraming}
                </p>
                <p className={cn("mt-1.5 text-pretty leading-snug text-ms-muted", primary ? "text-[11px] sm:text-[12px]" : "text-[10px] sm:text-[11px]")}>
                  {z.ladderImportance}
                </p>
                <p className="mt-2 border-t border-ms-border/12 pt-2 text-[10px] leading-snug text-ms-faint sm:text-[11px]">
                  <span className="font-medium text-ms-faint/95">
                    {pickLocale(locale, "Participation", "Участие")}
                  </span>
                  <span className="text-ms-border-mid"> · </span>
                  {z.microLine}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

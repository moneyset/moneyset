"use client";

import type { ExecutionLayerSurface } from "@/lib/execution/derive-execution-layer";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";

type ExecutionPrimaryCognitionStripProps = {
  locale: UiLocale;
  surface: Pick<
    ExecutionLayerSurface,
    | "executionPosture" | "continuationRead" | "invalidation" | "executionBiasLabel" | "dangerBand"
  >;
  className?: string;
};

/** Compressed primary cognition — posture, participation read, invalidation — not paragraph walls. */
export function ExecutionPrimaryCognitionStrip({ locale, surface, className }: ExecutionPrimaryCognitionStripProps) {
  const warn =
    surface.dangerBand === "critical" || surface.dangerBand === "dangerous" || surface.dangerBand === "elevated";

  return (
    <div
      className={cn(
        "grid gap-3 rounded-ms-lg border border-ms-border/22 bg-ms-surface/12 p-3.5 sm:gap-4 sm:p-4 lg:grid-cols-3 lg:gap-6",
        className,
      )}
      role="region"
      aria-label={pickLocale(locale, "Primary execution cognition", "Базовое исполнительное прочтение")}
    >
      <div className="min-w-0 space-y-1.5 lg:border-r lg:border-ms-border/15 lg:pr-5">
        <p className="text-[10px] font-medium text-ms-faint">
          {pickLocale(locale, "Posture", "Поза")}
        </p>
        <p className="line-clamp-3 text-pretty text-[12px] font-medium leading-snug tracking-tight text-ms-text sm:line-clamp-4 sm:text-[13px]">
          {surface.executionPosture}
        </p>
        <p className="text-[10px] leading-snug text-ms-muted">{surface.executionBiasLabel}</p>
      </div>
      <div className="min-w-0 space-y-1.5 lg:border-r lg:border-ms-border/15 lg:px-5">
        <p className="text-[10px] font-medium text-ms-faint">
          {pickLocale(locale, "Participation condition", "Условие участия")}
        </p>
        <p className="line-clamp-3 text-pretty text-[12px] leading-snug text-ms-muted sm:line-clamp-4 sm:text-[13px]">
          {surface.continuationRead}
        </p>
      </div>
      <div
        className={cn(
          "min-w-0 space-y-1.5 lg:pl-5",
          warn && "lg:border-l-2 lg:border-ms-danger/22 lg:pl-6",
        )}
      >
        <p className={cn("text-[10px] font-medium", warn ? "text-ms-warning/90" : "text-ms-faint")}>
          {pickLocale(locale, "Invalidation pressure", "Давление инвалидации")}
        </p>
        <p
          className={cn(
            "line-clamp-3 text-pretty text-[12px] leading-snug sm:line-clamp-4 sm:text-[13px]",
            warn ? "text-ms-text/95" : "text-ms-muted",
          )}
        >
          {surface.invalidation}
        </p>
      </div>
    </div>
  );
}

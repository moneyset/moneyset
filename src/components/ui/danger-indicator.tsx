"use client";

import type { DangerBandId } from "@/lib/simulation/cognition-types";
import { cn } from "@/lib/utils";

const bandWidth: Record<DangerBandId, string> = {
  calm: "w-[12%]",
  moderate: "w-[32%]",
  elevated: "w-[52%]",
  dangerous: "w-[74%]",
  critical: "w-[92%]",
};

type DangerIndicatorProps = {
  /** Five-tier fragility scale (simulation + live). */
  band: DangerBandId;
  label?: string;
  className?: string;
};

export function DangerIndicator({ band, label, className }: DangerIndicatorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {label ? <p className="ms-data-label text-ms-danger/90">{label}</p> : null}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-ms-pill bg-ms-elevated">
        <div
          className={cn(
            "h-full rounded-ms-pill transition-[width] duration-700 ease-out",
            band === "critical" || band === "dangerous"
              ? "bg-ms-danger/60"
              : band === "elevated"
                ? "bg-ms-warning/55"
                : "bg-ms-border-mid",
            bandWidth[band],
          )}
        />
      </div>
      <p className="ms-log-meta text-ms-faint capitalize">{band.replace(/_/g, " ")}</p>
    </div>
  );
}

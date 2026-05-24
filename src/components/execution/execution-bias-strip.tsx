"use client";

import type { ExecutionBiasVariant } from "@/lib/execution/derive-execution-layer";
import { cn } from "@/lib/utils";

const variantClass: Record<ExecutionBiasVariant, string> = {
  defensive_posture: "ms-exec-bias--defensive",
  aggression_reduced: "ms-exec-bias--caution",
  expansion_vulnerable: "ms-exec-bias--expansion",
  reclaim_required: "ms-exec-bias--reclaim",
  continuation_strengthening: "ms-exec-bias--continuation",
  favor_responsive_long: "ms-exec-bias--favor-long",
  favor_responsive_short: "ms-exec-bias--favor-short",
  measured_neutral: "ms-exec-bias--neutral",
};

type ExecutionBiasStripProps = {
  label: string;
  variant: ExecutionBiasVariant;
  className?: string;
};

/** Compact execution bias — actionable framing, not a signal card. */
export function ExecutionBiasStrip({ label, variant, className }: ExecutionBiasStripProps) {
  return (
    <div
      className={cn(
        "ms-exec-bias-strip relative overflow-hidden rounded-ms-md border border-ms-border/18 px-3 py-2.5 sm:px-4 sm:py-3",
        variantClass[variant],
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="ms-exec-bias-strip__glow pointer-events-none absolute inset-0 opacity-90" aria-hidden />
      <p className="relative text-[12px] font-medium leading-snug tracking-tight text-ms-text/92 sm:text-[13px]">
        {label}
      </p>
    </div>
  );
}

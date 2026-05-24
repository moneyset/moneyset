"use client";

import { MicroDeltaGlyph } from "@/components/cognition/micro-delta-glyph";
import { MicroSparkline } from "@/components/cognition/micro-sparkline";
import { classifySeriesDelta } from "@/lib/cognition/series-delta";
import { cn } from "@/lib/utils";

type SparkTone = "danger" | "warning" | "flow" | "consensus" | "muted";

type SparklineDeltaPairProps = {
  values: readonly number[];
  tone?: SparkTone;
  width?: number;
  height?: number;
  ariaLabel: string;
  /** Smaller + fainter on narrow viewports. */
  restrained?: boolean;
  className?: string;
};

/** Sparkline + tiny delta glyph — cognition density without extra chrome. */
export function SparklineDeltaPair({
  values,
  tone = "muted",
  width = 44,
  height = 12,
  ariaLabel,
  restrained,
  className,
}: SparklineDeltaPairProps) {
  const trend = classifySeriesDelta(values);
  const w = restrained ? Math.max(32, width - 8) : width;
  const h = restrained ? Math.max(10, height - 2) : height;
  return (
    <div className={cn("inline-flex items-end gap-0.5", restrained && "opacity-[0.86]", className)}>
      <MicroSparkline
        values={values}
        width={w}
        height={h}
        tone={tone}
        weight="hair"
        showEndpoint
        ariaLabel={ariaLabel}
      />
      <MicroDeltaGlyph trend={trend} className="mb-[1px] text-ms-muted" title={ariaLabel} />
    </div>
  );
}

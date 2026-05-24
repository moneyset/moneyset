"use client";

import type { SeriesDeltaTrend } from "@/lib/cognition/series-delta";
import { cn } from "@/lib/utils";

type MicroDeltaGlyphProps = {
  trend: SeriesDeltaTrend;
  /** Extra-quiet on mobile when density prop used upstream. */
  className?: string;
  /** Accessible hint — keep short. */
  title?: string;
};

/** 7×5px SVG — arrow or dash; low contrast, no retail sizing. */
export function MicroDeltaGlyph({ trend, className, title }: MicroDeltaGlyphProps) {
  const common = "text-current opacity-[0.42]";
  return (
    <svg
      width={7}
      height={5}
      viewBox="0 0 7 5"
      className={cn("shrink-0", common, className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      {trend === "rising" ? (
        <path d="M1 4 L3.5 1 L6 4" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
      ) : trend === "falling" ? (
        <path d="M1 1 L3.5 4 L6 1" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <line x1="1" y1="2.5" x2="6" y2="2.5" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" opacity={0.55} />
      )}
    </svg>
  );
}

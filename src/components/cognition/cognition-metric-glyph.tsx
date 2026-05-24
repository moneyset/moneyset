"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CognitionMetricGlyphProps = {
  label: string;
  value: number | string;
  /** 0–100 bar fill */
  meter?: number;
  tone?: "neutral" | "stress" | "support" | "critical";
  className?: string;
  children?: ReactNode;
};

/** Single compressed metric — number first, words minimal. */
export function CognitionMetricGlyph({
  label,
  value,
  meter,
  tone = "neutral",
  className,
  children,
}: CognitionMetricGlyphProps) {
  const fill = meter !== undefined ? Math.max(4, Math.min(100, meter)) : null;

  return (
    <div
      className={cn(
        "ms-cognition-glyph",
        tone === "stress" && "ms-cognition-glyph--stress",
        tone === "support" && "ms-cognition-glyph--support",
        tone === "critical" && "ms-cognition-glyph--critical",
        className,
      )}
    >
      <p className="ms-cognition-glyph__value tabular-nums">{value}</p>
      <p className="ms-cognition-glyph__label">{label}</p>
      {fill !== null ? (
        <div className="ms-cognition-glyph__meter" aria-hidden>
          <span style={{ width: `${fill}%` } as CSSProperties} />
        </div>
      ) : null}
      {children}
    </div>
  );
}

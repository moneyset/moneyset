"use client";

import { blufAriaLabel, blufLabel, hierarchySectionLabel } from "@/lib/i18n/section-ia";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import type { SurfaceBlufSnapshot } from "@/hooks/use-surface-bluf";

type SurfaceBlufBlockProps = {
  bluf: SurfaceBlufSnapshot;
  className?: string;
};

function toneClass(tone: SurfaceBlufSnapshot["rows"][number]["tone"]): string {
  if (tone === "risk")      return "text-ms-danger/92";
  if (tone === "warning")   return "text-ms-warning/90";
  if (tone === "cognition") return "text-ms-cognition";
  return "text-ms-text";
}

/**
 * BLUF — Bottom Line Up Front.
 * Conclusion first. The four canonical fields:
 *   Current State · Risk · Confidence · Primary Implication
 */
export function SurfaceBlufBlock({ bluf, className }: SurfaceBlufBlockProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  const conclusionLabel = hierarchySectionLabel(locale, "conclusion");
  const implLabel       = blufLabel(locale, "primaryImplication");
  const ariaLabel       = blufAriaLabel(locale);
  const readFirst       = pickLocale(locale, "Read this first", "Читайте сначала");

  return (
    <section
      className={cn(
        "mb-[var(--ms-block-gap)] overflow-hidden rounded-ms-xl",
        "border border-ms-cognition/20 bg-gradient-to-b from-ms-cognition/[0.07] via-ms-surface/20 to-ms-elevated/10",
        className,
      )}
      aria-label={ariaLabel}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-ms-border/20 px-4 py-2.5 sm:px-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ms-cognition/90">
          {conclusionLabel}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ms-faint/70">
          {readFirst}
        </p>
      </header>

      {/* Metric grid — Current State · Risk · Confidence · [surface-specific] */}
      <div className="grid gap-0 divide-x divide-ms-border/15 sm:grid-flow-col sm:auto-cols-fr">
        {bluf.rows.map((row) => (
          <div key={row.labelKey} className="min-w-0 px-4 py-3.5 sm:px-5">
            <p className="ms-data-label text-ms-faint">
              {blufLabel(locale, row.labelKey)}
            </p>
            <p
              className={cn(
                "mt-1.5 text-[13px] font-semibold leading-snug tracking-tight",
                toneClass(row.tone),
              )}
            >
              {row.value}
            </p>
          </div>
        ))}
      </div>

      {/* Primary Implication — the one sentence that drives the decision */}
      <div className="border-t border-ms-border/20 bg-ms-elevated/14 px-4 py-4 sm:px-5">
        <p className="ms-data-label text-ms-faint">{implLabel}</p>
        <p className="mt-1.5 text-pretty text-[13px] font-medium leading-relaxed text-ms-text sm:text-[14px]">
          {bluf.implication}
        </p>
      </div>
    </section>
  );
}

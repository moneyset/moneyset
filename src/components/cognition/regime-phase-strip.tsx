"use client";

import type { CognitiveSnapshot } from "@/lib/simulation/cognition-types";
import { phaseLabel, pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";

function abbrevPhase(label: string): string {
  const w = label.trim().split(/\s+/)[0] ?? label;
  return w.length > 8 ? `${w.slice(0, 7)}…` : w;
}

type RegimePhaseStripProps = {
  history: readonly CognitiveSnapshot[];
  max?: number;
  className?: string;
};

/** Read-only regime path from recent cognition ticks — no interaction. */
export function RegimePhaseStrip({ history, max = 9, className }: RegimePhaseStripProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const slice = history.length <= max ? history : history.slice(-max);
  if (slice.length === 0) return null;
  const pathAria = pickLocale(locale, "Recent regime path", "Недавняя траектория режима");

  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline gap-x-0.5 gap-y-1 text-[11px] leading-snug text-ms-muted",
        className,
      )}
      aria-label={pathAria}
      lang={locale}
    >
      {slice.map((h, i) => (
        <span key={`${h.simTick}-${i}`} className="inline-flex items-baseline gap-0.5">
          {i > 0 ? <span className="mx-0.5 text-ms-faint/90">→</span> : null}
          <span className="font-medium text-ms-text/90">{abbrevPhase(phaseLabel(locale, h.phase))}</span>
        </span>
      ))}
    </div>
  );
}

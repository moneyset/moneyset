"use client";

import { useMarketMotionContext } from "@/components/motion/market-motion-context";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { CognitionPulse } from "@/lib/motion/motion-language";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

function PulseChip({ pulse, locale }: { pulse: CognitionPulse; locale: ReturnType<typeof useUiPrefsStore.getState>["uiLocale"] }) {
  const label = pickLocale(locale, pulse.headlineEn, pulse.headlineRu);
  return (
    <li
      className={cn(
        "ms-cognition-pulse-chip",
        pulse.severity === "urgent" && "ms-cognition-pulse-chip--urgent",
        pulse.severity === "elevated" && "ms-cognition-pulse-chip--elevated",
      )}
      data-ms-pulse={pulse.id}
    >
      <span className="ms-cognition-pulse-chip__dot" aria-hidden />
      <span className="ms-cognition-pulse-chip__label">{label}</span>
    </li>
  );
}

/** Quiet strip — communicates “something is changing” without alarm UI. */
export function CognitionPulseStrip({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const motion = useMarketMotionContext();

  if (!motion || motion.pulses.length === 0) return null;

  return (
    <div
      className={cn("ms-cognition-pulse-strip", className)}
      role="status"
      aria-live="polite"
      aria-label={pickLocale(locale, "Cognition pulse", "Пульс прочтения")}
      data-ms-motion-phase={motion.phase}
    >
      <span className="ms-cognition-pulse-strip__beacon" aria-hidden />
      <ul className="ms-cognition-pulse-strip__list">
        {motion.pulses.map((p) => (
          <PulseChip key={p.id} pulse={p} locale={locale} />
        ))}
      </ul>
    </div>
  );
}

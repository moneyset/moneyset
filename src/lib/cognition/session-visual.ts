import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

/**
 * Ultra-subtle UTC desk tint for environmental cognition — not a news calendar.
 * Returns low-opacity Tailwind background utilities for thin strips only.
 */
export function utcSessionAmbientBarClass(): string {
  const h = new Date().getUTCHours();
  if (h >= 0 && h < 7) return "bg-ms-flow/[0.07]";
  if (h >= 7 && h < 13) return "bg-ms-consensus/[0.08]";
  if (h >= 13 && h < 16) return "bg-ms-warning/[0.06]";
  if (h >= 16 && h < 22) return "bg-ms-danger/[0.055]";
  return "bg-ms-faint/[0.06]";
}

export type ExecutionSessionKind = "asia" | "london" | "overlap" | "ny" | "drift";

/** UTC bucket for execution rail environment — desk cadence, not a calendar. */
export function executionSessionKind(): ExecutionSessionKind {
  const h = new Date().getUTCHours();
  if (h >= 0 && h < 7) return "asia";
  if (h >= 7 && h < 13) return "london";
  if (h >= 13 && h < 16) return "overlap";
  if (h >= 16 && h < 22) return "ny";
  return "drift";
}

/** Subtle veil over structural rail — session-conditioned, calm. */
export function executionRailSessionVeil(): { fill: string; opacity: number } {
  switch (executionSessionKind()) {
    case "asia":
      return { fill: "var(--ms-flow)", opacity: 0.042 };
    case "london":
      return { fill: "var(--ms-consensus)", opacity: 0.048 };
    case "overlap":
      return { fill: "var(--ms-warning)", opacity: 0.036 };
    case "ny":
      return { fill: "var(--ms-intel)", opacity: 0.044 };
    default:
      return { fill: "var(--ms-text-primary)", opacity: 0.026 };
  }
}

/**
 * Wrapper classes for the execution structural rail — slow session-tinted ambient drift.
 * Environmental desk read, not a calendar strip or ticker.
 */
export function cognitionRailSessionWrapClass(): string {
  const k = executionSessionKind();
  return `ms-cognition-rail-session ms-cognition-rail-session--${k}`;
}

/** Upper-right desk cognition — one quiet line, UTC buckets. */
export function executionSessionDeskStrip(locale: UiLocale): string {
  switch (executionSessionKind()) {
    case "asia":
      return pickLocale(locale, "Asia · thin liquidity", "Азия · тонкая ликвидность");
    case "london":
      return pickLocale(locale, "London · participation breadth", "Лондон · ширина участия");
    case "overlap":
      return pickLocale(locale, "Overlap · transition acceleration", "Перекрытие · ускорение переходов");
    case "ny":
      return pickLocale(locale, "NY · volatility pressure", "NY · давление волы");
    default:
      return pickLocale(locale, "Post-NY drift · softer reads", "После NY · мягче прочтения");
  }
}

import type { AttentionAnchor } from "@/lib/cognition/information-priority";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

/** Primary scroll target for the current attention anchor — mobile + coherence. */
export function attentionAnchorScrollHref(anchor: AttentionAnchor): string {
  switch (anchor) {
    case "stress":
    case "liquidity":
    case "invalidation":
      return "/";
    case "scenario":
      return "/scenarios";
    case "structure":
      return "/maps";
    case "session":
      return "/";
    case "execution":
      return "/execution";
    default:
      return "/";
  }
}

/** One-line operational orientation — surfaces, not ornamental chains. */
export function cognitionFlowStripLine(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Work in order: execution, market structure, scenarios, then session context.",
    "Порядок работы: исполнение, структура рынка, сценарии, затем контекст сессии.",
  );
}

/** Current attention anchor — short desk language. */
export function attentionAnchorDeskLine(locale: UiLocale, anchor: AttentionAnchor): string {
  const m: Record<AttentionAnchor, { en: string; ru: string }> = {
    stress: { en: "Stress is expanding", ru: "Расширяется стресс" },
    liquidity: { en: "Liquidity is unstable", ru: "Нестабильная ликвидность" },
    scenario: { en: "Scenario path is shifting", ru: "Сдвигается сценарный путь" },
    structure: { en: "Regime and structure lead", ru: "Ведут режим и структура" },
    session: { en: "Session transition matters", ru: "Важен сессионный переход" },
    invalidation: { en: "Invalidation pressure elevated", ru: "Повышено давление инвалидации" },
    execution: { en: "Execution discipline leads", ru: "Ведёт дисциплина исполнения" },
  };
  return pickLocale(locale, m[anchor].en, m[anchor].ru);
}

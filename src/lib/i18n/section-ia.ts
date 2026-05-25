/**
 * Phase 1 — information architecture: section purpose, chrome copy, BLUF labels.
 */

import type { UiLocale } from "@/store/ui-prefs-store";
import { pickLocale } from "@/lib/i18n/cognition-dict";

export type PrimarySurfaceId = "core" | "execution" | "scenarios" | "ops" | "maps" | "agents";

export function sectionTitle(locale: UiLocale, id: PrimarySurfaceId): string {
  const m: Record<PrimarySurfaceId, { en: string; ru: string }> = {
    core: { en: "Core", ru: "Ядро" },
    execution: { en: "Execution", ru: "Исполнение" },
    scenarios: { en: "Scenarios", ru: "Сценарии" },
    ops: { en: "Changes", ru: "Изменения" },
    maps: { en: "Maps", ru: "Карты" },
    agents: { en: "Agents", ru: "Агенты" },
  };
  return pickLocale(locale, m[id].en, m[id].ru);
}

/** One-line purpose — visible in chrome and nav. */
export function sectionPurpose(locale: UiLocale, id: PrimarySurfaceId): string {
  const m: Record<PrimarySurfaceId, { en: string; ru: string }> = {
    core: { en: "What is happening now.", ru: "Что происходит сейчас." },
    execution: { en: "What should I do now.", ru: "Что делать сейчас." },
    scenarios: { en: "What could happen next.", ru: "Что может произойти дальше." },
    ops: { en: "What changed since the last read.", ru: "Что изменилось с прошлого прочтения." },
    maps: { en: "Structural market geometry.", ru: "Структурная геометрия рынка." },
    agents: { en: "Consensus and disagreement analysis.", ru: "Консенсус и расхождение прочтений." },
  };
  return pickLocale(locale, m[id].en, m[id].ru);
}

export function sectionChromeSubtitle(locale: UiLocale, id: PrimarySurfaceId): string {
  const m: Record<PrimarySurfaceId, { en: string; ru: string }> = {
    core: {
      en: "Live market posture, risk, and the lead scenario — before you scroll.",
      ru: "Живая поза, риск и ведущий сценарий — до прокрутки.",
    },
    execution: {
      en: "Action bias, invalidation, and zones anchored to live structure.",
      ru: "Уклон действия, снятие и зоны, привязанные к структуре.",
    },
    scenarios: {
      en: "Competing paths forward — ranked by structural advantage, not price targets.",
      ru: "Конкурирующие пути — по структурному преимуществу, не по целям.",
    },
    ops: {
      en: "Material shifts in regime, pressure, participation, and posture.",
      ru: "Существенные сдвиги режима, давления, участия и позы.",
    },
    maps: {
      en: "Where structure, liquidity, and stress concentrate in the field.",
      ru: "Где в поле сходятся структура, ликвидность и стресс.",
    },
    agents: {
      en: "Specialist reads in tension — where agreement breaks and decisions sharpen.",
      ru: "Специализированные прочтения в напряжении — где ломается согласие.",
    },
  };
  return pickLocale(locale, m[id].en, m[id].ru);
}

export function blufAriaLabel(locale: UiLocale): string {
  return pickLocale(locale, "Bottom line up front", "Главное в начале");
}

export function blufLabel(locale: UiLocale, key: BlufLabelKey): string {
  const m: Record<BlufLabelKey, { en: string; ru: string }> = {
    marketState: { en: "Market state", ru: "Состояние рынка" },
    risk: { en: "Risk", ru: "Риск" },
    confidence: { en: "Confidence", ru: "Уверенность" },
    primaryImplication: { en: "Primary implication", ru: "Главная импликация" },
    leadPath: { en: "Lead path", ru: "Ведущий путь" },
    pathWeight: { en: "Relative weight", ru: "Относительный вес" },
    latestChange: { en: "Latest change", ru: "Последнее изменение" },
    fieldRead: { en: "Field read", ru: "Прочтение поля" },
    consensus: { en: "Consensus", ru: "Консенсус" },
    disagreement: { en: "Key disagreement", ru: "Ключевое расхождение" },
  };
  return pickLocale(locale, m[key].en, m[key].ru);
}

export type BlufLabelKey =
  | "marketState"
  | "risk"
  | "confidence"
  | "primaryImplication"
  | "leadPath"
  | "pathWeight"
  | "latestChange"
  | "fieldRead"
  | "consensus"
  | "disagreement";

export function hierarchySectionLabel(
  locale: UiLocale,
  tier: "conclusion" | "reasoning" | "evidence" | "advanced",
): string {
  const m = {
    conclusion: { en: "Conclusion", ru: "Вывод" },
    reasoning: { en: "Reasoning", ru: "Обоснование" },
    evidence: { en: "Evidence", ru: "Доказательная база" },
    advanced: { en: "Advanced analysis", ru: "Углублённый анализ" },
  } as const;
  return pickLocale(locale, m[tier].en, m[tier].ru);
}

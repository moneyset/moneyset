/**
 * Phase 1+2 — information architecture: section purpose, chrome copy, BLUF labels.
 * Every surface must answer: What is this? Why does it matter? What should I do?
 */

import type { UiLocale } from "@/store/ui-prefs-store";
import { pickLocale } from "@/lib/i18n/cognition-dict";

export type PrimarySurfaceId = "core" | "execution" | "scenarios" | "ops" | "maps" | "agents";

export function sectionTitle(locale: UiLocale, id: PrimarySurfaceId): string {
  const m: Record<PrimarySurfaceId, { en: string; ru: string }> = {
    core:      { en: "Core",       ru: "Ядро" },
    execution: { en: "Execution",  ru: "Исполнение" },
    scenarios: { en: "Scenarios",  ru: "Сценарии" },
    ops:       { en: "Changes",    ru: "Изменения" },
    maps:      { en: "Maps",       ru: "Карты" },
    agents:    { en: "Agents",     ru: "Агенты" },
  };
  return pickLocale(locale, m[id].en, m[id].ru);
}

/** One-line definition — the clearest possible answer to "what is this section?" */
export function sectionPurpose(locale: UiLocale, id: PrimarySurfaceId): string {
  const m: Record<PrimarySurfaceId, { en: string; ru: string }> = {
    core:      { en: "What is happening now.",                    ru: "Что происходит сейчас." },
    execution: { en: "What should I do now.",                     ru: "Что делать сейчас." },
    scenarios: { en: "What could happen next.",                   ru: "Что может произойти дальше." },
    ops:       { en: "What changed and why.",                     ru: "Что изменилось и почему." },
    maps:      { en: "Structural market geometry.",               ru: "Структурная геометрия рынка." },
    agents:    { en: "Where intelligence agrees or disagrees.",   ru: "Где прочтения сходятся или расходятся." },
  };
  return pickLocale(locale, m[id].en, m[id].ru);
}

/** Longer descriptive subtitle shown in surface chrome headers. */
export function sectionChromeSubtitle(locale: UiLocale, id: PrimarySurfaceId): string {
  const m: Record<PrimarySurfaceId, { en: string; ru: string }> = {
    core: {
      en: "Live market posture, risk, and the lead scenario — above the fold, before you scroll.",
      ru: "Живая поза, риск и ведущий сценарий — до прокрутки.",
    },
    execution: {
      en: "Action bias, invalidation zones, and execution posture anchored to live structure.",
      ru: "Уклон действия, зоны инвалидации и поза исполнения, привязанные к структуре.",
    },
    scenarios: {
      en: "Competing paths forward — ranked by structural advantage, not price targets.",
      ru: "Конкурирующие пути — по структурному преимуществу, не по ценовым целям.",
    },
    ops: {
      en: "Material shifts in regime, pressure, participation, and posture — with the reason each change matters.",
      ru: "Существенные сдвиги режима, давления, участия и позы — с объяснением важности каждого.",
    },
    maps: {
      en: "Where structure, liquidity, and stress concentrate. Each layer shows how to apply it to your decision.",
      ru: "Где в поле сходятся структура, ликвидность и стресс. Каждый слой — с объяснением применения.",
    },
    agents: {
      en: "Six specialist reads in tension. Agreement strengthens conviction. Disagreement sharpens edge cases.",
      ru: "Шесть прочтений в напряжении. Согласие усиливает убеждённость. Расхождение уточняет граничные случаи.",
    },
  };
  return pickLocale(locale, m[id].en, m[id].ru);
}

export function blufAriaLabel(locale: UiLocale): string {
  return pickLocale(locale, "Current state and primary conclusion", "Текущее состояние и главный вывод");
}

export type BlufLabelKey =
  | "currentState"
  | "risk"
  | "confidence"
  | "primaryImplication"
  | "leadPath"
  | "pathWeight"
  | "latestChange"
  | "fieldRead"
  | "consensus"
  | "disagreement";

export function blufLabel(locale: UiLocale, key: BlufLabelKey): string {
  const m: Record<BlufLabelKey, { en: string; ru: string }> = {
    currentState:       { en: "Current state",       ru: "Текущее состояние" },
    risk:               { en: "Risk",                ru: "Риск" },
    confidence:         { en: "Confidence",          ru: "Уверенность" },
    primaryImplication: { en: "Primary implication", ru: "Главная импликация" },
    leadPath:           { en: "Lead path",           ru: "Ведущий путь" },
    pathWeight:         { en: "Relative weight",     ru: "Относительный вес" },
    latestChange:       { en: "Latest change",       ru: "Последнее изменение" },
    fieldRead:          { en: "Field read",          ru: "Прочтение поля" },
    consensus:          { en: "Consensus level",     ru: "Уровень консенсуса" },
    disagreement:       { en: "Key disagreement",    ru: "Ключевое расхождение" },
  };
  return pickLocale(locale, m[key].en, m[key].ru);
}

export function hierarchySectionLabel(
  locale: UiLocale,
  tier: "conclusion" | "reasoning" | "evidence" | "advanced",
): string {
  const m = {
    conclusion: { en: "Conclusion",       ru: "Вывод" },
    reasoning:  { en: "Why it matters",   ru: "Почему это важно" },
    evidence:   { en: "Evidence",         ru: "Доказательная база" },
    advanced:   { en: "Advanced detail",  ru: "Углублённый анализ" },
  } as const;
  return pickLocale(locale, m[tier].en, m[tier].ru);
}

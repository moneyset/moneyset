import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { ScenarioEngineCard, ScenarioId } from "@/lib/simulation/scenario-engine";
import { phaseLabel, pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

const TAIL_PRIORITY: ScenarioId[] = [
  "Structural Breakdown Risk",
  "Risk Reset Expansion",
  "Momentum Exhaustion",
  "Distribution Phase",
];

const RISK_ORDER: Record<ScenarioEngineCard["riskLevel"], number> = {
  low: 0,
  medium: 1,
  elevated: 2,
  high: 3,
};

/** Lowest-weight paths in the book — pick one operational tail lens (not a forecast %). */
export function pickTailRiskCard(cards: ScenarioEngineCard[]): ScenarioEngineCard | null {
  const pool = cards.slice(2);
  if (pool.length === 0) return null;
  for (const id of TAIL_PRIORITY) {
    const hit = pool.find((c) => c.id === id);
    if (hit) return hit;
  }
  return pool.reduce((best, c) => (RISK_ORDER[c.riskLevel] > RISK_ORDER[best.riskLevel] ? c : best), pool[0]);
}

function volTransitionLine(locale: UiLocale, derived: DerivedCognitionSnapshot): string {
  if (derived.volTone === "compressing") {
    return pickLocale(locale, "Volatility: compression / coil conditions.", "Волатильность: сжатие / змеевик.");
  }
  if (derived.volTone === "expanding") {
    return pickLocale(locale, "Volatility: expansion regime — path spreads widen faster.", "Волатильность: расширение — пути расходятся быстрее.");
  }
  return pickLocale(locale, "Volatility: neutral transition band.", "Волатильность: нейтральная переходная полоса.");
}

function participationLine(locale: UiLocale, derived: DerivedCognitionSnapshot): string | null {
  if (derived.divergenceIndex >= 42) {
    return pickLocale(
      locale,
      "Participation: views splitting — reweights alternate paths.",
      "Участие: расхождение мнений — переразвешивает альтернативы.",
    );
  }
  if (derived.divergenceIndex <= 22) {
    return pickLocale(locale, "Participation: alignment holding — continuation paths cleaner.", "Участие: сборка держится — продолжение чище.");
  }
  return null;
}

/** Conditions that shift relative path weighting — qualitative, no fake precision. */
export function buildStructuralTriggerLines(
  locale: UiLocale,
  derived: DerivedCognitionSnapshot,
  paths: ScenarioEngineCard[],
): string[] {
  const out: string[] = [];
  out.push(
    pickLocale(
      locale,
      `Structural regime: ${phaseLabel(locale, derived.phase)}.`,
      `Структурный режим: ${phaseLabel(locale, derived.phase)}.`,
    ),
  );
  out.push(volTransitionLine(locale, derived));
  const part = participationLine(locale, derived);
  if (part) out.push(part);
  if (derived.dangerBand === "elevated" || derived.dangerBand === "dangerous" || derived.dangerBand === "critical") {
    out.push(
      pickLocale(
        locale,
        "Risk band elevated — invalidation sensitivity rises across paths.",
        "Рисковая полоса выше — чувствительность к инвалидации растёт.",
      ),
    );
  }
  const seen = new Set<string>();
  for (const card of paths) {
    for (const line of card.conditionLines) {
      if (!seen.has(line)) {
        seen.add(line);
        out.push(line);
      }
    }
  }
  return out.slice(0, 8);
}

export function rotationEngineSummary(
  locale: UiLocale,
  book: { rotationPair: { from: ScenarioId; to: ScenarioId } | null },
  primary: ScenarioEngineCard,
  secondary: ScenarioEngineCard | null,
): { headline: string; body: string } {
  if (book.rotationPair) {
    return {
      headline: pickLocale(locale, "Transition active", "Переход активен"),
      body: pickLocale(
        locale,
        "Structural dominance rotated — execution posture should be re-read against the new lead path.",
        "Сменилась структурная доминанта — перечитать исполнение относительно нового ведущего пути.",
      ),
    };
  }
  if (primary.evolutionState === "weakening" || primary.evolutionState === "deteriorating") {
    return {
      headline: pickLocale(locale, "Primary path softening", "Базовый путь смягчается"),
      body: pickLocale(
        locale,
        "Lead structural path is losing coherence — watch secondary paths for sponsorship handoff.",
        "Ведущий путь теряет связность — следить за спонсорством альтернатив.",
      ),
    };
  }
  if (secondary && (secondary.evolutionState === "strengthening" || secondary.evolutionState === "transitioning")) {
    return {
      headline: pickLocale(locale, "Alternate path developing", "Альтернатива нарастает"),
      body: pickLocale(
        locale,
        "Secondary structure is gaining validity — tighten breakout assumptions until leadership clarifies.",
        "Вторичная структура набирает валидность — ужать допущения пробоя, пока лидерство не прояснится.",
      ),
    };
  }
  return {
    headline: pickLocale(locale, "Rotation quiet", "Ротация спокойна"),
    body: pickLocale(
      locale,
      "No active dominance handoff — probabilities evolve slowly; avoid over-trading small deck motion.",
      "Смены лидера нет — эволюция медленная; не разгонять мелкие движения колоды.",
    ),
  };
}

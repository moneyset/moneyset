import {
  consensusLabel,
  dangerBandLabel,
  phaseLabel,
  pickLocale,
  scenarioInvalidation,
  scenarioTitle,
} from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";
import type { JournalCognitiveLayers, MemorySnapshot } from "@/types/memory";
import type { ScenarioId } from "@/lib/simulation/scenario-engine";
import type { VolatilityTone } from "@/lib/simulation/cognition-types";

function topScenarioId(s: MemorySnapshot): ScenarioId | null {
  return s.scenarios[0]?.id ?? null;
}

function biasPostureLine(locale: UiLocale, bias: string | null | undefined): string {
  if (bias === "tighten_risk") return pickLocale(locale, "Posture: tighten risk.", "Позиция: резать риск.");
  if (bias === "wait_for_acceptance") return pickLocale(locale, "Posture: wait acceptance.", "Позиция: ждать принятия.");
  if (bias === "stay_measured") return pickLocale(locale, "Posture: measured.", "Позиция: мера.");
  return pickLocale(locale, "Posture: unset.", "Позиция: не задана.");
}

function leadProb(h: MemorySnapshot): number {
  const p = h.scenarios[0]?.p;
  if (typeof p === "number" && Number.isFinite(p)) return p;
  return 50 + (h.dangerScore - 50) * 0.15;
}

export function deriveJournalCognitiveLayers(
  locale: UiLocale,
  cur: MemorySnapshot | null,
  prev: MemorySnapshot | null,
  volTone: VolatilityTone,
  leadScenarioId: ScenarioId,
  orchestratorActionBias: string | null | undefined,
): JournalCognitiveLayers {
  if (!cur) {
    return {
      stateShift: pickLocale(locale, "No capture — state delta void.", "Нет снимка — дельта пуста."),
      structuralChange: pickLocale(locale, "Structure unanchored.", "Структура не привязана."),
      postureChange: biasPostureLine(locale, orchestratorActionBias ?? null),
      invalidationOrConfirmation: pickLocale(locale, "Invalidation follows lead path.", "Снятие — от базы."),
      scenarioEvolution: pickLocale(locale, "Scenario unknown without capture.", "Сценарий без снимка."),
    };
  }

  const phaseForInv = cur.phase;
  const stateParts: string[] = [];
  if (prev) {
    if (prev.phase !== cur.phase) {
      stateParts.push(
        pickLocale(
          locale,
          `${phaseLabel(locale, prev.phase)} → ${phaseLabel(locale, cur.phase)}.`,
          `${phaseLabel(locale, prev.phase)} → ${phaseLabel(locale, cur.phase)}.`,
        ),
      );
    }
    if (prev.dangerBand !== cur.dangerBand) {
      stateParts.push(
        pickLocale(
          locale,
          `${dangerBandLabel(locale, prev.dangerBand)} → ${dangerBandLabel(locale, cur.dangerBand)}.`,
          `${dangerBandLabel(locale, prev.dangerBand)} → ${dangerBandLabel(locale, cur.dangerBand)}.`,
        ),
      );
    }
    if (prev.consensus !== cur.consensus) {
      stateParts.push(
        pickLocale(
          locale,
          `${consensusLabel(locale, prev.consensus)} → ${consensusLabel(locale, cur.consensus)}.`,
          `${consensusLabel(locale, prev.consensus)} → ${consensusLabel(locale, cur.consensus)}.`,
        ),
      );
    }
  }
  const stateShift =
    stateParts.length > 0
      ? stateParts.join(" ")
      : pickLocale(locale, "State hold — no prior delta.", "Срез без дельты к прошлому.");

  let structuralChange = prev
    ? pickLocale(locale, "Stress stable vs prior capture.", "Стресс стабилен к прошлому снимку.")
    : pickLocale(locale, "Structure pinned to capture.", "Структура зафиксирована на снимке.");
  if (prev && Math.abs(cur.dangerScore - prev.dangerScore) >= 5) {
    structuralChange =
      cur.dangerScore > prev.dangerScore
        ? pickLocale(locale, "Stress accelerated — pocket pressure migration up.", "Стресс выше — давление в карманах.")
        : pickLocale(locale, "Stress eased — defensive shells can tighten.", "Стресс ниже — оболочки могут сжаться.");
  } else if (prev && cur.dangerScore !== prev.dangerScore) {
    structuralChange = pickLocale(locale, "Stress drift vs prior capture.", "Дрейф стресса к прошлому снимку.");
  }

  if (prev && Math.abs(cur.divergenceIndex - prev.divergenceIndex) >= 6) {
    structuralChange =
      cur.divergenceIndex > prev.divergenceIndex
        ? pickLocale(
            locale,
            "Structural deterioration — divergence widened vs prior capture.",
            "Деградация структуры — дивергенция шире к прошлому снимку.",
          )
        : pickLocale(
            locale,
            "Structural coherence recovery — divergence compressed.",
            "Восстановление связности — дивергенция сжата.",
          );
  }

  const postureChange = biasPostureLine(locale, orchestratorActionBias ?? null);

  const invalidationOrConfirmation = scenarioInvalidation(locale, leadScenarioId, phaseForInv, volTone);

  const curTop = topScenarioId(cur);
  const prevTop = prev ? topScenarioId(prev) : null;
  const curP = leadProb(cur);
  const prevP = prev ? leadProb(prev) : curP;
  let scenarioEvolution = pickLocale(locale, "Lead path unchanged in capture.", "База без смены в снимке.");
  if (prev && curTop && prevTop && curTop !== prevTop) {
    scenarioEvolution = pickLocale(
      locale,
      `Rotation: ${scenarioTitle(locale, prevTop)} → ${scenarioTitle(locale, curTop)}.`,
      `Смена: ${scenarioTitle(locale, prevTop)} → ${scenarioTitle(locale, curTop)}.`,
    );
  } else if (prev && Math.abs(curP - prevP) >= 4) {
    scenarioEvolution =
      curP > prevP
        ? pickLocale(locale, "Lead sponsorship strengthening.", "Спонсорство базы усилилось.")
        : pickLocale(locale, "Lead sponsorship weakening.", "Спонсорство базы ослабло.");
  }

  return { stateShift, structuralChange, postureChange, invalidationOrConfirmation, scenarioEvolution };
}

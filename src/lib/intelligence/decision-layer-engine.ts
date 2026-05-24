/**
 * Decision layer — execution guidance and scenario framing.
 * Not trade signals; no buy/sell.
 */

import type { ExecutionLayerSurface } from "@/lib/execution/derive-execution-layer";
import type { MarketPostureSnapshot, ExecutionBiasId, MarketPostureId } from "@/lib/intelligence/market-posture-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers, ConsensusEvolutionLabel } from "@/lib/simulation/cognition-types";
import type { ScenarioEngineCard } from "@/lib/simulation/scenario-engine";

export type PictureChangeKind = "confirm" | "weaken" | "invalidate";

export type DecisionPictureLine = Readonly<{
  kind: PictureChangeKind;
  text: string;
}>;

export type DecisionLayerSnapshot = Readonly<{
  headline: string;
  subline: string;
  /** 3–5 execution instructions — premium; still computed for blur preview. */
  whatToDoNow: readonly string[];
  pictureChanges: readonly DecisionPictureLine[];
}>;

type LocalePack = Readonly<{ en: string; ru: string }>;

function T(pack: LocalePack, locale: "en" | "ru"): string {
  return pickLocale(locale, pack.en, pack.ru);
}

/** Primary desk headline — English examples are ALL CAPS; RU analogous emphasis. */
function deriveHeadline(args: {
  locale: "en" | "ru";
  posture: MarketPostureId;
  phase: DerivedCognitionSnapshot["phase"];
  danger: DerivedCognitionSnapshot["dangerBand"];
  volTone: DerivedCognitionSnapshot["volTone"];
  consensus: ConsensusEvolutionLabel;
  positioningPressure: number;
  leadEvolution: ScenarioEngineCard["evolutionState"];
}): LocalePack {
  const { posture, phase, danger, volTone, consensus, positioningPressure, leadEvolution } = args;

  if (danger === "critical" || danger === "dangerous") {
    return {
      en: "RISK OF REVERSAL INCREASING",
      ru: "РИСК РАЗВОРОТА РАСТЁТ",
    };
  }

  if (danger === "elevated" && (posture === "fragile_continuation" || leadEvolution === "deteriorating")) {
    return {
      en: "RISK OF REVERSAL INCREASING",
      ru: "РИСК РАЗВОРОТА РАСТЁТ",
    };
  }

  if (posture === "fragile_continuation" || leadEvolution === "deteriorating") {
    return {
      en: "CONTINUATION STRUCTURE UNDER STRESS",
      ru: "СТРУКТУРА ПРОДОЛЖЕНИЯ ПОД НАГРУЗКОЙ",
    };
  }

  if (
    volTone === "expanding" &&
    (danger === "elevated" || phase === "volatility_expansion" || posture === "reactive")
  ) {
    return {
      en: "PRESSURE EXPANDING",
      ru: "ДАВЛЕНИЕ НАРАСТАЕТ",
    };
  }

  if (
    phase === "distribution_phase" ||
    (consensus === "consensus_weakening" && positioningPressure < 56)
  ) {
    return {
      en: "BUYER WEAKENING",
      ru: "ПОКУПАТЕЛЬ СЛАБЕЕТ",
    };
  }

  if (
    consensus === "divergence_increasing" ||
    (consensus === "consensus_weakening" && positioningPressure >= 56)
  ) {
    return {
      en: "PARTICIPATION WEAKENING",
      ru: "УЧАСТИЕ ОСЛАБЕВАЕТ",
    };
  }

  if (posture === "expansion" || (posture === "constructive" && positioningPressure >= 62)) {
    return {
      en: "CONTINUATION DOMINATES",
      ru: "ПРЕИМУЩЕСТВО ЗА ПРОДОЛЖЕНИЕМ",
    };
  }

  if (
    posture === "neutral" ||
    posture === "compression" ||
    phase === "regime_transition" ||
    phase === "liquidity_compression"
  ) {
    if (positioningPressure >= 55) {
      return {
        en: "NEUTRAL WITH BULLISH BIAS",
        ru: "НЕЙТРАЛЬНО С БЫЧЬИМ УКЛОНОМ",
      };
    }
    if (positioningPressure <= 45) {
      return {
        en: "NEUTRAL WITH BEARISH BIAS",
        ru: "НЕЙТРАЛЬНО С МЕДВЕЖЬИМ УКЛОНОМ",
      };
    }
    return {
      en: "NEUTRAL — RANGE DISCIPLINE",
      ru: "НЕЙТРАЛЬНО — ДИСЦИПЛИНА ДИАПАЗОНА",
    };
  }

  if (posture === "defensive") {
    return {
      en: "DEFENSIVE STRUCTURE",
      ru: "ЗАЩИТНАЯ СТРУКТУРА",
    };
  }

  if (posture === "aggressive" || phase === "overheated_momentum") {
    return {
      en: "EXTENSION STRETCHED — PATIENCE FAVORED",
      ru: "РАЗГОН НАТЯНУТ — ПРЕДПОЧТИТЕЛЬНО ТЕРПЕНИЕ",
    };
  }

  return {
    en: "STRUCTURAL READ STABLE — MONITOR ACCEPTANCE",
    ru: "СТРУКТУРНОЕ ПРОЧТЕНИЕ СТАБИЛЬНО — СЛЕДИТЕ ЗА ПРИНЯТИЕМ",
  };
}

function whatToDoForBias(locale: "en" | "ru", bias: ExecutionBiasId, danger: DerivedCognitionSnapshot["dangerBand"]): string[] {
  const base: Partial<Record<ExecutionBiasId, LocalePack[]>> = {
    patience_favored: [
      { en: "Wait for pullback confirmation before adding exposure", ru: "Ждите подтверждения отката прежде чем добавлять экспозицию" },
      { en: "Do not chase extremes — prioritize structure over rhythm", ru: "Не гонитесь за экстремумами — приоритет структуры, не ритма" },
      { en: "Operate only inside the acceptance band when anchored", ru: "Работайте только в полосе принятия после привязки" },
      { en: "Avoid front-running the continuation thesis", ru: "Избегайте опережения тезиса продолжения" },
      { en: "Increase engagement only after confirmation on tape", ru: "Наращивайте вовлечённость только после подтверждения на ленте" },
    ],
    acceptance_required: [
      { en: "Require acceptance to print before treating extension as durable", ru: "Требуйте принятия на ленте до считания продление устойчивым" },
      { en: "Do not scale until the reclaim shelf holds through a liquidity sweep", ru: "Не масштабируйте пока полка отбоя не держится через снятие ликвидности" },
      { en: "Keep risk tight until sponsorship confirms", ru: "Держите риск жёстким пока спонсорство не подтвердится" },
      { en: "Avoid chasing outside the defended band", ru: "Избегайте преследования вне защищённой полосы" },
    ],
    risk_reduction: [
      { en: "Reduce pacing — invalidation pressure is elevated", ru: "Снизьте темп — давление инвалидации повышено" },
      { en: "Defensive shelving first; re-engage only on structure repair", ru: "Сначала защитные полки; вернётесь только на починке структуры" },
      { en: "Do not add leverage into widening divergence", ru: "Не добавляйте кредитное плечо при расходящейся сборке" },
      { en: "Tighten invalidation hygiene on the lead path", ru: "Ужесточите гигиену снятия на базовом пути" },
    ],
    reactive_participation: [
      { en: "Favor reactive, two-way framing — volatility is expanding", ru: "Предпочитайте реактивное двустороннее прочтение — вола расширяется" },
      { en: "Wait for stabilization before treating direction as sustained", ru: "Ждите стабилизации прежде чем считать направление устойчивым" },
      { en: "Size for range, not for trend extrapolation", ru: "Размер под диапазон, не под экстраполяцию тренда" },
      { en: "Avoid single-scenario commitment", ru: "Избегайте фиксации на одном сценарии" },
    ],
    controlled_aggression: [
      { en: "Continuation favored only while participation quality holds", ru: "Продолжение в базе пока качество участия держится" },
      { en: "Add only on confirmed sponsorship, not on impulse", ru: "Добавляйте только на подтверждённом спонсорстве, не на импульсе" },
      { en: "Keep acceptance as the operating floor", ru: "Держите принятие как операционный пол" },
      { en: "Do not extend through unconfirmed expansion triggers", ru: "Не продлевайте через неподтверждённые триггеры расширения" },
    ],
  };

  const lines = base[bias] ?? base.patience_favored!;
  const out = lines.map((p) => T(p, locale));

  if (danger === "critical" || danger === "dangerous") {
    return [
      T({ en: "Stand down aggressive posture until stress recedes", ru: "Остановите агрессивную позу пока стресс не снизится" }, locale),
      ...out.slice(0, 3),
    ].slice(0, 5);
  }

  return out.slice(0, 5);
}

function pictureLines(args: {
  locale: "en" | "ru";
  posture: MarketPostureSnapshot;
  surface: ExecutionLayerSurface;
  leadCard: ScenarioEngineCard | null;
}): DecisionPictureLine[] {
  const { locale, posture, surface, leadCard } = args;

  const confirms: DecisionPictureLine[] = [
    {
      kind: "confirm",
      text: T(
        {
          en: "Acceptance zone holds through the next liquidity interaction",
          ru: "Зона принятия держится через следующее взаимодействие с ликвидностью",
        },
        locale,
      ),
    },
    {
      kind: "confirm",
      text: T(
        {
          en: "Participation improves without widening agent divergence",
          ru: "Участие улучшается без расширения разноса агентов",
        },
        locale,
      ),
    },
    {
      kind: "confirm",
      text: T(
        {
          en: "Sponsorship strengthens on the lead structural path",
          ru: "Спонсорство усиливается на базовом структурном пути",
        },
        locale,
      ),
    },
  ];

  const weakens: DecisionPictureLine[] = [
    {
      kind: "weaken",
      text: T(
        {
          en: "Pressure expands while acceptance remains unconfirmed",
          ru: "Давление растёт пока принятие не подтверждено",
        },
        locale,
      ),
    },
    surface.invalidationPressure[0]
      ? { kind: "weaken" as const, text: surface.invalidationPressure[0]! }
      : {
          kind: "weaken" as const,
          text: T(
            {
              en: "Pullback structure frays before acceptance prints",
              ru: "Структура отката рвётся до появления принятия",
            },
            locale,
          ),
        },
  ];

  const invBase =
    posture.invalidationRead.length > 8
      ? posture.invalidationRead
      : T(
          { en: "Lead path invalidates on acceptance failure", ru: "Базовый путь снимается при провале принятия" },
          locale,
        );

  const invalidates: DecisionPictureLine[] = [
    { kind: "invalidate", text: invBase },
    {
      kind: "invalidate",
      text: leadCard?.invalidation
        ? leadCard.invalidation
        : T(
            {
              en: "Scenario invalidates if structural support is lost",
              ru: "Сценарий снимается при потере структурной поддержки",
            },
            locale,
          ),
    },
  ];

  return [...confirms, ...weakens, ...invalidates].slice(0, 7);
}

export function deriveDecisionLayer(args: {
  locale: "en" | "ru";
  posture: MarketPostureSnapshot;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  surface: ExecutionLayerSurface;
  leadCard: ScenarioEngineCard | null;
}): DecisionLayerSnapshot {
  const { locale, posture, derived, latent, surface, leadCard } = args;

  const headlinePack = deriveHeadline({
    locale,
    posture: posture.posture,
    phase: derived.phase,
    danger: derived.dangerBand,
    volTone: derived.volTone,
    consensus: derived.consensus,
    positioningPressure: latent.positioningPressure,
    leadEvolution: leadCard?.evolutionState ?? "stabilizing",
  });

  const headline = T(headlinePack, locale);
  const subline = posture.executionImplication;

  const whatToDoNow = whatToDoForBias(locale, posture.executionBias, derived.dangerBand);
  const pictureChanges = pictureLines({ locale, posture, surface, leadCard });

  return { headline, subline, whatToDoNow, pictureChanges };
}

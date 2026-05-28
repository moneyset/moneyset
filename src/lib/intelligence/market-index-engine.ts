/**
 * Market Index — centralized regime synthesis and intelligence metrics.
 * Derives institutional-grade desk reads from cognition simulation state.
 */

import { deriveStrategicPosture } from "@/lib/cognition/strategic-read";
import {
  consensusLabel,
  dangerBandLabel,
  dominantHeadline,
  phaseLabel,
  pickLocale,
} from "@/lib/i18n/cognition-dict";
import type {
  CognitiveSnapshot,
  DominantHeadlineKey,
  LatentDrivers,
  MainRiskKey,
  TopScenarioSurface,
} from "@/lib/simulation/cognition-types";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { ScenarioEngineCard } from "@/lib/simulation/scenario-engine";
import type { UiLocale } from "@/store/ui-prefs-store";

export type MarketRegimeId =
  | "fragile_continuation"
  | "risk_expansion"
  | "compression_state"
  | "structural_breakdown"
  | "responsive_reclaim"
  | "controlled_trend"
  | "regime_transition";

export type MetricMovement =
  | "rising"
  | "weakening"
  | "strengthening"
  | "deteriorating"
  | "stabilizing";

export type MarketIndexMetricId =
  | "consensus"
  | "risk"
  | "flow"
  | "liquidity"
  | "structure"
  | "fragility"
  | "participation"
  | "sponsorship";

export type MarketRegimeState = Readonly<{
  id: MarketRegimeId;
  label: string;
  structuralState: string;
  tacticalPosture: string;
  tone: "neutral" | "stress" | "support";
}>;

export type MarketIndexMetric = Readonly<{
  id: MarketIndexMetricId;
  label: string;
  value: number;
  displayValue: string;
  movement: MetricMovement;
  movementLabel: string;
  structuralExplanation: string;
  implication: string;
  primaryRisk: string;
  tacticalMeaning: string;
}>;

export type MarketIndexBundle = Readonly<{
  regime: MarketRegimeState;
  metrics: readonly MarketIndexMetric[];
  synthesisLine: string;
  updatedClock: string;
}>;

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

function deltaFromHistory(
  history: readonly CognitiveSnapshot[],
  pick: (s: CognitiveSnapshot) => number,
  window = 6,
): number {
  if (history.length < 2) return 0;
  const recent = history.slice(-window);
  const first = recent[0]!;
  const last = recent[recent.length - 1]!;
  return pick(last) - pick(first);
}

function movementFromDelta(
  locale: UiLocale,
  delta: number,
  invert = false,
): { movement: MetricMovement; label: string } {
  const d = invert ? -delta : delta;
  if (d >= 6) {
    return {
      movement: invert ? "deteriorating" : "rising",
      label: pickLocale(locale, "Rising", "Растёт"),
    };
  }
  if (d >= 3) {
    return {
      movement: "strengthening",
      label: pickLocale(locale, "Strengthening", "Усиливается"),
    };
  }
  if (d <= -6) {
    return {
      movement: invert ? "stabilizing" : "weakening",
      label: pickLocale(locale, "Weakening", "Ослабевает"),
    };
  }
  if (d <= -3) {
    return {
      movement: invert ? "strengthening" : "deteriorating",
      label: pickLocale(locale, "Deteriorating", "Ухудшается"),
    };
  }
  return {
    movement: "stabilizing",
    label: pickLocale(locale, "Stabilizing", "Стабильно"),
  };
}

function resolveMarketRegime(
  locale: UiLocale,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  strategicBias: string,
): MarketRegimeState {
  const phase = derived.phase;

  if (phase === "panic_risk" || phase === "distribution_phase") {
    return {
      id: "structural_breakdown",
      label: pickLocale(locale, "Structural Breakdown", "Структурный срыв"),
      structuralState: pickLocale(
        locale,
        "Supply dominates rallies · sponsorship failing at key shelves",
        "Предложение на откатах · спонсорство проваливается у полок",
      ),
      tacticalPosture: strategicBias,
      tone: "stress",
    };
  }

  if (phase === "fragile_continuation") {
    return {
      id: "fragile_continuation",
      label: pickLocale(locale, "Fragile Continuation", "Хрупкое продолжение"),
      structuralState: pickLocale(
        locale,
        "Trend intact but cohesion thinning · invalidation discipline required",
        "Тренд цел, но связность тоньше · нужна дисциплина инвалидации",
      ),
      tacticalPosture: strategicBias,
      tone: "stress",
    };
  }

  if (phase === "volatility_expansion" || derived.dangerBand === "dangerous" || derived.dangerBand === "critical") {
    return {
      id: "risk_expansion",
      label: pickLocale(locale, "Risk Expansion", "Расширение риска"),
      structuralState: pickLocale(
        locale,
        "Vol band widening · defense-first execution window",
        "Полоса волы расширяется · окно исполнения «защита сначала»",
      ),
      tacticalPosture: strategicBias,
      tone: "stress",
    };
  }

  if (phase === "liquidity_compression") {
    return {
      id: "compression_state",
      label: pickLocale(locale, "Compression State", "Состояние сжатия"),
      structuralState: pickLocale(
        locale,
        "Range tightening · breakout pressure building in thin depth",
        "Диапазон сжимается · давление пробоя на тонкой глубине",
      ),
      tacticalPosture: strategicBias,
      tone: "neutral",
    };
  }

  if (phase === "regime_transition") {
    return {
      id: "regime_transition",
      label: pickLocale(locale, "Regime Transition", "Переход режима"),
      structuralState: pickLocale(
        locale,
        "Lattice coherence in flux · scenario leadership rotating",
        "Связность решётки в движении · ротация лидерства сценариев",
      ),
      tacticalPosture: strategicBias,
      tone: "neutral",
    };
  }

  if (
    (phase === "stable_expansion" || phase === "controlled_trend") &&
    latent.liquidityStructuralStress <= 48 &&
    derived.dangerBand === "calm"
  ) {
    return {
      id: "responsive_reclaim",
      label: pickLocale(locale, "Responsive Reclaim", "Отзывчивый откуп"),
      structuralState: pickLocale(
        locale,
        "Sponsorship holding · continuation proofs valid at shelves",
        "Спонсорство держится · доказательства продолжения валидны у полок",
      ),
      tacticalPosture: strategicBias,
      tone: "support",
    };
  }

  return {
    id: "controlled_trend",
    label: pickLocale(locale, "Controlled Trend", "Контролируемый тренд"),
    structuralState: pickLocale(
      locale,
      `${phaseLabel(locale, phase)} · structural envelope intact`,
      `${phaseLabel(locale, phase)} · структурный конверт цел`,
    ),
    tacticalPosture: strategicBias,
    tone: "neutral",
  };
}

function buildMetric(
  locale: UiLocale,
  id: MarketIndexMetricId,
  labelEn: string,
  labelRu: string,
  value: number,
  displayValue: string,
  delta: number,
  invertDelta: boolean,
  copy: {
    explanationEn: string;
    explanationRu: string;
    implicationEn: string;
    implicationRu: string;
    riskEn: string;
    riskRu: string;
    tacticalEn: string;
    tacticalRu: string;
  },
): MarketIndexMetric {
  const { movement, label: movementLabel } = movementFromDelta(locale, delta, invertDelta);
  return {
    id,
    label: pickLocale(locale, labelEn, labelRu),
    value: clamp(value),
    displayValue,
    movement,
    movementLabel,
    structuralExplanation: pickLocale(locale, copy.explanationEn, copy.explanationRu),
    implication: pickLocale(locale, copy.implicationEn, copy.implicationRu),
    primaryRisk: pickLocale(locale, copy.riskEn, copy.riskRu),
    tacticalMeaning: pickLocale(locale, copy.tacticalEn, copy.tacticalRu),
  };
}

export function deriveMarketIndexBundle(args: {
  locale: UiLocale;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  history: readonly CognitiveSnapshot[];
  agentLattice: readonly { role: string; confidencePct: number }[];
  topScenario: TopScenarioSurface;
  scenarioCards: readonly ScenarioEngineCard[];
  dominantHeadlineKey: DominantHeadlineKey;
  mainRisk: { riskKey: MainRiskKey; dangerScore: number };
}): MarketIndexBundle {
  const { locale, derived, latent, history, agentLattice, topScenario, scenarioCards, dominantHeadlineKey, mainRisk } =
    args;

  const strategic = deriveStrategicPosture({
    locale,
    derived,
    latent,
    topScenario,
    scenarioCards,
    dominantHeadline: dominantHeadline(locale, dominantHeadlineKey),
    mainRisk,
    history,
  });

  const regime = resolveMarketRegime(locale, derived, latent, strategic.strategicBias);

  const flowAgent = agentLattice.find((a) => a.role === "Flow");
  const flowVal = flowAgent?.confidencePct ?? clamp(latent.positioningPressure);
  const sponsorshipVal = clamp(100 - latent.liquidityStructuralStress * 0.85);
  const structureVal = clamp(100 - derived.divergenceIndex * 0.55);
  const fragilityVal = clamp(
    latent.liquidityStructuralStress * 0.45 + derived.dangerScore * 0.4 + derived.divergenceIndex * 0.15,
  );

  const consensusDisplay = consensusLabel(locale, derived.consensus);
  const riskDisplay = dangerBandLabel(locale, derived.dangerBand);

  const metrics: MarketIndexMetric[] = [
    buildMetric(
      locale,
      "consensus",
      "Consensus",
      "Консенсус",
      100 - derived.divergenceIndex,
      consensusDisplay,
      -deltaFromHistory(history, (h) => h.divergenceIndex),
      false,
      {
        explanationEn: `Lattice reads ${consensusDisplay} with spread ${derived.consensusSpreadPct}%.`,
        explanationRu: `Решётка: ${consensusDisplay}, разброс ${derived.consensusSpreadPct}%.`,
        implicationEn: "Scenario arbitration weights shift when consensus fractures.",
        implicationRu: "Веса арбитража сценариев смещаются при разломе консенсуса.",
        riskEn: "Cross-model divergence can invalidate single-path conviction.",
        riskRu: "Межмодельное расхождение может инвалидировать убеждённость в одном пути.",
        tacticalEn: "Refresh path leadership before scaling size.",
        tacticalRu: "Обновить лидерство путей перед масштабированием размера.",
      },
    ),
    buildMetric(
      locale,
      "risk",
      "Risk",
      "Риск",
      derived.dangerScore,
      riskDisplay,
      deltaFromHistory(history, (h) => h.dangerScore),
      true,
      {
        explanationEn: `Stress band ${riskDisplay} · score ${derived.dangerScore}/100.`,
        explanationRu: `Полоса стресса ${riskDisplay} · индекс ${derived.dangerScore}/100.`,
        implicationEn: "Elevated risk compresses aggression tolerance across execution lanes.",
        implicationRu: "Высокий риск сжимает допуск агрессии по полосам исполнения.",
        riskEn: strategic.primaryStructuralRisk,
        riskRu: strategic.primaryStructuralRisk,
        tacticalEn: strategic.strategicBias,
        tacticalRu: strategic.strategicBias,
      },
    ),
    buildMetric(
      locale,
      "flow",
      "Flow",
      "Поток",
      flowVal,
      `${flowVal}`,
      deltaFromHistory(history, (h) => h.positioningPressure),
      false,
      {
        explanationEn: "Participation leadership and crowding geometry in the tape.",
        explanationRu: "Лидерство участия и геометрия скопления на ленте.",
        implicationEn: "Flow divergence from price warns of fragile continuation.",
        implicationRu: "Расхождение потока с ценой предупреждает о хрупком продолжении.",
        riskEn: "Forced-flow pockets can accelerate without sponsorship.",
        riskRu: "Карманы вынужденного потока могут ускориться без спонсорства.",
        tacticalEn: "Re-test sponsorship before trend adds.",
        tacticalRu: "Перепроверять спонсорство перед добавлениями к тренду.",
      },
    ),
    buildMetric(
      locale,
      "liquidity",
      "Liquidity",
      "Ликвидность",
      latent.liquidityStructuralStress,
      `${Math.round(latent.liquidityStructuralStress)}`,
      deltaFromHistory(history, (h) => h.liquidityStructuralStress),
      true,
      {
        explanationEn: "Structural depth stress · sweep vulnerability and pocket quality.",
        explanationRu: "Структурный стресс глубины · уязвимость к сносу и качество карманов.",
        implicationEn: "Thin liquidity widens invalidation and fill risk.",
        implicationRu: "Тонкая ликвидность расширяет инвалидацию и риск исполнения.",
        riskEn: "Cascade geometry if shelves fail simultaneously.",
        riskRu: "Геометрия каскада при одновременном провале полок.",
        tacticalEn: "Adapt resting style and chase distance to depth topology.",
        tacticalRu: "Адаптировать стиль заявок и дистанцию погони к топологии глубины.",
      },
    ),
    buildMetric(
      locale,
      "structure",
      "Structure",
      "Структура",
      structureVal,
      phaseLabel(locale, derived.phase),
      deltaFromHistory(history, (h) => 100 - h.divergenceIndex),
      false,
      {
        explanationEn: `Phase ${phaseLabel(locale, derived.phase)} · structural envelope coherence.`,
        explanationRu: `Фаза ${phaseLabel(locale, derived.phase)} · связность структурного конверта.`,
        implicationEn: "Regime phase sets invalidation and zone geometry.",
        implicationRu: "Фаза режима задаёт инвалидацию и геометрию зон.",
        riskEn: "Phase migration reprices all sponsorship tests.",
        riskRu: "Миграция фазы переоценивает все проверки спонсорства.",
        tacticalEn: "Re-anchor zones when phase shifts.",
        tacticalRu: "Заново привязать зоны при смене фазы.",
      },
    ),
    buildMetric(
      locale,
      "fragility",
      "Fragility",
      "Хрупкость",
      fragilityVal,
      `${fragilityVal}`,
      deltaFromHistory(
        history,
        (h) => h.liquidityStructuralStress * 0.5 + h.dangerScore * 0.5,
      ),
      true,
      {
        explanationEn: "Composite fragility · liquidity, stress, and divergence coupling.",
        explanationRu: "Сводная хрупкость · связка ликвидности, стресса и расхождения.",
        implicationEn: "High fragility favors conditional structures over conviction scaling.",
        implicationRu: "Высокая хрупкость — условные конструкции вместо масштабирования убеждённости.",
        riskEn: "Edge-case invalidation paths become primary.",
        riskRu: "Граничные пути инвалидации становятся основными.",
        tacticalEn: "Widen stops · reduce size · monitor reclaim proofs.",
        tacticalRu: "Шире стопы · меньше размер · следить за доказательствами откупа.",
      },
    ),
    buildMetric(
      locale,
      "participation",
      "Participation",
      "Участие",
      latent.positioningPressure,
      `${Math.round(latent.positioningPressure)}`,
      deltaFromHistory(history, (h) => h.positioningPressure),
      false,
      {
        explanationEn: "Crowding and leverage-sensitive participation heat.",
        explanationRu: "Жар участия, чувствительный к плечу и скоплению.",
        implicationEn: "Participation extremes often precede vol expansion.",
        implicationRu: "Экстремумы участия часто предшествуют расширению волы.",
        riskEn: "Overcrowded continuation breaks without flow confirmation.",
        riskRu: "Перегретое продолжение ломается без подтверждения потока.",
        tacticalEn: "Treat trend adds as conditional above participation envelope.",
        tacticalRu: "Добавления к тренду условны выше конверта участия.",
      },
    ),
    buildMetric(
      locale,
      "sponsorship",
      "Sponsorship",
      "Спонсорство",
      sponsorshipVal,
      `${sponsorshipVal}`,
      -deltaFromHistory(history, (h) => h.liquidityStructuralStress),
      false,
      {
        explanationEn: "Price acceptance integrity at structural shelves.",
        explanationRu: "Целостность принятия цены на структурных полках.",
        implicationEn: "Sponsorship decay invalidates continuation before price breaks.",
        implicationRu: "У decay спонсорства инвалидирует продолжение раньше пробоя цены.",
        riskEn: "Failed reclaim at key zones triggers cascade geometry.",
        riskRu: "Провал откупа в ключевых зонах запускает каскадную геометрию.",
        tacticalEn: "Honor acceptance proofs before scaling conviction.",
        tacticalRu: "Требовать доказательства принятия перед масштабированием убеждённости.",
      },
    ),
  ];

  const updatedClock = history[history.length - 1]?.simulatedClockLabel ?? "—";

  const synthesisLine = pickLocale(
    locale,
    `${regime.label} · ${strategic.favoredPath} · ${topScenario.probabilityPct}% path weight`,
    `${regime.label} · ${strategic.favoredPath} · вес пути ${topScenario.probabilityPct}%`,
  );

  return { regime, metrics, synthesisLine, updatedClock };
}

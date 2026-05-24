/**
 * Semantic bilingual copy for cognition / simulation surfaces.
 * Meaning-first (desk language), not literal word swaps.
 */

import type { UiLocale } from "@/store/ui-prefs-store";
import type {
  AgentLatticeRole,
  ConsensusEvolutionLabel,
  DangerBandId,
  DominantHeadlineKey,
  LatentDrivers,
  LogEntryType,
  LogPriority,
  MainRiskKey,
  MarketPhaseId,
  TopScenarioWireId,
  VolatilityTone,
  ScenarioEvolutionState,
} from "@/lib/simulation/cognition-types";
import type { ScenarioId } from "@/lib/simulation/scenario-engine";

export type { DominantHeadlineKey, MainRiskKey, TopScenarioWireId } from "@/lib/simulation/cognition-types";

export function pickLocale<T>(locale: UiLocale, en: T, ru: T): T {
  return locale === "ru" ? ru : en;
}

const L = pickLocale;

export function divergenceTier(n: number): "Low" | "Moderate" | "Rising" | "Elevated" {
  if (n <= 26) return "Low";
  if (n <= 44) return "Moderate";
  if (n <= 60) return "Rising";
  return "Elevated";
}

const PHASE: Record<
  MarketPhaseId,
  { en: { label: string; summary: string }; ru: { label: string; summary: string } }
> = {
  stable_expansion: {
    en: { label: "Stable expansion", summary: "Trend orderly; stability intact." },
    ru: { label: "Расширение под контролем", summary: "Структура ровная; диапазон держится." },
  },
  controlled_trend: {
    en: { label: "Controlled trend", summary: "Trend stable; vol controlled." },
    ru: { label: "Тренд в узде", summary: "Вол в полосе; продолжение спокойное." },
  },
  overheated_momentum: {
    en: { label: "Overheated momentum", summary: "Momentum hot; leverage building." },
    ru: { label: "Перегрев", summary: "Участие горячее; плечо растёт." },
  },
  fragile_continuation: {
    en: { label: "Fragile continuation", summary: "Trend unstable; breaks easier." },
    ru: { label: "Продолжение слабеет", summary: "Связность падает; ломается легче." },
  },
  liquidity_compression: {
    en: { label: "Tight liquidity range", summary: "Range tight; breakout pressure." },
    ru: { label: "Диапазон сжат", summary: "Ликвидность тоньше; ждать выход." },
  },
  volatility_expansion: {
    en: { label: "Vol expansion", summary: "Vol rising; larger moves." },
    ru: { label: "Вол расширяется", summary: "Вол выше; ходы шире." },
  },
  distribution_phase: {
    en: { label: "Distribution", summary: "Supply into rallies; weak follow-through." },
    ru: { label: "Дистрибуция", summary: "Продавец на откатах; продолжение слабее." },
  },
  panic_risk: {
    en: { label: "Disorderly", summary: "Downside accelerates." },
    ru: { label: "Срыв", summary: "Нисходящий импульс ускоряется." },
  },
  regime_transition: {
    en: { label: "Regime transition", summary: "Transition active." },
    ru: { label: "Смена режима", summary: "Переход; связность на контроле." },
  },
};

const CONS: Record<
  ConsensusEvolutionLabel,
  { en: { label: string; summary: string }; ru: { label: string; summary: string } }
> = {
  consensus_strengthening: {
    en: {
      label: "Alignment up",
      summary: "Cohesion improving.",
    },
    ru: {
      label: "Сборка сильнее",
      summary: "Участие расширяется.",
    },
  },
  consensus_weakening: {
    en: {
      label: "Alignment down",
      summary: "Cohesion weakening.",
    },
    ru: {
      label: "Сборка слабеет",
      summary: "Участие сужается.",
    },
  },
  divergence_increasing: {
    en: {
      label: "Divergence wide",
      summary: "Inputs misaligned.",
    },
    ru: {
      label: "Разнос широкий",
      summary: "Вводные разъезжаются.",
    },
  },
  risk_layer_escalating: {
    en: {
      label: "Risk leads",
      summary: "Risk lens dominant.",
    },
    ru: {
      label: "Риск ведёт ленту",
      summary: "Приоритет — риск.",
    },
  },
  macro_dominance_rising: {
    en: {
      label: "Macro leads",
      summary: "Macro lens dominant.",
    },
    ru: {
      label: "Макро ведёт",
      summary: "Макро задаёт тон.",
    },
  },
};

const DANGER: Record<DangerBandId, { en: string; ru: string }> = {
  calm: { en: "Controlled", ru: "Спокойно" },
  moderate: { en: "Watchful", ru: "На контроле" },
  elevated: { en: "Elevated", ru: "Стресс выше" },
  dangerous: { en: "Dangerous", ru: "Риск острый" },
  critical: { en: "Critical", ru: "Критично" },
};

const DANGER_SIG: Record<DangerBandId, { en: [string, string]; ru: [string, string] }> = {
  calm: { en: ["Balance intact", "Orderly flow"], ru: ["Баланс держится", "Поток ровный"] },
  moderate: { en: ["Tail risk rising", "Leverage watch"], ru: ["Хвост дорожает", "Плечо на контроле"] },
  elevated: { en: ["Sweep risk", "Positioning tight"], ru: ["Риск сноса", "Позиции плотные"] },
  dangerous: { en: ["Forced flows", "Thin liquidity"], ru: ["Поток жёсткий", "Ликв тонкая"] },
  critical: { en: ["Cascade risk", "Disorderly conditions"], ru: ["Риск каскада", "Лента срывается"] },
};

const DOMINANT: Record<DominantHeadlineKey, { en: string; ru: string }> = {
  liquidity_stressed: { en: "Depth thin", ru: "Глубина тонкая" },
  controlled_expansion: { en: "Controlled expansion", ru: "Расширение под контролем" },
  fragile_continuation: { en: "Fragile continuation", ru: "Продолжение слабеет" },
  momentum_exhaustion_risk: { en: "Momentum exhaustion risk", ru: "Импульс выдыхается" },
  overheated_participation: { en: "Overheated participation", ru: "Участие перегрето" },
  trend_intact: { en: "Trend intact", ru: "Тренд держится" },
  bullish_fragile: { en: "Trend up · unstable", ru: "Тренд вверх · связность слабая" },
  defensive_tilt: { en: "Defensive tilt", ru: "Уклон в защиту" },
};

const MAINRISK: Record<MainRiskKey, { en: { h: string; s: (d: number) => string }; ru: { h: string; s: (d: number) => string } }> = {
  forced_move: {
    en: {
      h: "Forced-move risk",
      s: (d) => `Stress ${Math.round(d)} — tighten risk; honor invalidation.`,
    },
    ru: {
      h: "Риск форс‑движения",
      s: (d) => `Стресс ${Math.round(d)} — резать риск; держать снятие тезиса.`,
    },
  },
  reversal_vol: {
    en: {
      h: "Reversal risk building",
      s: () => "Vol up faster than participation; reversal risk higher.",
    },
    ru: {
      h: "Риск разворота",
      s: () => "Вол обгоняет участие; разворот ближе.",
    },
  },
  reversal_fade: {
    en: {
      h: "Reversal risk building",
      s: () => "Momentum fading without fresh demand; reversal risk building.",
    },
    ru: {
      h: "Риск разворота",
      s: () => "Импульс выдыхается; нового спроса нет — разворот ближе.",
    },
  },
};

const SCENARIO_TITLE: Record<ScenarioId, { en: string; ru: string }> = {
  "Controlled Bullish Expansion": {
    en: "Controlled expansion",
    ru: "Контролируемое расширение",
  },
  "Liquidity Sweep Before Continuation": {
    en: "Liquidity sweep before continuation",
    ru: "Снос перед продолжением",
  },
  "Fragile Breakout Structure": {
    en: "Fragile breakout structure",
    ru: "Пробой на тонкой базе",
  },
  "Volatility Compression": {
    en: "Volatility compression",
    ru: "Вол сжат",
  },
  "Structural Breakdown Risk": {
    en: "Structural breakdown risk",
    ru: "Риск структурного сноса",
  },
  "Distribution Phase": {
    en: "Distribution phase",
    ru: "Фаза дистрибуции",
  },
  "Momentum Exhaustion": {
    en: "Momentum exhaustion",
    ru: "Выдыхание импульса",
  },
  "Risk Reset Expansion": {
    en: "Risk reset expansion",
    ru: "После сброса риска — расширение",
  },
};

const DIV: Record<"Low" | "Moderate" | "Rising" | "Elevated", { en: string; ru: string }> = {
  Low: { en: "Low", ru: "Тихо" },
  Moderate: { en: "Moderate", ru: "Середина" },
  Rising: { en: "Rising", ru: "Рост" },
  Elevated: { en: "Elevated", ru: "Выше" },
};

export function phaseLabel(locale: UiLocale, id: MarketPhaseId): string {
  return L(locale, PHASE[id].en.label, PHASE[id].ru.label);
}

export function phaseSummaryLine(locale: UiLocale, id: MarketPhaseId): string {
  // REGIME-only summary: structure state, no risk/fragility language.
  return L(locale, PHASE[id].en.summary, PHASE[id].ru.summary);
}

export function consensusLabel(locale: UiLocale, id: ConsensusEvolutionLabel): string {
  return L(locale, CONS[id].en.label, CONS[id].ru.label);
}

export function consensusSummaryLine(locale: UiLocale, id: ConsensusEvolutionLabel): string {
  return L(locale, CONS[id].en.summary, CONS[id].ru.summary);
}

export function dangerBandLabel(locale: UiLocale, band: DangerBandId): string {
  return L(locale, DANGER[band].en, DANGER[band].ru);
}

export function dangerSignalsLocalized(locale: UiLocale, band: DangerBandId): string[] {
  const x = DANGER_SIG[band];
  return L(locale, [...x.en], [...x.ru]);
}

export function dominantHeadline(locale: UiLocale, key: DominantHeadlineKey): string {
  return L(locale, DOMINANT[key].en, DOMINANT[key].ru);
}

export function dominantSummaryLine(locale: UiLocale, liq: number, lev: number): string {
  const en = `Liq ${Math.round(liq)} · lev ${Math.round(lev)}`;
  const ru = `Ликв ${Math.round(liq)} · пл ${Math.round(lev)}`;
  return L(locale, en, ru);
}

/** Highest-scoring structural pressure driver (matches hero strip logic). */
export function dominantPressureDriverKey(latent: LatentDrivers): string {
  const pairs: Array<[label: string, score: number]> = [
    ["Leverage building", latent.positioningPressure],
    ["Liquidity thinning", latent.liquidityStructuralStress],
    ["Volatility rising", latent.volatilityImpulse],
    ["Crowd optimism rising", latent.sentimentThermal],
    ["Macro leading", latent.macroLiquidityBackdrop],
  ];
  let top: [string, number] = pairs[0] ?? ["Orderly breadth", 0];
  pairs.forEach((p) => {
    if (p[1] > top[1]) top = p;
  });
  return top[0];
}

export function mainRiskDisplay(locale: UiLocale, key: MainRiskKey, dangerScore: number): { headline: string; summary: string } {
  const pack = MAINRISK[key];
  return {
    headline: L(locale, pack.en.h, pack.ru.h),
    summary: L(locale, pack.en.s(dangerScore), pack.ru.s(dangerScore)),
  };
}

export function scenarioTitle(locale: UiLocale, id: ScenarioId): string {
  return L(locale, SCENARIO_TITLE[id].en, SCENARIO_TITLE[id].ru);
}

export function topScenarioSummary(locale: UiLocale, _id: TopScenarioWireId, _prob: number): string {
  const en = "Lead path · acceptance pending.";
  const ru = "База · принятие не держится.";
  return L(locale, en, ru);
}

export function scenarioInvalidation(
  locale: UiLocale,
  id: ScenarioId,
  phase: MarketPhaseId,
  volTone: VolatilityTone,
): string {
  if (id === "Volatility Compression") {
    return volTone === "compressing"
      ? L(locale, "Breakout fails to hold direction.", "Пробой не держит направление.")
      : L(locale, "Coil thesis off if vol stays elevated without range.", "Сжатие снято: вол выше, диапазона нет.");
  }
  if (id === "Structural Breakdown Risk") {
    return phase === "panic_risk"
      ? L(locale, "Vol up; reclaim attempts fail.", "Вол выше; откупы не держатся.")
      : L(
          locale,
          "Mid-range reclaim holds with steady breadth and depth.",
          "Середина держится при ровной ширине и глубине.",
        );
  }
  if (id === "Liquidity Sweep Before Continuation") {
    return L(locale, "Sweep fails; price rejected into range.", "Снос не прошёл — цена в диапазон.");
  }
  if (id === "Controlled Bullish Expansion") {
    return L(locale, "Key support lost; bids thin on pullbacks.", "Опора снята; на откатах бид тонкий.");
  }
  if (id === "Distribution Phase") {
    return L(locale, "Supply lifts on rallies; dips find bid.", "На ростах продавец; на откатах есть бид.");
  }
  if (id === "Momentum Exhaustion") {
    return L(locale, "Fresh impulse + breadth; exhaustion read drops.", "Новый импульс и ширина; тезис выдыхания снят.");
  }
  if (id === "Fragile Breakout Structure") {
    return L(locale, "Failed breakout; vol into thin book.", "Пробой не принят; стакан тонкий.");
  }
  return L(locale, "Shallow bounce; divergence stays wide.", "Отскок слабый; разнос широкий.");
}

export function scenarioStrategicSummary(locale: UiLocale, id: ScenarioId, derivedPhase: MarketPhaseId): string {
  if (id === "Controlled Bullish Expansion") {
    return L(
      locale,
      "Late continuation holds above reclaim — participation narrowing, not broadening.",
      "Позднее продолжение над откупом — участие сужается, не расширяется.",
    );
  }
  if (id === "Liquidity Sweep Before Continuation") {
    return L(
      locale,
      "Sweep into thin passive depth — continuation only after reclaim proof.",
      "Снос в тонкий пассив — продолжение только после доказанного откупа.",
    );
  }
  if (id === "Volatility Compression") {
    return L(locale, "Vol compressed. First break leads.", "Вол сжат. Ведёт первый выход.");
  }
  if (id === "Structural Breakdown Risk") {
    return L(
      locale,
      "Macro pressure accelerates risk-off — failed reclaims open breakdown path.",
      "Макро давление ускоряет risk-off — срыв откупов открывает путь сноса.",
    );
  }
  if (id === "Distribution Phase") {
    return L(locale, "Rallies sold. Continuation weak.", "Росты продают. Продолжение слабеет.");
  }
  if (id === "Momentum Exhaustion") {
    return L(locale, "Impulse aging. Needs bids.", "Импульс выдыхается. Нужен бид.");
  }
  if (id === "Fragile Breakout Structure") {
    return L(locale, "Break risk. Acceptance fails → reverse.", "Риск пробоя. Нет принятия — разворот.");
  }
  const prefix =
    derivedPhase === "regime_transition"
      ? L(locale, "Transition — ", "Переход — ")
      : "";
  return (
    prefix +
    L(locale, "Macro helps only with liq + coherence.", "Макро тянет только при ликве и связности.")
  );
}

export function scenarioStructuralPath(locale: UiLocale, id: ScenarioId): string {
  const m: Record<ScenarioId, { en: string; ru: string }> = {
    "Controlled Bullish Expansion": {
      en: "Controlled continuation above reclaim — participation narrows, not broadens.",
      ru: "Контролируемое продолжение над откупом — участие сужается, не расширяется.",
    },
    "Liquidity Sweep Before Continuation": {
      en: "Liquidity sweep path — continuation only after reclaim proves.",
      ru: "Путь сноса ликвидности — продолжение только после доказанного откупа.",
    },
    "Volatility Compression": {
      en: "Compression coil — first directional acceptance leads the tape.",
      ru: "Сжатие волы — ведёт первое направленное принятие.",
    },
    "Structural Breakdown Risk": {
      en: "Macro-driven risk-off — failed reclaims accelerate breakdown path.",
      ru: "Макро risk-off — срыв откупов ускоряет путь сноса.",
    },
    "Distribution Phase": {
      en: "Distribution read — supply meets rallies; continuation weakens structurally.",
      ru: "Дистрибуция — предложение на ростах; продолжение структурно слабеет.",
    },
    "Momentum Exhaustion": {
      en: "Exhaustion path — impulse ages; needs sustained bid quality.",
      ru: "Выдыхание импульса — нужна устойчивость бида.",
    },
    "Fragile Breakout Structure": {
      en: "Fragile breakout — acceptance thin; reversal validity rises on failure.",
      ru: "Хрупкий пробой — принятие тонкое; при срыве растёт валидность разворота.",
    },
    "Risk Reset Expansion": {
      en: "Risk-reset expansion — macro and liquidity must cohere for follow-through.",
      ru: "Расширение после сброса риска — макро и ликвидность должны сойтись для продолжения.",
    },
  };
  const row = m[id];
  return L(locale, row.en, row.ru);
}

export function scenarioTapeConditions(locale: UiLocale, id: ScenarioId): readonly [string, string] {
  const m: Record<ScenarioId, { en: [string, string]; ru: [string, string] }> = {
    "Controlled Bullish Expansion": {
      en: ["Reclaim holds as support", "Participation breadth not collapsing"],
      ru: ["Откуп держится как опора", "Ширина участия не рушится"],
    },
    "Liquidity Sweep Before Continuation": {
      en: ["Depth tolerates probe lower", "Sponsorship returns on reclaim"],
      ru: ["Глубина терпит зонд вниз", "Спонсор возвращается на откупе"],
    },
    "Volatility Compression": {
      en: ["Range integrity intact", "Breakout attempts remain two-sided"],
      ru: ["Целостность диапазона", "Пробои остаются двусторонними"],
    },
    "Structural Breakdown Risk": {
      en: ["Reclaim attempts failing", "Vol expansion against weak structure"],
      ru: ["Откупы не держатся", "Вол расширяется против слабой структуры"],
    },
    "Distribution Phase": {
      en: ["Rallies meet supply", "Dips still find responsive bids"],
      ru: ["Росты встречают предложение", "Откаты ещё с бидами"],
    },
    "Momentum Exhaustion": {
      en: ["Impulse slope flattening", "Breadth no longer expanding with price"],
      ru: ["Наклон импульса сплющивается", "Ширина не растёт с ценой"],
    },
    "Fragile Breakout Structure": {
      en: ["Breakout acceptance shallow", "Liquidity rejects extension"],
      ru: ["Принятие пробоя мелкое", "Ликвидность режет продолжение"],
    },
    "Risk Reset Expansion": {
      en: ["Macro backdrop improving", "Structural stress not re-accumulating"],
      ru: ["Макро фон улучшается", "Стресс не накапливается снова"],
    },
  };
  const row = m[id];
  return [L(locale, row.en[0], row.ru[0]), L(locale, row.en[1], row.ru[1])];
}

export function scenarioExecutionImplicationLine(locale: UiLocale, id: ScenarioId): string {
  const m: Record<ScenarioId, { en: string; ru: string }> = {
    "Controlled Bullish Expansion": {
      en: "Execution: reactive continuation preferred; size down if acceptance frays.",
      ru: "Исполнение: реактивное продолжение; объём ниже, если принятие сыпется.",
    },
    "Liquidity Sweep Before Continuation": {
      en: "Execution: wait reclaim proof; avoid front-running the sweep thesis.",
      ru: "Исполнение: ждать доказательства откупа; не опережать тезис сноса.",
    },
    "Volatility Compression": {
      en: "Execution: favor first clean break acceptance; avoid mid-range chase.",
      ru: "Исполнение: первый чистый пробой; без погони в середине диапазона.",
    },
    "Structural Breakdown Risk": {
      en: "Execution: tighten risk; prioritize defense until reclaim stabilizes.",
      ru: "Исполнение: ужать риск; защита, пока откуп не стабилен.",
    },
    "Distribution Phase": {
      en: "Execution: fade euphoric adds; continuation only on structural repair.",
      ru: "Исполнение: без эйфории; продолжение только при починке структуры.",
    },
    "Momentum Exhaustion": {
      en: "Execution: reduce aggression; favor mean-reversion probes over trend chase.",
      ru: "Исполнение: меньше агрессии; к среднему, не за трендом.",
    },
    "Fragile Breakout Structure": {
      en: "Execution: breakout only on sustained acceptance; else favor fade.",
      ru: "Исполнение: пробой только при устойчивом принятии; иначе фейд.",
    },
    "Risk Reset Expansion": {
      en: "Execution: scale only as liquidity and consensus cohere.",
      ru: "Исполнение: масштаб только при схождении ликвидности и сборки.",
    },
  };
  const row = m[id];
  return L(locale, row.en, row.ru);
}

export function scenarioEvolutionStateLabel(locale: UiLocale, s: ScenarioEvolutionState): string {
  const m: Record<ScenarioEvolutionState, { en: string; ru: string }> = {
    strengthening: { en: "Evolution: strengthening", ru: "Эволюция: усиление" },
    weakening: { en: "Evolution: weakening", ru: "Эволюция: ослабление" },
    stabilizing: { en: "Evolution: stabilizing", ru: "Эволюция: стабилизация" },
    deteriorating: { en: "Evolution: deteriorating", ru: "Эволюция: ухудшение" },
    transitioning: { en: "Evolution: shifting", ru: "Эволюция: сдвиг" },
    rebuilding: { en: "Evolution: rebuilding", ru: "Эволюция: пересборка" },
  };
  return L(locale, m[s].en, m[s].ru);
}

/** Ordinal conviction — no numeric probability in copy. */
export function scenarioPathConvictionLine(locale: UiLocale, rankIndex: number, deltaFromPrev: number): string {
  if (rankIndex === 0) {
    if (deltaFromPrev >= 3) {
      return L(locale, "Structural advantage: dominant · strengthening.", "Структурное преимущество: доминирует · усиливается.");
    }
    if (deltaFromPrev <= -3) {
      return L(locale, "Structural advantage: dominant · decaying.", "Структурное преимущество: доминирует · слабеет.");
    }
    if (Math.abs(deltaFromPrev) < 1.5) {
      return L(locale, "Structural advantage: dominant · stable conviction.", "Структурное преимущество: доминирует · устойчиво.");
    }
    if (deltaFromPrev > 0) {
      return L(locale, "Structural advantage: dominant · moderate lift.", "Структурное преимущество: доминирует · умеренный подъём.");
    }
    return L(locale, "Structural advantage: dominant · softening.", "Структурное преимущество: доминирует · смягчение.");
  }
  if (rankIndex === 1) {
    return L(locale, "Alternate path — moderate structural conviction.", "Альтернатива — умеренная структурная убеждённость.");
  }
  return L(locale, "Tail path — low-conviction unless stress validates it.", "Хвост — низкая убеждённость без валидации стрессом.");
}

export function scenarioPathRotationLine(locale: UiLocale, fromId: ScenarioId, toId: ScenarioId): string {
  const a = scenarioTitle(locale, fromId);
  const b = scenarioTitle(locale, toId);
  return L(locale, `Dominance shift: lead path moves from ${a} into ${b}.`, `Смена лидерства: ведущий путь — от ${a} к ${b}.`);
}

const DRIVER: Record<string, { en: string; ru: string }> = {
  // Controlled vocabulary: one primary phrase per concept.
  "Liquidity thinning": { en: "Depth thin", ru: "Глубина тонкая" },
  "Liquidity stressed": { en: "Depth thin", ru: "Глубина тонкая" },
  "Depth thinning": { en: "Depth thin", ru: "Глубина тонкая" },
  "Leverage building": { en: "Leverage extended", ru: "Плечо растянуто" },
  "Leverage extended": { en: "Leverage extended", ru: "Плечо растянуто" },
  "Volatility rising": { en: "Vol widening", ru: "Вол расширяется" },
  "Volatility impulse": { en: "Vol widening", ru: "Вол расширяется" },
  "Crowd optimism rising": { en: "Participation hot", ru: "Участие горячее" },
  "Crowd overheating": { en: "Participation hot", ru: "Участие горячее" },
  "Macro leading": { en: "Macro leads", ru: "Макро ведёт" },
  "Consensus weakening": { en: "Alignment down", ru: "Сборка слабеет" },
  "Views splitting": { en: "Divergence wide", ru: "Расхождение широкое" },
  "Orderly breadth": { en: "Breadth broad", ru: "Участие широкое" },
  "Contained dispersion": { en: "Divergence contained", ru: "Расхождение сдержано" },
  "Conditions stable": { en: "Structure stable", ru: "Структура держится" },
};

const FRAG: Record<string, { en: string; ru: string }> = {
  // Controlled vocabulary: risk-side factors.
  "Sweep risk higher": { en: "Sweep risk", ru: "Риск сноса" },
  "Fast move risk": { en: "Fast-move risk", ru: "Риск резкого хода" },
  "Leverage unwind risk": { en: "Unwind risk", ru: "Риск разжима" },
  "Crowd reversal risk": { en: "Reversal risk", ru: "Риск разворота" },
  "Views splitting": { en: "Divergence wide", ru: "Расхождение широкое" },
  "Fragility contained": { en: "Fragility contained", ru: "Хрупкость в полосе" },
};

export function localizeDriverLine(locale: UiLocale, line: string): string {
  const row = DRIVER[line];
  if (!row) return line;
  return L(locale, row.en, row.ru);
}

export function localizeFragilityLine(locale: UiLocale, line: string): string {
  const row = FRAG[line];
  if (!row) return line;
  return L(locale, row.en, row.ru);
}

export function divergenceLabel(locale: UiLocale, label: "Low" | "Moderate" | "Rising" | "Elevated"): string {
  return L(locale, DIV[label].en, DIV[label].ru);
}

export function priorityLabel(locale: UiLocale, p: LogPriority): string {
  const m: Record<LogPriority, { en: string; ru: string }> = {
    informational: { en: "Informational", ru: "Справочно" },
    important: { en: "Important", ru: "Важно" },
    elevated: { en: "Elevated", ru: "Повышено" },
    critical: { en: "Critical", ru: "Критично" },
  };
  return L(locale, m[p].en, m[p].ru);
}

export function logEntryTypeLabel(locale: UiLocale, entryType: string): string {
  if (entryType === "ORCHESTRATOR") return L(locale, "Summary", "Сводка");
  const map: Record<LogEntryType, { en: string; ru: string }> = {
    FLOW: { en: "Flow", ru: "Поток" },
    RISK: { en: "Risk", ru: "Риск" },
    CONSENSUS: { en: "Consensus", ru: "Консенсус" },
    REGIME: { en: "Regime", ru: "Режим" },
    SENTIMENT: { en: "Sentiment", ru: "Настроения" },
    VOLATILITY: { en: "Volatility", ru: "Волатильность" },
    LIQUIDITY: { en: "Liquidity", ru: "Ликвидность" },
    MACRO: { en: "Macro", ru: "Макро" },
    SCENARIO: { en: "Scenario", ru: "Сценарий" },
    ORCHESTRATOR: { en: "Summary", ru: "Сводка" },
  };
  const row = map[entryType as LogEntryType];
  if (!row) return entryType.charAt(0) + entryType.slice(1).toLowerCase();
  return L(locale, row.en, row.ru);
}

type ScenarioConf = "low" | "medium" | "high";
type ScenarioRisk = "low" | "medium" | "elevated" | "high";

/** Deck position → visual / scan hierarchy (not a forecast rank). */
export type ScenarioCardTier = "primary" | "secondary" | "tail";

export function scenarioTierFromDeckIndex(index: number): ScenarioCardTier {
  if (index <= 0) return "primary";
  if (index < 3) return "secondary";
  return "tail";
}

export function scenarioTierEyebrow(locale: UiLocale, tier: ScenarioCardTier): string {
  const m: Record<ScenarioCardTier, { en: string; ru: string }> = {
    primary: { en: "Primary structural path", ru: "Основной структурный путь" },
    secondary: { en: "Secondary path", ru: "Вторичный путь" },
    tail: { en: "Tail risk path", ru: "Хвостовой риск" },
  };
  return L(locale, m[tier].en, m[tier].ru);
}

/** Read quality — desk language, not a retail “score”. */
export function scenarioConfidenceLabel(locale: UiLocale, c: ScenarioConf): string {
  const m: Record<ScenarioConf, { en: string; ru: string }> = {
    low: { en: "Unresolved paths", ru: "Пути не сомкнулись" },
    medium: { en: "Mixed inputs", ru: "Смешанные вводные" },
    high: { en: "Inputs aligned", ru: "Вводные сходятся" },
  };
  return L(locale, m[c].en, m[c].ru);
}

export function scenarioRiskLevelLabel(locale: UiLocale, r: ScenarioRisk): string {
  const m: Record<ScenarioRisk, { en: string; ru: string }> = {
    low: { en: "Stress contained", ru: "Стресс сдержан" },
    medium: { en: "Stress on watch", ru: "Стресс на контроле" },
    elevated: { en: "Stress elevated", ru: "Стресс набирает" },
    high: { en: "Stress acute", ru: "Стресс острый" },
  };
  return L(locale, m[r].en, m[r].ru);
}

/** Surface posture chips from `postureTags()` — semantic, not literal. */
export function localizePostureTag(locale: UiLocale, tag: string): string {
  const PT: Record<string, { en: string; ru: string }> = {
    // Controlled vocabulary tags (from `postureTags()`).
    "Leverage extended": { en: "Leverage extended", ru: "Плечо растянуто" },
    "Depth thin": { en: "Depth thin", ru: "Глубина тонкая" },
    "Vol compressed": { en: "Vol compressed", ru: "Вол сжат" },
    "Participation hot": { en: "Participation hot", ru: "Участие горячее" },
    "Macro leads": { en: "Macro leads", ru: "Макро ведёт" },
    "Structure stable": { en: "Structure stable", ru: "Структура держится" },
    "Divergence contained": { en: "Divergence contained", ru: "Расхождение сдержано" },
  };
  const row = PT[tag];
  if (!row) return tag;
  return L(locale, row.en, row.ru);
}

export function operationalClusterTitle(
  locale: UiLocale,
  args: { single: LogEntryType | null; types: ReadonlySet<LogEntryType>; maxPrio: number },
): string {
  const { single, types, maxPrio } = args;
  if (single && types.size <= 1) {
    return logEntryTypeLabel(locale, single);
  }
  if (maxPrio >= 3) {
    return L(locale, "Critical burst", "Критический пакет");
  }
  if (types.has("RISK") && (types.has("CONSENSUS") || types.has("FLOW"))) {
    return L(locale, "Risk + flow/consensus", "Риск + поток/консенсус");
  }
  if (types.has("REGIME")) {
    return L(locale, "Regime cluster", "Пакет режима");
  }
  if ((types.has("VOLATILITY") || types.has("REGIME")) && types.has("RISK")) {
    return L(locale, "Vol-risk", "Вол и риск");
  }
  if (types.has("LIQUIDITY") && types.has("FLOW")) {
    return L(locale, "Liq-flow", "Ликв и поток");
  }
  if (types.has("LIQUIDITY") || types.has("FLOW")) {
    return L(locale, "Flow/liq", "Поток/ликв");
  }
  if (types.has("MACRO")) {
    return L(locale, "Macro", "Макро");
  }
  if (types.has("SCENARIO")) {
    return L(locale, "Scenario shift", "Сценарий");
  }
  if (types.has("ORCHESTRATOR")) {
    return L(locale, "Desk note", "Деск");
  }
  if (types.size >= 3) {
    return L(locale, "Multi-factor", "Несколько факторов");
  }
  if (types.size === 2) {
    return L(locale, "Coupled shift", "Связный сдвиг");
  }
  return L(locale, "Event burst", "Пакет");
}

/** Compact desk read for consensus panel (agreement vs divergence). */
export function consensusStressRead(locale: UiLocale, agreementPct: number, divergencePct: number): string {
  if (agreementPct >= 76 && divergencePct <= 22) {
    return L(locale, "High participation agreement", "Участие широкое");
  }
  if (agreementPct <= 48 && divergencePct >= 40) {
    return L(locale, "Thin agreement · structural friction", "Участие тоньше · трение в структуре");
  }
  if (divergencePct >= 44) {
    return L(locale, "Cross-input divergence ↑", "Вводные разъезжаются");
  }
  if (agreementPct <= 56) {
    return L(locale, "Confirmation deteriorating", "Принятие слабеет");
  }
  return L(locale, "Provisional alignment", "Сборка условная");
}

export function agentLatticeRoleLabel(locale: UiLocale, role: AgentLatticeRole): string {
  if (role === "Orchestrator") return L(locale, "Summary", "Сводка");
  const R: Record<Exclude<AgentLatticeRole, "Orchestrator">, { en: string; ru: string }> = {
    Macro: { en: "Macro", ru: "Макро" },
    Flow: { en: "Flow", ru: "Поток" },
    Risk: { en: "Risk", ru: "Риск" },
    Sentiment: { en: "Sentiment", ru: "Настроения" },
    Liquidity: { en: "Liquidity", ru: "Ликвидность" },
  };
  const row = R[role];
  if (!row) return role;
  return L(locale, row.en, row.ru);
}

export type IntelligencePlaceholderKey = "marketRegime" | "consensus" | "danger";

const INTEL_TITLE: Record<IntelligencePlaceholderKey, { en: string; ru: string }> = {
  marketRegime: { en: "Market regime", ru: "Режим рынка" },
  consensus: { en: "Alignment", ru: "Сборка" },
  danger: { en: "Stress", ru: "Стресс" },
};

const INTEL_EYEBROW: Record<IntelligencePlaceholderKey, { en: string; ru: string }> = {
  marketRegime: { en: "Regime", ru: "Режим" },
  consensus: { en: "Alignment", ru: "Сборка" },
  danger: { en: "Risk", ru: "Риск" },
};

export function intelligencePanelTitle(locale: UiLocale, key: IntelligencePlaceholderKey): string {
  const x = INTEL_TITLE[key];
  return L(locale, x.en, x.ru);
}

export function intelligencePanelEyebrow(locale: UiLocale, key: IntelligencePlaceholderKey): string {
  const x = INTEL_EYEBROW[key];
  return L(locale, x.en, x.ru);
}

export function regimeMetricLabels(locale: UiLocale): {
  liq: string;
  vol: string;
  participation: string;
  recentPath: string;
} {
  return {
    liq: L(locale, "Liq", "Ликв."),
    vol: L(locale, "Vol", "Вол"),
    participation: L(locale, "Participation", "Участие"),
    recentPath: L(locale, "Recent path", "Траектория"),
  };
}

export function dangerPlaceholderTelemetry(locale: UiLocale): {
  liquidityStress: string;
  volImpulse: string;
  structuralNote: string;
  riskScore: string;
} {
  return {
    liquidityStress: L(locale, "Liquidity stress", "Ликв под давлением"),
    volImpulse: L(locale, "Volatility impulse", "Импульс волы"),
    structuralNote: L(locale, "Structural inputs.", "Структурные вводные."),
    riskScore: L(locale, "Risk score", "Оценка стресса"),
  };
}

export function consensusDriversSectionLabel(locale: UiLocale): string {
  return L(locale, "Trace", "Разбор");
}

export function consensusMeterLabels(locale: UiLocale): {
  spread: string;
  agreement: string;
  divergence: string;
  readPrefix: string;
  sparkAgreementAria: string;
  sparkDivergenceAria: string;
} {
  return {
    spread: L(locale, "Composite spread", "Сводный разнос"),
    agreement: L(locale, "Participation breadth", "Ширина участия"),
    divergence: L(locale, "Structural divergence", "Структурный разнос"),
    readPrefix: L(locale, "Read", "Срез"),
    sparkAgreementAria: L(
      locale,
      "Participation agreement breadth trace, recent window",
      "Ширина участия, недавнее окно",
    ),
    sparkDivergenceAria: L(
      locale,
      "Structural divergence index trace, recent window",
      "Структурный разнос, недавнее окно",
    ),
  };
}

export function whatChangedStripCopy(locale: UiLocale): {
  title: string;
  empty: string;
  consensusWeakened: string;
  fragilityUp: string;
  regimeShifted: string;
  volCompressing: string;
  volExpanding: string;
  participationWeakened: string;
  participationImproved: string;
  momentumNeutral: string;
  fundingAccelerated: string;
  leverageElevated: string;
} {
  return {
    title: L(locale, "Last 90 minutes", "90 мин"),
    empty: L(locale, "No structural delta in this window.", "В этом окне нет структурной дельты."),
    consensusWeakened: L(locale, "Alignment weakened", "Сборка слабеет"),
    fragilityUp: L(locale, "Fragility increased", "Хрупкость растёт"),
    regimeShifted: L(locale, "Regime shifted", "Режим сместился"),
    volCompressing: L(locale, "Volatility compressing", "Вол сжимается"),
    volExpanding: L(locale, "Volatility expanding", "Вол разжимается"),
    participationWeakened: L(locale, "Participation weakened", "Участие сужается"),
    participationImproved: L(locale, "Participation improved", "Участие шире"),
    momentumNeutral: L(locale, "Momentum neutral", "Импульс в нуле"),
    fundingAccelerated: L(locale, "Funding accelerated", "Фандинг шагнул"),
    leverageElevated: L(locale, "Leverage elevated", "Плечо выше нормы"),
  };
}

export function divergenceBriefingTitle(locale: UiLocale): string {
  return L(locale, "Structural tension", "Напряжение в структуре");
}

/** One-line regime / vol / stress anchor for divergence context (operations tone). */
export function divergenceAnchorLine(
  locale: UiLocale,
  phase: MarketPhaseId,
  volTone: VolatilityTone,
  dangerBand: DangerBandId,
): string {
  const p = phaseLabel(locale, phase);
  const vt =
    volTone === "expanding"
      ? L(locale, "Vol ↑", "Вол ↑")
      : volTone === "compressing"
        ? L(locale, "Vol ↓", "Вол ↓")
        : L(locale, "Vol flat", "Вол ровно");
  const b = dangerBandLabel(locale, dangerBand);
  return `${p} · ${vt} · ${b}`;
}

export function causalChainStripTitle(locale: UiLocale): string {
  return L(locale, "Causal chain", "Цепочка причин");
}

const POSTURE_ROW: Record<
  "eyebrow" | "condition" | "mainRisk" | "lead" | "bias" | "confidence" | "invalidation",
  { en: string; ru: string }
> = {
  eyebrow: { en: "Read", ru: "Срез" },
  condition: { en: "Condition", ru: "Состояние" },
  mainRisk: { en: "Main risk", ru: "Главный риск" },
  lead: { en: "Lead scenario", ru: "База" },
  bias: { en: "Bias", ru: "Уклон" },
  confidence: { en: "Confidence", ru: "Убеждённость" },
  invalidation: { en: "Invalidation", ru: "Снятие тезиса" },
};

export function strategicPostureRowLabel(
  locale: UiLocale,
  row: keyof typeof POSTURE_ROW,
): string {
  const x = POSTURE_ROW[row];
  return L(locale, x.en, x.ru);
}

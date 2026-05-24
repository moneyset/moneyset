import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type {
  DangerBandId,
  LatentDrivers,
  MarketPhaseId,
  ScenarioEvolutionState,
  VolatilityTone,
} from "@/lib/simulation/cognition-types";
import { clamp, isLateContinuationRegime } from "@/lib/simulation/engine-evolve";
import { scenarioInvalidation, scenarioStrategicSummary } from "@/lib/i18n/cognition-dict";
import {
  scenarioExecutionImplicationLine,
  scenarioPathConvictionLine,
  scenarioStructuralPath,
  scenarioTapeConditions,
} from "@/lib/i18n/cognition-dict";
import { utcSessionEvolutionLine } from "@/lib/cognition/temporal-evolution";
import type { UiLocale } from "@/store/ui-prefs-store";

export type ScenarioId =
  | "Controlled Bullish Expansion"
  | "Liquidity Sweep Before Continuation"
  | "Fragile Breakout Structure"
  | "Volatility Compression"
  | "Structural Breakdown Risk"
  | "Distribution Phase"
  | "Momentum Exhaustion"
  | "Risk Reset Expansion";

export type ScenarioRiskLevel = "low" | "medium" | "elevated" | "high";
export type ScenarioConfidenceLevel = "low" | "medium" | "high";

export type ScenarioEngineCard = Readonly<{
  id: ScenarioId;
  title: ScenarioId;
  /** Internal weight for ordering / smoothing — not shown as a forecast %. */
  probabilityPct: number;
  previousProbabilityPct: number;
  confidence: ScenarioConfidenceLevel;
  riskLevel: ScenarioRiskLevel;
  invalidation: string;
  strategicSummary: string;
  dominantDrivers: string[];
  fragilityFactors: string[];
  structuralPath: string;
  conditionLines: readonly [string, string];
  structuralSupport: readonly string[];
  invalidationPressure: readonly string[];
  evolutionState: ScenarioEvolutionState;
  executionImplication: string;
  pathConvictionLine: string;
  /** Session / overlap desk note — primary path only. */
  sessionContext: string | null;
}>;

export type ScenarioEngineBook = Readonly<{
  updatedAtTick: number;
  cards: ScenarioEngineCard[];
  rotationPair: Readonly<{ from: ScenarioId; to: ScenarioId }> | null;
}>;

function confFrom(derived: DerivedCognitionSnapshot): ScenarioConfidenceLevel {
  const spread = derived.consensusSpreadPct;
  const div = derived.divergenceIndex;
  if (spread >= 72 && div <= 24) return "high";
  if (spread <= 46 || div >= 44) return "low";
  return "medium";
}

function riskFromBand(band: DangerBandId): ScenarioRiskLevel {
  if (band === "calm") return "low";
  if (band === "moderate") return "medium";
  if (band === "elevated") return "elevated";
  return "high";
}

function invalidationFor(id: ScenarioId, phase: MarketPhaseId, volTone: VolatilityTone, locale: UiLocale): string {
  return scenarioInvalidation(locale, id, phase, volTone);
}

function driversFrom(latent: LatentDrivers, derived: DerivedCognitionSnapshot): string[] {
  const out: string[] = [];
  if (latent.liquidityStructuralStress >= 66) out.push("Liquidity thinning");
  if (latent.positioningPressure >= 64) out.push("Leverage building");
  if (latent.volatilityImpulse >= 62) out.push("Volatility rising");
  if (latent.sentimentThermal >= 70) out.push("Crowd optimism rising");
  if (latent.macroLiquidityBackdrop >= 70) out.push("Macro leading");
  if (derived.divergenceIndex >= 34) out.push("Consensus weakening");
  if (out.length === 0) out.push("Orderly breadth", "Contained dispersion");
  return out.slice(0, 4);
}

function fragilityFrom(latent: LatentDrivers, derived: DerivedCognitionSnapshot): string[] {
  const out: string[] = [];
  if (latent.liquidityStructuralStress >= 70) out.push("Sweep risk higher");
  if (latent.volatilityImpulse >= 66) out.push("Fast move risk");
  if (latent.positioningPressure >= 72) out.push("Leverage unwind risk");
  if (latent.sentimentThermal >= 74) out.push("Crowd reversal risk");
  if (derived.divergenceIndex >= 42) out.push("Views splitting");
  if (out.length === 0) out.push("Fragility contained");
  return out.slice(0, 4);
}

function scenarioScores(latent: LatentDrivers, derived: DerivedCognitionSnapshot): Record<ScenarioId, number> {
  const pp = latent.positioningPressure;
  const ls = latent.liquidityStructuralStress;
  const vi = latent.volatilityImpulse;
  const st = latent.sentimentThermal;
  const mb = latent.macroLiquidityBackdrop;
  const div = derived.divergenceIndex;

  const regimeBias = isLateContinuationRegime(latent) ? 14 : 0;

  const sweep = ls * 0.58 + pp * 0.32 + vi * 0.14 - st * 0.18 + regimeBias;
  const controlled = pp * 0.62 + (100 - ls) * 0.25 + derived.consensusSpreadPct * 0.22 - div * 0.18 + regimeBias * 0.92;
  const compression = (100 - vi) * 0.55 + ls * 0.22 + (derived.volTone === "compressing" ? 12 : 0);
  const breakdown =
    ls * 0.46 + vi * 0.34 + div * 0.22 + (derived.dangerScore >= 70 ? 10 : 0) + regimeBias * 0.85 + (latent.macroLiquidityBackdrop <= 50 ? 6 : 0);
  const offRegime = regimeBias > 0 ? 0.82 : 1;
  const distribution =
    ((100 - pp) * 0.32 + ls * 0.34 + vi * 0.18 + (derived.phase === "distribution_phase" ? 14 : 0)) * offRegime;
  const exhaustion = (st * 0.48 + pp * 0.28 + (100 - derived.consensusSpreadPct) * 0.24) * offRegime;
  const fragileBreakout = (pp * 0.42 + ls * 0.34 + div * 0.25 + (derived.phase === "fragile_continuation" ? 10 : 0)) * offRegime;
  const riskReset = (mb * 0.38 + (100 - ls) * 0.32 + (vi >= 58 ? 8 : 0) + (derived.phase === "regime_transition" ? 10 : 0)) * offRegime;

  return {
    "Controlled Bullish Expansion": controlled,
    "Liquidity Sweep Before Continuation": sweep,
    "Fragile Breakout Structure": fragileBreakout,
    "Volatility Compression": compression,
    "Structural Breakdown Risk": breakdown,
    "Distribution Phase": distribution,
    "Momentum Exhaustion": exhaustion,
    "Risk Reset Expansion": riskReset,
  };
}

function normalizeTo100(scores: Record<ScenarioId, number>): Record<ScenarioId, number> {
  const ids = Object.keys(scores) as ScenarioId[];
  const raw = ids.map((id) => Math.max(1, scores[id]));
  const sum = raw.reduce((a, b) => a + b, 0);
  const scaled = raw.map((v) => (v / sum) * 100);

  const rounded = scaled.map((v) => Math.round(v));
  const delta = 100 - rounded.reduce((a, b) => a + b, 0);
  if (delta !== 0) {
    const bestIdx = scaled
      .map((v, i) => ({ i, frac: v - Math.floor(v) }))
      .sort((a, b) => b.frac - a.frac)[0]?.i;
    if (typeof bestIdx === "number") rounded[bestIdx] = rounded[bestIdx] + delta;
  }

  const out = {} as Record<ScenarioId, number>;
  ids.forEach((id, i) => {
    out[id] = clamp(rounded[i] ?? 0, 1, 85);
  });
  return out;
}

function strategicSummaryFor(id: ScenarioId, derived: DerivedCognitionSnapshot, locale: UiLocale): string {
  return scenarioStrategicSummary(locale, id, derived.phase);
}

function deriveEvolutionState(prevPct: number, nextPct: number): ScenarioEvolutionState {
  const d = nextPct - prevPct;
  if (d >= 4) return "strengthening";
  if (d <= -4) return "weakening";
  if (Math.abs(d) < 1.3) return "stabilizing";
  if (d < 0) return "deteriorating";
  if (d > 0) return "transitioning";
  return "rebuilding";
}

function finalizeCards(
  tick: number,
  locale: UiLocale,
  sorted: ScenarioEngineCard[],
  previous: ScenarioEngineBook | undefined,
): ScenarioEngineBook {
  const cards = sorted.map((c, i) => ({
    ...c,
    pathConvictionLine: scenarioPathConvictionLine(locale, i, c.probabilityPct - c.previousProbabilityPct),
    sessionContext: i === 0 ? utcSessionEvolutionLine(locale) : null,
  }));
  const rotationPair =
    previous?.cards[0] && cards[0] && previous.cards[0].id !== cards[0].id
      ? ({ from: previous.cards[0].id, to: cards[0].id } as const)
      : null;
  return { updatedAtTick: tick, cards, rotationPair };
}

export function deriveScenarioEngineBook(args: {
  tick: number;
  latent: LatentDrivers;
  derived: DerivedCognitionSnapshot;
  previous?: ScenarioEngineBook;
  locale?: UiLocale;
}): ScenarioEngineBook {
  const { tick, latent, derived, previous } = args;
  const locale = args.locale ?? "en";

  const scores = scenarioScores(latent, derived);
  const target = normalizeTo100(scores);

  const prevMap = new Map<ScenarioId, ScenarioEngineCard>();
  previous?.cards.forEach((c) => prevMap.set(c.id, c));

  /** Slow evolution: EMA smoothing + clamp per tick to avoid noisy jumps. */
  const alpha = 0.18;
  const maxStep = 7;

  const rawCards = (Object.keys(target) as ScenarioId[])
    .map((id) => {
      const prev = prevMap.get(id);
      const prevPct = prev?.probabilityPct ?? target[id];
      const blended = prevPct * (1 - alpha) + target[id] * alpha;
      const stepped = clamp(blended, prevPct - maxStep, prevPct + maxStep);
      const probabilityPct = Math.round(stepped);
      const dom = driversFrom(latent, derived);
      const frag = fragilityFrom(latent, derived);

      return {
        id,
        title: id,
        probabilityPct,
        previousProbabilityPct: prevPct,
        confidence: confFrom(derived),
        riskLevel: riskFromBand(derived.dangerBand),
        invalidation: invalidationFor(id, derived.phase, derived.volTone, locale),
        strategicSummary: strategicSummaryFor(id, derived, locale),
        dominantDrivers: dom,
        fragilityFactors: frag,
        structuralPath: scenarioStructuralPath(locale, id),
        conditionLines: scenarioTapeConditions(locale, id),
        structuralSupport: dom,
        invalidationPressure: frag.slice(0, 2),
        evolutionState: deriveEvolutionState(prevPct, probabilityPct),
        executionImplication: scenarioExecutionImplicationLine(locale, id),
        pathConvictionLine: "",
        sessionContext: null,
      } satisfies ScenarioEngineCard;
    })
    .sort((a, b) => b.probabilityPct - a.probabilityPct)
    .slice(0, 6);

  const sumTop = rawCards.reduce((a, c) => a + c.probabilityPct, 0);
  if (sumTop >= 96 && sumTop <= 104) {
    return finalizeCards(tick, locale, rawCards, previous);
  }

  const scale = 100 / Math.max(1, sumTop);
  const scaled = rawCards.map((c) => ({ ...c, probabilityPct: clamp(Math.round(c.probabilityPct * scale), 1, 85) }));
  return finalizeCards(tick, locale, scaled, previous);
}

/** Re-render scenario copy for a new UI locale without advancing the EMA tick. */
export function relocalizeScenarioEngineBook(
  book: ScenarioEngineBook,
  derived: DerivedCognitionSnapshot,
  locale: UiLocale,
): ScenarioEngineBook {
  return {
    updatedAtTick: book.updatedAtTick,
    rotationPair: book.rotationPair,
    cards: book.cards.map((c, i) => ({
      ...c,
      structuralPath: scenarioStructuralPath(locale, c.id),
      conditionLines: scenarioTapeConditions(locale, c.id),
      executionImplication: scenarioExecutionImplicationLine(locale, c.id),
      invalidation: scenarioInvalidation(locale, c.id, derived.phase, derived.volTone),
      strategicSummary: scenarioStrategicSummary(locale, c.id, derived.phase),
      pathConvictionLine: scenarioPathConvictionLine(locale, i, c.probabilityPct - c.previousProbabilityPct),
      sessionContext: i === 0 ? utcSessionEvolutionLine(locale) : null,
    })),
  };
}


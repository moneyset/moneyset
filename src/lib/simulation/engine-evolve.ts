/**
 * Deterministic latent evolution — smooth, coherent, replayable within a tab session.
 * No RNG: all drivers are rhythmic functions of sim tick only.
 */

import type {
  ConsensusEvolutionLabel,
  DangerBandId,
  LatentDrivers,
  MarketPhaseId,
  VolatilityTone,
} from "@/lib/simulation/cognition-types";

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Session baseline — late BTC continuation: narrowing participation, compressed vol, rising macro pressure. */
const REGIME_LATENT_ANCHOR: LatentDrivers = {
  positioningPressure: 71,
  liquidityStructuralStress: 73,
  volatilityImpulse: 39,
  sentimentThermal: 66,
  macroLiquidityBackdrop: 46,
};

function anchoredRhythmic(tick: number, anchor: number, p1: number, p2: number, amplitude: number): number {
  return anchor + Math.sin(tick / p1) * amplitude + Math.cos(tick / p2) * amplitude * 0.55;
}

/** Coherent institutional regime — used for copy and scenario weighting. */
export function isLateContinuationRegime(latent: LatentDrivers): boolean {
  return (
    latent.positioningPressure >= 62 &&
    latent.liquidityStructuralStress >= 58 &&
    latent.volatilityImpulse <= 52 &&
    latent.macroLiquidityBackdrop <= 54
  );
}

export function evolveLatent(tick: number): LatentDrivers {
  return {
    positioningPressure: clamp(anchoredRhythmic(tick, REGIME_LATENT_ANCHOR.positioningPressure, 52, 34, 9), 6, 98),
    liquidityStructuralStress: clamp(
      anchoredRhythmic(tick + 12, REGIME_LATENT_ANCHOR.liquidityStructuralStress, 61, 43, 8),
      6,
      98,
    ),
    volatilityImpulse: clamp(anchoredRhythmic(tick - 50, REGIME_LATENT_ANCHOR.volatilityImpulse, 38, 26, 7), 5, 95),
    sentimentThermal: clamp(anchoredRhythmic(tick + 80, REGIME_LATENT_ANCHOR.sentimentThermal, 46, 31, 8), 5, 96),
    macroLiquidityBackdrop: clamp(
      anchoredRhythmic(tick + 220, REGIME_LATENT_ANCHOR.macroLiquidityBackdrop, 94, 71, 7),
      8,
      92,
    ),
  };
}

export type DerivedCognitionSnapshot = Readonly<{
  latent: LatentDrivers;
  phase: MarketPhaseId;
  consensus: ConsensusEvolutionLabel;
  dangerScore: number;
  dangerBand: DangerBandId;
  volTone: VolatilityTone;
  consensusSpreadPct: number;
  divergenceIndex: number;
}>;

export function classifyPhase(latent: LatentDrivers): MarketPhaseId {
  const pp = latent.positioningPressure;
  const lt = latent.liquidityStructuralStress;
  const vi = latent.volatilityImpulse;
  const st = latent.sentimentThermal;
  const mb = latent.macroLiquidityBackdrop;

  if (vi >= 74 && lt >= 70) return "panic_risk";
  if (lt >= 74 && pp < 62) return "liquidity_compression";
  if (vi >= 62 && lt >= 55) return "volatility_expansion";
  if (pp < 54 && lt >= 60 && vi >= 45) return "distribution_phase";

  if (pp >= 64 && lt >= 60 && vi <= 50 && st >= 56 && mb <= 56) return "fragile_continuation";

  const fragilityLean = lt * 0.55 + (100 - pp) * 0.18 + vi * 0.27;

  if (fragilityLean >= 68 && pp >= 58 && st >= 62) return "fragile_continuation";
  if (pp >= 70 && st >= 66 && lt < 60) return "overheated_momentum";
  if (mb >= 70 && lt < 55 && pp >= 54 && pp < 68) return "controlled_trend";

  if (Math.abs(pp - lt) >= 38 && lt >= 60) return "regime_transition";

  return "stable_expansion";
}

function volatilityTone(latent: LatentDrivers, tick: number): VolatilityTone {
  const drift = latent.volatilityImpulse - latent.liquidityStructuralStress * 0.42;
  if (latent.volatilityImpulse <= 43 && latent.liquidityStructuralStress <= 62 + Math.sin(tick / 40) * 3) {
    return "compressing";
  }
  if (drift > 15) return "expanding";
  return "neutral";
}

export function divergenceIndex(latent: LatentDrivers): number {
  const a = latent.positioningPressure - latent.sentimentThermal;
  const b = latent.liquidityStructuralStress - latent.macroLiquidityBackdrop;
  return clamp(Math.abs(a) * 0.55 + Math.abs(b) * 0.45, 0, 99);
}

export function consensusLabel(latent: LatentDrivers, div: number, phase: MarketPhaseId): ConsensusEvolutionLabel {
  if (latent.macroLiquidityBackdrop >= 72 && latent.macroLiquidityBackdrop > latent.positioningPressure + 12) {
    return "macro_dominance_rising";
  }

  const riskLean = latent.liquidityStructuralStress * 0.45 + latent.volatilityImpulse * 0.25;
  if (div >= 44 && riskLean >= 48) return "risk_layer_escalating";
  if (div >= 32) return "divergence_increasing";
  if (div <= 22 && phase !== "panic_risk" && phase !== "distribution_phase") {
    return "consensus_strengthening";
  }
  return "consensus_weakening";
}

function dangerFrom(latent: LatentDrivers, div: number): { score: number; band: DangerBandId } {
  const positioningDrag = latent.positioningPressure > 64 ? (latent.positioningPressure - 64) * 0.42 : 0;
  let score =
    latent.liquidityStructuralStress * 0.38 +
    latent.volatilityImpulse * 0.28 +
    div * 0.22 +
    positioningDrag +
    (latent.sentimentThermal > 70 ? (latent.sentimentThermal - 70) * 0.12 : 0);

  score = clamp(score + Math.sin(latent.liquidityStructuralStress / 20) * 2, 0, 99);

  let band: DangerBandId = "dangerous";
  if (score < 28) band = "calm";
  else if (score < 42) band = "moderate";
  else if (score < 58) band = "elevated";
  else if (score < 76) band = "dangerous";

  /** Critical intentionally rare — only when multiple structural stresses collide. */
  if (score >= 88 || (latent.liquidityStructuralStress >= 76 && latent.volatilityImpulse >= 70)) {
    band = "critical";
  }

  return { score: Math.round(score), band };
}

export function deriveFromLatentCommitted(
  latent: LatentDrivers,
  tick: number,
  committedPhase: MarketPhaseId,
): DerivedCognitionSnapshot {
  const div = divergenceIndex(latent);
  const consensus = consensusLabel(latent, div, committedPhase);
  const volTone = volatilityTone(latent, tick);
  const { score, band } = dangerFrom(latent, div);

  return {
    latent,
    phase: committedPhase,
    consensus,
    dangerScore: score,
    dangerBand: band,
    volTone,
    consensusSpreadPct: clamp(94 - div * 0.75, 18, 96),
    divergenceIndex: div,
  };
}

export function deriveFromLatent(latent: LatentDrivers, tick: number): DerivedCognitionSnapshot {
  const div = divergenceIndex(latent);
  const phase = classifyPhase(latent);
  const consensus = consensusLabel(latent, div, phase);
  const volTone = volatilityTone(latent, tick);
  const { score, band } = dangerFrom(latent, div);

  return {
    latent,
    phase,
    consensus,
    dangerScore: score,
    dangerBand: band,
    volTone,
    consensusSpreadPct: clamp(94 - div * 0.75, 18, 96),
    divergenceIndex: div,
  };
}

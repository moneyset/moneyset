import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type {
  DominantHeadlineKey,
  DominantSurface,
  LatentDrivers,
  MainRiskKey,
  TopScenarioSurface,
  TopScenarioWireId,
} from "@/lib/simulation/cognition-types";

function postureHeadlineKey(latent: LatentDrivers, derived: DerivedCognitionSnapshot): DominantHeadlineKey {
  const { liquidityStructuralStress, positioningPressure, sentimentThermal, volatilityImpulse } = latent;

  if (liquidityStructuralStress >= 74) return "liquidity_stressed";
  if (positioningPressure >= 68 && derived.divergenceIndex <= 30) return "controlled_expansion";
  if (liquidityStructuralStress >= 62 && positioningPressure >= 58) return "fragile_continuation";
  if (sentimentThermal >= 71 && volatilityImpulse < 52 && positioningPressure >= 60) return "momentum_exhaustion_risk";
  if (derived.phase === "overheated_momentum") return "overheated_participation";
  if (derived.phase === "stable_expansion" && (derived.dangerBand === "calm" || derived.dangerBand === "moderate")) {
    return "trend_intact";
  }
  return positioningPressure >= 55 ? "bullish_fragile" : "defensive_tilt";
}

export function deriveDominantSurface(latent: LatentDrivers, derived: DerivedCognitionSnapshot): DominantSurface {
  return {
    headlineKey: postureHeadlineKey(latent, derived),
    liquidity: latent.liquidityStructuralStress,
    leverage: latent.positioningPressure,
  };
}

export function deriveMainRisk(
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
): { riskKey: MainRiskKey; dangerScore: number } {
  if (derived.dangerBand === "critical" || derived.dangerBand === "dangerous") {
    return { riskKey: "forced_move", dangerScore: derived.dangerScore };
  }
  return {
    riskKey: latent.volatilityImpulse > 62 ? "reversal_vol" : "reversal_fade",
    dangerScore: derived.dangerScore,
  };
}

const SCENARIO_IDS: TopScenarioWireId[] = [
  "Controlled Bullish Expansion",
  "Liquidity Sweep Before Continuation",
  "Structural Breakdown Risk",
  "Volatility Compression",
];

export function postureTags(latent: LatentDrivers): string[] {
  const tags: string[] = [];
  // Controlled vocabulary: short, repeatable tags (no synonyms).
  if (latent.positioningPressure >= 66) tags.push("Leverage extended");
  if (latent.liquidityStructuralStress >= 60) tags.push("Depth thin");
  if (latent.volatilityImpulse <= 44) tags.push("Vol compressed");
  if (latent.sentimentThermal >= 68) tags.push("Participation hot");
  if (latent.macroLiquidityBackdrop >= 68) tags.push("Macro leads");
  if (tags.length === 0) tags.push("Structure stable", "Divergence contained");
  return tags.slice(0, 4);
}

export function deriveTopScenario(latent: LatentDrivers, derived: DerivedCognitionSnapshot): TopScenarioSurface {
  const liquidityPull = latent.liquidityStructuralStress * 1.05;
  const flowPull = latent.positioningPressure * 0.98;
  const volPull = latent.volatilityImpulse * 0.88;

  const breakdownLean = latent.liquidityStructuralStress * 0.45 + derived.dangerScore * 0.45;
  const expansionLean = flowPull * 0.56 + (100 - derived.dangerScore) * 0.2;
  const sweepLean =
    latent.liquidityStructuralStress * 0.62 + latent.positioningPressure * 0.32 - latent.sentimentThermal * 0.2;
  const compressionLean =
    latent.volatilityImpulse * 0.4 + latent.liquidityStructuralStress * 0.35 + (liquidityPull + volPull > 155 ? 8 : -4);

  const scores = [expansionLean, sweepLean, breakdownLean, compressionLean];
  let top = 0;
  scores.forEach((s, i) => {
    if (s > scores[top]!) top = i;
  });

  let prob = Math.round(28 + scores[top]! * 0.14);
  prob = Math.min(Math.max(prob, 18), 48);

  return {
    scenarioId: SCENARIO_IDS[top]!,
    probabilityPct: prob,
  };
}

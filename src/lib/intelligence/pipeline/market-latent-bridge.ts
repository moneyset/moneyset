/**
 * Blend simulation latent with live market metrics — market informs desk state, not UI opinions.
 */

import { clamp } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import type { UnifiedMarketSnapshot } from "@/lib/intelligence/types";
import type { NormalizedMarketState } from "@/types/market-state";

function scaleFunding(funding: number | null): number {
  if (funding === null) return 0;
  return clamp(Math.abs(funding) * 120_000, 0, 28);
}

export function blendLatentWithMarket(
  simLatent: LatentDrivers,
  tape: NormalizedMarketState,
  unified: UnifiedMarketSnapshot | null,
): LatentDrivers {
  if (tape.connection !== "live" && tape.price === null) return simLatent;

  const vol = tape.realizedVol ?? unified?.structure.realizedVol ?? null;
  const momentum = tape.momentum ?? unified?.structure.momentum ?? null;
  const funding = tape.fundingRate ?? unified?.derivatives.fundingRate ?? null;
  const fragility = unified?.structure.fragility ?? null;
  const macroPressure = unified?.macro.macroPressure ?? null;
  const liqPressure = unified?.derivatives.liquidationPressure ?? null;

  let positioningPressure = simLatent.positioningPressure;
  let liquidityStructuralStress = simLatent.liquidityStructuralStress;
  let volatilityImpulse = simLatent.volatilityImpulse;
  let sentimentThermal = simLatent.sentimentThermal;
  let macroLiquidityBackdrop = simLatent.macroLiquidityBackdrop;

  if (momentum !== null) {
    positioningPressure = clamp(positioningPressure * 0.55 + (50 + momentum * 0.35) * 0.45, 5, 98);
  }
  if (vol !== null) {
    volatilityImpulse = clamp(volatilityImpulse * 0.5 + vol * 0.5, 5, 95);
  }
  if (funding !== null) {
    const fBoost = scaleFunding(funding);
    liquidityStructuralStress = clamp(liquidityStructuralStress * 0.6 + (48 + fBoost) * 0.4, 5, 98);
    sentimentThermal = clamp(sentimentThermal * 0.7 + (52 + fBoost * 0.8) * 0.3, 5, 96);
  }
  if (fragility !== null) {
    liquidityStructuralStress = clamp(liquidityStructuralStress * 0.65 + fragility * 0.35, 5, 98);
  }
  if (macroPressure !== null) {
    macroLiquidityBackdrop = clamp(100 - macroPressure * 0.85, 8, 92);
  } else if (unified && unified.macro.dxyProxy !== null) {
    macroLiquidityBackdrop = clamp(macroLiquidityBackdrop * 0.6 + (105 - unified.macro.dxyProxy) * 2.2, 8, 92);
  }
  if (liqPressure !== null && liqPressure > 0) {
    liquidityStructuralStress = clamp(liquidityStructuralStress * 0.7 + Math.min(98, liqPressure / 1e4) * 0.3, 5, 98);
  }

  return {
    positioningPressure,
    liquidityStructuralStress,
    volatilityImpulse,
    sentimentThermal,
    macroLiquidityBackdrop,
  };
}

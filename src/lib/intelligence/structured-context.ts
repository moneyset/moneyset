/**
 * Structured AI context — compact facts only, never raw tick spam.
 */

import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import type { ScenarioEngineBook } from "@/lib/simulation/scenario-engine";
import type { AgentLatticeRow, OperationalLogEntry } from "@/lib/simulation/cognition-types";
import { buildContextPayload, formatContext } from "@/lib/openrouter/context";
import type { UnifiedMarketSnapshot } from "@/lib/intelligence/types";

export type StructuredIntelligenceContext = Readonly<{
  marketBlock: string;
  cognitionBlock: string;
  combined: string;
}>;

export function buildStructuredIntelligenceContext(args: {
  market: UnifiedMarketSnapshot;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  scenarioBook: ScenarioEngineBook;
  agentLattice: AgentLatticeRow[];
  operationalLog: OperationalLogEntry[];
}): StructuredIntelligenceContext {
  const { market, derived, latent, scenarioBook, agentLattice, operationalLog } = args;
  const m = market;

  const marketLines = [
    `unified_market symbol=${m.symbol} sig=${m.signature}`,
    `tape: price=${m.tape.price ?? "n/a"} mark=${m.tape.markPrice ?? "n/a"} conn=${m.tape.connection}`,
    `derivatives: funding=${m.derivatives.fundingRate ?? "n/a"} oi=${m.derivatives.openInterest ?? "n/a"} liq_pressure=${m.derivatives.liquidationPressure ?? "n/a"}`,
    `structure: vol=${m.structure.realizedVol ?? "n/a"} momentum=${m.structure.momentum ?? "n/a"} continuation_q=${m.structure.continuationQuality} fragility=${m.structure.fragility}`,
    `macro: dxy_proxy=${m.macro.dxyProxy ?? "n/a"} yield10y=${m.macro.yield10y ?? "n/a"} macro_pressure=${m.macro.macroPressure ?? "n/a"}`,
    `cross_venue: dislocation_pct=${m.crossVenue.priceDislocationPct ?? "n/a"}`,
    `latent: liq_stress=${latent.liquidityStructuralStress} vol_impulse=${latent.volatilityImpulse} positioning=${latent.positioningPressure} macro_backdrop=${latent.macroLiquidityBackdrop}`,
  ];

  const cognitionPayload = buildContextPayload({
    symbol: m.symbol,
    market: {
      price: m.tape.price,
      markPrice: m.tape.markPrice,
      fundingRate: m.derivatives.fundingRate,
      openInterest: m.derivatives.openInterest,
      realizedVol: m.structure.realizedVol,
      momentum: m.structure.momentum,
      connection: m.tape.connection,
      ts: m.tape.ts,
    },
    derived,
    scenarioBook,
    agentLattice,
    operationalLog,
  });

  const cognitionBlock = formatContext(cognitionPayload);
  const marketBlock = marketLines.join("\n");
  const combined = [marketBlock, "", "cognition:", cognitionBlock].join("\n");

  return { marketBlock, cognitionBlock, combined };
}

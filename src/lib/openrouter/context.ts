import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { ScenarioEngineBook } from "@/lib/simulation/scenario-engine";
import type { AgentLatticeRow, OperationalLogEntry, ScenarioEvolutionState } from "@/lib/simulation/cognition-types";
import type { NormalizedMarketState } from "@/types/market-state";

export type CognitionContextPayload = Readonly<{
  symbol: string;
  market: Pick<
    NormalizedMarketState,
    "price" | "markPrice" | "fundingRate" | "openInterest" | "realizedVol" | "momentum" | "connection" | "ts"
  >;
  derived: Pick<DerivedCognitionSnapshot, "phase" | "dangerBand" | "dangerScore" | "volTone" | "consensus" | "divergenceIndex">;
  topScenarios: Array<{
    title: string;
    pathConvictionLine: string;
    evolutionState: ScenarioEvolutionState;
    structuralPath: string;
    invalidation: string;
    executionImplication: string;
    strategicSummary: string;
  }>;
  agentLattice: AgentLatticeRow[];
  recentOps: Array<Pick<OperationalLogEntry, "entryType" | "priority" | "headline" | "summary">>;
}>;

export function formatContext(ctx: CognitionContextPayload): string {
  const lines: string[] = [];
  lines.push(`symbol=${ctx.symbol}`);
  lines.push(
    `market: price=${ctx.market.price ?? "n/a"} mark=${ctx.market.markPrice ?? "n/a"} conn=${ctx.market.connection}`,
  );
  lines.push(
    `market: vol=${ctx.market.realizedVol ?? "n/a"} momentum=${ctx.market.momentum ?? "n/a"} funding=${ctx.market.fundingRate ?? "n/a"} oi=${ctx.market.openInterest ?? "n/a"}`,
  );
  lines.push(
    `cognition: phase=${ctx.derived.phase} danger=${ctx.derived.dangerBand}(${ctx.derived.dangerScore}) volTone=${ctx.derived.volTone} consensus=${ctx.derived.consensus} div=${ctx.derived.divergenceIndex}`,
  );
  lines.push("top_scenarios:");
  ctx.topScenarios.slice(0, 4).forEach((s) =>
    lines.push(
      `- ${s.title} · ${s.pathConvictionLine} [${s.evolutionState}] :: ${s.structuralPath} | inv: ${s.invalidation} | exec: ${s.executionImplication} | tape: ${s.strategicSummary}`,
    ),
  );
  lines.push("agent_lattice:");
  ctx.agentLattice.forEach((a) =>
    lines.push(`- ${a.role} conf=${a.confidencePct}% state=${a.stateLabel} align=${a.alignmentLabel}`),
  );
  lines.push("recent_ops:");
  ctx.recentOps.slice(0, 8).forEach((e) => lines.push(`- ${e.entryType}/${e.priority} ${e.headline}: ${e.summary}`));
  return lines.join("\n");
}

/** Fields read from tape for OpenRouter cognition — avoids subscribing the whole store shape. */
export type MarketContextSlice = Pick<
  NormalizedMarketState,
  "price" | "markPrice" | "fundingRate" | "openInterest" | "realizedVol" | "momentum" | "connection" | "ts"
>;

export function buildContextPayload(args: {
  symbol: string;
  market: MarketContextSlice;
  derived: DerivedCognitionSnapshot;
  scenarioBook: ScenarioEngineBook;
  agentLattice: AgentLatticeRow[];
  operationalLog: OperationalLogEntry[];
}): CognitionContextPayload {
  const { symbol, market, derived, scenarioBook, agentLattice, operationalLog } = args;

  return {
    symbol,
    market: {
      price: market.price,
      markPrice: market.markPrice,
      fundingRate: market.fundingRate,
      openInterest: market.openInterest,
      realizedVol: market.realizedVol,
      momentum: market.momentum,
      connection: market.connection,
      ts: market.ts,
    },
    derived: {
      phase: derived.phase,
      dangerBand: derived.dangerBand,
      dangerScore: derived.dangerScore,
      volTone: derived.volTone,
      consensus: derived.consensus,
      divergenceIndex: derived.divergenceIndex,
    },
    topScenarios: scenarioBook.cards.map((c) => ({
      title: c.title,
      pathConvictionLine: c.pathConvictionLine,
      evolutionState: c.evolutionState,
      structuralPath: c.structuralPath,
      invalidation: c.invalidation,
      executionImplication: c.executionImplication,
      strategicSummary: c.strategicSummary,
    })),
    agentLattice,
    recentOps: operationalLog.map((e) => ({
      entryType: e.entryType,
      priority: e.priority,
      headline: e.headline,
      summary: e.summary,
    })),
  };
}


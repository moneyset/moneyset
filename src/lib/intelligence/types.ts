import type { NormalizedMarketState } from "@/types/market-state";

/** Aggregated live market snapshot — feeds UI + structured AI context. */
export type UnifiedMarketSnapshot = Readonly<{
  symbol: string;
  tape: NormalizedMarketState;
  sources: Readonly<{
    binance: boolean;
    bybit: boolean;
    coingecko: boolean;
    coinalyze: boolean;
    fred: boolean;
    tradingViewSymbol: string;
  }>;
  crossVenue: Readonly<{
    binancePrice: number | null;
    bybitPrice: number | null;
    priceDislocationPct: number | null;
  }>;
  macro: Readonly<{
    dxyProxy: number | null;
    yield10y: number | null;
    macroPressure: number | null;
  }>;
  derivatives: Readonly<{
    fundingRate: number | null;
    openInterest: number | null;
    liquidationPressure: number | null;
  }>;
  structure: Readonly<{
    realizedVol: number | null;
    momentum: number | null;
    continuationQuality: number | null;
    fragility: number | null;
  }>;
  signature: string;
  fetchedAt: number;
}>;

export type ExecutionInterpretationOutput = Readonly<{
  posture: string;
  acceptanceZone: string;
  defensiveZone: string;
  executionBias: string;
  tacticalFramework: readonly string[];
  scenarioImplication: string;
  rationale: string;
}>;

export type CachedInferenceBundle = Readonly<{
  market: UnifiedMarketSnapshot;
  interpretation: ExecutionInterpretationOutput | null;
  aiOrchestrator: unknown | null;
  inferredAt: number;
  marketSignature: string;
}>;

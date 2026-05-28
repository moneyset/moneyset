/**
 * Unified market state engine — aggregates venue + macro feeds into one snapshot.
 * Live prices from APIs; never from AI.
 */

import { fetchBinanceMarketSnapshot } from "@/lib/services/binance";
import { fetchBybitTickerSnapshot } from "@/lib/services/bybit";
import { fetchCoinGeckoBtcSnapshot } from "@/lib/services/coingecko";
import { fetchCoinalyzeSnapshot } from "@/lib/services/coinalyze";
import { fetchFredMacroSnapshot } from "@/lib/services/fred";
import { getTradingViewConfig } from "@/lib/services/tradingview";
import { cacheGet, cacheSet } from "@/lib/services/shared/http";
import type { UnifiedMarketSnapshot } from "@/lib/intelligence/types";
import type { MarketConnectionState, NormalizedMarketState } from "@/types/market-state";

const MARKET_STATE_TTL_MS = 30_000;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function buildSignature(args: {
  price: number | null;
  funding: number | null;
  oi: number | null;
  vol: number | null;
  momentum: number | null;
  dxy: number | null;
}): string {
  const p = args.price !== null ? Math.round(args.price / 50) : "na";
  const f = args.funding !== null ? Math.round(args.funding * 1e6) : "na";
  const oi = args.oi !== null ? Math.round(args.oi / 1000) : "na";
  const v = args.vol !== null ? Math.round(args.vol) : "na";
  const m = args.momentum !== null ? Math.round(args.momentum / 5) : "na";
  const d = args.dxy !== null ? Math.round(args.dxy * 10) : "na";
  return `${p}|${f}|${oi}|${v}|${m}|${d}`;
}

function deriveMacroPressure(dxy: number | null, yield10y: number | null): number | null {
  if (dxy === null && yield10y === null) return null;
  const dxyPart = dxy !== null ? clamp((dxy - 100) * 2.5, 0, 50) : 25;
  const yPart = yield10y !== null ? clamp(yield10y * 8, 0, 50) : 25;
  return clamp(dxyPart + yPart, 0, 100);
}

function deriveFragility(funding: number | null, vol: number | null, dislocation: number | null): number {
  let score = 28;
  if (funding !== null && Math.abs(funding) >= 0.0008) score += 18;
  if (vol !== null && vol >= 48) score += 22;
  if (dislocation !== null && dislocation >= 0.35) score += 16;
  return clamp(score, 0, 100);
}

function deriveContinuationQuality(momentum: number | null, vol: number | null, funding: number | null): number {
  let score = 52;
  if (momentum !== null) score += momentum * 0.22;
  if (vol !== null && vol <= 22) score += 8;
  if (vol !== null && vol >= 50) score -= 14;
  if (funding !== null && funding > 0.001) score -= 10;
  return clamp(score, 0, 100);
}

export async function fetchUnifiedMarketSnapshot(symbol = "BTCUSDT"): Promise<UnifiedMarketSnapshot> {
  const sym = symbol.toUpperCase();
  const cacheKey = `unified:market:${sym}`;
  const cached = cacheGet<UnifiedMarketSnapshot>(cacheKey);
  if (cached) return cached;

  const tv = getTradingViewConfig();
  const [binance, bybit, gecko, coinalyze, fred] = await Promise.all([
    fetchBinanceMarketSnapshot(sym).catch(() => null),
    fetchBybitTickerSnapshot(sym).catch(() => null),
    fetchCoinGeckoBtcSnapshot().catch(() => null),
    fetchCoinalyzeSnapshot(sym).catch(() => null),
    fetchFredMacroSnapshot().catch(() => null),
  ]);

  const price = binance?.price ?? bybit?.lastPrice ?? gecko?.priceUsd ?? null;
  const markPrice = binance?.markPrice ?? bybit?.markPrice ?? price;
  const fundingRate = binance?.fundingRate ?? bybit?.fundingRate ?? coinalyze?.fundingRate ?? null;
  const openInterest = binance?.openInterest ?? bybit?.openInterest ?? coinalyze?.openInterest ?? null;
  const realizedVol = binance?.realizedVol ?? null;
  const momentum = binance?.momentum ?? null;

  const priceDislocationPct =
    binance?.price && bybit?.lastPrice
      ? Math.abs((binance.price - bybit.lastPrice) / binance.price) * 100
      : null;

  const connection: MarketConnectionState = price !== null ? "live" : "disconnected";
  const ts = Date.now();

  const tape: NormalizedMarketState = {
    symbol: sym,
    price,
    ts,
    changePercent24h: gecko?.change24hPct ?? null,
    markPrice,
    fundingRate,
    nextFundingTime: binance?.nextFundingTime ?? null,
    openInterest,
    realizedVol,
    momentum,
    connection,
    lastWsTs: null,
    lastRestTs: ts,
    error: price === null ? "Tape unavailable" : null,
    feedDegraded: false,
  };

  const macroPressure = deriveMacroPressure(fred?.dxyProxy ?? null, fred?.yield10y ?? null);

  const snapshot: UnifiedMarketSnapshot = {
    symbol: sym,
    tape,
    sources: {
      binance: binance !== null,
      bybit: bybit !== null,
      coingecko: gecko !== null,
      coinalyze: coinalyze !== null,
      fred: fred !== null,
      tradingViewSymbol: tv.symbol,
    },
    crossVenue: {
      binancePrice: binance?.price ?? null,
      bybitPrice: bybit?.lastPrice ?? null,
      priceDislocationPct,
    },
    macro: {
      dxyProxy: fred?.dxyProxy ?? null,
      yield10y: fred?.yield10y ?? null,
      macroPressure,
    },
    derivatives: {
      fundingRate,
      openInterest,
      liquidationPressure: coinalyze?.liquidationPressure ?? null,
    },
    structure: {
      realizedVol,
      momentum,
      continuationQuality: deriveContinuationQuality(momentum, realizedVol, fundingRate),
      fragility: deriveFragility(fundingRate, realizedVol, priceDislocationPct),
    },
    signature: buildSignature({
      price,
      funding: fundingRate,
      oi: openInterest,
      vol: realizedVol,
      momentum,
      dxy: fred?.dxyProxy ?? null,
    }),
    fetchedAt: ts,
  };

  cacheSet(cacheKey, snapshot, MARKET_STATE_TTL_MS);
  return snapshot;
}

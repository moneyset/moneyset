/**
 * Binance futures market data — server-side aggregation layer.
 * @see services/binance/rest.ts for low-level REST calls
 */

import {
  binanceFuturesPrice,
  binanceOpenInterest,
  binancePremiumIndex,
} from "@/services/binance/rest";
import { BINANCE_FAPI_BASE } from "@/services/binance/constants";
import { fetchBinanceJson, intervalToBinance } from "@/lib/binance/upstream";
import { cacheGet, cacheSet, num } from "@/lib/services/shared/http";
import type { OhlcCandle } from "@/types/market";
import { momentumFromCandles, realizedVolFromCandles } from "@/lib/market/metrics";

export type BinanceMarketSnapshot = Readonly<{
  symbol: string;
  price: number | null;
  markPrice: number | null;
  fundingRate: number | null;
  nextFundingTime: number | null;
  openInterest: number | null;
  realizedVol: number | null;
  momentum: number | null;
  ts: number;
}>;

function cleanSymbol(s: string): string {
  return (s || "BTCUSDT").trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() || "BTCUSDT";
}

async function fetchKlines(symbol: string, interval = "1m", limit = 180): Promise<OhlcCandle[]> {
  const sym = cleanSymbol(symbol);
  const binanceInterval = intervalToBinance(interval);
  const url = `${BINANCE_FAPI_BASE}/fapi/v1/klines?symbol=${sym}&interval=${binanceInterval}&limit=${limit}`;
  const raw = await fetchBinanceJson<unknown[][]>(url);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!Array.isArray(row) || row.length < 6) return null;
      const open = num(row[1]);
      const high = num(row[2]);
      const low = num(row[3]);
      const close = num(row[4]);
      const openTime = num(row[0]);
      if (open === null || high === null || low === null || close === null || openTime === null) return null;
      return { time: Math.floor(openTime / 1000), open, high, low, close };
    })
    .filter((c): c is OhlcCandle => c !== null);
}

export async function fetchBinanceMarketSnapshot(symbol = "BTCUSDT"): Promise<BinanceMarketSnapshot> {
  const sym = cleanSymbol(symbol);
  const cacheKey = `binance:snapshot:${sym}`;
  const cached = cacheGet<BinanceMarketSnapshot>(cacheKey);
  if (cached) return cached;

  const ts = Date.now();
  const [price, premium, oi, candles] = await Promise.all([
    binanceFuturesPrice(sym).catch(() => null),
    binancePremiumIndex(sym).catch(() => ({
      markPrice: null,
      indexPrice: null,
      fundingRate: null,
      nextFundingTime: null,
    })),
    binanceOpenInterest(sym).catch(() => null),
    fetchKlines(sym).catch(() => [] as OhlcCandle[]),
  ]);

  const realizedVol = candles.length > 20 ? realizedVolFromCandles(candles, 90) : null;
  const momentum = candles.length > 20 ? momentumFromCandles(candles, 24) : null;

  const snap: BinanceMarketSnapshot = {
    symbol: sym,
    price,
    markPrice: premium.markPrice,
    fundingRate: premium.fundingRate,
    nextFundingTime: premium.nextFundingTime,
    openInterest: oi,
    realizedVol,
    momentum,
    ts,
  };
  cacheSet(cacheKey, snap, 25_000);
  return snap;
}

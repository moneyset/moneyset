/**
 * Client-side market tape contract: single shape for REST + WS feeds.
 * Add fields here when expanding Binance surfaces — keep UI reading this store only.
 */
export type MarketConnectionState = "connecting" | "live" | "stale" | "disconnected";

export type NormalizedMarketState = Readonly<{
  symbol: string;
  /** last traded or mark price */
  price: number | null;
  /** unix ms */
  ts: number | null;
  /** Spot 24h ticker: signed percent change (e.g. -1.25 = −1.25%). */
  changePercent24h: number | null;

  markPrice: number | null;
  fundingRate: number | null;
  nextFundingTime: number | null;
  openInterest: number | null;

  /** derived */
  realizedVol: number | null; // 0..100 proxy
  momentum: number | null; // -100..100 proxy

  connection: MarketConnectionState;
  lastWsTs: number | null;
  lastRestTs: number | null;
  error: string | null;
}>;


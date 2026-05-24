/**
 * TradingView — symbol routing only. Live prices come from exchange APIs, not TV.
 */

import { env } from "@/lib/services/shared/env";

export type TradingViewConfig = Readonly<{
  symbol: string;
  exchangeHint: string;
}>;

export function getTradingViewConfig(): TradingViewConfig {
  const symbol = env("TRADINGVIEW_SYMBOL") ?? "BINANCE:BTCUSDT";
  const exchangeHint = symbol.includes(":") ? symbol.split(":")[0]! : "BINANCE";
  return { symbol, exchangeHint };
}

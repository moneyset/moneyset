/**
 * Minimal Binance spot WebSocket — browser `WebSocket` only (no extra deps).
 * Stream: 24h ticker for BTCUSDT.
 * @see https://binance-docs.github.io/apidocs/spot/en/#individual-symbol-ticker-streams
 */

export const BINANCE_BTCUSDT_SPOT_TICKER_WS = "wss://stream.binance.com:9443/ws/btcusdt@ticker";

export type BtcUsdtTickerTick = {
  price: number;
  /** Signed percent change over 24h (e.g. -1.25 means −1.25%). */
  changePercent24h: number;
  /** Event time from the payload (ms). */
  ts: number;
};

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace("%", "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Parse a single `btcusdt@ticker` frame into a tick, or null if unusable. */
export function parseBtcUsdtTickerMessage(raw: string): BtcUsdtTickerTick | null {
  try {
    const msg = JSON.parse(raw) as Record<string, unknown>;
    const price = num(msg.c);
    const changePercent24h = num(msg.P);
    const ts = num(msg.E);
    if (price === null || changePercent24h === null) return null;
    return {
      price,
      changePercent24h,
      ts: ts ?? Date.now(),
    };
  } catch {
    return null;
  }
}

export type BtcUsdtTickerHandlers = {
  onTick: (tick: BtcUsdtTickerTick) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

/** Opens one connection. Call the returned function to close. */
export function connectBtcUsdtSpotTicker(handlers: BtcUsdtTickerHandlers): () => void {
  if (typeof WebSocket === "undefined") {
    return () => {};
  }

  const ws = new WebSocket(BINANCE_BTCUSDT_SPOT_TICKER_WS);

  ws.onopen = () => {
    handlers.onOpen?.();
  };

  ws.onmessage = (ev) => {
    const tick = parseBtcUsdtTickerMessage(String(ev.data));
    if (tick) handlers.onTick(tick);
  };

  ws.onclose = () => {
    handlers.onClose?.();
  };

  return () => {
    try {
      ws.close();
    } catch {
      /* noop */
    }
  };
}

/**
 * Live data integration policy — adapters (Binance WS, REST, CoinGlass, OpenRouter)
 * should push normalized facts into `market-store` + optional future feed stores.
 * The UI consumes only `deriveLiveExecutionIntel` + evolution buffer — never raw streams.
 */

/** Minimum wall time between evolution buffer commits (avoids metric spam under fast ticks). */
export const LIVE_INTEL_BUFFER_COALESCE_MS = 4000;

/** Upper bound on retained execution evolution frames (memory / replay substrate). */
export const LIVE_INTEL_EVOLUTION_CAP = 128;

#!/usr/bin/env node
/**
 * Phase 5 — data source connectivity audit (reads env, probes public endpoints).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const envPath = resolve(root, ".env.local");
const env = {};
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

async function probe(name, fn) {
  try {
    const ok = await fn();
    return ok ? "CONNECTED" : "PARTIALLY CONNECTED";
  } catch {
    return "NOT CONNECTED";
  }
}

const results = {};

results.Binance = await probe("Binance", async () => {
  const r = await fetch("https://fapi.binance.com/fapi/v1/ticker/price?symbol=BTCUSDT");
  const j = await r.json();
  return r.ok && j?.price;
});

results.Bybit = await probe("Bybit", async () => {
  const r = await fetch("https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT");
  const j = await r.json();
  return r.ok && j?.result?.list?.[0]?.lastPrice;
});

results.CoinGecko = await probe("CoinGecko", async () => {
  const headers = env.COINGECKO_API_KEY?.startsWith("CG-")
    ? { "x-cg-demo-api-key": env.COINGECKO_API_KEY }
    : env.COINGECKO_API_KEY
      ? { "x-cg-pro-api-key": env.COINGECKO_API_KEY }
      : {};
  const host = env.COINGECKO_API_KEY?.startsWith("CG-")
    ? "https://api.coingecko.com"
    : "https://api.coingecko.com";
  const r = await fetch(`${host}/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`, { headers });
  const j = await r.json();
  return r.ok && j?.bitcoin?.usd;
});

results.Coinalyze = env.COINALYZE_API_KEY
  ? await probe("Coinalyze", async () => {
      const r = await fetch("https://api.coinalyze.net/v1/funding-rate?symbols=BTCUSDT.6", {
        headers: { api_key: env.COINALYZE_API_KEY },
      });
      return r.ok;
    })
  : "NOT CONNECTED (no COINALYZE_API_KEY)";

results.FRED = env.FRED_API_KEY
  ? await probe("FRED", async () => {
      const r = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${env.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`,
      );
      const j = await r.json();
      return r.ok && j?.observations?.length;
    })
  : "NOT CONNECTED (no FRED_API_KEY)";

results.TradingView = env.TRADINGVIEW_SYMBOL
  ? "PARTIALLY CONNECTED (symbol config only — no TV API)"
  : "NOT CONNECTED";

results.OpenRouter = env.OPENROUTER_API_KEY
  ? "CONNECTED (key present — runtime via /api/openrouter/cognition)"
  : "NOT CONNECTED (no OPENROUTER_API_KEY)";

results.DeepSeek = env.DEEPSEEK_API_KEY
  ? "PARTIALLY CONNECTED (key present — daily brief / inference only)"
  : "NOT CONNECTED (no DEEPSEEK_API_KEY)";

console.log("\nMONEYSET Phase 5 — Data Source Audit\n");
for (const [k, v] of Object.entries(results)) {
  console.log(`${k.padEnd(14)} ${v}`);
}
console.log("\n");

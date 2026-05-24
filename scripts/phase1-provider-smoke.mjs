/** Quick provider connectivity check — run: node scripts/phase1-provider-smoke.mjs */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

async function probe(name, fn) {
  try {
    const detail = await fn();
    return { name, status: "CONNECTED", detail };
  } catch (e) {
    return { name, status: "NOT CONNECTED", detail: e instanceof Error ? e.message : String(e) };
  }
}

loadEnvLocal();

const sym = "BTCUSDT";
const results = [];

results.push(
  await probe("Binance", async () => {
    const r = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${sym}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    return `price ${j.price}`;
  }),
);

results.push(
  await probe("Bybit", async () => {
    const r = await fetch(
      `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${sym}`,
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const px = j?.result?.list?.[0]?.lastPrice;
    if (!px) throw new Error("no ticker");
    return `price ${px}`;
  }),
);

results.push(
  await probe("CoinGecko", async () => {
    const key = process.env.COINGECKO_API_KEY?.trim();
    const isProKey = Boolean(key && !key.startsWith("CG-"));
    const base = isProKey ? "https://pro-api.coingecko.com" : "https://api.coingecko.com";
    const url = `${base}/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`;
    const headers = { Accept: "application/json" };
    if (key) {
      headers[isProKey ? "x-cg-pro-api-key" : "x-cg-demo-api-key"] = key;
    }
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return `btc ${(await r.json()).bitcoin?.usd}`;
  }),
);

results.push(
  await probe("NOWPayments", async () => {
    const key = process.env.NOWPAYMENTS_API_KEY?.trim();
    if (!key) throw new Error("missing key");
    const r = await fetch("https://api.nowpayments.io/v1/status", {
      headers: { "x-api-key": key },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    return `message ${j.message ?? "ok"}`;
  }),
);

results.push(
  await probe("Coinalyze", async () => {
    const key = process.env.COINALYZE_API_KEY;
    if (!key) throw new Error("missing key");
    const r = await fetch("https://api.coinalyze.net/v1/funding-rate?symbols=BTCUSDT.6", {
      headers: { "api-key": key },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return `rows ${((await r.json()) ?? []).length}`;
  }),
);

results.push(
  await probe("FRED", async () => {
    const key = process.env.FRED_API_KEY;
    if (!key) throw new Error("missing key");
    const r = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DTWEXBGS&api_key=${key}&file_type=json&sort_order=desc&limit=1`,
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    return `dxy ${j.observations?.[0]?.value}`;
  }),
);

results.push(
  await probe("TradingView", async () => {
    const symTv = process.env.TRADINGVIEW_SYMBOL ?? "BINANCE:BTCUSDT";
    return `symbol config ${symTv} (no REST API)`;
  }),
);

results.push(
  await probe("OpenRouter", async () => {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("missing key");
    const r = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    return `models ${(j.data ?? []).length}`;
  }),
);

results.push(
  await probe("DeepSeek", async () => {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) throw new Error("missing key");
    const base = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
    const r = await fetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return `ok ${r.status}`;
  }),
);

results.push(
  await probe("Supabase", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("missing public keys");
    const r = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return "auth health ok";
  }),
);

console.log(JSON.stringify(results, null, 2));

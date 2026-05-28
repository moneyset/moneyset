#!/usr/bin/env node
/**
 * Pre-deploy section audit — pages + critical APIs.
 * Usage: node scripts/verify-sections.mjs [baseUrl]
 */
const base = (process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const PAGES = [
  { path: "/", name: "Core", markers: ["MONEYSET", "ms-"] },
  { path: "/index", name: "Market Index", markers: ["Market Index", "ms-market-index", "Regime"] },
  { path: "/execution", name: "Execution", markers: ["ms-", "Execution"] },
  { path: "/scenarios", name: "Scenarios", markers: ["ms-", "Scenario"] },
  { path: "/ops", name: "Ops", markers: ["ms-"] },
  { path: "/agents", name: "Agents", markers: ["ms-", "Agent"] },
  { path: "/macro", name: "Macro", markers: ["ms-"] },
  { path: "/cross-asset", name: "Cross-asset", markers: ["ms-"] },
  { path: "/risk-radar", name: "Risk Radar", markers: ["ms-"] },
  { path: "/sentiment", name: "Sentiment", markers: ["ms-"] },
  { path: "/maps", name: "Maps", markers: ["ms-", "Map"] },
  { path: "/labs", name: "Labs", markers: ["ms-", "Lab"] },
  { path: "/replay", name: "Replay Studio", markers: ["ms-", "Replay"] },
  { path: "/memory", name: "Memory", markers: ["ms-"] },
  { path: "/journal", name: "Journal", markers: ["ms-", "Journal"] },
  { path: "/settings", name: "Settings", markers: ["ms-", "Settings"] },
  { path: "/auth", name: "Auth", markers: ["ms-", "auth"] },
];

const APIS = [
  { path: "/api/health", name: "Health", expect: (s) => s === 200 || s === 503 },
  { path: "/api/access/me", name: "Access me", expect: (s) => s === 200 },
  { path: "/api/billing/history", name: "Billing history", expect: (s) => s === 401 },
  { path: "/api/billing/create", name: "Billing create", expect: (s) => s === 401 || s === 405 },
  { path: "/api/billing/webhook", name: "Billing webhook", method: "POST", body: "{}", expect: (s) => s === 401 || s === 400 },
  { path: "/api/intelligence/market-state", name: "Market state", expect: (s) => s >= 200 && s < 500 },
];

async function fetchStatus(path, opts = {}) {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    cache: "no-store",
    method: opts.method ?? "GET",
    headers: opts.headers,
    body: opts.body,
  });
  const text = await res.text();
  return { status: res.status, text };
}

const results = [];
let failed = 0;

console.log(`\nverify-sections: ${base}\n`);

for (const page of PAGES) {
  try {
    const { status, text } = await fetchStatus(page.path);
    const markerOk = page.markers.some((m) => text.includes(m));
    const ok = status === 200 && markerOk;
    results.push({ kind: "page", ...page, status, ok, markerOk });
    if (!ok) failed++;
    console.log(`${ok ? "✓" : "✗"} [page] ${page.name.padEnd(16)} ${page.path.padEnd(14)} → ${status}${markerOk ? "" : " (marker missing)"}`);
  } catch (e) {
    failed++;
    console.log(`✗ [page] ${page.name.padEnd(16)} ${page.path.padEnd(14)} → ERROR ${e instanceof Error ? e.message : e}`);
  }
}

console.log("");
for (const api of APIS) {
  try {
    const { status } = await fetchStatus(api.path, {
      method: api.method,
      headers: api.body ? { "Content-Type": "application/json" } : undefined,
      body: api.body,
    });
    const ok = api.expect(status);
    results.push({ kind: "api", ...api, status, ok });
    if (!ok) failed++;
    console.log(`${ok ? "✓" : "✗"} [api ] ${api.name.padEnd(16)} ${api.path.padEnd(28)} → ${status}`);
  } catch (e) {
    failed++;
    console.log(`✗ [api ] ${api.name.padEnd(16)} ${api.path.padEnd(28)} → ERROR ${e instanceof Error ? e.message : e}`);
  }
}

const pagesOk = results.filter((r) => r.kind === "page" && r.ok).length;
const apisOk = results.filter((r) => r.kind === "api" && r.ok).length;
console.log(`\nSummary: ${pagesOk}/${PAGES.length} pages, ${apisOk}/${APIS.length} APIs — ${failed} failure(s)\n`);

if (failed > 0) process.exit(1);
console.log("verify-sections: ok\n");

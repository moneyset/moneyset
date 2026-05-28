#!/usr/bin/env node
/**
 * Post-deploy smoke — hits /api/health on the deployed site.
 * Usage: node scripts/verify-deployment.mjs https://your-domain.com
 */
const base = (process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

async function main() {
  const url = `${base}/api/health`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  console.log(`verify-deployment: ${url} → ${res.status}`);
  console.log(JSON.stringify(json, null, 2));
  if (!res.ok || !json.ok) process.exit(1);
  console.log("verify-deployment: ok");
}

main().catch((e) => {
  console.error("verify-deployment failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Verify Supabase schema tables required by MONEYSET application code.
 *
 * Usage:
 *   node scripts/verify-schema.mjs [baseUrl]
 *
 * Uses production /api/health when baseUrl provided, otherwise probes via local env + Supabase admin.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

function loadDotEnvLocal() {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (process.env[key]) continue;
      process.env[key] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // optional
  }
}

/** Tables referenced in src via admin.from("...") */
export const APP_TABLES = [
  { table: "profiles", select: "id", mapsTo: ["subscriptions", "entitlements", "user_access"] },
  { table: "payments", select: "id", mapsTo: [] },
  { table: "invitation_codes", select: "code", mapsTo: [] },
  { table: "invitation_redemptions", select: "id", mapsTo: [] },
];

const base = (process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://moneyset.pro").replace(/\/$/, "");

async function verifyViaHealth() {
  const res = await fetch(`${base}/api/health`, { cache: "no-store" });
  const body = await res.json();
  console.log(`\nverify-schema (health): ${base}/api/health → HTTP ${res.status}\n`);
  console.log(JSON.stringify(body, null, 2));

  const tables = body?.supabase?.tables ?? {};
  let failed = 0;
  for (const { table } of APP_TABLES) {
    const ok = tables[table]?.ok === true;
    console.log(`${ok ? "OK" : "FAIL"}  public.${table}`);
    if (!ok) failed++;
  }

  console.log("\nNote: subscriptions, entitlements, user_access are NOT separate tables.");
  console.log("They are stored/computed via public.profiles + src/lib/access/roles.ts\n");

  process.exit(failed > 0 || !body.ok ? 1 : 0);
}

loadDotEnvLocal();
await verifyViaHealth();

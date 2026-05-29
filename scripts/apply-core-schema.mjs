#!/usr/bin/env node
/**
 * Apply core Supabase schema locally or in CI.
 *
 * Option A — direct Postgres:
 *   DATABASE_URL="postgresql://..." node scripts/apply-core-schema.mjs
 *
 * Option B — Supabase Management API (no DB password):
 *   SUPABASE_ACCESS_TOKEN="sbp_..." NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co" node scripts/apply-core-schema.mjs
 *
 * Option C — Supabase Dashboard → SQL Editor → paste:
 *   supabase/migrations/20260529_production_schema_complete.sql
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

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

function projectRefFromUrl(raw) {
  if (!raw) return null;
  try {
    const host = new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname;
    return host.split(".")[0] || null;
  } catch {
    return null;
  }
}

loadDotEnvLocal();

const sqlPath = join(process.cwd(), "supabase/migrations/20260529_production_schema_complete.sql");
const sql = readFileSync(sqlPath, "utf8");

const dbUrl = process.env.DATABASE_URL?.trim() || process.env.SUPABASE_DB_URL?.trim();
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef =
  process.env.SUPABASE_PROJECT_REF?.trim() ||
  projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  projectRefFromUrl(process.env.SUPABASE_URL);

async function applyViaManagementApi() {
  if (!accessToken || !projectRef) return false;

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.text();
  if (!res.ok) {
    console.error("Management API apply failed:", res.status, body);
    process.exit(1);
  }

  console.log("Applied via Supabase Management API:", sqlPath);
  console.log(body);
  return true;
}

async function applyViaPostgres() {
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(sql);
    console.log("Applied via DATABASE_URL:", sqlPath);
  } catch (e) {
    console.error("Schema apply failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  } finally {
    await client.end().catch(() => undefined);
  }
}

if (dbUrl) {
  await applyViaPostgres();
} else if (await applyViaManagementApi()) {
  // done
} else {
  console.error("Missing DATABASE_URL/SUPABASE_DB_URL or SUPABASE_ACCESS_TOKEN + project ref.");
  console.error("Run supabase/migrations/20260529_production_schema_complete.sql in Supabase SQL Editor instead.");
  process.exit(1);
}

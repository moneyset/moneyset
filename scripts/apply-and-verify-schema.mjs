#!/usr/bin/env node
/**
 * Apply production schema and verify public tables + health endpoint.
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

const REQUIRED_TABLES = ["profiles", "payments", "invitation_codes", "invitation_redemptions"];
const VERIFY_SQL = `
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
`;

loadDotEnvLocal();

const sqlPath = join(process.cwd(), "supabase/migrations/20260529_production_schema_complete.sql");
const migrationSql = readFileSync(sqlPath, "utf8");

const dbUrl = process.env.DATABASE_URL?.trim() || process.env.SUPABASE_DB_URL?.trim();
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef =
  process.env.SUPABASE_PROJECT_REF?.trim() ||
  projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  projectRefFromUrl(process.env.SUPABASE_URL);
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://moneyset.pro").replace(/\/$/, "");

async function queryViaManagementApi(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Management API ${res.status}: ${body}`);
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

async function applyViaManagementApi() {
  if (!accessToken || !projectRef) return false;
  await queryViaManagementApi(migrationSql);
  console.log("Applied via Supabase Management API:", sqlPath);
  return true;
}

async function applyViaPostgres() {
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    await client.query(migrationSql);
    console.log("Applied via DATABASE_URL:", sqlPath);
    return client;
  } catch (e) {
    await client.end().catch(() => undefined);
    throw e;
  }
}

async function verifyTablesPg(client) {
  const { rows } = await client.query(VERIFY_SQL);
  return rows.map((r) => r.table_name);
}

async function verifyTablesManagementApi() {
  const result = await queryViaManagementApi(VERIFY_SQL);
  const rows = Array.isArray(result) ? result : result?.result ?? result?.data ?? [];
  return rows.map((r) => r.table_name ?? r.table_name);
}

async function verifyHealth() {
  const res = await fetch(`${siteUrl}/api/health`, { cache: "no-store" });
  const body = await res.json();
  return { status: res.status, body };
}

let pgClient = null;

try {
  if (dbUrl) {
    pgClient = await applyViaPostgres();
  } else if (!(await applyViaManagementApi())) {
    console.error("Missing DATABASE_URL/SUPABASE_DB_URL or SUPABASE_ACCESS_TOKEN + project ref.");
    process.exit(1);
  }

  const tables = pgClient ? await verifyTablesPg(pgClient) : await verifyTablesManagementApi();
  console.log("\npublic tables:");
  for (const name of tables) console.log(`  - ${name}`);

  let missing = REQUIRED_TABLES.filter((t) => !tables.includes(t));
  if (missing.length) {
    console.error("\nMissing required tables:", missing.join(", "));
    process.exit(1);
  }
  console.log("\nAll required tables present:", REQUIRED_TABLES.join(", "));

  // Allow PostgREST schema cache reload
  await new Promise((r) => setTimeout(r, 2000));

  const health = await verifyHealth();
  console.log(`\n/api/health → HTTP ${health.status}`);
  console.log(JSON.stringify(health.body, null, 2));

  const supabaseOk = health.body?.supabase?.ok === true;
  if (!supabaseOk) {
    console.error("\nHealth check supabase.ok is not true yet.");
    process.exit(1);
  }

  console.log("\nSchema apply + verification OK.");
} catch (e) {
  console.error("Failed:", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  if (pgClient) await pgClient.end().catch(() => undefined);
}

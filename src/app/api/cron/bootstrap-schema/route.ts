import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextResponse } from "next/server";
import pg from "pg";

import { envFirst } from "@/lib/services/shared/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SCHEMA_FILE = "supabase/migrations/20260529_production_schema_complete.sql";

function projectRefFromUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const host = new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname;
    return host.split(".")[0] || null;
  } catch {
    return null;
  }
}

async function applyViaManagementApi(sql: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const projectRef =
    process.env.SUPABASE_PROJECT_REF?.trim() ||
    projectRefFromUrl(envFirst("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL") ?? undefined);

  if (!accessToken || !projectRef) {
    return { ok: false, error: "SUPABASE_ACCESS_TOKEN and project ref required for Management API apply" };
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.text();
  if (!res.ok) return { ok: false, error: `Management API ${res.status}: ${body}` };
  return { ok: true };
}

/**
 * Recovery schema bootstrap for production.
 *
 * Requires Authorization: Bearer <CRON_SECRET>
 * And one of:
 *   - DATABASE_URL / SUPABASE_DB_URL
 *   - SUPABASE_ACCESS_TOKEN (+ project ref from env)
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured on this server." },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token || token !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const sqlPath = join(process.cwd(), SCHEMA_FILE);
  const sql = readFileSync(sqlPath, "utf8");
  const dbUrl = process.env.DATABASE_URL?.trim() || process.env.SUPABASE_DB_URL?.trim();

  if (dbUrl) {
    const client = new pg.Client({
      connectionString: dbUrl,
      ssl: dbUrl.includes("localhost") ? undefined : { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      await client.query(sql);
      return NextResponse.json({ ok: true, applied: SCHEMA_FILE, method: "postgres" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "bootstrap_failed";
      console.error("[cron/bootstrap-schema]", message);
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  const mgmt = await applyViaManagementApi(sql);
  if (mgmt.ok) {
    return NextResponse.json({ ok: true, applied: SCHEMA_FILE, method: "management_api" });
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        mgmt.error +
        ". Or run supabase/migrations/20260529_production_schema_complete.sql in Supabase SQL Editor.",
    },
    { status: 503 },
  );
}

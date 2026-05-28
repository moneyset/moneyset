import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextResponse } from "next/server";
import pg from "pg";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * One-time / recovery schema bootstrap for production.
 *
 * Requires:
 *   - Authorization: Bearer <CRON_SECRET>
 *   - DATABASE_URL or SUPABASE_DB_URL (Supabase → Settings → Database → URI)
 *
 * Applies supabase/migrations/20260528_bootstrap_core_schema.sql (idempotent).
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

  const dbUrl = process.env.DATABASE_URL?.trim() || process.env.SUPABASE_DB_URL?.trim();
  if (!dbUrl) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "DATABASE_URL is not configured. Add Supabase Database URI to Vercel env, or run supabase/migrations/20260528_bootstrap_core_schema.sql in the SQL Editor.",
      },
      { status: 503 },
    );
  }

  const sqlPath = join(process.cwd(), "supabase/migrations/20260528_bootstrap_core_schema.sql");
  const sql = readFileSync(sqlPath, "utf8");

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(sql);
    return NextResponse.json({ ok: true, applied: "20260528_bootstrap_core_schema.sql" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "bootstrap_failed";
    console.error("[cron/bootstrap-schema]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    await client.end().catch(() => undefined);
  }
}

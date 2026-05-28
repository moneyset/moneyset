import { NextResponse } from "next/server";

import { validateProductionEnv } from "@/lib/ops/env-validation";
import { logOpsEvent } from "@/lib/ops/operational-events";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CORE_TABLES = ["profiles", "payments"] as const;

async function probeTable(
  admin: NonNullable<ReturnType<typeof supabaseAdmin>>,
  table: (typeof CORE_TABLES)[number],
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await admin.from(table).select("id").limit(1);
  return { ok: !error, error: error?.message ?? null };
}

export async function GET() {
  const envCheck = validateProductionEnv();
  const isProd = process.env.NODE_ENV === "production";

  const tableChecks: Record<string, { ok: boolean; error: string | null }> = {};
  let supabaseOk = false;
  let supabaseError: string | null = null;
  const admin = supabaseAdmin();
  const adminConfigured = Boolean(admin);

  if (admin) {
    try {
      for (const table of CORE_TABLES) {
        tableChecks[table] = await probeTable(admin, table);
      }
      supabaseOk = CORE_TABLES.every((table) => tableChecks[table]?.ok);
      if (!supabaseOk) {
        const failed = CORE_TABLES.filter((table) => !tableChecks[table]?.ok);
        supabaseError =
          failed
            .map((table) => `${table}: ${tableChecks[table]?.error ?? "unknown"}`)
            .join("; ") || "schema_probe_failed";
      }
    } catch (e) {
      supabaseOk = false;
      supabaseError = e instanceof Error ? e.message : "connection_failed";
    }
  }

  const ok = isProd ? envCheck.ok && supabaseOk : true;

  if (isProd && !ok) {
    logOpsEvent("health_degraded", {
      envOk: envCheck.ok,
      supabaseOk,
      missingCount: envCheck.missing.length,
      profilesOk: tableChecks.profiles?.ok ?? false,
      paymentsOk: tableChecks.payments?.ok ?? false,
    });
  }

  return NextResponse.json(
    {
      ok,
      ts: Date.now(),
      env: isProd
        ? { ok: envCheck.ok, missing: envCheck.missing, invalid: envCheck.invalid }
        : { ok: true, mode: "development" },
      supabase: isProd
        ? { ok: supabaseOk, adminConfigured, error: supabaseError, tables: tableChecks }
        : { ok: true, mode: "development" },
    },
    { status: ok ? 200 : 503 },
  );
}

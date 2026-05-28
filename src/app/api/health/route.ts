import { NextResponse } from "next/server";

import { validateProductionEnv } from "@/lib/ops/env-validation";
import { logOpsEvent } from "@/lib/ops/operational-events";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const envCheck = validateProductionEnv();
  const isProd = process.env.NODE_ENV === "production";

  let supabaseOk = false;
  let supabaseError: string | null = null;
  const admin = supabaseAdmin();
  const adminConfigured = Boolean(admin);
  if (admin) {
    try {
      const { error } = await admin.from("profiles").select("id").limit(1);
      supabaseOk = !error;
      if (error) supabaseError = error.message;
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
        ? { ok: supabaseOk, adminConfigured, error: supabaseError }
        : { ok: true, mode: "development" },
    },
    { status: ok ? 200 : 503 },
  );
}

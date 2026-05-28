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
  const admin = supabaseAdmin();
  if (admin) {
    try {
      const { error } = await admin.from("profiles").select("id").limit(1);
      supabaseOk = !error;
    } catch {
      supabaseOk = false;
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
        ? { ok: envCheck.ok, missing: envCheck.missing }
        : { ok: true, mode: "development" },
      supabase: supabaseOk,
    },
    { status: ok ? 200 : 503 },
  );
}

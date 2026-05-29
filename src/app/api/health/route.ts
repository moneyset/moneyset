import { NextResponse } from "next/server";

import { validateProductionEnv } from "@/lib/ops/env-validation";
import { logOpsEvent } from "@/lib/ops/operational-events";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CORE_TABLES = [
  { table: "profiles", select: "id" },
  { table: "payments", select: "id" },
  { table: "invitation_codes", select: "code" },
  { table: "invitation_redemptions", select: "id" },
] as const;

async function probeTable(
  admin: NonNullable<ReturnType<typeof supabaseAdmin>>,
  spec: (typeof CORE_TABLES)[number],
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await admin.from(spec.table).select(spec.select).limit(1);
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
      for (const spec of CORE_TABLES) {
        tableChecks[spec.table] = await probeTable(admin, spec);
      }
      supabaseOk = CORE_TABLES.every((spec) => tableChecks[spec.table]?.ok);
      if (!supabaseOk) {
        const failed = CORE_TABLES.filter((spec) => !tableChecks[spec.table]?.ok);
        supabaseError =
          failed
            .map((spec) => `${spec.table}: ${tableChecks[spec.table]?.error ?? "unknown"}`)
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
      invitationCodesOk: tableChecks.invitation_codes?.ok ?? false,
      invitationRedemptionsOk: tableChecks.invitation_redemptions?.ok ?? false,
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
        ? {
            ok: supabaseOk,
            adminConfigured,
            error: supabaseError,
            tables: tableChecks,
            entitlementModel: {
              profiles: "access + subscription columns",
              entitlements: "computed in app (roles.ts)",
              subscriptions: "profiles.subscription_status + premium_until",
              user_access: "not a table — profiles.access_level",
            },
          }
        : { ok: true, mode: "development" },
    },
    { status: ok ? 200 : 503 },
  );
}

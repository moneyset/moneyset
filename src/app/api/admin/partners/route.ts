import { NextResponse } from "next/server";

import { resolveRequestUserId } from "@/lib/access/request-user";
import { isAdmin, roleFromProfile } from "@/lib/access/roles";
import {
  DEFAULT_PARTNER_COMMISSION_RATE,
  normalizePartnerCode,
  partnerPublicUrl,
} from "@/lib/partners/partner-codes";
import { loadPartnerDashboard } from "@/lib/partners/partner-attribution";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function requireAdmin(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) {
    return { ok: false as const, res: NextResponse.json({ ok: false, error: "Service unavailable" }, { status: 503 }) };
  }
  const userId = await resolveRequestUserId(req, admin);
  if (!userId) {
    return { ok: false as const, res: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }
  const { data } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!isAdmin(roleFromProfile(data ?? {}))) {
    return { ok: false as const, res: NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 }) };
  }
  return { ok: true as const, admin, userId };
}

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  try {
    const rows = await loadPartnerDashboard(gate.admin);
    const origin = new URL(req.url).origin;
    return NextResponse.json({
      ok: true,
      partners: rows.map((row) => ({
        ...row,
        url: partnerPublicUrl(row.code, origin),
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(e instanceof Error ? e.message : "Load failed") },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  try {
    const body = (await req.json()) as { code?: string; label?: string; commissionRate?: number };
    const code = normalizePartnerCode(body.code ?? "");
    if (!code) {
      return NextResponse.json({ ok: false, error: "Partner code required (3–32 chars, a-z, 0-9, _)" }, { status: 400 });
    }

    const commissionRate =
      typeof body.commissionRate === "number" && body.commissionRate > 0 && body.commissionRate <= 1
        ? body.commissionRate
        : DEFAULT_PARTNER_COMMISSION_RATE;

    const { error } = await gate.admin.from("founding_partners").insert({
      code,
      label: body.label?.trim() || null,
      commission_rate: commissionRate,
      disabled: false,
      created_by: gate.userId,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: sanitizeApiError(error.message) }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    return NextResponse.json({
      ok: true,
      partner: { code, url: partnerPublicUrl(code, origin), commissionRate },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(e instanceof Error ? e.message : "Create failed") },
      { status: 500 },
    );
  }
}

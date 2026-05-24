import { NextResponse } from "next/server";

import { DEFAULT_INVITATION_DAYS, normalizeInviteCode } from "@/lib/access/invitation";
import { resolveRequestUserId } from "@/lib/access/request-user";
import { isAdmin, roleFromProfile } from "@/lib/access/roles";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function requireAdmin(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return { ok: false as const, res: NextResponse.json({ ok: false, error: "Service unavailable" }, { status: 503 }) };
  const userId = await resolveRequestUserId(req, admin);
  if (!userId) return { ok: false as const, res: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  const { data } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  const profile = roleFromProfile(data ?? {});
  if (!isAdmin(profile)) {
    return { ok: false as const, res: NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 }) };
  }
  return { ok: true as const, admin, userId };
}

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  const { data, error } = await gate.admin.from("invitation_codes").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: sanitizeApiError(error.message) }, { status: 502 });
  return NextResponse.json({ ok: true, codes: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  try {
    const body = (await req.json()) as {
      code?: string;
      label?: string;
      durationDays?: number;
      maxUses?: number;
      codeExpiresAt?: string | null;
    };

    const code = normalizeInviteCode(body.code ?? "");
    if (!code) return NextResponse.json({ ok: false, error: "Code required" }, { status: 400 });

    const row = {
      code,
      label: body.label?.trim() || null,
      duration_days: body.durationDays && body.durationDays > 0 ? body.durationDays : DEFAULT_INVITATION_DAYS,
      max_uses: body.maxUses && body.maxUses > 0 ? body.maxUses : 1,
      code_expires_at: body.codeExpiresAt ?? null,
      disabled: false,
      use_count: 0,
      created_by: gate.userId,
    };

    const { error } = await gate.admin.from("invitation_codes").insert(row);
    if (error) return NextResponse.json({ ok: false, error: sanitizeApiError(error.message) }, { status: 400 });

    return NextResponse.json({ ok: true, code: row });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(e instanceof Error ? e.message : "Create failed") },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  try {
    const body = (await req.json()) as { code?: string; disabled?: boolean };
    const code = normalizeInviteCode(body.code ?? "");
    if (!code) return NextResponse.json({ ok: false, error: "Code required" }, { status: 400 });
    if (typeof body.disabled !== "boolean") {
      return NextResponse.json({ ok: false, error: "disabled flag required" }, { status: 400 });
    }

    const { error } = await gate.admin.from("invitation_codes").update({ disabled: body.disabled }).eq("code", code);
    if (error) return NextResponse.json({ ok: false, error: sanitizeApiError(error.message) }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(e instanceof Error ? e.message : "Update failed") },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

import { redeemInvitationCode, normalizeInviteCode, expireInvitationIfNeeded } from "@/lib/access/invitation";
import { roleFromProfile, guestProfile } from "@/lib/access/roles";
import { resolveRequestUserId } from "@/lib/access/request-user";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const admin = supabaseAdmin();
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Service unavailable" }, { status: 503 });
    }

    const userId = await resolveRequestUserId(req, admin);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in required to activate invitation" }, { status: 401 });
    }

    await expireInvitationIfNeeded(admin, userId);

    const body = (await req.json()) as { code?: string };
    const code = body?.code?.trim();
    if (!code) return NextResponse.json({ ok: false, error: "Missing invitation code" }, { status: 400 });

    const result = await redeemInvitationCode(admin, userId, code);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: sanitizeApiError(result.error) }, { status: 400 });
    }

    const { data: profileRow } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
    const profile = profileRow ? roleFromProfile(profileRow) : guestProfile();

    return NextResponse.json({
      ok: true,
      code: normalizeInviteCode(code),
      invitationUntil: result.invitationUntil,
      profile,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(e instanceof Error ? e.message : "Redeem failed") },
      { status: 500 },
    );
  }
}

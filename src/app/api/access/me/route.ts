import { NextResponse } from "next/server";

import { capabilitiesFor } from "@/lib/access/capabilities";
import { expireInvitationIfNeeded } from "@/lib/access/invitation";
import { entitlementsFor, guestProfile, roleFromProfile } from "@/lib/access/roles";
import { resolveRequestUserId } from "@/lib/access/request-user";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = supabaseAdmin();
  const userId = await resolveRequestUserId(req, admin);
  if (!userId) {
    const profile = guestProfile();
    return NextResponse.json({ ok: true, profile, entitlements: entitlementsFor(profile) });
  }

  if (!admin) {
    const profile = guestProfile();
    return NextResponse.json({ ok: true, profile, entitlements: entitlementsFor(profile) });
  }

  await expireInvitationIfNeeded(admin, userId);

  const { data, error } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(error.message) },
      { status: 502 },
    );
  }

  const profile = roleFromProfile(data ?? {});
  return NextResponse.json({
    ok: true,
    profile,
    entitlements: entitlementsFor(profile),
    capabilities: capabilitiesFor(profile),
  });
}

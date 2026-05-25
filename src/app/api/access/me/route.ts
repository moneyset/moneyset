import { NextResponse } from "next/server";

import { capabilitiesFor } from "@/lib/access/capabilities";
import { expireInvitationIfNeeded } from "@/lib/access/invitation";
import { expirePremiumIfNeeded } from "@/lib/access/premium-expiry";
import { entitlementsFor, guestProfile, roleFromProfile } from "@/lib/access/roles";
import { resolveRequestUserId } from "@/lib/access/request-user";
import { isFounderTelegramId } from "@/lib/access/founder";
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
  await expirePremiumIfNeeded(admin, userId);

  const { data, error } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(error.message) },
      { status: 502 },
    );
  }

  const rawProfile = data ?? {};

  // Founder accounts always receive full founding access, regardless of DB state.
  // If the DB row is stale, we patch it in the background.
  const telegramUserId = (rawProfile as Record<string, unknown>).telegram_user_id;
  const telegramUserIdStr = typeof telegramUserId === "string" || typeof telegramUserId === "number" ? telegramUserId : null;
  if (isFounderTelegramId(telegramUserIdStr)) {
    // Ensure DB row reflects founding access (fire-and-forget, no await)
    void admin.from("profiles").update({
      access_level: "founding",
      founding_access: true,
      premium_until: null,
    }).eq("id", userId);

    const founderProfile = roleFromProfile({
      ...rawProfile,
      access_level: "founding",
      founding_access: true,
      premium_until: null,
    });
    return NextResponse.json({
      ok: true,
      profile: founderProfile,
      entitlements: entitlementsFor(founderProfile),
      capabilities: capabilitiesFor(founderProfile),
    });
  }

  const profile = roleFromProfile(rawProfile);
  return NextResponse.json({
    ok: true,
    profile,
    entitlements: entitlementsFor(profile),
    capabilities: capabilitiesFor(profile),
  });
}

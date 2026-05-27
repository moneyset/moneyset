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

/**
 * Read-only profile + entitlement endpoint.
 *
 * This endpoint must NOT write to the database.
 * - Expiry helpers (invitation, premium) run as background tasks and are
 *   accepted as a necessary side-effect on a read endpoint; they don't affect
 *   the response and are called from nowhere else.
 * - Founder access: the DB row is set authoritative at Telegram login time
 *   (src/app/api/auth/telegram/route.ts). This route reads the DB row and
 *   applies the founding override in-memory only — it does NOT write to DB.
 *   If the DB row is stale, the user should re-login to refresh it.
 */
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

  // TTL checks — run in background, do not await
  void expireInvitationIfNeeded(admin, userId);
  void expirePremiumIfNeeded(admin, userId);

  const { data, error } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(error.message) },
      { status: 502 },
    );
  }

  const rawProfile = data ?? {};

  // Founder override: applied in-memory only, no DB write from this path.
  // DB is kept authoritative by the Telegram login route on each sign-in.
  const telegramUserId = (rawProfile as Record<string, unknown>).telegram_user_id;
  const telegramUserIdStr =
    typeof telegramUserId === "string" || typeof telegramUserId === "number"
      ? telegramUserId
      : null;

  if (isFounderTelegramId(telegramUserIdStr)) {
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

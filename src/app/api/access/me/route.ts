import { NextResponse } from "next/server";

import { capabilitiesFor } from "@/lib/access/capabilities";
import { entitlementsFor, guestProfile, roleFromProfile } from "@/lib/access/roles";
import { resolveRequestUserId } from "@/lib/access/request-user";
import { isFounderTelegramId } from "@/lib/access/founder";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Pure read endpoint — profile + entitlements.
 *
 * MUST NOT write to the database.
 *
 * Access decisions (expiry, founder override) are computed in-memory from the
 * DB row values — no compensating DB writes happen here.
 *
 * Expiry cleanup (downgrading stale access_level / role columns) is the sole
 * responsibility of the scheduled cron job at /api/cron/expire-access.
 *
 * Why in-memory expiry is safe:
 *   - hasExtendedAccess() checks profile.premiumUntil date before granting access
 *   - isInvitationActive() checks profile.invitationUntil date before granting access
 *   - A stale access_level column in the DB cannot grant access through either gate
 *   - The cron job cleans up stale columns asynchronously
 *
 * Founder override:
 *   - Applied in-memory only. The DB row is set correctly at Telegram login time
 *     (api/auth/telegram/route.ts). If the DB row is stale, re-login refreshes it.
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

  const { data, error } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(error.message) },
      { status: 502 },
    );
  }

  const rawProfile = data ?? {};

  // Founder override: in-memory only, no DB write from this path.
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

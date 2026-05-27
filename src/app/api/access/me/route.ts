import { NextResponse } from "next/server";

import { capabilitiesFor } from "@/lib/access/capabilities";
import { entitlementsFor, guestProfile, roleFromProfile } from "@/lib/access/roles";
import { resolveRequestUserId } from "@/lib/access/request-user";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Pure read endpoint — returns profile, entitlements, and capabilities.
 *
 * Invariants:
 *   - NO database writes of any kind.
 *   - NO in-memory entitlement overrides based on Telegram ID.
 *   - NO founder grants, NO access upgrades, NO expiry mutations.
 *
 * Single source of truth: the profiles DB row.
 *   - Founding access is present in the row (founding_access = true /
 *     access_level = "founding") because api/auth/telegram writes it
 *     at every login. If the row is missing or stale, the user re-logins.
 *   - hasFounderAccess(profile) is the only founder check; it reads the
 *     pre-computed profile.foundingAccess field — no ID lookups.
 *   - Premium expiry is checked in-memory by hasExtendedAccess() via
 *     the premiumUntil date; the cron job cleans up stale columns.
 */
export async function GET(req: Request) {
  const admin = supabaseAdmin();
  const userId = await resolveRequestUserId(req, admin);

  if (!userId || !admin) {
    const profile = guestProfile();
    return NextResponse.json({ ok: true, profile, entitlements: entitlementsFor(profile) });
  }

  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(error.message) },
      { status: 502 },
    );
  }

  // roleFromProfile reads founding_access and access_level from the DB row.
  // hasFounderAccess(profile) in downstream capability checks reads profile.foundingAccess.
  // No overrides, no bypasses, no hidden grants.
  const profile = roleFromProfile(data ?? {});

  return NextResponse.json({
    ok: true,
    profile,
    entitlements: entitlementsFor(profile),
    capabilities: capabilitiesFor(profile),
  });
}

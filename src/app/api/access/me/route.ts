import { NextResponse } from "next/server";

import { capabilitiesFor } from "@/lib/access/capabilities";
import { entitlementsFor, guestProfile, roleFromProfile } from "@/lib/access/roles";
import { resolveRequestUserId } from "@/lib/access/request-user";
import { sanitizeApiError } from "@/lib/services/shared/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureProfileRow } from "@/lib/supabase/ensure-profile";

export const dynamic = "force-dynamic";

/**
 * Pure read endpoint — returns profile, entitlements, and capabilities.
 *
 * Invariants:
 *   - Only writes a missing profile row (repair path when trigger did not run).
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

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  let email: string | null = null;
  if (token) {
    const { data: authData } = await admin.auth.getUser(token);
    email = authData.user?.email ?? null;
  }

  const ensured = await ensureProfileRow(admin, userId, email);
  if (!ensured.ok) {
    return NextResponse.json(
      { ok: false, error: sanitizeApiError(ensured.error ?? "profile_sync_failed") },
      { status: 502 },
    );
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

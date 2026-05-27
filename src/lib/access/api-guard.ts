import { hasFullPlatformAccess } from "@/lib/access/capabilities";
import { guestProfile, roleFromProfile, type ProfileAccess } from "@/lib/access/roles";
import { resolveRequestUserId } from "@/lib/access/request-user";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Load the server-side profile for API route guards.
 *
 * Pure read — does NOT write to the database.
 *
 * Access expiry (premium_until, invitation_until) is evaluated in-memory by
 * hasExtendedAccess() and isInvitationActive() inside the returned profile's
 * downstream capability/entitlement checks. Stale DB columns are cleaned up
 * asynchronously by the scheduled /api/cron/expire-access job.
 */
export async function loadRequestProfile(req: Request): Promise<ProfileAccess> {
  const admin = supabaseAdmin();
  const userId = await resolveRequestUserId(req, admin);
  if (!userId || !admin) return guestProfile();

  const { data } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  return roleFromProfile(data ?? {});
}

export function profileHasFullAccess(profile: ProfileAccess): boolean {
  return hasFullPlatformAccess(profile);
}

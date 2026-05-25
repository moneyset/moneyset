import { hasFullPlatformAccess } from "@/lib/access/capabilities";
import { expireInvitationIfNeeded } from "@/lib/access/invitation";
import { expirePremiumIfNeeded } from "@/lib/access/premium-expiry";
import { guestProfile, roleFromProfile, type ProfileAccess } from "@/lib/access/roles";
import { resolveRequestUserId } from "@/lib/access/request-user";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Load server-side profile for API routes (expires invitation/premium windows first). */
export async function loadRequestProfile(req: Request): Promise<ProfileAccess> {
  const admin = supabaseAdmin();
  const userId = await resolveRequestUserId(req, admin);
  if (!userId || !admin) return guestProfile();

  await expireInvitationIfNeeded(admin, userId);
  await expirePremiumIfNeeded(admin, userId);

  const { data } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  return roleFromProfile(data ?? {});
}

export function profileHasFullAccess(profile: ProfileAccess): boolean {
  return hasFullPlatformAccess(profile);
}

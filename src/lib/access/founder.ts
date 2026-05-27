/**
 * Founder access — single source of truth.
 *
 * All founder-access checks anywhere in the codebase must go through
 * hasFounderAccess(profile). Direct field access (profile.foundingAccess,
 * profile.accessLevel === "founding") is forbidden outside this file.
 *
 * Architecture:
 *   DB is authoritative. The Telegram login route (api/auth/telegram) writes
 *   founding_access: true at sign-in time. roleFromProfile() in roles.ts reads
 *   that column and sets profile.foundingAccess correctly.
 *
 *   hasFounderAccess(profile) reads only the pre-computed profile fields —
 *   it is pure, deterministic, and never touches the DB.
 *
 *   isFounderTelegramId(tgId) is used ONLY in api/auth/telegram (write path)
 *   to provision the DB row on login. It must NOT be used in read paths.
 */

import type { ProfileAccess } from "@/lib/access/roles";

/**
 * Permanent founder Telegram user IDs.
 * These accounts receive lifetime founding access provisioned at login time.
 * Adding an ID here does not grant access by itself — the auth route writes
 * it to the DB, which becomes the authoritative record.
 */
const FOUNDER_TELEGRAM_IDS: ReadonlySet<string> = new Set(["7538344648"]);

/**
 * Returns true if the given Telegram user ID belongs to a permanent founder.
 * Used ONLY in api/auth/telegram (write path) — NOT in read paths.
 */
export function isFounderTelegramId(tgId: string | number | null | undefined): boolean {
  if (tgId == null) return false;
  return FOUNDER_TELEGRAM_IDS.has(String(tgId));
}

/**
 * Single source of truth for founder access on a resolved ProfileAccess.
 *
 * Returns true if the profile has founding-level access.
 * Does not read Telegram IDs, does not query the DB, does not mutate anything.
 *
 * profile.foundingAccess is computed by roleFromProfile() from:
 *   - DB column founding_access = true
 *   - OR DB column access_level = "founding"
 * Either condition is sufficient.
 */
export function hasFounderAccess(profile: ProfileAccess): boolean {
  // profile.foundingAccess already consolidates both founding_access=true
  // and access_level="founding" via roleFromProfile(). The second clause
  // is belt-and-suspenders for any code path that bypasses roleFromProfile.
  return profile.foundingAccess || profile.accessLevel === "founding";
}

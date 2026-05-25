import { hasFullPlatformAccess } from "@/lib/access/capabilities";

export type UserRole = "admin" | "beta" | "premium" | "guest";

export type AccessTier = "free" | "premium";

export type AccessLevel = "free" | "premium" | "founding" | "admin" | "invitation";

export type SubscriptionStatus =
  | "inactive"
  | "trial"
  | "active"
  | "founding"
  | "past_due"
  | "expired"
  | "canceled";

export type ProfileAccess = Readonly<{
  role: UserRole;
  accessTier: AccessTier;
  accessLevel: AccessLevel;
  subscriptionStatus: SubscriptionStatus;
  foundingAccess: boolean;
  premiumUntil: string | null;
  invitationUntil: string | null;
}>;

const defaultProfile: ProfileAccess = {
  role: "guest",
  accessTier: "free",
  accessLevel: "free",
  subscriptionStatus: "inactive",
  foundingAccess: false,
  premiumUntil: null,
  invitationUntil: null,
};

export function roleFromProfile(row: {
  role?: string | null;
  access_tier?: string | null;
  access_level?: string | null;
  subscription_status?: string | null;
  founding_access?: boolean | null;
  premium_until?: string | null;
  invitation_until?: string | null;
}): ProfileAccess {
  const role =
    row.role === "admin" || row.role === "beta" || row.role === "premium" || row.role === "guest"
      ? row.role
      : "guest";

  const accessLevel: AccessLevel =
    row.access_level === "admin" ||
    row.access_level === "founding" ||
    row.access_level === "premium" ||
    row.access_level === "invitation" ||
    row.access_level === "free"
      ? row.access_level
      : row.role === "admin"
        ? "admin"
        : row.founding_access
          ? "founding"
          : row.access_tier === "premium"
            ? "premium"
            : "free";

  const accessTier: AccessTier =
    accessLevel === "premium" || accessLevel === "founding" || accessLevel === "admin" || row.access_tier === "premium"
      ? "premium"
      : "free";

  const subscriptionStatus: SubscriptionStatus =
    row.subscription_status === "inactive" ||
    row.subscription_status === "trial" ||
    row.subscription_status === "active" ||
    row.subscription_status === "founding" ||
    row.subscription_status === "past_due" ||
    row.subscription_status === "expired" ||
    row.subscription_status === "canceled"
      ? row.subscription_status
      : row.founding_access
        ? "founding"
        : "inactive";

  return {
    role,
    accessTier,
    accessLevel,
    subscriptionStatus,
    foundingAccess: Boolean(row.founding_access) || accessLevel === "founding",
    premiumUntil: row.premium_until ?? null,
    invitationUntil: row.invitation_until ?? null,
  };
}

export function guestProfile(): ProfileAccess {
  return defaultProfile;
}

export function hasExtendedAccess(profile: ProfileAccess): boolean {
  if (profile.role === "admin" || profile.accessLevel === "admin") return true;
  if (profile.role === "beta") return true;
  if (profile.foundingAccess || profile.accessLevel === "founding") return true;
  if (profile.subscriptionStatus === "founding") return true;

  if (profile.subscriptionStatus === "expired" || profile.subscriptionStatus === "canceled") return false;
  if (profile.subscriptionStatus === "past_due") return false;

  const premiumLike =
    profile.role === "premium" ||
    profile.accessLevel === "premium" ||
    profile.accessTier === "premium" ||
    profile.subscriptionStatus === "active";

  if (!premiumLike) return false;
  if (!profile.premiumUntil) return true;
  return new Date(profile.premiumUntil).getTime() > Date.now();
}

export function isAdmin(profile: ProfileAccess): boolean {
  return profile.role === "admin" || profile.accessLevel === "admin";
}

export type EntitlementKey =
  | "dashboard"
  | "partialInterpretation"
  | "executionMap"
  | "tacticalFramework"
  | "scenarioEngineFull"
  | "riskLayer";

export function entitlementsFor(profile: ProfileAccess): Readonly<Record<EntitlementKey, boolean>> {
  const full = hasFullPlatformAccess(profile);
  return {
    dashboard: true,
    partialInterpretation: true,
    executionMap: full,
    tacticalFramework: full,
    scenarioEngineFull: full || profile.role === "beta",
    riskLayer: full,
  };
}

export function canAccessEntitlement(profile: ProfileAccess, key: EntitlementKey): boolean {
  return entitlementsFor(profile)[key];
}

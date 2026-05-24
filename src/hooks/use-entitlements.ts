"use client";

import { canAccessEntitlement, entitlementsFor, type EntitlementKey } from "@/lib/access/roles";
import { useFullPlatformAccess } from "@/hooks/use-capabilities";
import { useAccessStore } from "@/store/access-store";

export function useEntitlements() {
  const profile = useAccessStore((s) => s.profile);
  return entitlementsFor(profile);
}

export function useCanAccess(feature: EntitlementKey): boolean {
  const profile = useAccessStore((s) => s.profile);
  const full = useFullPlatformAccess();
  if (full && feature !== "dashboard") return true;
  return canAccessEntitlement(profile, feature);
}

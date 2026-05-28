"use client";

import {
  canAccessCapability,
  capabilitiesFor,
  hasFullPlatformAccess,
  type AccessCapability,
} from "@/lib/access/capabilities";
import { hasExtendedAccess } from "@/lib/access/roles";
import { useAccessStore } from "@/store/access-store";

export function useServerConfirmed(): boolean {
  return useAccessStore((s) => s.serverConfirmed);
}

/** Cached paid profile while server sync is in flight — prevents premium vanish on reload. */
export function useOptimisticEntitlement(): boolean {
  const confirmed = useAccessStore((s) => s.serverConfirmed);
  const syncStatus = useAccessStore((s) => s.syncStatus);
  const profile = useAccessStore((s) => s.profile);
  if (confirmed) return false;
  return syncStatus === "loading" && hasExtendedAccess(profile);
}

export function useCapabilities() {
  const profile = useAccessStore((s) => s.profile);
  return capabilitiesFor(profile);
}

function clientTrialActive(trialEndsAtTs: number | null): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return trialEndsAtTs != null && trialEndsAtTs > Date.now();
}

export function useFullPlatformAccess(): boolean {
  const profile = useAccessStore((s) => s.profile);
  const trial = useAccessStore((s) => s.trialEndsAtTs);
  const confirmed = useAccessStore((s) => s.serverConfirmed);
  const syncStatus = useAccessStore((s) => s.syncStatus);
  const optimistic = !confirmed && syncStatus === "loading" && hasExtendedAccess(profile);

  if (!confirmed && !optimistic) return false;
  if (hasFullPlatformAccess(profile)) return true;
  return clientTrialActive(trial);
}

export function useCanAccessCapability(capability: AccessCapability): boolean {
  const profile = useAccessStore((s) => s.profile);
  const trial = useAccessStore((s) => s.trialEndsAtTs);
  const confirmed = useAccessStore((s) => s.serverConfirmed);
  const syncStatus = useAccessStore((s) => s.syncStatus);
  const optimistic = !confirmed && syncStatus === "loading" && hasExtendedAccess(profile);

  if (!confirmed && !optimistic) return false;
  if (clientTrialActive(trial)) return true;
  return canAccessCapability(profile, capability);
}

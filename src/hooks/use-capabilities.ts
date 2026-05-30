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
  return (syncStatus === "loading" || syncStatus === "error") && hasExtendedAccess(profile);
}

export function useCapabilities() {
  const profile = useAccessStore((s) => s.profile);
  return capabilitiesFor(profile);
}

function clientTrialActive(trialEndsAtTs: number | null): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return trialEndsAtTs != null && trialEndsAtTs > Date.now();
}

function canEvaluateAccess(
  confirmed: boolean,
  syncStatus: "idle" | "loading" | "confirmed" | "error",
  profile: ReturnType<typeof useAccessStore.getState>["profile"],
): boolean {
  if (confirmed) return true;
  // Optimistic unlock only while server sync is in flight — never trust idle + cached profile alone.
  if ((syncStatus === "loading" || syncStatus === "error") && hasExtendedAccess(profile)) return true;
  return false;
}

export function useFullPlatformAccess(): boolean {
  const profile = useAccessStore((s) => s.profile);
  const trial = useAccessStore((s) => s.trialEndsAtTs);
  const confirmed = useAccessStore((s) => s.serverConfirmed);
  const syncStatus = useAccessStore((s) => s.syncStatus);

  if (!canEvaluateAccess(confirmed, syncStatus, profile)) return false;
  if (hasFullPlatformAccess(profile)) return true;
  return clientTrialActive(trial);
}

export function useCanAccessCapability(capability: AccessCapability): boolean {
  const profile = useAccessStore((s) => s.profile);
  const trial = useAccessStore((s) => s.trialEndsAtTs);
  const confirmed = useAccessStore((s) => s.serverConfirmed);
  const syncStatus = useAccessStore((s) => s.syncStatus);

  if (!canEvaluateAccess(confirmed, syncStatus, profile)) return false;
  if (clientTrialActive(trial)) return true;
  return canAccessCapability(profile, capability);
}

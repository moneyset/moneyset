"use client";

import {
  canAccessCapability,
  capabilitiesFor,
  hasFullPlatformAccess,
  type AccessCapability,
} from "@/lib/access/capabilities";
import { useAccessStore } from "@/store/access-store";

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
  if (hasFullPlatformAccess(profile)) return true;
  return clientTrialActive(trial);
}

export function useCanAccessCapability(capability: AccessCapability): boolean {
  const profile = useAccessStore((s) => s.profile);
  const trial = useAccessStore((s) => s.trialEndsAtTs);
  if (clientTrialActive(trial)) return true;
  return canAccessCapability(profile, capability);
}

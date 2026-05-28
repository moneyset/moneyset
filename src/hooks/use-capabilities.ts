"use client";

import {
  canAccessCapability,
  capabilitiesFor,
  hasFullPlatformAccess,
  type AccessCapability,
} from "@/lib/access/capabilities";
import { useAccessStore } from "@/store/access-store";

/**
 * True once the server has responded to /api/access/me this session.
 * Gates must not open until this is true — prevents localStorage-edited
 * profiles from bypassing access checks before the server corrects them.
 */
export function useServerConfirmed(): boolean {
  return useAccessStore((s) => s.serverConfirmed);
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
  // Block all premium access until the server has confirmed this session's profile.
  // This ensures no localStorage-edited profile can open premium gates.
  if (!confirmed) return false;
  if (hasFullPlatformAccess(profile)) return true;
  return clientTrialActive(trial);
}

export function useCanAccessCapability(capability: AccessCapability): boolean {
  const profile = useAccessStore((s) => s.profile);
  const trial = useAccessStore((s) => s.trialEndsAtTs);
  const confirmed = useAccessStore((s) => s.serverConfirmed);
  if (!confirmed) return false;
  if (clientTrialActive(trial)) return true;
  return canAccessCapability(profile, capability);
}

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

export function useFullPlatformAccess(): boolean {
  const profile = useAccessStore((s) => s.profile);
  const trial = useAccessStore((s) => s.trialEndsAtTs);
  if (hasFullPlatformAccess(profile)) return true;
  return trial != null && trial > Date.now();
}

export function useCanAccessCapability(capability: AccessCapability): boolean {
  const profile = useAccessStore((s) => s.profile);
  const trial = useAccessStore((s) => s.trialEndsAtTs);
  if (trial != null && trial > Date.now()) return true;
  return canAccessCapability(profile, capability);
}

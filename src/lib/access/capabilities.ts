/**
 * Access capabilities — FREE vs full platform (Founding · Invitation · Admin).
 * Institutional decision-support framing; not a retail feature matrix.
 */

import type { ProfileAccess } from "@/lib/access/roles";
import { hasExtendedAccess, isAdmin } from "@/lib/access/roles";
import { hasFounderAccess } from "@/lib/access/founder";

export type AccessCapability =
  | "marketPostureCore"
  | "marketPostureZones"
  | "marketPostureHistory"
  | "invalidationLogic"
  | "coreSummary"
  | "scenarioSummary"
  | "agentConsensusPartial"
  | "agentConsensusFull"
  | "executionMap"
  | "executionLayer"
  | "scenarioEvolution"
  | "marketMemory"
  | "replayStudio"
  | "deepInterpretation"
  | "riskFraming";

export function isInvitationActive(profile: ProfileAccess): boolean {
  if (profile.accessLevel !== "invitation") return false;
  if (!profile.invitationUntil) return false;
  return new Date(profile.invitationUntil).getTime() > Date.now();
}

export function isInvitationExpired(profile: ProfileAccess): boolean {
  if (profile.accessLevel !== "invitation") return false;
  if (!profile.invitationUntil) return false;
  return new Date(profile.invitationUntil).getTime() <= Date.now();
}

/** Founding, premium, admin, beta, or active invitation window. */
export function hasFullPlatformAccess(profile: ProfileAccess): boolean {
  if (hasExtendedAccess(profile)) return true;
  return isInvitationActive(profile);
}

export function accessTierLabel(profile: ProfileAccess): "free" | "founding" | "invitation" | "admin" {
  if (isAdmin(profile)) return "admin";
  if (isInvitationActive(profile)) return "invitation";
  if (hasFounderAccess(profile)) return "founding";
  if (hasExtendedAccess(profile)) return "founding";
  return "free";
}

export function capabilitiesFor(profile: ProfileAccess): Readonly<Record<AccessCapability, boolean>> {
  const full = hasFullPlatformAccess(profile);

  return {
    marketPostureCore: true,
    riskFraming: true,
    coreSummary: true,
    scenarioSummary: true,
    agentConsensusPartial: true,

    marketPostureZones: full,
    marketPostureHistory: full,
    invalidationLogic: full,
    executionMap: full,
    executionLayer: full,
    scenarioEvolution: full,
    agentConsensusFull: full,
    marketMemory: full,
    replayStudio: full,
    deepInterpretation: full,
  };
}

export function canAccessCapability(profile: ProfileAccess, capability: AccessCapability): boolean {
  return capabilitiesFor(profile)[capability];
}

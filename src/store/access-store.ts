"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  hasExtendedAccess,
  type ProfileAccess,
  type UserRole,
} from "@/lib/access/roles";

export type AccessTier = "free" | "premium";

const defaultProfile: ProfileAccess = {
  role: "guest",
  accessTier: "free",
  accessLevel: "free",
  subscriptionStatus: "inactive",
  foundingAccess: false,
  premiumUntil: null,
  invitationUntil: null,
};

type AccessState = {
  tier: AccessTier;
  profile: ProfileAccess;
  trialEndsAtTs: number | null;
  trialStarted: boolean;
  setTier: (tier: AccessTier) => void;
  setProfile: (profile: ProfileAccess) => void;
  beginCognitionTrial: () => void;
  isPremium: () => boolean;
  hasExtendedCognition: () => boolean;
};

export const useAccessStore = create<AccessState>()(
  persist(
    (set, get) => ({
      tier: "free",
      profile: defaultProfile,
      trialEndsAtTs: null,
      trialStarted: false,
      setTier: (tier) =>
        set((s) => ({
          tier,
          profile: { ...s.profile, accessTier: tier },
        })),
      setProfile: (profile) =>
        set({
          profile,
          tier: profile.accessTier === "premium" ? "premium" : "free",
        }),
      beginCognitionTrial: () =>
        set((s) => {
          if (s.tier === "premium" || s.profile.foundingAccess || s.trialStarted) return s;
          return {
            trialStarted: true,
            trialEndsAtTs: Date.now() + 72 * 60 * 60 * 1000,
          };
        }),
      isPremium: () => get().tier === "premium" || hasExtendedAccess(get().profile),
      hasExtendedCognition: () => {
        const s = get();
        if (hasExtendedAccess(s.profile)) return true;
        if (s.tier === "premium") return true;
        return s.trialEndsAtTs != null && s.trialEndsAtTs > Date.now();
      },
    }),
    {
      name: "moneyset_access_v2",
      partialize: (s) => ({
        tier: s.tier,
        profile: s.profile,
        trialEndsAtTs: s.trialEndsAtTs,
        trialStarted: s.trialStarted,
      }),
      skipHydration: true,
    },
  ),
);

export type { UserRole };


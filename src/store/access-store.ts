"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  guestProfile,
  hasExtendedAccess,
  type ProfileAccess,
  type UserRole,
} from "@/lib/access/roles";

export type AccessTier = "free" | "premium";

type AccessState = {
  profile: ProfileAccess;
  trialEndsAtTs: number | null;
  trialStarted: boolean;
  /**
   * Set to true only after a server response has been written via setProfile().
   * All premium gate hooks return false while this is false, regardless of whatever
   * the localStorage cache contains. Not persisted — always starts false on each
   * page load, so manually-edited localStorage entries cannot bypass access gates.
   */
  serverConfirmed: boolean;
  setProfile: (profile: ProfileAccess) => void;
  beginCognitionTrial: () => void;
  isPremium: () => boolean;
  hasExtendedCognition: () => boolean;
};

export const useAccessStore = create<AccessState>()(
  persist(
    (set, get) => ({
      profile: guestProfile(),
      trialEndsAtTs: null,
      trialStarted: false,
      serverConfirmed: false,

      setProfile: (profile) =>
        set({
          profile,
          // Every call to setProfile() comes from a server response (/api/access/me
          // or /api/auth/telegram). Marking confirmed here is the ONLY way to unlock
          // the premium gates — localStorage edits can never set this flag.
          serverConfirmed: true,
        }),

      beginCognitionTrial: () =>
        set((s) => {
          if (process.env.NODE_ENV === "production") return s;
          if (hasExtendedAccess(s.profile) || s.trialStarted) return s;
          return {
            trialStarted: true,
            trialEndsAtTs: Date.now() + 72 * 60 * 60 * 1000,
          };
        }),

      // Derives solely from server-validated profile — no redundant tier field.
      isPremium: () => hasExtendedAccess(get().profile),

      hasExtendedCognition: () => {
        const s = get();
        if (hasExtendedAccess(s.profile)) return true;
        if (process.env.NODE_ENV === "production") return false;
        return s.trialEndsAtTs != null && s.trialEndsAtTs > Date.now();
      },
    }),
    {
      name: "moneyset_access_v2",
      partialize: (s) => ({
        // profile is server data; caching it prevents a visible "free flash" for
        // legitimate paying users on reload. It does NOT grant access — gates also
        // require serverConfirmed, which resets to false on every page load and is
        // never persisted. A localStorage edit to profile is therefore harmless.
        profile: s.profile,
        // trialEndsAtTs / trialStarted intentionally excluded: dev-only, session-scoped.
        // serverConfirmed intentionally excluded: must re-confirm from server each load.
      }),
      skipHydration: true,
    },
  ),
);

export type { UserRole };

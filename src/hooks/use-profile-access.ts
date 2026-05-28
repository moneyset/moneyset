"use client";

import { useCallback, useEffect } from "react";

import type { ProfileAccess } from "@/lib/access/roles";
import { guestProfile } from "@/lib/access/roles";
import { authHeadersForUser } from "@/lib/access/request-user";
import { useAccessStore } from "@/store/access-store";
import { useAuthStore } from "@/store/auth-store";

const MAX_ATTEMPTS = 3;
const RETRY_MS = [0, 2_000, 6_000];

/**
 * Sync Supabase profile → local access store with retry.
 * Runs for ALL sessions (guest + authenticated) — server is the only authority.
 */
export function useProfileAccess() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const setProfile = useAccessStore((s) => s.setProfile);
  const setSyncLoading = useAccessStore((s) => s.setSyncLoading);
  const setSyncError = useAccessStore((s) => s.setSyncError);

  const load = useCallback(async () => {
    setSyncLoading();

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      if (RETRY_MS[i]) {
        await new Promise((r) => setTimeout(r, RETRY_MS[i]));
      }

      try {
        const headers: HeadersInit = user?.id
          ? { ...authHeadersForUser(user.id, session?.access_token ?? null) }
          : {};
        const res = await fetch("/api/access/me", { headers, cache: "no-store" });
        const json = (await res.json()) as { ok: boolean; profile?: ProfileAccess };

        if (res.ok && json.ok && json.profile) {
          setProfile(json.profile);
          return;
        }
      } catch {
        /* retry */
      }
    }

    if (!user?.id) {
      setProfile(guestProfile());
      return;
    }

    setSyncError();
  }, [session?.access_token, setProfile, setSyncError, setSyncLoading, user?.id]);

  useEffect(() => {
    void load();
    useAccessStore.getState().registerProfileSyncRetry(load);
    return () => {
      useAccessStore.getState().registerProfileSyncRetry(null);
    };
  }, [load]);

  return { retry: load };
}

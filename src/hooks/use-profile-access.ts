"use client";

import { useEffect } from "react";

import type { ProfileAccess } from "@/lib/access/roles";
import { authHeadersForUser } from "@/lib/access/request-user";
import { useAccessStore } from "@/store/access-store";
import { useAuthStore } from "@/store/auth-store";

/**
 * Sync Supabase profile role → local access store (premium / founding).
 */
export function useProfileAccess() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const sessionMode = useAuthStore((s) => s.sessionMode);
  const setProfile = useAccessStore((s) => s.setProfile);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const headers: HeadersInit = {
          ...authHeadersForUser(user?.id ?? null, session?.access_token ?? null),
        };
        const res = await fetch("/api/access/me", { headers, cache: "no-store" });
        const json = (await res.json()) as { ok: boolean; profile?: ProfileAccess };
        if (!alive || !json.ok || !json.profile) return;
        setProfile(json.profile);
      } catch {
        /* local tier fallback */
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [user?.id, session?.access_token, sessionMode, setProfile]);
}

"use client";

import { authHeadersForUser } from "@/lib/access/request-user";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAuthStore } from "@/store/auth-store";

/**
 * Build Authorization headers for client → server API calls.
 * Always prefers a fresh Supabase session token over the Zustand snapshot —
 * the store can lag behind cookie/session refresh after sign-in or TOKEN_REFRESHED.
 */
export async function resolveClientAuthHeaders(): Promise<HeadersInit> {
  const sb = supabaseBrowser();
  if (sb) {
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token ?? null;
    const userId = data.session?.user?.id ?? null;
    if (token) return authHeadersForUser(userId, token);
  }

  const { user, session } = useAuthStore.getState();
  return authHeadersForUser(user?.id ?? null, session?.access_token ?? null);
}

/** True when a Bearer token is available for protected billing APIs. */
export async function hasClientAuthToken(): Promise<boolean> {
  const headers = await resolveClientAuthHeaders();
  const auth = (headers as Record<string, string>)["Authorization"];
  return Boolean(auth?.startsWith("Bearer "));
}

"use client";

import { useEffect } from "react";

import { supabaseBrowser } from "@/lib/supabase/browser";
import { clearClientSession } from "@/lib/auth/sign-out";
import { useAuthStore } from "@/store/auth-store";
import { useEntryStore } from "@/store/entry-store";

/**
 * Initialises session state and subscribes to auth changes (browser-only).
 *
 * Security contract:
 *   - On any auth loss event (explicit sign-out, token expiry, session revocation),
 *     clearClientSession() is called IMMEDIATELY before updating the auth store.
 *     This ensures the access profile is reset to guest before the auth status
 *     changes, so there is no window where auth.status = "signed_out" but the
 *     client still holds a premium profile.
 *   - Token refresh (SIGNED_IN / TOKEN_REFRESHED) does NOT clear the session —
 *     setAuth() updates the store with the new token and useProfileAccess re-fetches.
 */
export function AuthBootstrap() {
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) {
      if (useEntryStore.getState().entryMode === "guest") {
        useAuthStore.getState().setGuest();
      } else {
        setAuth(null);
      }
      return;
    }

    let active = true;
    sb.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setAuth(data.session);
      } else {
        // No stored session on load — clear any stale access state immediately.
        clearClientSession();
        if (useEntryStore.getState().entryMode === "guest") {
          useAuthStore.getState().setGuest();
        } else {
          setAuth(null);
        }
      }
    });

    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuth(session);
      } else {
        // Auth loss: token expired, revoked, explicit signOut from another tab, etc.
        // Reset access immediately — do NOT wait for useProfileAccess to refetch.
        // This prevents a window where auth is gone but the client still holds a
        // premium profile with serverConfirmed = true.
        clearClientSession();
        if (useEntryStore.getState().entryMode === "guest") {
          useAuthStore.getState().setGuest();
        } else {
          setAuth(null);
        }
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [setAuth]);

  return null;
}

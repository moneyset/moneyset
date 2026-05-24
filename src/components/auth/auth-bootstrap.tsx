"use client";

import { useEffect } from "react";

import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAuthStore } from "@/store/auth-store";
import { useEntryStore } from "@/store/entry-store";

/** Initializes session state + subscribes to auth changes (browser-only). */
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
      } else if (useEntryStore.getState().entryMode === "guest") {
        useAuthStore.getState().setGuest();
      } else {
        setAuth(null);
      }
    });

    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) setAuth(session);
      else if (useEntryStore.getState().entryMode === "guest") useAuthStore.getState().setGuest();
      else setAuth(null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [setAuth]);

  return null;
}


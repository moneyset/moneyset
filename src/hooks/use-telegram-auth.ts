"use client";

import { useCallback, useState } from "react";

import type { ProfileAccess } from "@/lib/access/roles";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAccessStore } from "@/store/access-store";
import { useAuthStore } from "@/store/auth-store";
import { useEntryStore } from "@/store/entry-store";

function readTelegramInitData(): string | null {
  if (typeof window === "undefined") return null;
  const tg = window.Telegram?.WebApp;
  const initData = (tg as { initData?: string } | undefined)?.initData;
  return typeof initData === "string" && initData.length > 0 ? initData : null;
}

export function useTelegramAuth() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setProfile = useAccessStore((s) => s.setProfile);
  const completeEntry = useEntryStore((s) => s.completeEntry);

  const signInWithTelegram = useCallback(async () => {
    setError(null);
    const initData = readTelegramInitData();
    if (!initData) {
      setError("Open inside Telegram to continue with Telegram.");
      return false;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        access_token?: string;
        refresh_token?: string;
        profile?: ProfileAccess;
      };
      if (!json.ok || !json.access_token || !json.refresh_token) {
        setError(json.error ?? "Telegram sign-in failed");
        return false;
      }

      const sb = supabaseBrowser();
      if (sb) {
        const { error: sessionErr } = await sb.auth.setSession({
          access_token: json.access_token,
          refresh_token: json.refresh_token,
        });
        if (sessionErr) {
          setError(sessionErr.message);
          return false;
        }
        const { data } = await sb.auth.getSession();
        setAuth(data.session ?? null);
      } else {
        setAuth(null);
      }

      if (json.profile) setProfile(json.profile);
      completeEntry("telegram");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Telegram sign-in failed");
      return false;
    } finally {
      setBusy(false);
    }
  }, [completeEntry, setAuth, setProfile]);

  return { signInWithTelegram, busy, error, hasInitData: Boolean(readTelegramInitData()) };
}

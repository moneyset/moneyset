"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ProfileAccess } from "@/lib/access/roles";
import {
  isTelegramMiniApp,
  openTelegramMiniApp,
  readTelegramInitData,
} from "@/lib/auth/telegram-client";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAccessStore } from "@/store/access-store";
import { useAuthStore } from "@/store/auth-store";
import { useEntryStore } from "@/store/entry-store";

type SignInOptions = Readonly<{
  source?: "manual" | "auto";
  silent?: boolean;
}>;

export function useTelegramAuth() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoAttempted, setAutoAttempted] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const authStatus = useAuthStore((s) => s.status);
  const setProfile = useAccessStore((s) => s.setProfile);
  const completeEntry = useEntryStore((s) => s.completeEntry);
  const hasInitData = isTelegramMiniApp();

  const signInWithTelegram = useCallback(
    async (opts: SignInOptions = {}) => {
      setError(null);
      const initData = readTelegramInitData();
      if (!initData) {
        if (!opts.silent) {
          setError("Open inside Telegram to continue with Telegram.");
        }
        return false;
      }

      setBusy(true);
      try {
        await fetch("/api/auth/telegram/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "telegram_login_started", source: opts.source ?? "manual" }),
        }).catch(() => undefined);

        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData, source: opts.source ?? "manual" }),
        });
        const json = (await res.json()) as {
          ok: boolean;
          error?: string;
          access_token?: string;
          refresh_token?: string;
          profile?: ProfileAccess;
          isNewUser?: boolean;
          isReturning?: boolean;
        };

        if (!json.ok || !json.access_token || !json.refresh_token) {
          const message = json.error ?? "Telegram sign-in failed";
          if (!opts.silent) setError(message);
          await fetch("/api/auth/telegram/telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "telegram_login_failed",
              reason: message.slice(0, 120),
              source: opts.source ?? "manual",
            }),
          }).catch(() => undefined);
          return false;
        }

        const sb = supabaseBrowser();
        if (sb) {
          const { error: sessionErr } = await sb.auth.setSession({
            access_token: json.access_token,
            refresh_token: json.refresh_token,
          });
          if (sessionErr) {
            if (!opts.silent) setError(sessionErr.message);
            return false;
          }
          const { data } = await sb.auth.getSession();
          setAuth(data.session ?? null);
        } else {
          setAuth(null);
        }

        if (json.profile) setProfile(json.profile);
        completeEntry("telegram");
        useAccessStore.getState().retryProfileSync?.();
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Telegram sign-in failed";
        if (!opts.silent) setError(message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [completeEntry, setAuth, setProfile],
  );

  const openTelegram = useCallback(() => {
    openTelegramMiniApp();
  }, []);

  return {
    signInWithTelegram,
    openTelegram,
    busy,
    error,
    hasInitData,
    inTelegram: hasInitData,
    autoAttempted,
    setAutoAttempted,
    authStatus,
  };
}

/** Auto sign-in when Mini App loads with valid initData (Google-like one-tap). */
export function useTelegramAutoSignIn() {
  const { signInWithTelegram, hasInitData, authStatus, autoAttempted, setAutoAttempted, busy } =
    useTelegramAuth();
  const running = useRef(false);

  useEffect(() => {
    if (!hasInitData) return;
    if (authStatus === "signed_in") return;
    if (autoAttempted || running.current || busy) return;

    running.current = true;
    setAutoAttempted(true);
    void signInWithTelegram({ source: "auto", silent: true }).finally(() => {
      running.current = false;
    });
  }, [
    authStatus,
    autoAttempted,
    busy,
    hasInitData,
    setAutoAttempted,
    signInWithTelegram,
  ]);
}

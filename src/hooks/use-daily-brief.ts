"use client";

import { useEffect } from "react";

import { authHeadersForUser } from "@/lib/access/request-user";
import { useIntelligencePipelineStore } from "@/store/intelligence-pipeline-store";
import { useAuthStore } from "@/store/auth-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const BRIEF_REFRESH_MS = 6 * 60 * 60_000;

/** Fetches cached daily brief once per session window — no UI surface required. */
export function useDailyBrief(enabled = true) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const setDailyBrief = useIntelligencePipelineStore((s) => s.setDailyBrief);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch("/api/intelligence/daily-brief", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeadersForUser(user?.id ?? null, session?.access_token ?? null),
          },
          body: JSON.stringify({ locale }),
        });
        const json = (await res.json()) as { ok: boolean; brief?: Parameters<typeof setDailyBrief>[0] };
        if (alive && json.ok && json.brief) setDailyBrief(json.brief);
      } catch {
        /* deterministic desk continues */
      }
    };

    load();
    const id = window.setInterval(load, BRIEF_REFRESH_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [enabled, locale, setDailyBrief, session?.access_token, user?.id]);
}

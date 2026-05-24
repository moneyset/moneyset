"use client";

import { useEffect } from "react";

import { useIntelligencePipelineStore } from "@/store/intelligence-pipeline-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const BRIEF_REFRESH_MS = 6 * 60 * 60_000;

/** Fetches cached daily brief once per session window — no UI surface required. */
export function useDailyBrief(enabled = true) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const setDailyBrief = useIntelligencePipelineStore((s) => s.setDailyBrief);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch("/api/intelligence/daily-brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
  }, [enabled, locale, setDailyBrief]);
}

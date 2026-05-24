"use client";

import { useEffect } from "react";

import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";

/** When UI language changes, refresh agent lattice + scenario copy without advancing the sim tick. */
export function CognitionLocaleSync() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const refreshForLocale = useCognitionSimulationStore((s) => s.refreshForLocale);

  useEffect(() => {
    document.documentElement.lang = locale === "ru" ? "ru" : "en";
    refreshForLocale();
  }, [locale, refreshForLocale]);

  return null;
}

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { MsResolvedTheme, MsThemePreference } from "@/types/theme";

function systemIsDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(pref: MsThemePreference): MsResolvedTheme {
  if (pref === "system") return systemIsDark() ? "dark" : "light";
  return pref;
}

type ThemeState = {
  preference: MsThemePreference;
  setPreference: (next: MsThemePreference) => void;
  /** Sync DOM + optional meta theme-color */
  applyToDocument: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: "system",

      setPreference: (next) => {
        set({ preference: next });
        queueMicrotask(() => get().applyToDocument());
      },

      applyToDocument: () => {
        if (typeof document === "undefined") return;
        const resolved = resolveTheme(get().preference);
        document.documentElement.setAttribute("data-theme", resolved);
        const meta = document.querySelector('meta[name="theme-color"]');
        const color = resolved === "dark" ? "#040406" : "#f6f5f1";
        if (meta) meta.setAttribute("content", color);
      },
    }),
    {
      name: "moneyset_theme_v1",
      partialize: (s) => ({ preference: s.preference }),
      skipHydration: true,
    },
  ),
);

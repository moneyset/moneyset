"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UiLocale = "en" | "ru";

export type CognitionDensityMode = "compressed" | "strategic" | "deep";

type UiPrefsState = {
  /** Display-only locale for future i18n; no translation pipeline in foundation. */
  uiLocale: UiLocale;
  setUiLocale: (locale: UiLocale) => void;

  cognitionDense: boolean;
  setCognitionDense: (v: boolean) => void;

  cognitionMode: CognitionDensityMode;
  setCognitionMode: (v: CognitionDensityMode) => void;

  motionIntensity: "low" | "standard";
  setMotionIntensity: (v: "low" | "standard") => void;

  alertSensitivity: "low" | "standard" | "high";
  setAlertSensitivity: (v: "low" | "standard" | "high") => void;

  /** Chart-heavy surfaces (Labs, maps) — display density only; no strategy semantics. */
  chartVisualDensity: "standard" | "compact";
  setChartVisualDensity: (v: "standard" | "compact") => void;

  /** Mobile bottom nav label row — icons-only when off for calmer thumb navigation. */
  showMobileNavLabels: boolean;
  setShowMobileNavLabels: (v: boolean) => void;

  /** Replay / temporal surfaces — extra moment density in collapsed sections on small screens. */
  replayMobileDetail: "standard" | "reduced";
  setReplayMobileDetail: (v: "standard" | "reduced") => void;

  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;
};

export const useUiPrefsStore = create<UiPrefsState>()(
  persist(
    (set) => ({
      uiLocale: "en",
      setUiLocale: (uiLocale) => set({ uiLocale }),

      cognitionDense: false,
      setCognitionDense: (cognitionDense) => set({ cognitionDense }),

      cognitionMode: "strategic",
      /** Density follows mode: compressed = tighter page rhythm (operational, not decorative). */
      setCognitionMode: (cognitionMode) =>
        set({ cognitionMode, cognitionDense: cognitionMode === "compressed" }),

      motionIntensity: "standard",
      setMotionIntensity: (motionIntensity) => set({ motionIntensity }),

      alertSensitivity: "standard",
      setAlertSensitivity: (alertSensitivity) => set({ alertSensitivity }),

      chartVisualDensity: "standard",
      setChartVisualDensity: (chartVisualDensity) => set({ chartVisualDensity }),

      showMobileNavLabels: true,
      setShowMobileNavLabels: (showMobileNavLabels) => set({ showMobileNavLabels }),

      replayMobileDetail: "standard",
      setReplayMobileDetail: (replayMobileDetail) => set({ replayMobileDetail }),

      onboardingComplete: false,
      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
    }),
    {
      name: "moneyset_ui_prefs_v1",
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<UiPrefsState>) }),
      partialize: (s) => ({
        uiLocale: s.uiLocale,
        cognitionDense: s.cognitionDense,
        cognitionMode: s.cognitionMode,
        motionIntensity: s.motionIntensity,
        alertSensitivity: s.alertSensitivity,
        chartVisualDensity: s.chartVisualDensity,
        showMobileNavLabels: s.showMobileNavLabels,
        replayMobileDetail: s.replayMobileDetail,
        onboardingComplete: s.onboardingComplete,
      }),
    },
  ),
);

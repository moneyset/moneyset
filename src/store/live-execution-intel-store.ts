"use client";

import { create } from "zustand";

import type { LiveExecutionIntel } from "@/lib/live/live-intel-types";

type LiveIntelStore = Readonly<{
  intel: LiveExecutionIntel | null;
  setIntel: (next: LiveExecutionIntel) => void;
}>;

/** Latest compressed live intel — written by `useLiveExecutionIntelBridge` only. */
export const useLiveExecutionIntelStore = create<LiveIntelStore>((set) => ({
  intel: null,
  setIntel: (next) =>
    set((s) => {
      if (s.intel?.signature === next.signature) return s;
      return { intel: next };
    }),
}));

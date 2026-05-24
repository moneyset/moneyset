"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type EntryMode = "unknown" | "guest" | "telegram" | "account";

type EntryState = {
  entryComplete: boolean;
  entryMode: EntryMode;
  completeEntry: (mode: Exclude<EntryMode, "unknown">) => void;
  resetEntry: () => void;
};

export const useEntryStore = create<EntryState>()(
  persist(
    (set) => ({
      entryComplete: false,
      entryMode: "unknown",
      completeEntry: (mode) => set({ entryComplete: true, entryMode: mode }),
      resetEntry: () => set({ entryComplete: false, entryMode: "unknown" }),
    }),
    { name: "moneyset_entry_v1", skipHydration: true },
  ),
);

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { InsightReport, JournalEntry, MemorySnapshot } from "@/types/memory";

type MemoryState = {
  snapshots: MemorySnapshot[];
  journal: JournalEntry[];
  insights: InsightReport[];

  addSnapshot: (s: MemorySnapshot) => void;
  addJournalEntry: (e: JournalEntry) => void;
  updateJournalEntry: (id: string, patch: Partial<JournalEntry>) => void;
  removeJournalEntry: (id: string) => void;

  addInsight: (r: InsightReport) => void;
  clearInsights: () => void;
};

const MAX_SNAPSHOTS = 240;
const MAX_JOURNAL = 400;
const MAX_INSIGHTS = 60;

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set) => ({
      snapshots: [],
      journal: [],
      insights: [],

      addSnapshot: (s) =>
        set((prev) => ({
          snapshots: [s, ...prev.snapshots].slice(0, MAX_SNAPSHOTS),
        })),

      addJournalEntry: (e) =>
        set((prev) => ({
          journal: [e, ...prev.journal].slice(0, MAX_JOURNAL),
        })),

      updateJournalEntry: (id, patch) =>
        set((prev) => ({
          journal: prev.journal.map((e) => (e.id === id ? ({ ...e, ...patch } as JournalEntry) : e)),
        })),

      removeJournalEntry: (id) => set((prev) => ({ journal: prev.journal.filter((e) => e.id !== id) })),

      addInsight: (r) =>
        set((prev) => ({
          insights: [r, ...prev.insights].slice(0, MAX_INSIGHTS),
        })),

      clearInsights: () => set({ insights: [] }),
    }),
    {
      name: "moneyset_memory_v1",
      partialize: (s) => ({ snapshots: s.snapshots, journal: s.journal, insights: s.insights }),
      skipHydration: true,
    },
  ),
);


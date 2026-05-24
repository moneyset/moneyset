"use client";

import { create } from "zustand";

import type { ExecutionEvolutionFrame } from "@/lib/live/live-intel-types";
import { LIVE_INTEL_EVOLUTION_CAP } from "@/lib/live/live-pipeline";

type ExecutionEvolutionStore = Readonly<{
  samples: readonly ExecutionEvolutionFrame[];
  /** Append if signature differs from tail — ring buffer for replay / memory substrate. */
  pushDistinct: (frame: ExecutionEvolutionFrame) => void;
  tail: (n: number) => readonly ExecutionEvolutionFrame[];
  clear: () => void;
}>;

export const useExecutionEvolutionStore = create<ExecutionEvolutionStore>((set, get) => ({
  samples: [],

  pushDistinct: (frame) => {
    const cur = get().samples;
    const last = cur[cur.length - 1];
    if (last?.signature === frame.signature) return;
    const next = [...cur, frame].slice(-LIVE_INTEL_EVOLUTION_CAP);
    set({ samples: next });
  },

  tail: (n) => get().samples.slice(-Math.max(0, n)),

  clear: () => set({ samples: [] }),
}));

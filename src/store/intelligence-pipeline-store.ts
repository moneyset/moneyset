"use client";

import { create } from "zustand";

import type { IntelligencePipelineResult } from "@/lib/intelligence/pipeline/types";
import type { UnifiedMarketSnapshot } from "@/lib/intelligence/types";
import type { DailyBrief } from "@/lib/intelligence/pipeline/types";

const FALLBACK_SIGNATURE = "offline|0|neutral|moderate";

type PipelineState = {
  unifiedMarket: UnifiedMarketSnapshot | null;
  result: IntelligencePipelineResult | null;
  dailyBrief: DailyBrief | null;
  lastSignature: string;
  setUnifiedMarket: (snap: UnifiedMarketSnapshot | null) => void;
  setResult: (result: IntelligencePipelineResult) => void;
  setDailyBrief: (brief: DailyBrief | null) => void;
};

function emptyResult(): IntelligencePipelineResult {
  const now = Date.now();
  return {
    posture: {
      posture: "neutral",
      confidence: "moderate",
      executionBias: "patience_favored",
      riskLevel: "medium",
      primaryAcceptanceZone: "—",
      primaryRiskZone: "—",
      why: [
        "Market context synchronizing",
        "Agent lattice pending live tape",
        "Execution geometry awaiting anchor",
      ],
      executionImplication:
        "Aggressive breakout participation remains premature until acceptance confirms.",
      invalidationRead: "Invalidation pending structural anchor.",
      history: { priorPosture: null, change: "stable" },
    },
    domainAnalyses: [],
    executionImplication:
      "Aggressive breakout participation remains premature until acceptance confirms.",
    signature: FALLBACK_SIGNATURE,
    source: "deterministic",
    aiAvailable: false,
    orchestrator: null,
    aiAgents: [],
    inferredAt: now,
  };
}

export const useIntelligencePipelineStore = create<PipelineState>((set) => ({
  unifiedMarket: null,
  result: emptyResult(),
  dailyBrief: null,
  lastSignature: FALLBACK_SIGNATURE,
  setUnifiedMarket: (unifiedMarket) => set({ unifiedMarket }),
  setResult: (result) => set({ result, lastSignature: result.signature }),
  setDailyBrief: (dailyBrief) => set({ dailyBrief }),
}));

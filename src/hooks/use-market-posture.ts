"use client";

import { useIntelligencePipelineStore } from "@/store/intelligence-pipeline-store";
import type { MarketPostureSnapshot } from "@/lib/intelligence/market-posture-engine";

/**
 * Single source of truth — posture from intelligence pipeline store.
 */
export function useMarketPosture(): MarketPostureSnapshot {
  const result = useIntelligencePipelineStore((s) => s.result);
  return result?.posture ?? {
    posture: "neutral",
    confidence: "moderate",
    executionBias: "patience_favored",
    riskLevel: "medium",
    primaryAcceptanceZone: "—",
    primaryRiskZone: "—",
    why: ["Intelligence layer synchronizing", "Awaiting market normalization", "Desk read pending"],
    executionImplication:
      "Aggressive breakout participation remains premature until acceptance confirms.",
    invalidationRead: "Invalidation pending structural anchor.",
    history: { priorPosture: null, change: "stable" },
  };
}

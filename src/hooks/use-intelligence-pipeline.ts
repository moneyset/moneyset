"use client";

import { useEffect, useMemo } from "react";

import { runIntelligencePipeline } from "@/lib/intelligence/pipeline/run-pipeline";
import { useAiCognitionStore } from "@/store/ai-cognition-store";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useIntelligencePipelineStore } from "@/store/intelligence-pipeline-store";
import { useMarketStore } from "@/store/market-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

/**
 * Runs intelligence pipeline whenever market + simulation + AI state changes.
 * UI reads posture from this hook / store — never invents opinions locally.
 *
 * Uses primitive store selectors only (no useShallow objects) so React 19
 * getServerSnapshot stays stable during SSR/hydration.
 */
export function useIntelligencePipeline(enabled = true) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const setResult = useIntelligencePipelineStore((s) => s.setResult);
  const unifiedSignature = useIntelligencePipelineStore((s) => s.unifiedMarket?.signature);
  const price = useMarketStore((s) => s.price);
  const fundingRate = useMarketStore((s) => s.fundingRate);
  const momentum = useMarketStore((s) => s.momentum);
  const realizedVol = useMarketStore((s) => s.realizedVol);
  const simTick = useCognitionSimulationStore((s) => s.simTick);
  const phase = useCognitionSimulationStore((s) => s.derived.phase);
  const dangerBand = useCognitionSimulationStore((s) => s.derived.dangerBand);
  const actionBias = useAiCognitionStore((s) => s.orchestrator?.actionBias);
  const aiAgentCount = useAiCognitionStore((s) => {
    let count = 0;
    for (const agent of Object.values(s.agents)) {
      if (agent) count += 1;
    }
    return count;
  });

  const depsKey = useMemo(
    () =>
      [
        unifiedSignature,
        price,
        fundingRate,
        momentum,
        realizedVol,
        simTick,
        phase,
        dangerBand,
        actionBias,
        aiAgentCount,
      ].join("|"),
    [
      unifiedSignature,
      price,
      fundingRate,
      momentum,
      realizedVol,
      simTick,
      phase,
      dangerBand,
      actionBias,
      aiAgentCount,
    ],
  );

  useEffect(() => {
    if (!enabled) return;
    try {
      const market = useMarketStore.getState();
      const simulation = useCognitionSimulationStore.getState();
      const ai = useAiCognitionStore.getState();
      const pipeline = useIntelligencePipelineStore.getState();
      const result = runIntelligencePipeline({
        locale,
        tape: {
          symbol: market.symbol,
          price: market.price,
          ts: market.ts,
          changePercent24h: market.changePercent24h,
          markPrice: market.markPrice,
          fundingRate: market.fundingRate,
          nextFundingTime: market.nextFundingTime,
          openInterest: market.openInterest,
          realizedVol: market.realizedVol,
          momentum: market.momentum,
          connection: market.connection,
          lastWsTs: market.lastWsTs,
          lastRestTs: market.lastRestTs,
          error: market.error,
        },
        unified: pipeline.unifiedMarket,
        derived: simulation.derived,
        latent: simulation.latent,
        history: simulation.history,
        scenarioBook: simulation.scenarioBook,
        simTick: simulation.simTick,
        orchestrator: ai.orchestrator,
        aiAgents: Object.values(ai.agents).filter(Boolean),
      });
      if (result.signature === pipeline.lastSignature) return;
      setResult(result);
    } catch {
      /* failsafe: keep prior result in store */
    }
  }, [enabled, locale, depsKey, setResult]);
}

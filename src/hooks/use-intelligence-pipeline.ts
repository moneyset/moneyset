"use client";

import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { runIntelligencePipeline } from "@/lib/intelligence/pipeline/run-pipeline";
import { useExecutionSurface } from "@/hooks/use-execution-surface";
import { useAiCognitionStore } from "@/store/ai-cognition-store";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useIntelligencePipelineStore } from "@/store/intelligence-pipeline-store";
import { useMarketStore } from "@/store/market-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

/**
 * Runs intelligence pipeline whenever market + simulation + AI state changes.
 * UI reads posture from this hook / store — never invents opinions locally.
 */
export function useIntelligencePipeline(enabled = true) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const setResult = useIntelligencePipelineStore((s) => s.setResult);
  const unified = useIntelligencePipelineStore((s) => s.unifiedMarket);

  const tape = useMarketStore(
    useShallow((s) => ({
      symbol: s.symbol,
      price: s.price,
      ts: s.ts,
      changePercent24h: s.changePercent24h,
      markPrice: s.markPrice,
      fundingRate: s.fundingRate,
      nextFundingTime: s.nextFundingTime,
      openInterest: s.openInterest,
      realizedVol: s.realizedVol,
      momentum: s.momentum,
      connection: s.connection,
      lastWsTs: s.lastWsTs,
      lastRestTs: s.lastRestTs,
      error: s.error,
    })),
  );

  const sim = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      history: s.history,
      scenarioBook: s.scenarioBook,
      simTick: s.simTick,
    })),
  );

  const { orchestrator, aiAgents } = useAiCognitionStore(
    useShallow((s) => ({
      orchestrator: s.orchestrator,
      aiAgents: Object.values(s.agents).filter(Boolean),
    })),
  );

  const surface = useExecutionSurface();

  const depsKey = useMemo(
    () =>
      [
        unified?.signature,
        tape.price,
        tape.fundingRate,
        tape.momentum,
        tape.realizedVol,
        sim.simTick,
        sim.derived.phase,
        sim.derived.dangerBand,
        orchestrator?.actionBias,
        aiAgents.length,
        surface.executionBiasVariant,
      ].join("|"),
    [
      unified?.signature,
      tape.price,
      tape.fundingRate,
      tape.momentum,
      tape.realizedVol,
      sim.simTick,
      sim.derived.phase,
      sim.derived.dangerBand,
      orchestrator?.actionBias,
      aiAgents.length,
      surface.executionBiasVariant,
    ],
  );

  useEffect(() => {
    if (!enabled) return;
    try {
      const result = runIntelligencePipeline({
        locale,
        tape,
        unified,
        derived: sim.derived,
        latent: sim.latent,
        history: sim.history,
        scenarioBook: sim.scenarioBook,
        simTick: sim.simTick,
        orchestrator,
        aiAgents,
      });
      setResult(result);
    } catch {
      /* failsafe: keep prior result in store */
    }
  }, [enabled, locale, depsKey, tape, unified, sim, orchestrator, aiAgents, setResult]);
}

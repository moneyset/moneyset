import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import type { UnifiedMarketSnapshot } from "@/lib/intelligence/types";
import type { NormalizedMarketState } from "@/types/market-state";

import { analyzeAgentDomains } from "./agent-analysis";
import { blendLatentWithMarket } from "./market-latent-bridge";
import { latticeFromDomains } from "./agent-analysis";
import type { ExecutionLayerSurface } from "@/lib/execution/derive-execution-layer";
import type { UiLocale } from "@/store/ui-prefs-store";
import type { NormalizedIntelligenceInput } from "./types";

export function buildPipelineSignature(args: {
  marketSignature: string | null;
  simTick: number;
  phase: string;
  dangerBand: string;
}): string {
  return `${args.marketSignature ?? "offline"}|${args.simTick}|${args.phase}|${args.dangerBand}`;
}

export function normalizeIntelligenceInput(args: {
  locale: UiLocale;
  tape: NormalizedMarketState;
  unified: UnifiedMarketSnapshot | null;
  derived: DerivedCognitionSnapshot;
  simLatent: LatentDrivers;
  surface: ExecutionLayerSurface;
  simTick: number;
}): NormalizedIntelligenceInput {
  const blendedLatent = blendLatentWithMarket(args.simLatent, args.tape, args.unified);
  const derivedWithBlend: DerivedCognitionSnapshot = { ...args.derived, latent: blendedLatent };
  const agentLattice = latticeFromDomains(args.locale, blendedLatent, derivedWithBlend);
  const domainAnalyses = analyzeAgentDomains({
    locale: args.locale,
    derived: derivedWithBlend,
    latent: blendedLatent,
    tape: args.tape,
    unified: args.unified,
    surface: args.surface,
  });

  const signature = buildPipelineSignature({
    marketSignature: args.unified?.signature ?? null,
    simTick: args.simTick,
    phase: args.derived.phase,
    dangerBand: args.derived.dangerBand,
  });

  return {
    tape: args.tape,
    unified: args.unified,
    derived: derivedWithBlend,
    latent: args.simLatent,
    blendedLatent,
    agentLattice,
    domainAnalyses,
    signature,
  };
}

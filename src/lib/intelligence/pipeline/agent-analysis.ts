/**
 * Deterministic agent domain analysis — DATA → normalized drivers → agent reads.
 * Uses existing six domains; structure is synthesized (no new agent module).
 */

import { deriveAgentLattice } from "@/lib/simulation/agents-derive";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import type { UnifiedMarketSnapshot } from "@/lib/intelligence/types";
import type { ExecutionLayerSurface } from "@/lib/execution/derive-execution-layer";
import type { UiLocale } from "@/store/ui-prefs-store";
import type { NormalizedMarketState } from "@/types/market-state";

import type { AgentDomainAnalysis, AgentDomainId } from "./types";

function pct(n: number): number {
  return Math.round(Math.min(94, Math.max(34, n)));
}

export function analyzeAgentDomains(args: {
  locale: UiLocale;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  tape: NormalizedMarketState;
  unified: UnifiedMarketSnapshot | null;
  surface: ExecutionLayerSurface;
}): readonly AgentDomainAnalysis[] {
  const { locale, derived, latent, tape, unified, surface } = args;
  const lattice = deriveAgentLattice(latent, derived, locale);
  const byRole = Object.fromEntries(lattice.map((r) => [r.role, r])) as Record<string, (typeof lattice)[0]>;

  const structure: AgentDomainAnalysis = {
    id: "structure",
    headline: pickLocale(locale, "Structure", "Структура"),
    confidencePct: pct(
      (unified?.structure.continuationQuality ?? 52) * 0.5 +
        (100 - derived.divergenceIndex) * 0.35,
    ),
    read: pickLocale(
      locale,
      surface.executionHeadline.length > 16
        ? surface.executionHeadline
        : derived.volTone === "compressing"
          ? "Range-bound structure — acceptance unresolved."
          : "Trend structure intact on the primary path.",
      surface.executionHeadline.length > 16
        ? surface.executionHeadline
        : derived.volTone === "compressing"
          ? "Структура в диапазоне — принятие не разрешено."
          : "Трендовая структура на базовом пути сохранена.",
    ),
    factors: [
      pickLocale(locale, "Trend condition", "Состояние тренда"),
      pickLocale(locale, "Acceptance geometry", "Геометрия принятия"),
    ],
  };

  const liquidity: AgentDomainAnalysis = {
    id: "liquidity",
    headline: pickLocale(locale, "Liquidity", "Ликвидность"),
    confidencePct: byRole.Liquidity?.confidencePct ?? pct(100 - latent.liquidityStructuralStress),
    read: byRole.Liquidity?.analyticLine ?? pickLocale(locale, "Liquidity layer neutral.", "Слой ликвидности нейтрален."),
    factors: [
      pickLocale(locale, "Liquidity concentration", "Концентрация ликвидности"),
      pickLocale(
        locale,
        unified?.derivatives.liquidationPressure
          ? "Liquidation pressure elevated"
          : "Liquidation pressure contained",
        unified?.derivatives.liquidationPressure
          ? "Давление ликвидаций повышено"
          : "Давление ликвидаций сдержано",
      ),
    ],
  };

  const flow: AgentDomainAnalysis = {
    id: "flow",
    headline: pickLocale(locale, "Flow", "Поток"),
    confidencePct: byRole.Flow?.confidencePct ?? pct(latent.positioningPressure),
    read: byRole.Flow?.analyticLine ?? pickLocale(locale, "Participation quality stable.", "Качество участия стабильно."),
    factors: [
      pickLocale(locale, "Volume / participation", "Объём / участие"),
      tape.momentum !== null
        ? pickLocale(locale, "Order-flow impulse on tape", "Импульс потока на ленте")
        : pickLocale(locale, "Tape impulse pending", "Импульс ленты ожидается"),
    ],
  };

  const sentiment: AgentDomainAnalysis = {
    id: "sentiment",
    headline: pickLocale(locale, "Sentiment", "Настроение"),
    confidencePct: byRole.Sentiment?.confidencePct ?? pct(106 - latent.sentimentThermal),
    read: byRole.Sentiment?.analyticLine ?? pickLocale(locale, "Crowd positioning balanced.", "Позиционирование толпы в балансе."),
    factors: [
      pickLocale(locale, "Crowd behavior", "Поведение толпы"),
      pickLocale(locale, "Positioning heat", "Нагрев позиционирования"),
    ],
  };

  const risk: AgentDomainAnalysis = {
    id: "risk",
    headline: pickLocale(locale, "Risk", "Риск"),
    confidencePct: byRole.Risk?.confidencePct ?? pct(100 - derived.dangerScore),
    read: byRole.Risk?.analyticLine ?? pickLocale(locale, "Fragility contained.", "Хрупкость сдержана."),
    factors: [
      pickLocale(locale, "Fragility / instability", "Хрупкость / нестабильность"),
      pickLocale(locale, "Invalidation risk", "Риск снятия"),
    ],
  };

  const macro: AgentDomainAnalysis = {
    id: "macro",
    headline: pickLocale(locale, "Macro", "Макро"),
    confidencePct: byRole.Macro?.confidencePct ?? pct(latent.macroLiquidityBackdrop),
    read: byRole.Macro?.analyticLine ?? pickLocale(locale, "Macro path mixed.", "Макро-путь смешанный."),
    factors: [
      unified?.macro.yield10y !== null
        ? pickLocale(locale, "Rates backdrop on tape", "Ставки в фоне")
        : pickLocale(locale, "Rates proxy unavailable", "Прокси ставок недоступен"),
      pickLocale(locale, "Liquidity conditions", "Условия ликвидности"),
    ],
  };

  return [structure, liquidity, flow, sentiment, risk, macro];
}

export function latticeFromDomains(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
): ReturnType<typeof deriveAgentLattice> {
  return deriveAgentLattice(latent, derived, locale);
}

export type { AgentDomainId };

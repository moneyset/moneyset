/**
 * Execution implication engine — one institutional sentence. No signals, no hype.
 */

import type { ExecutionLayerSurface } from "@/lib/execution/derive-execution-layer";
import type { ExecutionBiasId } from "@/lib/intelligence/market-posture-engine";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { ScenarioEngineCard } from "@/lib/simulation/scenario-engine";
import type { OrchestratorOutput } from "@/lib/openrouter/prompts";
import type { UiLocale } from "@/store/ui-prefs-store";

export function deriveExecutionImplication(args: {
  locale: UiLocale;
  derived: DerivedCognitionSnapshot;
  surface: ExecutionLayerSurface;
  leadCard: ScenarioEngineCard | null;
  bias: ExecutionBiasId;
  orchestrator: OrchestratorOutput | null;
}): string {
  const { locale, derived, surface, leadCard, bias, orchestrator } = args;

  if (orchestrator?.synthesis && orchestrator.synthesis.length > 24) {
    const line = orchestrator.synthesis.split("\n")[0]?.trim() ?? orchestrator.synthesis.trim();
    if (line.length > 20 && !/\b(buy|sell|long|short|pump|dump)\b/i.test(line)) {
      return line.endsWith(".") ? line : `${line}.`;
    }
  }

  if (leadCard?.executionImplication && leadCard.executionImplication.length > 24) {
    const line = leadCard.executionImplication.trim();
    return line.endsWith(".") ? line : `${line}.`;
  }
  if (surface.continuationRead.length > 20) {
    const line = surface.continuationRead.trim();
    return line.endsWith(".") ? line : `${line}.`;
  }

  const map: Record<ExecutionBiasId, { en: string; ru: string }> = {
    patience_favored: {
      en: "Aggressive breakout participation remains premature until acceptance confirms.",
      ru: "Агрессивное участие на пробой преждевременно, пока принятие не подтвердится.",
    },
    reactive_participation: {
      en: "Reactive participation is favored while structure resolves inside the current band.",
      ru: "Реактивное участие предпочтительно, пока структура разрешается в текущей полосе.",
    },
    controlled_aggression: {
      en: "Continuation remains favored while participation quality holds.",
      ru: "Продолжение остаётся в базе, пока качество участия держится.",
    },
    risk_reduction: {
      en: "Risk reduction is favored until invalidation pressure clears from the lead path.",
      ru: "Снижение риска предпочтительно, пока давление снятия не снимется с базового пути.",
    },
    acceptance_required: {
      en: "Acceptance is required before extension bias can be treated as durable.",
      ru: "Принятие обязательно, прежде чем уклон на продление можно считать устойчивым.",
    },
  };

  if (derived.dangerBand === "critical") {
    return pickLocale(
      locale,
      "Aggression is not favored until sponsorship stabilizes and stress recedes.",
      "Агрессия не предпочтительна, пока спонсорство не стабилизируется и стресс не снизится.",
    );
  }

  return pickLocale(locale, map[bias].en, map[bias].ru);
}

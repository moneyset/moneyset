/**
 * Daily intelligence brief — institutional, short, actionable.
 * DeepSeek for long-form when available; deterministic failsafe always.
 */

import { postureLabel, riskLevelLabel, executionBiasLabel } from "@/lib/intelligence/market-posture-engine";
import type { IntelligencePipelineResult } from "@/lib/intelligence/pipeline/types";
import type { UiLocale } from "@/store/ui-prefs-store";
import { deepSeekChat } from "@/lib/services/deepseek";
import { env } from "@/lib/services/shared/env";

import type { DailyBrief } from "@/lib/intelligence/pipeline/types";

export function deriveDailyBriefDeterministic(
  locale: UiLocale,
  pipeline: IntelligencePipelineResult,
  primaryScenarioTitle: string,
): DailyBrief {
  const p = pipeline.posture;
  return {
    marketPosture: postureLabel(locale, p.posture),
    keyRisk: riskLevelLabel(locale, p.riskLevel),
    primaryScenario: primaryScenarioTitle,
    executionImplication: pipeline.executionImplication,
    supportingReasons: p.why,
    generatedAt: Date.now(),
    source: "deterministic",
  };
}

export async function generateDailyBrief(args: {
  locale: UiLocale;
  pipeline: IntelligencePipelineResult;
  primaryScenarioTitle: string;
  contextBlock: string;
}): Promise<DailyBrief> {
  const fallback = deriveDailyBriefDeterministic(args.locale, args.pipeline, args.primaryScenarioTitle);
  if (!env("DEEPSEEK_API_KEY")) return fallback;

  try {
    const raw = await deepSeekChat({
      temperature: 0.2,
      max_tokens: 480,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Institutional BTC desk daily brief. JSON only: {marketPosture,keyRisk,primaryScenario,executionImplication,supportingReasons:[3 strings]}. No buy/sell. No hype. Short sentences.",
        },
        {
          role: "user",
          content: args.contextBlock.slice(0, 5000),
        },
      ],
    });
    const parsed = JSON.parse(raw) as {
      marketPosture?: string;
      keyRisk?: string;
      primaryScenario?: string;
      executionImplication?: string;
      supportingReasons?: string[];
    };
    const reasons = parsed.supportingReasons?.filter((r) => r.length > 4).slice(0, 3) ?? [];
    while (reasons.length < 3) reasons.push(fallback.supportingReasons[reasons.length] ?? "Structural read unchanged.");
    return {
      marketPosture: parsed.marketPosture ?? fallback.marketPosture,
      keyRisk: parsed.keyRisk ?? fallback.keyRisk,
      primaryScenario: parsed.primaryScenario ?? fallback.primaryScenario,
      executionImplication: parsed.executionImplication ?? fallback.executionImplication,
      supportingReasons: [reasons[0]!, reasons[1]!, reasons[2]!],
      generatedAt: Date.now(),
      source: "deepseek",
    };
  } catch {
    return fallback;
  }
}

export function formatDailyBriefMarkdown(brief: DailyBrief): string {
  return [
    `Market Posture: ${brief.marketPosture}`,
    `Key Risk: ${brief.keyRisk}`,
    `Primary Scenario: ${brief.primaryScenario}`,
    `Execution Implication: ${brief.executionImplication}`,
    "Supporting Reasons:",
    `1. ${brief.supportingReasons[0]}`,
    `2. ${brief.supportingReasons[1]}`,
    `3. ${brief.supportingReasons[2]}`,
  ].join("\n");
}

export function executionBiasBriefLine(locale: UiLocale, pipeline: IntelligencePipelineResult): string {
  return executionBiasLabel(locale, pipeline.posture.executionBias);
}

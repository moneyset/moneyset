"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { archetypeLabel } from "@/lib/agents/agent-archetypes";
import { useAgentCognition } from "@/hooks/use-agent-cognition";
import { useDecisionLayer } from "@/hooks/use-decision-layer";
import { useExecutionSurface } from "@/hooks/use-execution-surface";
import { useMarketPosture } from "@/hooks/use-market-posture";
import { deriveMapsTopologyBundle } from "@/lib/intelligence/maps-topology-view";
import {
  confidenceLabel,
  postureLabel,
  riskLevelLabel,
} from "@/lib/intelligence/market-posture-engine";
import { localizeOperationalLogEntry } from "@/lib/i18n/cognition-oplog-format";
import { pickLocale, scenarioConfidenceLabel, scenarioTitle } from "@/lib/i18n/cognition-dict";
import type { PrimarySurfaceId } from "@/lib/i18n/section-ia";
import { blufLabel } from "@/lib/i18n/section-ia";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export type BlufRow = Readonly<{
  labelKey: Parameters<typeof blufLabel>[1];
  value: string;
  tone?: "neutral" | "risk" | "cognition" | "warning";
}>;

export type SurfaceBlufSnapshot = Readonly<{
  rows: readonly BlufRow[];
  implication: string;
}>;

export function useSurfaceBluf(surface: PrimarySurfaceId): SurfaceBlufSnapshot {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const posture = useMarketPosture();
  const decision = useDecisionLayer();
  const exec = useExecutionSurface();
  const agents = useAgentCognition();
  const sim = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      history: s.history,
      simTick: s.simTick,
      scenarioBook: s.scenarioBook,
      topScenario: s.topScenario,
      operationalLog: s.operationalLog,
    })),
  );

  return useMemo(() => {
    const baseRows: BlufRow[] = [
      {
        labelKey: "currentState",
        value: postureLabel(locale, posture.posture),
        tone: "cognition",
      },
      {
        labelKey: "risk",
        value: riskLevelLabel(locale, posture.riskLevel),
        tone: posture.riskLevel === "elevated" || posture.riskLevel === "high" ? "risk" : "neutral",
      },
      {
        labelKey: "confidence",
        value: confidenceLabel(locale, posture.confidence),
        tone: "neutral",
      },
    ];

    switch (surface) {
      case "core":
        return {
          rows: baseRows,
          implication: decision.whatToDoNow[0] ?? posture.executionImplication,
        };

      case "execution":
        return {
          rows: [
            ...baseRows,
            {
              labelKey: "primaryImplication",
              value: exec.executionBiasLabel,
              tone: "cognition",
            },
          ],
          implication: decision.whatToDoNow[0] ?? exec.executionPosture,
        };

      case "scenarios": {
        const lead =
          sim.scenarioBook.cards.find((c) => c.id === sim.topScenario.scenarioId) ??
          sim.scenarioBook.cards[0] ??
          null;
        return {
          rows: [
            {
              labelKey: "leadPath",
              value: lead ? scenarioTitle(locale, lead.id) : pickLocale(locale, "Pending", "Ожидание"),
              tone: "cognition",
            },
            {
              labelKey: "pathWeight",
              value: lead
                ? pickLocale(locale, `${lead.probabilityPct}% structural weight`, `${lead.probabilityPct}% структурный вес`)
                : "—",
              tone: "neutral",
            },
            {
              labelKey: "confidence",
              value: lead ? scenarioConfidenceLabel(locale, lead.confidence) : confidenceLabel(locale, posture.confidence),
              tone: "neutral",
            },
            {
              labelKey: "risk",
              value: riskLevelLabel(locale, posture.riskLevel),
              tone: posture.riskLevel === "elevated" || posture.riskLevel === "high" ? "risk" : "neutral",
            },
          ],
          implication: lead?.pathConvictionLine ?? pickLocale(locale, "Paths still forming.", "Пути формируются."),
        };
      }

      case "ops": {
        const latest = sim.operationalLog[0] ?? null;
        const loc = latest ? localizeOperationalLogEntry(locale, latest) : null;
        return {
          rows: [
            {
              labelKey: "latestChange",
              value: loc?.headline ?? pickLocale(locale, "No material shift yet", "Существенных сдвигов пока нет"),
              tone: "warning",
            },
            {
              labelKey: "currentState",
              value: postureLabel(locale, posture.posture),
              tone: "cognition",
            },
            {
              labelKey: "risk",
              value: riskLevelLabel(locale, posture.riskLevel),
              tone: posture.riskLevel === "elevated" || posture.riskLevel === "high" ? "risk" : "neutral",
            },
          ],
          implication: loc?.whyMatters ?? loc?.summary ?? exec.evolutionHeadline,
        };
      }

      case "maps": {
        const bundle = deriveMapsTopologyBundle(locale, sim.latent, sim.derived, sim.history, sim.simTick);
        const topCell = bundle.structural.cells[0];
        return {
          rows: [
            {
              labelKey: "fieldRead",
              value: topCell?.label ?? pickLocale(locale, "Field stabilizing", "Поле стабилизируется"),
              tone: "cognition",
            },
            {
              labelKey: "currentState",
              value: postureLabel(locale, posture.posture),
              tone: "neutral",
            },
            {
              labelKey: "risk",
              value: riskLevelLabel(locale, posture.riskLevel),
              tone: posture.riskLevel === "elevated" || posture.riskLevel === "high" ? "risk" : "neutral",
            },
          ],
          implication: topCell?.readLine ?? posture.executionImplication,
        };
      }

      case "agents": {
        const leader = agents.personas.find((p) => p.id === agents.leadership.leaderId);
        const challenger = [...agents.personas].sort((a, b) => b.influence - a.influence)[1];
        return {
          rows: [
            {
              labelKey: "consensus",
              value: agents.consensusLabel,
              tone: "cognition",
            },
            {
              labelKey: "disagreement",
              value:
                leader && challenger
                  ? pickLocale(
                      locale,
                      `${archetypeLabel(locale, leader.id)} vs ${archetypeLabel(locale, challenger.id)}`,
                      `${archetypeLabel(locale, leader.id)} vs ${archetypeLabel(locale, challenger.id)}`,
                    )
                  : pickLocale(locale, "Agents aligning", "Агенты сходятся"),
              tone: "warning",
            },
            {
              labelKey: "confidence",
              value: confidenceLabel(locale, posture.confidence),
              tone: "neutral",
            },
          ],
          implication: agents.tension.headline,
        };
      }

      default:
        return { rows: baseRows, implication: posture.executionImplication };
    }
  }, [surface, locale, posture, decision, exec, agents, sim]);
}

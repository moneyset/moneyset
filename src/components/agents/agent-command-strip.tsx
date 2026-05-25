"use client";

import { useAgentCognition } from "@/hooks/use-agent-cognition";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function AgentCommandStrip({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useAgentCognition();
  const { tension, networkStress, consensusLabel } = bundle;

  const tiles = [
    {
      label: pickLocale(locale, "Instability", "Нестабильность"),
      value:
        tension.instability === "critical"
          ? pickLocale(locale, "Critical", "Критично")
          : tension.instability === "elevated"
            ? pickLocale(locale, "Elevated", "Повышено")
            : pickLocale(locale, "Contained", "Сдержано"),
      tense: tension.instability,
    },
    {
      label: pickLocale(locale, "Pressure", "Давление"),
      value: tension.pressure,
      tense: tension.instability,
    },
    {
      label: pickLocale(locale, "Divergence", "Расхождение"),
      value: tension.divergence,
      tense: tension.instability === "calm" ? "calm" : "elevated",
    },
    {
      label: pickLocale(locale, "Continuation", "Продолжение"),
      value: tension.continuation,
      tense: "calm" as const,
    },
    {
      label: pickLocale(locale, "Consensus", "Консенсус"),
      value: consensusLabel,
      tense: "calm" as const,
    },
    {
      label: pickLocale(locale, "Network stress", "Стресс сети"),
      value: `${networkStress}\u202f/\u202f100`,
      tense: networkStress >= 72 ? "critical" : networkStress >= 52 ? "elevated" : "calm",
    },
  ];

  return (
    <header className={cn("ms-agents-command", className)}>
      <div className="ms-agents-command__headline">
        <p className="ms-agents-command__tag">{pickLocale(locale, "Agent read tension", "Напряжение прочтений")}</p>
        <h2 className="ms-agents-command__title">{tension.headline}</h2>
        <p className="ms-agents-command__structural line-clamp-2">{tension.structural}</p>
      </div>
      <div className="ms-agents-command__grid" role="list">
        {tiles.map((t) => (
          <div
            key={t.label}
            role="listitem"
            className={cn(
              "ms-agents-command__tile",
              t.tense === "critical" && "ms-agents-command__tile--critical",
              t.tense === "elevated" && "ms-agents-command__tile--elevated",
            )}
          >
            <p className="ms-data-label text-ms-faint">{t.label}</p>
            <p className="ms-agents-command__tile-value">{t.value}</p>
          </div>
        ))}
      </div>
    </header>
  );
}

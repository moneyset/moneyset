"use client";

import { useAgentCognition } from "@/hooks/use-agent-cognition";
import { archetypeLabel } from "@/lib/agents/agent-archetypes";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function AgentTimeline({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const { timeline, leadership } = useAgentCognition();

  return (
    <section className={cn("ms-agents-timeline", className)} aria-label={pickLocale(locale, "Agent evolution", "Эволюция агентов")}>
      <header className="ms-agents-timeline__header">
        <h3 className="text-[11px] font-semibold tracking-tight text-ms-text">
          {pickLocale(locale, "Temporal cognition", "Временное прочтение")}
        </h3>
        <p className="mt-1 text-[10px] leading-snug text-ms-faint">
          {leadership.rotated
            ? pickLocale(
                locale,
                `Leadership rotated → ${archetypeLabel(locale, leadership.leaderId)}`,
                `Лидерство сменилось → ${archetypeLabel(locale, leadership.leaderId)}`,
              )
            : pickLocale(locale, `Current leader: ${archetypeLabel(locale, leadership.leaderId)}`, `Текущий лидер: ${archetypeLabel(locale, leadership.leaderId)}`)}
        </p>
      </header>
      {timeline.length === 0 ? (
        <p className="mt-4 text-[11px] text-ms-muted">
          {pickLocale(locale, "Insufficient history for temporal read.", "Недостаточно истории для временного прочтения.")}
        </p>
      ) : (
        <ol className="ms-agents-timeline__track">
          {timeline.map((ep) => (
            <li key={ep.tick} className="ms-agents-timeline__epoch">
              <span className="ms-agents-timeline__tick">T{ep.tick}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-ms-text">{archetypeLabel(locale, ep.leaderId)}</p>
                <p className="mt-0.5 text-[10px] text-ms-muted">
                  {ep.note}
                  <span className="text-ms-border/40"> · </span>
                  <span className="tabular-nums">{pickLocale(locale, "fracture", "разлом")} {ep.divergence}</span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

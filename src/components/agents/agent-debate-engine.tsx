"use client";

import { useAgentCognition } from "@/hooks/use-agent-cognition";
import { archetypeLabel } from "@/lib/agents/agent-archetypes";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function AgentDebateEngine({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useAgentCognition();

  return (
    <section className={cn("ms-agents-debate", className)} aria-label={pickLocale(locale, "Live debate", "Живой дебат")}>
      <header className="ms-agents-debate__header">
        <h3 className="text-[11px] font-semibold tracking-tight text-ms-text">
          {pickLocale(locale, "Structural conflict surface", "Поверхность структурного конфликта")}
        </h3>
        <p className="mt-1 text-[10px] leading-snug text-ms-faint">
          {pickLocale(locale, "Operational fractures — not messaging.", "Оперативные разломы — не переписка.")}
        </p>
      </header>
      {bundle.conflicts.length === 0 ? (
        <p className="mt-4 text-[11px] text-ms-muted">
          {pickLocale(locale, "No elevated cross-agent fractures in capture window.", "Повышенных межагентных разломов в окне захвата нет.")}
        </p>
      ) : (
        <ul className="ms-agents-debate__list">
          {bundle.conflicts.map((c) => (
            <li
              key={c.id}
              className={cn(
                "ms-agents-debate__conflict",
                c.severity === "fracture" && "ms-agents-debate__conflict--fracture",
                c.severity === "override" && "ms-agents-debate__conflict--override",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="ms-agents-debate__agents">
                  {archetypeLabel(locale, c.agents[0])}
                  <span className="text-ms-border/50" aria-hidden>
                    {" "}
                    ×{" "}
                  </span>
                  {archetypeLabel(locale, c.agents[1])}
                </span>
                <span className="ms-agents-debate__severity">{c.severity}</span>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-ms-text">{c.line}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

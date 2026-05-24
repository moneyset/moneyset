"use client";

import { useAgentCognition } from "@/hooks/use-agent-cognition";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function AgentWowEvents({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useAgentCognition();
  const active = bundle.wowEvents.filter((e) => e.active);

  if (active.length === 0) return null;

  return (
    <section className={cn("ms-agents-wow", className)} aria-label={pickLocale(locale, "Cognition events", "События прочтения")}>
      {active.map((e) => (
        <article key={e.kind} className={cn("ms-agents-wow__event", `ms-agents-wow__event--${e.kind}`)} data-ms-wow={e.kind}>
          <p className="ms-agents-wow__headline">{e.headline}</p>
          <p className="ms-agents-wow__detail">{e.detail}</p>
        </article>
      ))}
    </section>
  );
}

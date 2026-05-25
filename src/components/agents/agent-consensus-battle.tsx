"use client";

import { useMemo, type CSSProperties } from "react";

import { useAgentCognition } from "@/hooks/use-agent-cognition";
import { archetypeLabel } from "@/lib/agents/agent-archetypes";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

/** Live consensus warfare — fragmentation, influence, leadership shifts. */
export function AgentConsensusBattle({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useAgentCognition();
  const { personas, leadership, physics, networkStress } = bundle;

  const ranked = useMemo(() => [...personas].sort((a, b) => b.influence - a.influence), [personas]);
  const top = ranked[0];
  const challenger = ranked[1];
  const fragmentation = useMemo(() => {
    const spread = Math.max(...personas.map((p) => p.conviction)) - Math.min(...personas.map((p) => p.conviction));
    return Math.min(100, spread + physics.escalationPressure * 0.4);
  }, [personas, physics.escalationPressure]);

  if (!top || !challenger) return null;

  const battleIntensity = Math.min(1, (networkStress + fragmentation) / 160);

  return (
    <section
      className={cn("ms-consensus-battle", networkStress >= 65 && "ms-consensus-battle--hot", className)}
      aria-label={pickLocale(locale, "Specialist read influence and consensus", "Влияние и консенсус прочтений")}
      style={{ "--ms-battle-intensity": battleIntensity } as CSSProperties}
    >
      <div className="ms-consensus-battle__field" aria-hidden />
      <header className="ms-consensus-battle__header">
        <div>
          <p className="ms-data-label text-ms-faint">
            {pickLocale(locale, "Conviction spread", "Разброс убеждённости")}
          </p>
          <p className="mt-0.5 text-[9px] leading-snug text-ms-faint/80">
            {pickLocale(
              locale,
              "How split the specialist reads are — 0 = unified, 100 = fully fragmented",
              "Насколько расходятся прочтения — 0 = единство, 100 = полная фрагментация",
            )}
          </p>
        </div>
        <p className="ms-consensus-battle__fragmentation tabular-nums">
          {Math.round(fragmentation)}<span className="text-[0.55em] opacity-60">/100</span>
        </p>
      </header>

      <div className="ms-consensus-battle__lanes">
        {ranked.slice(0, 4).map((p, i) => (
          <div key={p.id} className="ms-consensus-battle__lane" data-ms-agent={p.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium text-ms-text">{archetypeLabel(locale, p.id)}</span>
              <span className="tabular-nums text-[10px] text-ms-muted">{p.influence}%</span>
            </div>
            <div className="ms-consensus-battle__bar">
              <span
                className={cn(
                  "ms-consensus-battle__fill",
                  p.id === leadership.leaderId && "ms-consensus-battle__fill--leader",
                  p.escalation === "critical" && "ms-consensus-battle__fill--critical",
                )}
                style={{ width: `${p.influence}%`, animationDelay: `${i * 0.12}s` } as CSSProperties}
              />
            </div>
            {leadership.rotated && p.id === leadership.leaderId ? (
              <p className="mt-1 text-[9px] uppercase tracking-wider text-ms-warning/90">
                {pickLocale(locale, "Leadership shift", "Смена лидерства")}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="ms-consensus-battle__duel">
        <span className="ms-consensus-battle__duelist">{archetypeLabel(locale, top.id)}</span>
        <span className="ms-consensus-battle__vs" aria-hidden />
        <span className="ms-consensus-battle__duelist">{archetypeLabel(locale, challenger.id)}</span>
        <p className="ms-consensus-battle__duel-read">
          {pickLocale(
            locale,
            `These two reads diverge by ${Math.abs(top.conviction - challenger.conviction)} points — the dominant disagreement in the current structure.`,
            `Эти два прочтения расходятся на ${Math.abs(top.conviction - challenger.conviction)} пунктов — ключевое расхождение в текущей структуре.`,
          )}
        </p>
      </div>
    </section>
  );
}

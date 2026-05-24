"use client";

import { useMemo, type CSSProperties } from "react";

import { ExecutionInterpretationBridge } from "@/components/execution/execution-interpretation-bridge";
import { useAgentCognition } from "@/hooks/use-agent-cognition";
import { useLiveSurfaceMotion } from "@/hooks/use-live-surface-motion";
import { AGENT_MAP_POSITIONS, archetypeFocus, archetypeLabel } from "@/lib/agents/agent-archetypes";
import type { AgentArchetypeId } from "@/lib/agents/agent-archetypes";
import type { AgentPersona } from "@/lib/agents/agent-cognition-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

function AgentNode({
  persona,
  isLeader,
  locale,
}: {
  persona: AgentPersona;
  isLeader: boolean;
  locale: ReturnType<typeof useUiPrefsStore.getState>["uiLocale"];
}) {
  const pos = AGENT_MAP_POSITIONS[persona.id];
  return (
    <article
      className={cn(
        "ms-war-room-node",
        isLeader && "ms-war-room-node--leader",
        persona.escalation === "critical" && "ms-war-room-node--critical",
        persona.escalation === "elevated" && "ms-war-room-node--elevated",
      )}
      data-ms-agent={persona.id}
      style={
        {
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          "--ms-node-conviction": `${persona.conviction}`,
          "--ms-node-influence": `${persona.influence}`,
          "--ms-node-stress": `${persona.stress}`,
        } as CSSProperties
      }
    >
      <div className="ms-war-room-node__ring" aria-hidden>
        <div className="ms-war-room-node__ring-inner" />
      </div>
      <div className="ms-war-room-node__core">
        <p className="ms-war-room-node__name">{archetypeLabel(locale, persona.id)}</p>
        <p className="ms-war-room-node__conviction tabular-nums">{persona.conviction}</p>
        <p className="ms-war-room-node__influence tabular-nums">{persona.influence}%</p>
      </div>
      {isLeader ? <span className="ms-war-room-node__crown" aria-hidden /> : null}
    </article>
  );
}

function AlignmentEdge({
  from,
  to,
  tension,
}: {
  from: AgentArchetypeId;
  to: AgentArchetypeId;
  tension: number;
}) {
  const a = AGENT_MAP_POSITIONS[from];
  const b = AGENT_MAP_POSITIONS[to];
  return (
    <line
      className="ms-war-room-edge"
      x1={`${a.x}%`}
      y1={`${a.y}%`}
      x2={`${b.x}%`}
      y2={`${b.y}%`}
      style={{ opacity: 0.12 + (tension / 100) * 0.45 }}
    />
  );
}

export function AgentWarRoom({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useAgentCognition();
  const live = useLiveSurfaceMotion("agents");
  const { personas, leadership, networkStress, consensusLabel, simTick } = bundle;

  const edges = useMemo(() => {
    const ids = personas.map((p) => p.id);
    const pairs: { from: AgentArchetypeId; to: AgentArchetypeId; tension: number }[] = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = personas.find((p) => p.id === ids[i])!;
        const b = personas.find((p) => p.id === ids[j])!;
        pairs.push({ from: ids[i]!, to: ids[j]!, tension: Math.abs(a.conviction - b.conviction) });
      }
    }
    return pairs.filter((p) => p.tension >= 14).slice(0, 8);
  }, [personas]);

  const stressClass =
    networkStress >= 72 ? "ms-war-room--critical" : networkStress >= 52 ? "ms-war-room--elevated" : "";

  return (
    <section
      className={cn("ms-war-room", "ms-signature-surface", live.className, stressClass, className)}
      style={{ ...live.style, "--ms-war-tick": simTick } as CSSProperties}
      aria-label={pickLocale(locale, "Agent war room", "Зал агентов")}
    >
      <div className="ms-war-room__veil" aria-hidden />
      <div className="ms-war-room__pulse" aria-hidden />

      <header className="ms-war-room__header">
        <p className="ms-war-room__tag">{pickLocale(locale, "Institutional war room", "Институциональный зал")}</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="ms-war-room__title">{consensusLabel}</h2>
            <p className="ms-war-room__subtitle">{leadership.leaderRead}</p>
          </div>
          <div className="text-right">
            <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Network stress", "Стресс сети")}</p>
            <p className="text-[18px] font-semibold tabular-nums tracking-tight text-ms-text">{networkStress}</p>
          </div>
        </div>
      </header>

      <ExecutionInterpretationBridge className="relative z-[2] mt-4" compact />

      <div className="ms-war-room__arena">
        <svg className="ms-war-room__topology" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {edges.map((e) => (
            <AlignmentEdge key={`${e.from}-${e.to}`} from={e.from} to={e.to} tension={e.tension} />
          ))}
        </svg>
        <div className="ms-war-room__hub" aria-hidden>
          <span className="ms-war-room__hub-label">{pickLocale(locale, "Consensus", "Консенсус")}</span>
        </div>
        {personas.map((p) => (
          <AgentNode key={p.id} persona={p} isLeader={p.id === leadership.leaderId} locale={locale} />
        ))}
      </div>

      <ul className="ms-war-room__legend">
        {personas.map((p) => (
          <li key={`${p.id}-leg`} className="ms-war-room__legend-item" data-ms-agent={p.id}>
            <span className="font-medium text-ms-text">{archetypeLabel(locale, p.id)}</span>
            <span className="text-ms-faint">{archetypeFocus(locale, p.id)}</span>
            <span className="tabular-nums text-ms-muted">
              {p.drift === "rising" ? "↑" : p.drift === "falling" ? "↓" : "—"} {p.posture}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

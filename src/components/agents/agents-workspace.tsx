"use client";

import { PlatformAccessGate } from "@/components/access/platform-access-gate";
import { AgentConsensusBattle } from "@/components/agents/agent-consensus-battle";
import { CognitionNavRail } from "@/components/cognition/cognition-nav-rail";
import { useCanAccessCapability } from "@/hooks/use-capabilities";
import { AgentCommandStrip } from "@/components/agents/agent-command-strip";
import { SignatureMomentBanner } from "@/components/cognition/signature-moment-banner";
import { AgentConvictionPhysics } from "@/components/agents/agent-conviction-physics";
import { AgentDebateEngine } from "@/components/agents/agent-debate-engine";
import { AgentTimeline } from "@/components/agents/agent-timeline";
import { AgentWarRoom } from "@/components/agents/agent-war-room";
import { AgentWowEvents } from "@/components/agents/agent-wow-events";
import { useLiveSurfaceMotion } from "@/hooks/use-live-surface-motion";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export type AgentsWorkspaceProps = {
  className?: string;
};

/**
 * Institutional multi-agent cognition — debate warfare, not chat.
 */
export function AgentsWorkspace({ className }: AgentsWorkspaceProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const live = useLiveSurfaceMotion("agents");
  const fullAgents = useCanAccessCapability("agentConsensusFull");

  return (
    <section
      id="agent-layer"
      data-ms-focus
      className={cn(
        "ms-agents-system ms-signature-surface scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)]",
        live.className,
        className,
      )}
      style={live.style}
      data-ms-motion-phase={live.phase}
      aria-label={pickLocale(locale, "Agent cognition warfare", "Война интерпретаций агентов")}
    >
      <SignatureMomentBanner world="agents" />
      <AgentCommandStrip className="mb-5" />
      {fullAgents ? <AgentWowEvents className="mb-5" /> : null}
      <AgentConsensusBattle className="mb-5" />
      {fullAgents ? (
        <>
          <AgentWarRoom className="mb-6" />
          <div className="ms-agents-system__grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <AgentDebateEngine className="h-full rounded-ms-2xl border border-ms-border/20 bg-ms-surface/6 p-4 sm:p-5" />
            </div>
            <div className="lg:col-span-5">
              <AgentConvictionPhysics className="h-full rounded-ms-2xl border border-ms-border/20 bg-ms-surface/6 p-4 sm:p-5" />
            </div>
            <div className="lg:col-span-12">
              <AgentTimeline className="rounded-ms-2xl border border-ms-border/20 bg-ms-surface/6 p-4 sm:p-5" />
            </div>
          </div>
        </>
      ) : (
        <PlatformAccessGate
          capability="agentConsensusFull"
          titleEn="Full agent consensus"
          titleRu="Полный консенсус агентов"
          bodyEn="Structure, liquidity, flow, sentiment, macro, and risk — unified for Founding and invitation access."
          bodyRu="Структура, ликвидность, поток, настроение, макро и риск — для Founding и приглашений."
          className="mt-4"
        >
          <span />
        </PlatformAccessGate>
      )}

      <CognitionNavRail className="mt-6" links={[{ href: "/execution", labelEn: "Execution", labelRu: "Исполнение" }]} />
    </section>
  );
}

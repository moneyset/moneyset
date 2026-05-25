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
      aria-label={pickLocale(locale, "Agent consensus analysis", "Анализ консенсуса агентов")}
    >
      <SignatureMomentBanner world="agents" />
      <AgentCommandStrip className="mb-5" />

      {/* Consensus interpretation guide */}
      <div className="mb-5 rounded-ms-lg border border-ms-border/20 bg-ms-elevated/10 px-4 py-3 sm:px-5">
        <p className="mb-2 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-ms-faint">
          {pickLocale(locale, "How to read this section", "Как читать этот раздел")}
        </p>
        <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-[9px] font-medium uppercase tracking-wider text-ms-faint">
              {pickLocale(locale, "When reads align", "Когда прочтения сходятся")}
            </dt>
            <dd className="mt-0.5 text-[10px] leading-snug text-ms-muted">
              {pickLocale(
                locale,
                "Most specialist reads support the same outcome — conviction in the current direction rises.",
                "Большинство прочтений поддерживают одинаковый исход — убеждённость в текущем направлении растёт.",
              )}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[9px] font-medium uppercase tracking-wider text-ms-faint">
              {pickLocale(locale, "When reads conflict", "Когда прочтения конфликтуют")}
            </dt>
            <dd className="mt-0.5 text-[10px] leading-snug text-ms-muted">
              {pickLocale(
                locale,
                "Specialist reads diverge on a key factor — use the disagreement to sharpen your risk awareness and edge cases.",
                "Прочтения расходятся по ключевому фактору — используйте расхождение для уточнения рисков и граничных случаев.",
              )}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ms-faint">
        {pickLocale(locale, "Evidence · specialist read influence and alignment", "Доказательная база · влияние и сходимость прочтений")}
      </p>
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
          titleEn="Full specialist analysis"
          titleRu="Полный анализ специалистов"
          bodyEn="Six specialist reads — structure, liquidity, flow, sentiment, macro, and risk. See where they agree, where they conflict, and what it means for your decision."
          bodyRu="Шесть специализированных прочтений — структура, ликвидность, поток, настроение, макро и риск. Где они сходятся, где конфликтуют и что это значит для решения."
          className="mt-4"
        >
          <span />
        </PlatformAccessGate>
      )}

      <CognitionNavRail className="mt-6" links={[{ href: "/execution", labelEn: "Execution", labelRu: "Исполнение" }]} />
    </section>
  );
}

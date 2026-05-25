"use client";

import { AgentLattice } from "@/components/agents/agent-lattice";
import { CognitionWorldFrame } from "@/components/cognition/cognition-world-frame";
import { SurfaceBlufBlock } from "@/components/cognition/surface-bluf-block";
import { WorldSurfaceChrome } from "@/components/cognition/world-surface-chrome";
import { useSurfaceBluf } from "@/hooks/use-surface-bluf";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { sectionChromeSubtitle, sectionPurpose, sectionTitle } from "@/lib/i18n/section-ia";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function AgentsSurfacePage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bluf = useSurfaceBluf("agents");

  return (
    <CognitionWorldFrame world="agents" className="ms-page ms-cognition-surface relative">
      <WorldSurfaceChrome
        world="agents"
        eyebrow={sectionTitle(locale, "agents")}
        title={sectionTitle(locale, "agents")}
        purpose={sectionPurpose(locale, "agents")}
        subtitle={sectionChromeSubtitle(locale, "agents")}
      />
      <p className="mb-4 max-w-3xl text-[12px] leading-relaxed text-ms-muted sm:text-[13px]">
        {pickLocale(
          locale,
          "Agents are specialist market reads — structure, flow, liquidity, sentiment, macro, and risk. When they disagree, your decision sharpens; when they align, conviction rises.",
          "Агенты — специализированные прочтения: структура, поток, ликвидность, настроение, макро и риск. Расхождение уточняет решение; согласие усиливает убеждённость.",
        )}
      </p>
      <SurfaceBlufBlock bluf={bluf} />
      <AgentLattice />
    </CognitionWorldFrame>
  );
}

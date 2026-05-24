"use client";

import { AgentLattice } from "@/components/agents/agent-lattice";
import { CognitionWorldFrame } from "@/components/cognition/cognition-world-frame";
import { WorldSurfaceChrome } from "@/components/cognition/world-surface-chrome";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function AgentsSurfacePage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  return (
    <CognitionWorldFrame world="agents" className="ms-page ms-cognition-surface relative">
      <WorldSurfaceChrome
        world="agents"
        eyebrow={pickLocale(locale, "Lattice", "Решётка")}
        title={pickLocale(locale, "Agent war room", "Комната агентов")}
        subtitle={pickLocale(
          locale,
          "Posture lattice · conflict tension · collective drift",
          "Решётка поз · напряжение конфликта · коллективный дрейф",
        )}
      />
      <AgentLattice />
    </CognitionWorldFrame>
  );
}

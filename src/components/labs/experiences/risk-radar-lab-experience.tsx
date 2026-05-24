"use client";

import { CognitionMachineShell } from "@/components/cognition/cognition-machine-shell";
import { SystemicRiskTopology } from "@/components/fragility/systemic-risk-topology";
import { getLabIdentity } from "@/lib/cognition/lab-identities";
import { getLabModule, labCopy } from "@/lib/labs/labs-modules";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function RiskRadarLabExperience() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const identity = getLabIdentity("risk-radar");
  const mod = getLabModule("risk-radar");

  return (
    <CognitionMachineShell
      identity={identity}
      locale={locale}
      title={labCopy(locale, mod.title)}
      purpose={labCopy(locale, mod.purpose)}
    >
      <SystemicRiskTopology lens="risk" />
    </CognitionMachineShell>
  );
}

"use client";

import { CognitionMachineShell } from "@/components/cognition/cognition-machine-shell";
import { LiquidityTopologyTheater } from "@/components/labs/liquidity/liquidity-topology-theater";
import { getLabIdentity } from "@/lib/cognition/lab-identities";
import { getLabModule, labCopy } from "@/lib/labs/labs-modules";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function LiquidityLabExperience() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const identity = getLabIdentity("liquidity");
  const mod = getLabModule("liquidity");

  return (
    <CognitionMachineShell
      identity={identity}
      locale={locale}
      title={labCopy(locale, mod.title)}
      purpose={labCopy(locale, mod.purpose)}
    >
      <LiquidityTopologyTheater />
    </CognitionMachineShell>
  );
}

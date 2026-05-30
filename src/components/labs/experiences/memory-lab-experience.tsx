"use client";

import { CognitionMachineShell } from "@/components/cognition/cognition-machine-shell";
import { MobileResponsivePreviewGate } from "@/components/access/mobile-responsive-preview-gate";
import { MarketMemoryConstellation } from "@/components/memory/market-memory-constellation";
import { getLabIdentity } from "@/lib/cognition/lab-identities";
import { getLabModule, labCopy } from "@/lib/labs/labs-modules";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function MemoryLabExperience() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const identity = getLabIdentity("strategy-memory");
  const mod = getLabModule("strategy-memory");

  return (
    <CognitionMachineShell
      identity={identity}
      locale={locale}
      title={labCopy(locale, mod.title)}
      purpose={labCopy(locale, mod.purpose)}
    >
      <MobileResponsivePreviewGate section="memoryLab" capability="marketMemory">
        <MarketMemoryConstellation />
      </MobileResponsivePreviewGate>
    </CognitionMachineShell>
  );
}

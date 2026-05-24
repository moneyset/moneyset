"use client";

import { CognitionMachineShell } from "@/components/cognition/cognition-machine-shell";
import { GlobalPressureMatrix } from "@/components/narrative/global-pressure-matrix";
import { getLabIdentity } from "@/lib/cognition/lab-identities";
import { getLabModule, labCopy } from "@/lib/labs/labs-modules";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function SentimentLabExperience() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const identity = getLabIdentity("sentiment");
  const mod = getLabModule("sentiment");

  return (
    <CognitionMachineShell
      identity={identity}
      locale={locale}
      title={labCopy(locale, mod.title)}
      purpose={labCopy(locale, mod.purpose)}
    >
      <GlobalPressureMatrix lens="sentiment" />
    </CognitionMachineShell>
  );
}

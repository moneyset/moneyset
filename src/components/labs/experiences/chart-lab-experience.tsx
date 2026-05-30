"use client";

import { CognitionMachineShell } from "@/components/cognition/cognition-machine-shell";
import { MobileResponsivePreviewGate } from "@/components/access/mobile-responsive-preview-gate";
import { ExecutionTerrainTheater } from "@/components/labs/chart/execution-terrain-theater";
import { getLabIdentity } from "@/lib/cognition/lab-identities";
import { getLabModule, labCopy } from "@/lib/labs/labs-modules";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function ChartLabExperience() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const identity = getLabIdentity("chart");
  const mod = getLabModule("chart");

  return (
    <CognitionMachineShell
      identity={identity}
      locale={locale}
      title={labCopy(locale, mod.title)}
      purpose={labCopy(locale, mod.purpose)}
    >
      <MobileResponsivePreviewGate section="chartLab" capability="executionMap">
        <ExecutionTerrainTheater />
      </MobileResponsivePreviewGate>
    </CognitionMachineShell>
  );
}

"use client";

import { ScenariosWorkspace } from "@/components/scenarios/scenarios-workspace";
import { SurfaceBlufBlock } from "@/components/cognition/surface-bluf-block";
import { SurfaceChrome } from "@/components/surfaces/surface-chrome";
import { useSurfaceBluf } from "@/hooks/use-surface-bluf";
import { sectionChromeSubtitle, sectionPurpose, sectionTitle } from "@/lib/i18n/section-ia";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function ScenariosSurfacePage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bluf = useSurfaceBluf("scenarios");

  return (
    <div className="ms-page ms-cognition-surface relative">
      <SurfaceChrome
        tone="support"
        eyebrow={sectionTitle(locale, "scenarios")}
        title={sectionTitle(locale, "scenarios")}
        purpose={sectionPurpose(locale, "scenarios")}
        subtitle={sectionChromeSubtitle(locale, "scenarios")}
      />
      <SurfaceBlufBlock bluf={bluf} />
      <ScenariosWorkspace />
    </div>
  );
}

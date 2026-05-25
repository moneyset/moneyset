"use client";

import { OperationalFeed } from "@/components/dashboard/operational-feed";
import { MarketChangeIntelligenceFrame } from "@/components/ops/market-change-intelligence-frame";
import { SurfaceBlufBlock } from "@/components/cognition/surface-bluf-block";
import { SurfaceChrome } from "@/components/surfaces/surface-chrome";
import { useSurfaceBluf } from "@/hooks/use-surface-bluf";
import { sectionChromeSubtitle, sectionPurpose, sectionTitle } from "@/lib/i18n/section-ia";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function OpsSurfacePage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bluf = useSurfaceBluf("ops");

  return (
    <div className="ms-page ms-cognition-surface relative">
      <SurfaceChrome
        tone="support"
        eyebrow={sectionTitle(locale, "ops")}
        title={sectionTitle(locale, "ops")}
        purpose={sectionPurpose(locale, "ops")}
        subtitle={sectionChromeSubtitle(locale, "ops")}
      />
      <SurfaceBlufBlock bluf={bluf} />
      <MarketChangeIntelligenceFrame />
      <OperationalFeed />
    </div>
  );
}

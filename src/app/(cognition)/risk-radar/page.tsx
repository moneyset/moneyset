"use client";

import { CognitionWorldFrame } from "@/components/cognition/cognition-world-frame";
import { WorldSurfaceChrome } from "@/components/cognition/world-surface-chrome";
import { RiskRadarWorkspace } from "@/components/risk/risk-radar-workspace";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function RiskRadarPage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  return (
    <CognitionWorldFrame world="risk" className="ms-page ms-cognition-surface relative">
      <WorldSurfaceChrome
        world="risk"
        eyebrow={pickLocale(locale, "Tectonic", "Тектоника")}
        title={pickLocale(locale, "Risk Radar", "Risk Radar")}
        subtitle={pickLocale(
          locale,
          "Systemic topology · hidden signals · fragility evolution",
          "Системная топология · скрытые сигналы · эволюция хрупкости",
        )}
      />
      <RiskRadarWorkspace />
    </CognitionWorldFrame>
  );
}

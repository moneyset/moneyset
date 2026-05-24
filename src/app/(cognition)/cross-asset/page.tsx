"use client";

import { CognitionWorldFrame } from "@/components/cognition/cognition-world-frame";
import { WorldSurfaceChrome } from "@/components/cognition/world-surface-chrome";
import { CrossAssetIntelligenceWorkspace } from "@/components/cross-asset/cross-asset-intelligence-workspace";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function CrossAssetIntelligencePage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  return (
    <CognitionWorldFrame world="transmission" className="ms-page ms-cognition-surface relative">
      <WorldSurfaceChrome
        world="transmission"
        eyebrow={pickLocale(locale, "Transmission", "Трансмиссия")}
        title={pickLocale(locale, "Cross-asset intelligence", "Кросс-активный интеллект")}
        subtitle={pickLocale(
          locale,
          "Contagion pathways · pressure propagation · cross-market arcs",
          "Пути заразы · передача давления · кросс-рыночные дуги",
        )}
      />
      <CrossAssetIntelligenceWorkspace />
    </CognitionWorldFrame>
  );
}

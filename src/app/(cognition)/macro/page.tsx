"use client";

import { CognitionWorldFrame } from "@/components/cognition/cognition-world-frame";
import { WorldSurfaceChrome } from "@/components/cognition/world-surface-chrome";
import { MacroIntelligenceWorkspace } from "@/components/macro/macro-intelligence-workspace";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function MacroIntelligencePage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  return (
    <CognitionWorldFrame world="macro" className="ms-page ms-cognition-surface relative">
      <WorldSurfaceChrome
        world="macro"
        eyebrow={pickLocale(locale, "Planetary", "Планетарный")}
        title={pickLocale(locale, "Macro intelligence", "Макро-интеллект")}
        subtitle={pickLocale(
          locale,
          "Global pressure matrix · regimes · event gravity",
          "Глобальная матрица давления · режимы · гравитация событий",
        )}
      />
      <MacroIntelligenceWorkspace />
    </CognitionWorldFrame>
  );
}

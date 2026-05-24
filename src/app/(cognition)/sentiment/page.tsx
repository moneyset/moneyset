"use client";

import { CognitionWorldFrame } from "@/components/cognition/cognition-world-frame";
import { WorldSurfaceChrome } from "@/components/cognition/world-surface-chrome";
import { SentimentIntelligenceWorkspace } from "@/components/sentiment/sentiment-intelligence-workspace";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function SentimentIntelligencePage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  return (
    <CognitionWorldFrame world="sentiment" className="ms-page ms-cognition-surface relative">
      <WorldSurfaceChrome
        world="sentiment"
        eyebrow={pickLocale(locale, "Narrative", "Нарратив")}
        title={pickLocale(locale, "Sentiment intelligence", "Интеллект настроений")}
        subtitle={pickLocale(
          locale,
          "Narrative topology · divergence · emotional transmission",
          "Топология нарратива · дивергенция · эмоциональная передача",
        )}
      />
      <SentimentIntelligenceWorkspace />
    </CognitionWorldFrame>
  );
}

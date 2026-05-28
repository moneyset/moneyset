"use client";

import { CognitionWorldFrame } from "@/components/cognition/cognition-world-frame";
import { WorldSurfaceChrome } from "@/components/cognition/world-surface-chrome";
import { JournalWorkspace } from "@/components/journal/journal-workspace";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function JournalPage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <CognitionWorldFrame world="memory" className="ms-page ms-cognition-surface relative">
      <WorldSurfaceChrome
        world="memory"
        eyebrow={pickLocale(locale, "Archive", "Архив")}
        title={pickLocale(locale, "Market Journal", "Журнал рынка")}
        subtitle={pickLocale(
          locale,
          "Structured memory · regime transitions · intelligence evolution",
          "Структурная память · переходы режима · эволюция интеллекта",
        )}
      />
      <JournalWorkspace />
    </CognitionWorldFrame>
  );
}

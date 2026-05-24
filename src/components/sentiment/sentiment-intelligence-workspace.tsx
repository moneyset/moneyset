"use client";

import { CognitionNavRail } from "@/components/cognition/cognition-nav-rail";
import { GlobalPressureMatrix } from "@/components/narrative/global-pressure-matrix";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function SentimentIntelligenceWorkspace({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <section
      id="sentiment-intel-layer"
      data-ms-focus
      className={cn("ms-global-narrative-system scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)]", className)}
      aria-label={pickLocale(locale, "Sentiment narrative engine", "Движок нарратива настроений")}
    >
      <GlobalPressureMatrix lens="sentiment" />
      <CognitionNavRail
        className="mt-6"
        links={[
          { href: "/macro", labelEn: "Macro", labelRu: "Макро" },
          { href: "/agents", labelEn: "Agents", labelRu: "Агенты" },
          { href: "/execution", labelEn: "Execution", labelRu: "Исполнение" },
        ]}
      />
    </section>
  );
}

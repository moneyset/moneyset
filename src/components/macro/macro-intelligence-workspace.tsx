"use client";

import { CognitionNavRail } from "@/components/cognition/cognition-nav-rail";
import { GlobalPressureMatrix } from "@/components/narrative/global-pressure-matrix";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function MacroIntelligenceWorkspace({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <section
      id="macro-intel-layer"
      data-ms-focus
      className={cn("ms-global-narrative-system scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)]", className)}
      aria-label={pickLocale(locale, "Macro narrative engine", "Макро-нарративный движок")}
    >
      <GlobalPressureMatrix lens="macro" />

      <CognitionNavRail
        className="mt-6"
        links={[
          { href: "/sentiment", labelEn: "Sentiment", labelRu: "Настроения" },
          { href: "/cross-asset", labelEn: "Cross-asset", labelRu: "Кросс-активы" },
          { href: "/execution", labelEn: "Execution", labelRu: "Исполнение" },
        ]}
      />
    </section>
  );
}

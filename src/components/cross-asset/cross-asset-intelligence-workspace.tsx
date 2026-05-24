"use client";

import { CognitionNavRail } from "@/components/cognition/cognition-nav-rail";
import { SystemicRiskTopology } from "@/components/fragility/systemic-risk-topology";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function CrossAssetIntelligenceWorkspace({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <section
      id="cross-asset-layer"
      data-ms-focus
      className={cn("ms-systemic-system scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)]", className)}
      aria-label={pickLocale(locale, "Cross-asset transmission observatory", "Обсерватория кросс-передачи")}
    >
      <SystemicRiskTopology lens="transmission" />
      <CognitionNavRail
        className="mt-6"
        links={[
          { href: "/risk-radar", labelEn: "Risk", labelRu: "Риск" },
          { href: "/macro", labelEn: "Macro", labelRu: "Макро" },
        ]}
      />
    </section>
  );
}

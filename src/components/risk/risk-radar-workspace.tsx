"use client";

import { CognitionNavRail } from "@/components/cognition/cognition-nav-rail";
import { SystemicRiskTopology } from "@/components/fragility/systemic-risk-topology";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function RiskRadarWorkspace({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <section
      id="risk-radar-layer"
      data-ms-focus
      className={cn("ms-systemic-system scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)]", className)}
      aria-label={pickLocale(locale, "Risk radar observatory", "Обсерватория Risk Radar")}
    >
      <SystemicRiskTopology lens="risk" />

      <CognitionNavRail
        className="mt-6"
        links={[
          { href: "/cross-asset", labelEn: "Transmission", labelRu: "Передача" },
          { href: "/execution", labelEn: "Execution", labelRu: "Исполнение" },
        ]}
      />
    </section>
  );
}

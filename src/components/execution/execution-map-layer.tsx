"use client";

import { useShallow } from "zustand/react/shallow";

import { ExecutionInterpretationPanel } from "@/components/execution/execution-interpretation-panel";
import { ExecutionMapSurface } from "@/components/execution/execution-map-surface";
import { PremiumGate } from "@/components/premium/premium-gate";
import { useExecutionInterpretation } from "@/hooks/use-execution-interpretation";
import { useExtendedCognitionAccess } from "@/hooks/use-extended-cognition-access";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUpgradeModalStore } from "@/store/upgrade-modal-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

/**
 * Premium Execution Map — posture framing + lane geometry.
 * Not a signal feed; institutional interpretation over structural bands.
 */
export function ExecutionMapLayer({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const extended = useExtendedCognitionAccess();
  const openUpgrade = useUpgradeModalStore((s) => s.openUpgrade);
  const { full, surface } = useExecutionInterpretation();
  const { derived, latent } = useCognitionSimulationStore(
    useShallow((s) => ({ derived: s.derived, latent: s.latent })),
  );

  if (surface.zones.length === 0) {
    return (
      <p className={cn("text-[11px] leading-snug text-ms-faint", className)}>
        {pickLocale(
          locale,
          "Execution map renders when mark/last anchors structural bands.",
          "Карта исполнения появится, когда метка/последняя привяжет структурные полосы.",
        )}
      </p>
    );
  }

  const mapBody = (
    <div className={cn("ms-exec-map-layer", className)}>
      <ExecutionInterpretationPanel locale={locale} bundle={full} mode="full" />
      <ExecutionMapSurface locale={locale} surface={surface} derived={derived} latent={latent} />
    </div>
  );

  if (extended) return mapBody;

  return (
    <div className={cn("ms-exec-map-layer ms-exec-map-layer--gated", className)}>
      <ExecutionInterpretationPanel locale={locale} bundle={full} mode="preview" />
      <PremiumGate feature="executionMap" onUnlock={openUpgrade} className="w-full">
        {mapBody}
      </PremiumGate>
    </div>
  );
}

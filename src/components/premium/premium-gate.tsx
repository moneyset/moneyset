"use client";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import { useCanAccessCapability, useOptimisticEntitlement, useServerConfirmed } from "@/hooks/use-capabilities";
import { useCanAccess } from "@/hooks/use-entitlements";
import { useExtendedCognitionAccess } from "@/hooks/use-extended-cognition-access";
import type { AccessCapability } from "@/lib/access/capabilities";
import type { EntitlementKey } from "@/lib/access/roles";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import {
  premiumGatePreviewExecution,
  premiumGatePreviewPosture,
  premiumGatePreviewScenario,
  premiumGatePreviewStructure,
} from "@/lib/i18n/trust-surface";

type PremiumGateProps = {
  children: React.ReactNode;
  onUnlock: () => void;
  className?: string;
  /** Keep the content visible but subdued (preview). */
  preview?: boolean;
  /** Optional entitlement key — defaults to extended access check. */
  feature?: EntitlementKey;
  capability?: AccessCapability;
};

export function PremiumGate({ children, onUnlock, className, preview = true, feature, capability }: PremiumGateProps) {
  const confirmed = useServerConfirmed();
  const optimistic = useOptimisticEntitlement();
  const extended = useExtendedCognitionAccess();
  const capAllowed = useCanAccessCapability(capability ?? "executionMap");
  const featureAllowed = useCanAccess(feature ?? "executionMap");
  const entitled = capability ? capAllowed : feature ? featureAllowed : extended;
  const t = useT();
  const locale = useUiPrefsStore((s) => s.uiLocale);

  if (!confirmed && !optimistic) return null;

  if (entitled) return <>{children}</>;

  return (
    <div className={cn("relative overflow-hidden rounded-ms-xl ms-premium-gate ms-premium-gate--locked", className)}>
      <div className="relative ms-premium-gate__preview-shell">
        <div
          className={cn(
            preview
              ? "pointer-events-none ms-premium-gate__preview-content select-none blur-[3px] saturate-[0.68] contrast-[0.92] opacity-[0.42]"
              : "opacity-0",
            "transition-[filter,opacity] duration-300 ease-out",
          )}
          aria-hidden={preview}
        >
          {children}
        </div>
        {preview ? (
          <div className="pointer-events-none absolute inset-0 ms-premium-gate__vignette" aria-hidden />
        ) : null}
        {preview ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-ms-canvas/55 via-ms-canvas/12 to-transparent" aria-hidden />
        ) : null}
      </div>

      {preview ? (
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-[1] sm:left-4 sm:right-4">
          <div className="ms-premium-gate__cognition-ribbon rounded-ms-md border border-ms-border/18 bg-ms-surface/32 px-2.5 py-2 backdrop-blur-[10px] sm:px-3 sm:py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ms-warning/70">
              {pickLocale(locale, "Founding Access", "Founding Access")}
            </p>
            <div className="mt-1.5 space-y-1 font-mono text-[9px] leading-snug text-ms-muted/75 sm:text-[9.5px]">
              <p className="ms-premium-gate__preview-line">{premiumGatePreviewPosture(locale)}</p>
              <p className="ms-premium-gate__preview-line">{premiumGatePreviewStructure(locale)}</p>
              <p className="ms-premium-gate__preview-line max-sm:opacity-55">{premiumGatePreviewScenario(locale)}</p>
              <p className="ms-premium-gate__preview-line max-sm:opacity-35">{premiumGatePreviewExecution(locale)}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="absolute inset-0 z-[2] flex items-end justify-center p-3 sm:items-center sm:p-4">
        <div className="ms-premium-gate__access-dock w-full max-w-md rounded-ms-xl border border-ms-border/24 bg-ms-surface/72 px-3 py-3 shadow-[0_12px_48px_-24px_rgba(0,0,0,0.55)] backdrop-blur-md sm:px-4 sm:py-3.5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-ms-md border border-ms-border/40 bg-ms-elevated/18 text-ms-dim sm:size-9">
              <Lock className="size-3.5 sm:size-4" strokeWidth={1.35} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="ms-data-label text-ms-warning/80">{t("gate.lockedTitle")}</p>
              <p className="mt-1 text-[11px] leading-snug text-ms-muted sm:text-[12px] sm:leading-relaxed">{t("gate.lockedBody")}</p>
            </div>
            <Button
              type="button"
              variant="cognition"
              size="sm"
              className="shrink-0 text-[11px] font-medium tracking-tight"
              onClick={onUnlock}
            >
              {t("gate.cta")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

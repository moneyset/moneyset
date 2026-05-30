"use client";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AccessCapability } from "@/lib/access/capabilities";
import { useNarrowMobileViewport } from "@/hooks/use-narrow-mobile-viewport";
import { useCanAccessCapability } from "@/hooks/use-capabilities";
import { mobileVizGateCopy, type MobileVizSection } from "@/lib/i18n/mobile-viz-gate-copy";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUpgradeModalStore } from "@/store/upgrade-modal-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type MobileResponsivePreviewGateProps = Readonly<{
  section: MobileVizSection;
  capability: AccessCapability;
  children: React.ReactNode;
  className?: string;
}>;

/**
 * Hides complex visualizations on narrow mobile (≤430px) behind a premium-style preview.
 * Prevents unfinished responsive layouts from becoming the first impression.
 */
export function MobileResponsivePreviewGate({
  section,
  capability,
  children,
  className,
}: MobileResponsivePreviewGateProps) {
  const narrow = useNarrowMobileViewport();
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const entitled = useCanAccessCapability(capability);
  const openUpgrade = useUpgradeModalStore((s) => s.openUpgrade);
  const copy = mobileVizGateCopy(section, locale);

  if (!narrow) return <>{children}</>;

  return (
    <div
      className={cn(
        "ms-mobile-viz-gate relative min-h-[min(44dvh,20rem)] overflow-hidden rounded-ms-xl",
        className,
      )}
    >
      <div
        className="ms-mobile-viz-gate__preview pointer-events-none select-none"
        aria-hidden
      >
        {children}
      </div>

      <div className="ms-mobile-viz-gate__overlay absolute inset-0 z-[1] flex flex-col items-center justify-center px-5 py-8 text-center">
        <p className="ms-mobile-viz-gate__ribbon font-mono text-[9px] uppercase tracking-[0.2em] text-ms-warning/75">
          {copy.ribbon}
        </p>

        <div className="mt-4 flex size-10 items-center justify-center rounded-ms-md border border-ms-border/40 bg-ms-elevated/25 text-ms-muted">
          <Lock className="size-4" strokeWidth={1.35} aria-hidden />
        </div>

        <p className="mt-4 max-w-[18rem] text-[13px] font-medium leading-snug text-ms-text">{copy.title}</p>
        <p className="mt-2 max-w-[20rem] text-[11px] leading-relaxed text-ms-muted">{copy.body}</p>

        <div className="mt-3 flex max-w-[20rem] flex-wrap justify-center gap-1.5">
          {copy.chips.map((label) => (
            <span
              key={label}
              className="rounded-full border border-ms-border/35 bg-ms-elevated/15 px-2 py-0.5 font-mono text-[9px] tracking-tight text-ms-faint"
            >
              {label}
            </span>
          ))}
        </div>

        {entitled ? (
          <p className="mt-5 max-w-[18rem] text-[10px] leading-relaxed text-ms-faint">{copy.desktopNote}</p>
        ) : (
          <Button type="button" variant="cognition" size="sm" className="mt-5" onClick={openUpgrade}>
            {pickLocale(locale, "Founding Access — $149", "Founding Access — $149")}
          </Button>
        )}
      </div>
    </div>
  );
}

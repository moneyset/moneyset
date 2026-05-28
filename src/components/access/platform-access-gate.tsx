"use client";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AccessCapability } from "@/lib/access/capabilities";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useCanAccessCapability } from "@/hooks/use-capabilities";
import { cn } from "@/lib/utils";
import { useUpgradeModalStore } from "@/store/upgrade-modal-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type PlatformAccessGateProps = {
  capability: AccessCapability;
  children: React.ReactNode;
  className?: string;
  titleEn: string;
  titleRu: string;
  bodyEn: string;
  bodyRu: string;
};

export function PlatformAccessGate({
  capability,
  children,
  className,
  titleEn,
  titleRu,
  bodyEn,
  bodyRu,
}: PlatformAccessGateProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const allowed = useCanAccessCapability(capability);
  const openUpgrade = useUpgradeModalStore((s) => s.openUpgrade);

  if (allowed) return <>{children}</>;

  return (
    <div className={cn("relative min-h-[min(52dvh,24rem)] overflow-hidden rounded-ms-xl", className)}>
      <div
        className="pointer-events-none select-none blur-[2px] saturate-[0.72] contrast-[0.92] opacity-[0.38]"
        aria-hidden
      >
        {children}
      </div>
      <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center bg-ms-canvas/45 px-6 py-10 text-center backdrop-blur-[2px]">
        <div className="flex size-10 items-center justify-center rounded-ms-md border border-ms-border/40 bg-ms-elevated/20 text-ms-muted">
          <Lock className="size-4" strokeWidth={1.35} aria-hidden />
        </div>
        <p className="mt-4 text-[13px] font-medium text-ms-text">{pickLocale(locale, titleEn, titleRu)}</p>
        <p className="mt-2 max-w-md text-[12px] leading-relaxed text-ms-muted">{pickLocale(locale, bodyEn, bodyRu)}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {[
            pickLocale(locale, "What to do now", "Что делать сейчас"),
            pickLocale(locale, "Where risk concentrates", "Где концентрируется риск"),
            pickLocale(locale, "What breaks the view", "Что сломает прочтение"),
          ].map((label) => (
            <span
              key={label}
              className="rounded-full border border-ms-border/40 bg-ms-elevated/20 px-2.5 py-0.5 font-mono text-[10px] tracking-tight text-ms-faint"
            >
              {label}
            </span>
          ))}
        </div>
        <Button type="button" variant="cognition" size="sm" className="mt-5" onClick={openUpgrade}>
          {pickLocale(locale, "Founding Access — $149", "Founding Access — $149")}
        </Button>
      </div>
    </div>
  );
}

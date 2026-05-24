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
    <div
      className={cn(
        "flex min-h-[min(52dvh,24rem)] flex-col items-center justify-center rounded-ms-xl border border-ms-border/35 bg-ms-surface/20 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-ms-md border border-ms-border/40 bg-ms-elevated/20 text-ms-muted">
        <Lock className="size-4" strokeWidth={1.35} aria-hidden />
      </div>
      <p className="mt-4 text-[13px] font-medium text-ms-text">{pickLocale(locale, titleEn, titleRu)}</p>
      <p className="mt-2 max-w-md text-[12px] leading-relaxed text-ms-muted">{pickLocale(locale, bodyEn, bodyRu)}</p>
      <Button type="button" variant="cognition" size="sm" className="mt-5" onClick={openUpgrade}>
        {pickLocale(locale, "Founding access · $79", "Founding · $79")}
      </Button>
    </div>
  );
}

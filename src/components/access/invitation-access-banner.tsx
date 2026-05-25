"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatInvitationCountdown } from "@/lib/access/invitation-display";
import { isInvitationActive, isInvitationExpired } from "@/lib/access/capabilities";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useAccessStore } from "@/store/access-store";
import { useUpgradeModalStore } from "@/store/upgrade-modal-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function InvitationAccessBanner({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const profile = useAccessStore((s) => s.profile);
  const openUpgrade = useUpgradeModalStore((s) => s.openUpgrade);
  const [, tick] = useState(0);

  const active = isInvitationActive(profile);
  const expired = isInvitationExpired(profile);

  useEffect(() => {
    if (!active && !expired) return;
    const id = window.setInterval(() => tick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, [active, expired]);

  if (!active && !expired) return null;

  if (expired) {
    return (
      <div
        className={cn(
          "border-b border-ms-warning/25 bg-ms-warning/[0.06] px-4 py-2.5 sm:px-5",
          className,
        )}
        role="status"
      >
        <div className="mx-auto flex max-w-[var(--ms-content-max)] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ms-warning/90">
              {pickLocale(locale, "Invitation Access Expired", "Приглашение истекло")}
            </p>
            <p className="mt-0.5 text-[12px] text-ms-muted">
              {pickLocale(locale, "Continue with Founding Access", "Продолжить с Founding Access")}
              <span className="tabular-nums text-ms-text"> · $149</span>
            </p>
          </div>
          <Button type="button" variant="cognition" size="sm" className="shrink-0" onClick={openUpgrade}>
            {pickLocale(locale, "Founding Access", "Founding Access")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("border-b border-ms-cognition/20 bg-ms-cognition/[0.05] px-4 py-2.5 sm:px-5", className)}
      role="status"
    >
      <div className="mx-auto flex max-w-[var(--ms-content-max)] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ms-cognition/90">
            {pickLocale(locale, "Invitation Access Active", "Приглашение активно")}
          </p>
          <p className="mt-0.5 text-[12px] text-ms-muted">
            {pickLocale(locale, "Full Platform Access", "Полный доступ к платформе")}
          </p>
        </div>
        <p className="font-mono text-[11px] tabular-nums text-ms-text/90">
          <span className="text-ms-faint">{pickLocale(locale, "Expires in:", "Истекает через:")} </span>
          {formatInvitationCountdown(locale, profile.invitationUntil)}
        </p>
      </div>
    </div>
  );
}

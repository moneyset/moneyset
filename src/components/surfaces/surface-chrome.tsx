"use client";

import Link from "next/link";

import { SectionHeader } from "@/components/ui/section-header";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";

type SurfaceChromeProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** One-line section purpose — IA Phase 1. */
  purpose?: string;
  className?: string;
  /** `support` = secondary surfaces visually recede (desktop hierarchy). */
  tone?: "primary" | "support";
};

export function SurfaceChrome({ eyebrow, title, subtitle, purpose, className, tone = "primary" }: SurfaceChromeProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const settingsLabel = pickLocale(locale, "Settings", "Настройки");

  const action = (
    <Link
      href="/settings"
      title={settingsLabel}
      aria-label={settingsLabel}
      className={cn(
        "ms-focus-ring shrink-0 rounded-ms-md border border-ms-border/70 px-2.5 py-1.5",
        "text-[12px] font-medium text-ms-muted transition-colors hover:border-ms-border-mid hover:text-ms-text",
      )}
    >
      {settingsLabel}
    </Link>
  );

  if (tone === "support") {
    return (
      <div
        className={cn(
          "mb-[var(--ms-block-gap)] flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:mb-[var(--ms-section-gap)]",
          "md:opacity-[0.94]",
          className,
        )}
      >
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-medium text-ms-faint">{eyebrow}</p>
          <h2 className="text-balance text-lg font-semibold leading-snug tracking-tight text-ms-text/92 md:text-xl">
            {title}
          </h2>
          {subtitle ? <p className="max-w-2xl text-[12px] leading-relaxed text-ms-muted">{subtitle}</p> : null}
          {purpose ? (
            <p className="max-w-2xl text-[13px] font-medium leading-snug text-ms-cognition/90">{purpose}</p>
          ) : null}
        </div>
        {action}
      </div>
    );
  }

  return (
    <SectionHeader
      variant="section"
      eyebrow={eyebrow}
      title={title}
      description={
        subtitle || purpose ? (
          <div className="space-y-1.5">
            {purpose ? <p className="max-w-2xl text-[13px] font-medium leading-snug text-ms-cognition/90">{purpose}</p> : null}
            {subtitle ? <p className="max-w-2xl text-[12px] leading-relaxed text-ms-muted">{subtitle}</p> : null}
          </div>
        ) : undefined
      }
      action={action}
      className={cn("mb-[var(--ms-block-gap)] lg:mb-[var(--ms-section-gap)]", className)}
    />
  );
}

"use client";

import type { LiveExecutionIntel } from "@/lib/live/live-intel-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";

export function LiveExecutionIntelStrip({
  locale,
  intel,
  className,
}: {
  locale: UiLocale;
  intel: LiveExecutionIntel;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-ms-md border border-ms-border/12 bg-ms-surface/5 px-2.5 py-2 text-[10px] leading-snug text-ms-muted sm:px-3",
        className,
      )}
      role="status"
      aria-label={pickLocale(locale, "Live execution intelligence", "Живое прочтение исполнения")}
    >
      <p className="text-ms-faint/95">
        <span className="text-ms-cognition/85">{pickLocale(locale, "Live emphasis", "Акцент")}</span>
        <span className="text-ms-faint"> · </span>
        {intel.emphasisLine}
      </p>
      <p className="mt-1.5 text-ms-dim/95">
        <span className="text-ms-faint">{pickLocale(locale, "Behavior", "Поведение")}</span>
        <span className="text-ms-faint"> · </span>
        {intel.behaviorLine}
      </p>
      <p className="mt-1.5 text-[9px] text-ms-faint/90 max-md:line-clamp-2">
        <span className="font-medium text-ms-faint">{pickLocale(locale, "Session", "Сессия")}</span>
        <span> — </span>
        {intel.sessionLine}
      </p>
      {intel.secondaryLine ? (
        <p className="mt-1.5 border-t border-ms-border/10 pt-1.5 text-[8.5px] text-ms-faint/85 max-md:hidden">
          {intel.secondaryLine}
        </p>
      ) : null}
    </div>
  );
}

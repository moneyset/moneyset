"use client";

import type { StrategicPostureRead } from "@/lib/cognition/strategic-read";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { strategicPostureRowLabel } from "@/lib/i18n/cognition-dict";

type StrategicPostureBlockProps = {
  read: StrategicPostureRead;
  className?: string;
};

const row = "grid grid-cols-1 gap-1.5 sm:grid-cols-[8.5rem_1fr] sm:gap-x-4 sm:gap-y-2";

export function StrategicPostureBlock({ read, className }: StrategicPostureBlockProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const L = (k: Parameters<typeof strategicPostureRowLabel>[1]) => strategicPostureRowLabel(locale, k);

  return (
    <div
      className={cn(
        "border-t border-ms-border/20 pt-3",
        className,
      )}
    >
      <div className={cn(row, "text-[12px] leading-snug")}>
        <span className="text-ms-faint">{L("mainRisk")}</span>
        <span className="text-ms-text">{read.primaryStructuralRisk}</span>

        <span className="text-ms-faint">{L("bias")}</span>
        <span className="text-ms-muted/90">{read.strategicBias}</span>

        <span className="text-ms-faint">{L("confidence")}</span>
        <div className="text-ms-muted/90">
          <span className="font-medium text-ms-text">{read.confidenceHeadline}</span>
          <span className="text-ms-faint"> — </span>
          {read.confidenceDetail}
        </div>

        <span className="text-ms-faint">{L("invalidation")}</span>
        <span className="text-ms-muted">{read.invalidation}</span>
      </div>
    </div>
  );
}

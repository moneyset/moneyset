"use client";

import { ExecutionInterpretationPanel } from "@/components/execution/execution-interpretation-panel";
import { useExecutionInterpretation } from "@/hooks/use-execution-interpretation";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";

/** Wired interpretation strip — preview for free, full for premium / trial. */
export function ExecutionInterpretationBridge({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const { full, extended } = useExecutionInterpretation();

  return (
    <ExecutionInterpretationPanel
      locale={locale}
      bundle={full}
      mode={extended ? "full" : "preview"}
      compact={compact}
      className={cn(className)}
    />
  );
}

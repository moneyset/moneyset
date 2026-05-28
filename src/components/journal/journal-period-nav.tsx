"use client";

import type { MemoryPeriodId } from "@/types/memory";
import { periodLabel } from "@/lib/journal/market-memory-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const PERIODS: MemoryPeriodId[] = ["today", "yesterday", "week", "month", "all"];

type JournalPeriodNavProps = {
  active: MemoryPeriodId;
  onChange: (period: MemoryPeriodId) => void;
  snapshotCount: number;
  entryCount: number;
};

export function JournalPeriodNav({ active, onChange, snapshotCount, entryCount }: JournalPeriodNavProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <div className="ms-journal-period">
      <div className="ms-journal-period__tabs" role="tablist" aria-label={pickLocale(locale, "Memory period", "Период памяти")}>
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active === p}
            className={cn("ms-journal-period__tab ms-focus-ring", active === p && "ms-journal-period__tab--active")}
            onClick={() => onChange(p)}
          >
            {periodLabel(locale, p)}
          </button>
        ))}
      </div>
      <p className="ms-journal-period__meta">
        {pickLocale(locale, "Captures", "Снимки")}{" "}
        <span className="font-mono tabular-nums text-ms-text">{snapshotCount}</span>
        <span className="text-ms-faint"> · </span>
        {pickLocale(locale, "Entries", "Записи")}{" "}
        <span className="font-mono tabular-nums text-ms-text">{entryCount}</span>
      </p>
    </div>
  );
}

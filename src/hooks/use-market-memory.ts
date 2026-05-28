"use client";

import { useMemo } from "react";

import {
  deriveMarketMemoryBundle,
} from "@/lib/journal/market-memory-engine";
import type { MemoryPeriodId } from "@/types/memory";
import { useMemoryStore } from "@/store/memory-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function useMarketMemory(period: MemoryPeriodId) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const snapshots = useMemoryStore((s) => s.snapshots);
  const journal = useMemoryStore((s) => s.journal);

  return useMemo(
    () =>
      deriveMarketMemoryBundle({
        locale,
        period,
        snapshots,
        journal,
      }),
    [locale, period, snapshots, journal],
  );
}

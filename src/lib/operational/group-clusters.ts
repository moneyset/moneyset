import type { OperationalLogEntry } from "@/lib/simulation/cognition-types";
import type { CognitionDensityMode, UiLocale } from "@/store/ui-prefs-store";
import { operationalClusterTitle, pickLocale } from "@/lib/i18n/cognition-dict";

export type OperationalCluster = Readonly<{
  id: string;
  title: string;
  subtitle: string;
  /** Oldest-first within burst (cause → effect) */
  entries: OperationalLogEntry[];
}>;

const priorityRank = (p: OperationalLogEntry["priority"]): number =>
  ({ informational: 0, important: 1, elevated: 2, critical: 3 } as const)[p];

/**
 * Burst-group operational entries (newest-first input) without inventing semantics.
 * Adjacency = close simTicks (same cognition window).
 */
export function clusterOperationalEntries(
  entries: readonly OperationalLogEntry[],
  mode: CognitionDensityMode,
  locale: UiLocale,
): OperationalCluster[] {
  if (entries.length === 0) return [];

  const tickGap =
    mode === "compressed" ? 10 : mode === "strategic" ? 8 : mode === "deep" ? 6 : 8;
  const maxPerCluster = mode === "deep" ? 8 : mode === "strategic" ? 6 : 5;

  const out: OperationalCluster[] = [];
  let i = 0;
  while (i < entries.length) {
    const batch: OperationalLogEntry[] = [entries[i]!];
    let j = i + 1;
    while (
      j < entries.length &&
      batch.length < maxPerCluster &&
      batch[batch.length - 1]!.simTick - entries[j]!.simTick <= tickGap
    ) {
      batch.push(entries[j]!);
      j += 1;
    }

    const chron = [...batch].sort((a, b) => a.simTick - b.simTick);
    const types = new Set(chron.map((e) => e.entryType));
    const maxPrio = Math.max(...chron.map((e) => priorityRank(e.priority)));
    const title = operationalClusterTitle(locale, {
      single: chron.length === 1 ? chron[0]!.entryType : null,
      types,
      maxPrio,
    });
    const t0 = chron[0]?.simulatedClockLabel ?? "";
    const t1 = chron[chron.length - 1]?.simulatedClockLabel ?? "";
    const subtitle =
      chron.length === 1
        ? t0
        : `${t0} → ${t1} · ${chron.length} ${pickLocale(locale, "events", "событий")}`;

    out.push({
      id: `opcl-${chron[0]!.id}-${chron[chron.length - 1]!.id}`,
      title,
      subtitle,
      entries: chron,
    });
    i = j;
  }
  return out;
}

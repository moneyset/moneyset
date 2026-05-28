import { pickLocale } from "@/lib/i18n/cognition-dict";
import {
  deriveIntelligenceBullets,
  deriveRegimeTransitions,
  filterSnapshotsByPeriod,
} from "@/lib/journal/market-memory-engine";
import type { InsightReport, MemoryPeriodId, MemorySnapshot } from "@/types/memory";
import type { UiLocale } from "@/store/ui-prefs-store";

function nid(): string {
  return `ins-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

/** Deterministic institutional intelligence summary — no LLM required. */
export function deriveJournalInsightReport(
  locale: UiLocale,
  snapshots: readonly MemorySnapshot[],
  period: MemoryPeriodId = "week",
): InsightReport | null {
  const filtered = filterSnapshotsByPeriod(snapshots, period);
  if (filtered.length < 2) return null;

  const transitions = deriveRegimeTransitions(locale, filtered);
  const latest = filtered[0]!;
  const prev = filtered[1] ?? null;
  const bullets = deriveIntelligenceBullets(locale, latest, prev);

  const transitionReads = transitions.slice(0, 3).map((t) => t.read);
  const allBullets = [...bullets, ...transitionReads].slice(0, 5);

  return {
    id: nid(),
    ts: Date.now(),
    title: pickLocale(locale, "Memory intelligence summary", "Сводка памяти интеллекта"),
    summary: pickLocale(
      locale,
      `${filtered.length} captures · ${transitions.length} regime transitions in window.`,
      `${filtered.length} снимков · ${transitions.length} переходов режима в окне.`,
    ),
    bullets: allBullets,
    scope: "combined",
  };
}

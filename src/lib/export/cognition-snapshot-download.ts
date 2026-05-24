"use client";

import type { JournalEntry, MemorySnapshot } from "@/types/memory";

export function cognitionExportBlob(snapshot: MemorySnapshot | null): { filename: string; body: string } {
  const body = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      snapshot,
      note: "Local export for journal / replay. Future: Supabase sync.",
    },
    null,
    2,
  );
  return { filename: `moneyset-cognition-${Date.now()}.json`, body };
}

/** Journal route: snapshots + entries (bounded) for portability. */
export function memoryArchiveBody(snapshots: readonly MemorySnapshot[], journal: readonly JournalEntry[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      snapshots: snapshots.slice(0, 240),
      journal: journal.slice(0, 400),
      note: "Local-first archive export.",
    },
    null,
    2,
  );
}

export function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

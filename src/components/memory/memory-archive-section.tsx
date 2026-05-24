"use client";

import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import {
  consensusLabel,
  dangerBandLabel,
  logEntryTypeLabel,
  phaseLabel,
  pickLocale,
  scenarioTitle,
} from "@/lib/i18n/cognition-dict";
import { formatOperationalTimestamp } from "@/lib/i18n/trust-surface";
import { localizeOperationalLogEntry } from "@/lib/i18n/cognition-oplog-format";
import type { OperationalLogEntry } from "@/lib/simulation/cognition-types";
import { useMemoryStore } from "@/store/memory-store";

/** Local persisted captures — audit trail, not the primary strategy memory surface. */
export function MemoryArchiveSection({ className }: { className?: string }) {
  const snapshots = useMemoryStore((s) => s.snapshots);
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <section className={cn("space-y-[var(--ms-block-gap)]", className)} aria-label={pickLocale(locale, "Local archive", "Локальный архив")}>
      {snapshots.length === 0 ? (
        <div className="rounded-ms-xl border border-ms-border/20 bg-ms-elevated/10 px-4 py-5 sm:px-5">
          <p className="text-[10px] font-medium text-ms-faint">{pickLocale(locale, "Audit archive", "Аудит-архив")}</p>
          <p className="mt-1 text-[12px] leading-snug text-ms-muted">
            {pickLocale(
              locale,
              "No local snapshots — cognition memory above is lattice-driven; saves appear here when you capture.",
              "Нет локальных снимков — память выше от решётки; сохранения появятся здесь при захвате.",
            )}
          </p>
        </div>
      ) : (
        snapshots.slice(0, 80).map((s) => (
          <article key={s.id} className="rounded-ms-xl border border-ms-border/18 bg-ms-elevated/10 px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ms-faint">{s.symbol}</p>
              <p className="mt-1 font-mono text-[10px] tabular-nums text-ms-faint">{formatOperationalTimestamp(locale, s.ts)}</p>
              <p className="mt-2 text-[13px] font-semibold leading-tight text-ms-text">
                {phaseLabel(locale, s.phase)} · {consensusLabel(locale, s.consensus)}
              </p>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-ms-muted">
              {pickLocale(locale, "Risk", "Риск")}{" "}
              <span className="font-mono tabular-nums text-ms-text">{dangerBandLabel(locale, s.dangerBand)}</span>
              <span className="text-ms-faint"> · </span>
              {pickLocale(locale, "Vol", "Вол")}{" "}
              <span className="font-mono tabular-nums text-ms-text">{s.realizedVol ?? "—"}</span>
              <span className="text-ms-faint"> · </span>
              {pickLocale(locale, "Mom", "Мом")}{" "}
              <span className="font-mono tabular-nums text-ms-text">{s.momentum ?? "—"}</span>
            </p>

            {s.orchestratorLine ? (
              <div className="mt-3 rounded-ms-lg border border-ms-border/25 bg-ms-surface/10 px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-ms-faint">{pickLocale(locale, "Desk", "Деск")}</p>
                <p className="mt-1 text-[11px] leading-snug text-ms-muted">{s.orchestratorLine}</p>
              </div>
            ) : null}

            <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
              <div className="rounded-ms-lg bg-ms-surface/8 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ms-faint">{pickLocale(locale, "Scenarios", "Сценарии")}</p>
                <div className="mt-2 space-y-1">
                  {s.scenarios.map((sc) => (
                    <div key={sc.id} className="flex items-center justify-between gap-3">
                      <p className="text-[11px] text-ms-muted">{scenarioTitle(locale, sc.id)}</p>
                      <p className="text-[10px] font-medium text-ms-faint">{pickLocale(locale, "Path", "Путь")}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-ms-lg bg-ms-surface/8 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ms-faint">{pickLocale(locale, "Ops trace", "Опс-след")}</p>
                <div className="mt-2 space-y-1.5">
                  {s.ops.slice(0, 4).map((e, i) => {
                    const full = {
                      id: `snap-op-${s.id}-${i}`,
                      simTick: 0,
                      ...e,
                    } as OperationalLogEntry;
                    const loc = localizeOperationalLogEntry(locale, full);
                    return (
                      <div key={full.id} className="rounded-ms-md bg-ms-elevated/12 px-2.5 py-1.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-mono text-[10px] tabular-nums text-ms-text/90">{e.simulatedClockLabel}</span>
                          <span className="text-[9px] font-medium uppercase tracking-wide text-ms-faint">
                            {logEntryTypeLabel(locale, e.entryType)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] font-semibold leading-snug text-ms-text">{loc.headline}</p>
                        <p className="mt-0.5 text-[10px] leading-snug text-ms-muted">{loc.summary}</p>
                      </div>
                    );
                  })}
                  <p className="mt-1.5 text-[10px] leading-snug text-ms-faint">{pickLocale(locale, "Read-only.", "Только чтение.")}</p>
                </div>
              </div>
            </div>
          </article>
        ))
      )}
    </section>
  );
}

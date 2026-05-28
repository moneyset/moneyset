"use client";

import { useState } from "react";

import { StatusPill } from "@/components/ui/status-pill";
import type { JournalEntry } from "@/types/memory";
import { journalDirectionLabel, journalOutcomeLabel, formatOperationalTimestamp } from "@/lib/i18n/trust-surface";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { journalReplayHighPriority } from "@/lib/cognition/information-priority";
import { cn } from "@/lib/utils";
import type { UiLocale } from "@/store/ui-prefs-store";

type JournalEntryCardProps = {
  entry: JournalEntry;
  locale: UiLocale;
  focused?: boolean;
  dimmed?: boolean;
};

function IntelligenceRecordBlock({ entry, locale }: { entry: JournalEntry; locale: UiLocale }) {
  const rec = entry.intelligenceRecord;
  if (!rec) return null;

  const rows: ReadonlyArray<readonly [string, string]> = [
    [pickLocale(locale, "Regime", "Режим"), rec.regimeState],
    [pickLocale(locale, "Scenario", "Сценарий"), rec.scenarioState],
    [pickLocale(locale, "Primary risk", "Главный риск"), rec.primaryRisks],
    [pickLocale(locale, "Structure", "Структура"), rec.structuralInterpretation],
    [pickLocale(locale, "Execution", "Исполнение"), rec.executionImplication],
  ];

  return (
    <div className="ms-journal-entry__intel">
      <ul className="ms-journal-entry__summary">
        {rec.intelligenceSummary.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <dl className="ms-journal-entry__record">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function JournalEntryCard({ entry, locale, focused, dimmed }: JournalEntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const replayHi = journalReplayHighPriority(entry.cognitiveLayers);
  const hasIntel = Boolean(entry.intelligenceRecord);

  return (
    <article
      className={cn(
        "ms-journal-entry",
        focused && "ms-journal-entry--focused",
        dimmed && "ms-journal-entry--dimmed",
        replayHi && "ms-journal-entry--signal",
      )}
    >
      <button
        type="button"
        className="ms-journal-entry__header ms-focus-ring"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="ms-journal-entry__meta">
          <time className="ms-journal-entry__time">{formatOperationalTimestamp(locale, entry.ts)}</time>
          <span className="ms-journal-entry__tags">
            {entry.symbol}
            <span className="text-ms-faint"> · </span>
            {journalDirectionLabel(locale, entry.direction)}
            <span className="text-ms-faint"> · </span>
            {journalOutcomeLabel(locale, entry.outcome ?? "open")}
          </span>
        </div>
        {hasIntel ? (
          <StatusPill accent="consensus" size="sm">
            {pickLocale(locale, "Intel", "Интеллект")}
          </StatusPill>
        ) : null}
      </button>

      <div className="ms-journal-entry__body">
        <p className="ms-journal-entry__reasoning">{entry.reasoning}</p>

        {(expanded || focused) && entry.intelligenceRecord ? (
          <IntelligenceRecordBlock entry={entry} locale={locale} />
        ) : null}

        {(expanded || focused) && entry.cognitiveLayers ? (
          <div className="ms-journal-entry__layers">
            <p className="ms-journal-entry__layers-label">
              {pickLocale(locale, "Transition capture", "Захват перехода")}
            </p>
            <p className="text-[11px] leading-snug text-ms-muted">{entry.cognitiveLayers.stateShift}</p>
            <p className="mt-1 text-[11px] leading-snug text-ms-faint">{entry.cognitiveLayers.scenarioEvolution}</p>
          </div>
        ) : null}

        {!expanded && !focused && hasIntel ? (
          <p className="ms-journal-entry__teaser">
            {entry.intelligenceRecord!.intelligenceSummary[0]}
          </p>
        ) : null}
      </div>
    </article>
  );
}

"use client";

import Link from "next/link";

import { IntelCard } from "@/components/ui/intel-card";
import type { MarketMemoryBundle } from "@/lib/journal/market-memory-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { formatOperationalTimestamp } from "@/lib/i18n/trust-surface";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type JournalMemoryPanelProps = {
  bundle: MarketMemoryBundle;
  className?: string;
};

export function JournalMemoryPanel({ bundle, className }: JournalMemoryPanelProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <aside className={cn("ms-journal-memory", className)}>
      <IntelCard variant="inset" className="ms-journal-memory__block">
        <p className="ms-journal-memory__eyebrow">
          {pickLocale(locale, "Intelligence summary", "Сводка интеллекта")}
        </p>
        {bundle.latestBullets.length > 0 ? (
          <ul className="ms-journal-memory__bullets">
            {bundle.latestBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : (
          <p className="ms-journal-memory__empty">
            {pickLocale(locale, "Captures accumulate as structure shifts.", "Снимки копятся при смене структуры.")}
          </p>
        )}
      </IntelCard>

      <IntelCard variant="inset" className="ms-journal-memory__block">
        <p className="ms-journal-memory__eyebrow">
          {pickLocale(locale, "Historical evolution", "Историческая эволюция")}
        </p>
        <dl className="ms-journal-memory__evolution">
          {bundle.evolution.map((line) => (
            <div key={line.id}>
              <dt>{line.label}</dt>
              <dd>{line.read}</dd>
            </div>
          ))}
          {bundle.evolution.length === 0 ? (
            <p className="ms-journal-memory__empty">
              {pickLocale(locale, "Need multiple captures in window.", "Нужно несколько снимков в окне.")}
            </p>
          ) : null}
        </dl>
      </IntelCard>

      <IntelCard variant="inset" className="ms-journal-memory__block">
        <p className="ms-journal-memory__eyebrow">
          {pickLocale(locale, "Regime transitions", "Переходы режима")}
        </p>
        {bundle.transitions.length > 0 ? (
          <ol className="ms-journal-memory__transitions">
            {bundle.transitions.slice(0, 8).map((t) => (
              <li key={t.id}>
                <span className="ms-journal-memory__transition-label">{t.label}</span>
                <span className="ms-journal-memory__transition-time">
                  {formatOperationalTimestamp(locale, t.ts)}
                </span>
                <p className="ms-journal-memory__transition-read">{t.read}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="ms-journal-memory__empty">
            {pickLocale(locale, "No regime transitions in period.", "Нет переходов режима за период.")}
          </p>
        )}
      </IntelCard>

      <IntelCard variant="inset" tone="support" className="ms-journal-memory__block ms-journal-memory__block--bridge">
        <p className="ms-journal-memory__eyebrow">
          {pickLocale(locale, "Replay complement", "Дополнение Replay")}
        </p>
        <p className="ms-journal-memory__bridge-copy">
          {pickLocale(
            locale,
            "Journal = structured memory · Replay Studio = temporal visualization of session lattice.",
            "Журнал = структурная память · Replay Studio = временная визуализация решётки сессии.",
          )}
        </p>
        <Link href="/replay" className="ms-journal-memory__replay-link ms-focus-ring">
          {pickLocale(locale, "Open Replay Studio →", "Открыть Replay Studio →")}
        </Link>
      </IntelCard>
    </aside>
  );
}

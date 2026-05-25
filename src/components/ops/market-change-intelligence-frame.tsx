"use client";

import { useShallow } from "zustand/react/shallow";

import { localizeOperationalLogEntry } from "@/lib/i18n/cognition-oplog-format";
import { pickLocale, scenarioTitle } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type IntelRow = {
  question: string;
  answer: string;
  tone?: "neutral" | "risk" | "strengthen" | "warning";
};

function IntelCell({ question, answer, tone = "neutral" }: IntelRow) {
  const valueClass =
    tone === "risk"
      ? "text-ms-danger/88"
      : tone === "strengthen"
        ? "text-ms-flow/90"
        : tone === "warning"
          ? "text-ms-warning/88"
          : "text-ms-text/90";
  return (
    <div className="min-w-0 border-l-2 border-ms-border/25 pl-3 py-0.5">
      <p className="ms-data-label text-ms-faint">{question}</p>
      <p className={cn("mt-1 text-[12px] font-medium leading-snug", valueClass)}>{answer}</p>
    </div>
  );
}

function ItemList({ items, tone }: { items: readonly string[]; tone?: "strengthen" | "risk" | "warning" }) {
  const dotClass =
    tone === "strengthen"
      ? "bg-ms-flow/60"
      : tone === "risk"
        ? "bg-ms-danger/55"
        : "bg-ms-border/50";
  const textClass =
    tone === "strengthen"
      ? "text-ms-flow/85"
      : tone === "risk"
        ? "text-ms-danger/80"
        : "text-ms-muted";
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-[10px] leading-relaxed sm:text-[11px]">
          <span className={cn("mt-1.5 size-1 shrink-0 rounded-full", dotClass)} aria-hidden />
          <span className={textClass}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Market Change Intelligence Frame.
 * Answers the six core questions for every ops session:
 *   What changed? · Why does it matter? · What probability changed?
 *   What strengthens the thesis? · What weakens it? · What invalidates it?
 */
export function MarketChangeIntelligenceFrame() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const { scenarioBook, topScenario, operationalLog } = useCognitionSimulationStore(
    useShallow((s) => ({
      scenarioBook: s.scenarioBook,
      topScenario: s.topScenario,
      operationalLog: s.operationalLog,
    })),
  );

  const lead = scenarioBook.cards.find((c) => c.id === topScenario.scenarioId) ?? scenarioBook.cards[0] ?? null;
  const latest = operationalLog[0] ?? null;
  const rotation = scenarioBook.rotationPair;

  if (!lead) return null;

  const probDelta = lead.probabilityPct - lead.previousProbabilityPct;
  const probChanged =
    Math.abs(probDelta) >= 2
      ? pickLocale(
          locale,
          `${lead.probabilityPct}% structural weight (${probDelta > 0 ? "+" : ""}${probDelta}% vs last read)`,
          `${lead.probabilityPct}% структурный вес (${probDelta > 0 ? "+" : ""}${probDelta}% к прошлому прочтению)`,
        )
      : pickLocale(
          locale,
          `${lead.probabilityPct}% structural weight — no material change`,
          `${lead.probabilityPct}% структурный вес — без существенных изменений`,
        );

  const latestLoc = latest ? localizeOperationalLogEntry(locale, latest) : null;

  const whatChanged =
    latestLoc?.headline ??
    pickLocale(locale, "No material shift in this session.", "Существенных сдвигов в этой сессии нет.");

  const whyMatters =
    latestLoc?.whyMatters ??
    lead.strategicSummary ??
    pickLocale(locale, "Structure is within expected parameters.", "Структура в ожидаемых параметрах.");

  const rotationLine = rotation
    ? pickLocale(
        locale,
        `Path rotating — ${rotation.from} → ${rotation.to}`,
        `Смена пути — ${rotation.from} → ${rotation.to}`,
      )
    : null;

  return (
    <div className="mb-[var(--ms-block-gap)] rounded-ms-xl border border-ms-border/16 bg-ms-elevated/8 overflow-hidden">
      {/* Header */}
      <div className="border-b border-ms-border/14 px-4 py-3 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ms-cognition/80">
              {pickLocale(locale, "Market change intelligence", "Аналитика изменений рынка")}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-ms-faint">
              {pickLocale(
                locale,
                "Six questions answered for every session read.",
                "Шесть вопросов для каждого прочтения сессии.",
              )}
            </p>
          </div>
          <div className="shrink-0 rounded-ms-md border border-ms-border/20 px-2.5 py-1">
            <p className="font-mono text-[10px] text-ms-muted">{scenarioTitle(locale, lead.id)}</p>
          </div>
        </div>
      </div>

      {/* Six intelligence questions */}
      <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-3">
        <IntelCell
          question={pickLocale(locale, "What changed?", "Что изменилось?")}
          answer={whatChanged}
          tone="neutral"
        />
        <IntelCell
          question={pickLocale(locale, "Why does it matter?", "Почему это важно?")}
          answer={whyMatters}
          tone="neutral"
        />
        <IntelCell
          question={pickLocale(locale, "What probability changed?", "Какова вероятность изменений?")}
          answer={probChanged}
          tone={probDelta > 3 ? "strengthen" : probDelta < -3 ? "risk" : "neutral"}
        />
      </div>

      {/* Thesis impact */}
      <div className="grid gap-0 divide-y divide-ms-border/10 border-t border-ms-border/14 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-4 py-3.5 sm:px-5">
          <p className="ms-data-label text-ms-flow/80">
            {pickLocale(locale, "What strengthens the thesis?", "Что укрепляет тезис?")}
          </p>
          {lead.structuralSupport.length > 0 ? (
            <ItemList items={lead.structuralSupport.slice(0, 3)} tone="strengthen" />
          ) : (
            <p className="mt-1.5 text-[10px] text-ms-faint">
              {pickLocale(locale, "No active support factors.", "Активных факторов поддержки нет.")}
            </p>
          )}
        </div>

        <div className="px-4 py-3.5 sm:px-5">
          <p className="ms-data-label text-ms-warning/80">
            {pickLocale(locale, "What weakens the thesis?", "Что ослабляет тезис?")}
          </p>
          {lead.invalidationPressure.length > 0 ? (
            <ItemList items={lead.invalidationPressure.slice(0, 3)} tone="warning" />
          ) : (
            <p className="mt-1.5 text-[10px] text-ms-faint">
              {pickLocale(locale, "No active pressure factors.", "Активных факторов давления нет.")}
            </p>
          )}
        </div>

        <div className="px-4 py-3.5 sm:px-5">
          <p className="ms-data-label text-ms-danger/80">
            {pickLocale(locale, "What invalidates the thesis?", "Что аннулирует тезис?")}
          </p>
          <p className="mt-1.5 text-[11px] font-medium leading-snug text-ms-danger/82">
            {lead.invalidation}
          </p>
          {rotationLine ? (
            <p className="mt-2 text-[10px] leading-snug text-ms-warning/80">{rotationLine}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

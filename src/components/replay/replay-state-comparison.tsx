"use client";

import type { ReplayStateComparison } from "@/lib/intelligence/replay-timeline-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type ReplayStateComparisonPanelProps = {
  comparison: ReplayStateComparison;
  metadata: Readonly<{
    regimeShift: string | null;
    consensusShift: string | null;
    confidenceShift: string | null;
    scenarioChange: string | null;
  }>;
};

function DeltaBadge({ direction }: { direction: "up" | "down" | "flat" }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const label =
    direction === "up"
      ? pickLocale(locale, "↑ expanded", "↑ расширилось")
      : direction === "down"
        ? pickLocale(locale, "↓ compressed", "↓ сжалось")
        : pickLocale(locale, "→ stable", "→ стабильно");
  return (
    <span
      className={cn(
        "ms-replay-delta",
        direction === "up" && "ms-replay-delta--up",
        direction === "down" && "ms-replay-delta--down",
      )}
    >
      {label}
    </span>
  );
}

function MetricRow({
  label,
  from,
  to,
  direction,
}: {
  label: string;
  from: number;
  to: number;
  direction: "up" | "down" | "flat";
}) {
  return (
    <div className="ms-replay-compare__metric">
      <p className="ms-replay-compare__metric-label">{label}</p>
      <div className="ms-replay-compare__metric-values">
        <span className="tabular-nums text-ms-faint">{from}</span>
        <span className="text-ms-border/50">→</span>
        <span className="tabular-nums text-ms-text">{to}</span>
        <DeltaBadge direction={direction} />
      </div>
    </div>
  );
}

export function ReplayStateComparisonPanel({ comparison, metadata }: ReplayStateComparisonPanelProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <section className="ms-replay-compare" aria-label={pickLocale(locale, "State comparison", "Сравнение состояний")}>
      <div className="ms-replay-compare__header">
        <p className="ms-replay-compare__title">
          {pickLocale(locale, "State reconstruction", "Реконструкция состояния")}
        </p>
        <p className="ms-replay-compare__range">
          {comparison.previousOffset ?? "—"} → {comparison.currentOffset}
        </p>
      </div>

      <p className="ms-replay-compare__summary">{comparison.structuralSummary}</p>

      <div className="ms-replay-compare__grid">
        <div className="ms-replay-compare__cell">
          <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Consensus", "Консенсус")}</p>
          <p className="mt-1 text-[11px] leading-snug text-ms-text">
            {comparison.consensus.from} → {comparison.consensus.to}
          </p>
          {metadata.consensusShift ? (
            <p className="mt-0.5 text-[10px] text-ms-cognition/85">{metadata.consensusShift}</p>
          ) : null}
        </div>

        <MetricRow
          label={pickLocale(locale, "Risk / instability", "Риск / нестабильность")}
          from={comparison.risk.from}
          to={comparison.risk.to}
          direction={comparison.risk.direction}
        />
        <MetricRow
          label={pickLocale(locale, "Liquidity pressure", "Давление ликвидности")}
          from={comparison.liquidity.from}
          to={comparison.liquidity.to}
          direction={comparison.liquidity.direction}
        />
        <MetricRow
          label={pickLocale(locale, "Sponsorship", "Спонсорство")}
          from={comparison.sponsorship.from}
          to={comparison.sponsorship.to}
          direction={comparison.sponsorship.direction}
        />
        <MetricRow
          label={pickLocale(locale, "Scenario weight", "Вес сценария")}
          from={comparison.scenarioWeight.from}
          to={comparison.scenarioWeight.to}
          direction={comparison.scenarioWeight.direction}
        />

        <div className="ms-replay-compare__cell ms-replay-compare__cell--wide">
          <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Execution posture", "Поза исполнения")}</p>
          <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-ms-muted">{comparison.executionPosture.to}</p>
        </div>
      </div>

      {(metadata.regimeShift || metadata.scenarioChange || metadata.confidenceShift) && (
        <ul className="ms-replay-compare__meta">
          {metadata.regimeShift ? (
            <li>
              <span className="ms-replay-compare__meta-key">{pickLocale(locale, "Regime", "Режим")}</span>
              {metadata.regimeShift}
            </li>
          ) : null}
          {metadata.scenarioChange ? (
            <li>
              <span className="ms-replay-compare__meta-key">{pickLocale(locale, "Scenario", "Сценарий")}</span>
              {metadata.scenarioChange}
            </li>
          ) : null}
          {metadata.confidenceShift ? (
            <li>
              <span className="ms-replay-compare__meta-key">{pickLocale(locale, "Confidence", "Уверенность")}</span>
              {metadata.confidenceShift}
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}

"use client";

import type { MarketIndexMetric, MetricMovement } from "@/lib/intelligence/market-index-engine";
import { cn } from "@/lib/utils";

const MOVEMENT_ARROW: Record<MetricMovement, string> = {
  rising: "↑",
  weakening: "↓",
  strengthening: "↑",
  deteriorating: "↓",
  stabilizing: "→",
};

const MOVEMENT_CLASS: Record<MetricMovement, string> = {
  rising: "ms-market-index-metric__movement--up",
  strengthening: "ms-market-index-metric__movement--up",
  weakening: "ms-market-index-metric__movement--down",
  deteriorating: "ms-market-index-metric__movement--down",
  stabilizing: "ms-market-index-metric__movement--flat",
};

type MarketIndexMetricCardProps = {
  metric: MarketIndexMetric;
  active: boolean;
  onToggle: () => void;
};

export function MarketIndexMetricCard({ metric, active, onToggle }: MarketIndexMetricCardProps) {
  const arrow = MOVEMENT_ARROW[metric.movement];

  return (
    <button
      type="button"
      className={cn(
        "ms-market-index-metric ms-focus-ring",
        active && "ms-market-index-metric--active",
        metric.id === "risk" && metric.value >= 62 && "ms-market-index-metric--stress",
        metric.id === "sponsorship" && metric.value >= 58 && "ms-market-index-metric--support",
      )}
      onClick={onToggle}
      aria-expanded={active}
      aria-controls={`ms-market-index-detail-${metric.id}`}
    >
      <span className="ms-market-index-metric__label">{metric.label}</span>
      <span className="ms-market-index-metric__value">{metric.displayValue}</span>
      <span
        className={cn("ms-market-index-metric__movement", MOVEMENT_CLASS[metric.movement])}
      >
        <span aria-hidden>{arrow}</span>
        {metric.movementLabel}
      </span>
      <span className="ms-market-index-metric__bar" aria-hidden>
        <span
          className="ms-market-index-metric__bar-fill"
          style={{ width: `${metric.value}%` }}
        />
      </span>
    </button>
  );
}

"use client";

import { m } from "framer-motion";

import { AnimatedSeparator } from "@/components/ui/animated-separator";
import { cn } from "@/lib/utils";

export type StrategicScenario = {
  id: string;
  title: string;
  probability: string;
  confidence: string;
  invalidation: string;
  explanation: string;
};

type StrategicScenarioCardProps = {
  scenario: StrategicScenario;
  className?: string;
};

export function StrategicScenarioCard({ scenario, className }: StrategicScenarioCardProps) {
  return (
    <m.article
      className={cn(
        "ms-surface-panel flex flex-col gap-3 rounded-ms-xl p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="ms-scenario-title max-w-[18rem]">{scenario.title}</h3>
        <p className="text-[11px] text-ms-muted">
          p <span className="font-mono tabular-nums text-ms-text">{scenario.probability}</span>
          <span className="text-ms-faint"> · </span>
          conf <span className="font-mono tabular-nums text-ms-text">{scenario.confidence}</span>
        </p>
      </div>
      <AnimatedSeparator variant="cognition" />
      <div className="space-y-1">
        <p className="ms-data-label text-ms-flow">Invalidation</p>
        <p className="ms-intelligence-summary text-[13px] text-ms-text">{scenario.invalidation}</p>
      </div>
      <p className="ms-intelligence-summary text-[13px] leading-relaxed">{scenario.explanation}</p>
    </m.article>
  );
}

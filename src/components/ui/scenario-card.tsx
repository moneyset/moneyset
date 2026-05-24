"use client";

import { m } from "framer-motion";

import { cn } from "@/lib/utils";

type ScenarioCardProps = {
  label: string;
  weight: string;
  line: string;
  className?: string;
};

export function ScenarioCard({ label, weight, line, className }: ScenarioCardProps) {
  return (
    <m.div
      className={cn(
        "ms-surface-inset flex flex-col gap-2 rounded-ms-lg p-4",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="ms-data-label text-ms-flow">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-ms-muted">{weight}</span>
      </div>
      <p className="ms-intelligence-summary text-[13px]">{line}</p>
    </m.div>
  );
}

"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function InterpretationLayer({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("ms-intel-layer rounded-ms-xl border border-ms-border/22 bg-ms-elevated/10", className)}>
      <header className="border-b border-ms-border/15 px-4 py-2.5 sm:px-5">
        <h3 className="text-[11px] font-semibold tracking-tight text-ms-text">{title}</h3>
      </header>
      <div className="px-4 py-3 sm:px-5 sm:py-4">{children}</div>
    </section>
  );
}

export function PressureStrip({ pct, stressed }: { pct: number; stressed?: boolean }) {
  const w = Math.max(4, Math.min(100, pct));
  return (
    <div className="mt-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-ms-surface/40" role="presentation">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            stressed ? "bg-ms-warning/55" : "bg-ms-cognition/45",
          )}
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  );
}

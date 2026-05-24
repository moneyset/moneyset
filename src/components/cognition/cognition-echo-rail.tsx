"use client";

import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

export type EchoRailItem = Readonly<{
  id: string;
  severity?: "neutral" | "elevated" | "critical";
  weight?: number;
}>;

/** Visual echo strip — severity as pulse bars, text in title tooltip only. */
export function CognitionEchoRail({
  items,
  titles,
  className,
}: {
  items: readonly EchoRailItem[];
  titles: Record<string, string>;
  className?: string;
}) {
  return (
    <ul className={cn("ms-cognition-echo-rail", className)} aria-hidden>
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            "ms-cognition-echo-rail__item",
            item.severity === "critical" && "ms-cognition-echo-rail__item--critical",
            item.severity === "elevated" && "ms-cognition-echo-rail__item--elevated",
          )}
          style={{ "--ms-echo-weight": item.weight ?? 0.5 } as CSSProperties}
          title={titles[item.id]}
        />
      ))}
    </ul>
  );
}

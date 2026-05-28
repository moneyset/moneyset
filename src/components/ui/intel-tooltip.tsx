"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type IntelTooltipProps = {
  content: string;
  children: ReactNode;
  className?: string;
  side?: "top" | "bottom";
};

/** Accessible intelligence tooltip — shared behavior across modules. */
export function IntelTooltip({ content, children, className, side = "top" }: IntelTooltipProps) {
  if (!content.trim()) return <>{children}</>;

  return (
    <span
      className={cn("ms-intel-tooltip", side === "bottom" && "ms-intel-tooltip--bottom", className)}
      data-tooltip={content}
    >
      <span className="ms-intel-tooltip__trigger" tabIndex={0}>
        {children}
      </span>
      <span role="tooltip" className="ms-intel-tooltip__content">
        {content}
      </span>
    </span>
  );
}

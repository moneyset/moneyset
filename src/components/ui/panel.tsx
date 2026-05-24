"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";

import type { MsSemanticAccent } from "@/lib/theme";
import { msTransition } from "@/lib/theme";
import { cn } from "@/lib/utils";

const accentBorder: Record<MsSemanticAccent, string> = {
  cognition: "border-l-ms-cognition",
  flow: "border-l-ms-flow",
  sentiment: "border-l-ms-sentiment",
  danger: "border-l-ms-danger",
  warning: "border-l-ms-warning",
  consensus: "border-l-ms-consensus",
  neutral: "border-l-transparent",
};

type CognitionPanelProps = {
  id?: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
  /** Left accent communicates module semantics at a glance. */
  accent?: MsSemanticAccent;
};

export function CognitionPanel({ id, eyebrow, title, children, className, accent = "neutral" }: CognitionPanelProps) {
  return (
    <m.article
      id={id}
      layout
      transition={msTransition.fast}
      className={cn(
        "relative flex min-h-0 min-w-0 flex-col gap-3.5 rounded-ms-xl p-4 sm:gap-4 sm:p-6",
        // Reduce “widget box” feel: softer surface, less contrast.
        "bg-ms-surface/14 transition-[border-color,background-color] duration-300 ease-out",
        accent !== "neutral" && "border-l pl-[1.25rem] sm:pl-[1.5rem]",
        accentBorder[accent],
        className,
      )}
    >
      <header className="flex min-w-0 flex-col gap-1">
        <p className="ms-eyebrow text-ms-faint/85">{eyebrow}</p>
        <h2 className="text-pretty text-[13px] font-semibold leading-snug text-ms-text sm:text-[14px]">{title}</h2>
      </header>
      <div className="min-h-0 min-w-0 flex-1">{children}</div>
    </m.article>
  );
}

/** Alias — same primitive; naming mirrors product language. */
export const IntelligencePanel = CognitionPanel;

"use client";

import { cn } from "@/lib/utils";

type CognitionPrimaryStateProps = {
  label: string;
  state: string;
  subline?: string;
  tension?: "calm" | "elevated" | "critical";
  /** Hero = world-scaled headline; compact = dense war-room scan. */
  profile?: "default" | "hero" | "compact";
  /** Visual-first: giant state, subline collapsed to details. */
  visualFirst?: boolean;
  className?: string;
};

export function CognitionPrimaryState({
  label,
  state,
  subline,
  tension = "calm",
  profile = "hero",
  visualFirst = true,
  className,
}: CognitionPrimaryStateProps) {
  return (
    <header
      className={cn(
        "ms-cognition-primary",
        visualFirst && "ms-cognition-primary--visual",
        profile === "hero" && "ms-cognition-primary--hero",
        profile === "compact" && "ms-cognition-primary--compact",
        className,
      )}
    >
      <p className="ms-cognition-primary__label">{label}</p>
      <h2
        className={cn(
          "ms-cognition-primary__state",
          tension === "elevated" && "ms-cognition-primary__state--elevated",
          tension === "critical" && "ms-cognition-primary__state--critical",
        )}
      >
        {state}
      </h2>
      {subline && !visualFirst ? <p className="ms-cognition-primary__subline">{subline}</p> : null}
      {subline && visualFirst ? (
        <details className="ms-cognition-primary__deep">
          <summary className="ms-cognition-primary__deep-summary">+</summary>
          <p className="ms-cognition-primary__subline">{subline}</p>
        </details>
      ) : null}
    </header>
  );
}

"use client";

import type { ReactNode } from "react";

import type { CognitionWorldId } from "@/lib/cognition/cognition-worlds";
import { cn } from "@/lib/utils";

export type WorldSurfaceChromeProps = {
  world: CognitionWorldId;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

/** World-scoped page chrome — typography and rhythm come from parent [data-ms-world]. */
export function WorldSurfaceChrome({
  world,
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: WorldSurfaceChromeProps) {
  return (
    <header className={cn("ms-world-chrome ms-world-chrome--visual", className)} data-ms-world-chrome={world}>
      <div className="ms-world-chrome__signal" aria-hidden />
      <div className="ms-world-chrome__copy">
        {eyebrow ? <p className="ms-world-chrome__eyebrow">{eyebrow}</p> : null}
        <h1 className="ms-world-chrome__title">{title}</h1>
        {subtitle ? <p className="ms-world-chrome__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ms-world-chrome__actions">{actions}</div> : null}
    </header>
  );
}

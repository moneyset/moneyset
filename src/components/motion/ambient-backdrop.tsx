"use client";

import { cn } from "@/lib/utils";

/** Quiet depth — fog, vignette, fine mesh, restrained grain; no accent orbs. */
export function AmbientBackdrop() {
  return (
    <div className="ms-shell-atmosphere pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className={cn("ms-intelligence-fog")} aria-hidden />
      <div className="ms-atmo-vignette" aria-hidden />
      <div className="ms-atmo-grain" aria-hidden />
      <div className="ms-grid-atmosphere" aria-hidden />
    </div>
  );
}

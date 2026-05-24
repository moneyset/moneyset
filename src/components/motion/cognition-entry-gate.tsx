"use client";

import type { ReactNode } from "react";

/** Pass-through — cinematic intro runs globally via CinematicIntroRoot. */
export function CognitionEntryGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

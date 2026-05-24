"use client";

import { useEffect, type ReactNode } from "react";

import { CognitionDramaProvider } from "@/components/cognition/cognition-drama-context";
import { useCognitionDrama } from "@/hooks/use-cognition-drama";

function applyDramaVars(drama: ReturnType<typeof useCognitionDrama>) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  for (const [k, v] of Object.entries(drama.cssVars)) {
    el.style.setProperty(k, v);
  }
  el.dataset.msDramaPhase = drama.dramaPhase;
  if (drama.activeMoment) {
    el.dataset.msSignature = drama.activeMoment.id;
  } else {
    delete el.dataset.msSignature;
  }
}

export function CognitionDramaBridge({ children }: { children: ReactNode }) {
  const drama = useCognitionDrama();

  useEffect(() => {
    applyDramaVars(drama);
  }, [drama]);

  return <CognitionDramaProvider value={drama}>{children}</CognitionDramaProvider>;
}

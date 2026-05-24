"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { CognitionDramaBundle } from "@/lib/cognition/cognition-drama-engine";

const CognitionDramaContext = createContext<CognitionDramaBundle | null>(null);

export function CognitionDramaProvider({ value, children }: { value: CognitionDramaBundle; children: ReactNode }) {
  return <CognitionDramaContext.Provider value={value}>{children}</CognitionDramaContext.Provider>;
}

export function useCognitionDramaContext(): CognitionDramaBundle | null {
  return useContext(CognitionDramaContext);
}

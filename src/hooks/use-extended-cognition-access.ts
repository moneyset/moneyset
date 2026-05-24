"use client";

import { useFullPlatformAccess } from "@/hooks/use-capabilities";

/** Founding · invitation · admin · beta, legacy premium, or evaluation trial. */
export function useExtendedCognitionAccess(): boolean {
  return useFullPlatformAccess();
}

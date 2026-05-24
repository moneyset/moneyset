"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { useCognitionDrama } from "@/hooks/use-cognition-drama";
import {
  deriveCategoryExperience,
  type CategoryExperienceProfile,
} from "@/lib/experience/category-experience";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";

export function useCategoryExperience(): CategoryExperienceProfile {
  const pathname = usePathname();
  const drama = useCognitionDrama();
  const { latent, derived } = useCognitionSimulationStore(
    useShallow((s) => ({ latent: s.latent, derived: s.derived })),
  );

  return useMemo(
    () => deriveCategoryExperience({ pathname, latent, derived, drama }),
    [pathname, latent, derived, drama],
  );
}

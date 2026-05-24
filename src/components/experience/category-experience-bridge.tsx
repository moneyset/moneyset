"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";

import { useCognitionDrama } from "@/hooks/use-cognition-drama";
import { deriveCategoryExperience } from "@/lib/experience/category-experience";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";

function applyCategoryExperience(
  experience: ReturnType<typeof deriveCategoryExperience>,
  pathname: string,
) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;

  const narrow =
    typeof window !== "undefined" && window.matchMedia("(max-width: 1023.98px)").matches;
  for (const [key, val] of Object.entries(experience.cssVars)) {
    if (narrow && key === "--ms-motion-breath-duration") continue;
    root.style.setProperty(key, val);
  }

  if (experience.world) {
    root.dataset.msExperienceWorld = experience.world;
    body.dataset.msExperienceWorld = experience.world;
  } else {
    delete root.dataset.msExperienceWorld;
    delete body.dataset.msExperienceWorld;
  }

  root.dataset.msExperienceMode = experience.mode;
  root.dataset.msExperienceTension = experience.tensionBand;
  root.dataset.msExperiencePath = pathname;
  body.classList.add("ms-category-organism");
  body.dataset.msExperienceMode = experience.mode;

  const cadenceClasses = [
    "ms-xp-cadence--sink",
    "ms-xp-cadence--tension",
    "ms-xp-cadence--temporal",
    "ms-xp-cadence--planetary",
    "ms-xp-cadence--wave",
    "ms-xp-cadence--echo",
    "ms-xp-cadence--fracture",
    "ms-xp-cadence--transmit",
    "ms-xp-cadence--strike",
    "ms-xp-cadence--command",
  ];
  const atmosphereClasses = [
    "ms-xp-atmosphere--pressure",
    "ms-xp-atmosphere--tension",
    "ms-xp-atmosphere--temporal",
    "ms-xp-atmosphere--planetary",
    "ms-xp-atmosphere--narrative",
    "ms-xp-atmosphere--resonance",
    "ms-xp-atmosphere--fragility",
    "ms-xp-atmosphere--transmission",
    "ms-xp-atmosphere--tactical",
    "ms-xp-atmosphere--command",
  ];
  root.classList.remove(...cadenceClasses, ...atmosphereClasses);
  root.classList.add(experience.cadenceClass, experience.atmosphereClass);

  delete root.dataset.msExperienceTransition;
}

/** Global category experience orchestration — emotional atmosphere per route. */
export function CategoryExperienceBridge({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const drama = useCognitionDrama();
  const { latent, derived } = useCognitionSimulationStore(
    useShallow((s) => ({ latent: s.latent, derived: s.derived })),
  );

  const experience = deriveCategoryExperience({ pathname, latent, derived, drama });

  useEffect(() => {
    return applyCategoryExperience(experience, pathname);
  }, [experience, pathname]);

  return <>{children}</>;
}

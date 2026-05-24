"use client";

import { CognitionWorldFrame } from "@/components/cognition/cognition-world-frame";
import { LabExperience } from "@/components/labs/lab-experience";
import { labSlugToWorld } from "@/lib/cognition/cognition-worlds";
import type { LabSlug } from "@/lib/labs/labs-modules";
import { cn } from "@/lib/utils";

export function LabModuleSurface({ slug, className }: { slug: LabSlug; className?: string }) {
  return (
    <CognitionWorldFrame world={labSlugToWorld(slug)} className={cn("ms-labs-module relative ms-page min-w-0", className)}>
      <LabExperience slug={slug} />
    </CognitionWorldFrame>
  );
}

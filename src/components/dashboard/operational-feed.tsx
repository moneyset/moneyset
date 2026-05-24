"use client";

import { OpsWorkspace } from "@/components/ops/ops-workspace";
import { cn } from "@/lib/utils";

type OperationalFeedProps = {
  className?: string;
};

/** Delegates to the institutional OPS evolution workspace (Prompt 14). */
export function OperationalFeed({ className }: OperationalFeedProps) {
  return <OpsWorkspace className={cn(className)} />;
}

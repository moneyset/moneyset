"use client";

import { DesktopPanelLiveTile } from "@/components/desktop/desktop-panel-live-tiles";
import { desktopPanelsForRail } from "@/lib/desktop/desktop-command-orchestrator";
import type { DesktopCommandOrchestration } from "@/lib/desktop/desktop-command-orchestrator";
import { cn } from "@/lib/utils";

export function DesktopCommandRail({
  side,
  orchestration,
  className,
}: {
  side: "left" | "right";
  orchestration: DesktopCommandOrchestration;
  className?: string;
}) {
  const panels = desktopPanelsForRail(orchestration, side);

  return (
    <aside
      className={cn(
        "ms-desk-rail hidden min-h-0 flex-col gap-2 lg:flex",
        side === "left" ? "ms-desk-rail--left" : "ms-desk-rail--right",
        className,
      )}
      aria-label={side === "left" ? "Command rail — structure" : "Command rail — execution"}
    >
      {panels.map((panel) => (
        <DesktopPanelLiveTile key={panel.id} panel={panel} />
      ))}
    </aside>
  );
}

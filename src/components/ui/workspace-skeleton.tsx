import { cn } from "@/lib/utils";

type WorkspaceSkeletonProps = {
  variant?: "compact" | "standard" | "theater";
  label?: string;
  className?: string;
};

const HEIGHT: Record<NonNullable<WorkspaceSkeletonProps["variant"]>, string> = {
  compact: "min-h-[10rem]",
  standard: "min-h-[18rem]",
  theater: "min-h-[24rem]",
};

/** Branded loading shell — shimmer bars, no blank flash. */
export function WorkspaceSkeleton({
  variant = "standard",
  label = "Loading workspace",
  className,
}: WorkspaceSkeletonProps) {
  return (
    <div
      className={cn(
        "ms-workspace-skeleton flex min-w-0 flex-col gap-3 rounded-ms-xl border border-ms-border/15 bg-ms-elevated/8 p-4 sm:gap-4 sm:p-5",
        HEIGHT[variant],
        className,
      )}
      aria-busy="true"
      aria-label={label}
      role="status"
    >
      <div className="ms-lab-skeleton h-3 w-28 rounded-ms-sm" aria-hidden />
      <div className="ms-lab-skeleton h-5 w-2/3 max-w-xs rounded-ms-sm" aria-hidden />
      <div className="ms-lab-skeleton mt-1 min-h-[8rem] min-w-0 flex-1 rounded-ms-lg" aria-hidden />
      <p className="sr-only">{label}</p>
    </div>
  );
}

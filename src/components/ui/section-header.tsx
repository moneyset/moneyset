import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** `hero` for primary workspace intros; `section` for in-page modules. */
  variant?: "hero" | "section";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
  variant = "section",
}: SectionHeaderProps) {
  const titleClass = variant === "hero" ? "ms-hero-title" : "ms-headline text-ms-text";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2.5 max-sm:gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="ms-section-eyebrow">{eyebrow}</p>
        <h2 className={cn(titleClass, "text-pretty break-words")}>{title}</h2>
        {description ? (
          <div className="ms-intelligence-summary max-w-[42rem] text-pretty text-ms-muted">{description}</div>
        ) : null}
      </div>
      {action ? <div className="min-w-0 shrink-0 sm:max-w-[45%]">{action}</div> : null}
    </div>
  );
}

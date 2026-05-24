"use client";

import { cn } from "@/lib/utils";

type ToggleProps = {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
  id?: string;
  className?: string;
};

export function Toggle({ checked, onCheckedChange, label, id, className }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "ms-focus-ring group inline-flex items-center gap-3 rounded-ms-pill border border-ms-border bg-ms-elevated/80 px-3 py-2 backdrop-blur-sm",
        className,
      )}
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-ms-pill border border-ms-border-mid transition-colors",
          checked ? "bg-ms-cognition/25" : "bg-ms-surface",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-ms-pill bg-ms-text shadow-ms-sm transition-transform duration-200 ease-out",
            checked ? "translate-x-[1.125rem]" : "translate-x-0.5",
          )}
        />
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ms-muted">{label}</span>
    </button>
  );
}

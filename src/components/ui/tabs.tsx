"use client";

import { cn } from "@/lib/utils";

export type TabItem<T extends string = string> = { id: T; label: string };

type TabsProps<T extends string> = {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
};

export function Tabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex rounded-ms-md border border-ms-border bg-ms-elevated/70 p-0.5 backdrop-blur-sm",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "ms-focus-ring rounded-[calc(var(--ms-radius-md)-2px)] px-3 py-1.5 text-[11px] font-medium tracking-tight transition-colors",
              active ? "bg-ms-surface text-ms-text shadow-ms-ring" : "text-ms-muted hover:text-ms-text",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

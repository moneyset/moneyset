"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MsThemePreference } from "@/types/theme";
import { useThemeStore } from "@/store/theme-store";

const modes: { value: MsThemePreference; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function ThemeToggle() {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  return (
    <div
      className="inline-flex rounded-ms-md border border-ms-border bg-ms-elevated/80 p-0.5 shadow-ms-ring backdrop-blur-md"
      role="group"
      aria-label="Theme"
    >
      {modes.map(({ value, icon: Icon, label }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPreference(value)}
            aria-label={label}
            className={cn(
              "ms-focus-ring flex size-8 items-center justify-center rounded-[calc(var(--ms-radius-md)-2px)] transition-colors",
              active
                ? "bg-ms-surface text-ms-text shadow-ms-sm"
                : "text-ms-muted hover:bg-ms-elevated hover:text-ms-text",
            )}
          >
            <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import type { UiLocale } from "@/store/ui-prefs-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { useT } from "@/lib/i18n/use-t";

const locales: { id: UiLocale; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "ru", label: "RU" },
];

/** Display-only language control — wires to UI prefs for future i18n; no translation engine. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const uiLocale = useUiPrefsStore((s) => s.uiLocale);
  const setUiLocale = useUiPrefsStore((s) => s.setUiLocale);
  const t = useT();

  return (
    <div
      className={cn(
        "flex rounded-ms-md border border-ms-border bg-ms-elevated/70 p-0.5 backdrop-blur-sm",
        className,
      )}
      role="group"
      aria-label={t("lang.label")}
    >
      {locales.map(({ id, label }) => {
        const active = uiLocale === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setUiLocale(id)}
            className={cn(
              "ms-focus-ring min-w-[2.25rem] rounded-[calc(var(--ms-radius-md)-2px)] px-2 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors",
              active ? "bg-ms-surface text-ms-text shadow-ms-ring" : "text-ms-muted hover:text-ms-text",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

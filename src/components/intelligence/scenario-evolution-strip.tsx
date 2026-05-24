"use client";

import { useExecutionEvolutionStore } from "@/store/execution-evolution-store";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function ScenarioEvolutionStrip({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const samples = useExecutionEvolutionStore((s) => s.samples);
  const tail = samples.slice(-5);

  if (tail.length === 0) return null;

  return (
    <section
      className={cn("border-t border-ms-border/25 px-4 py-4 sm:px-5", className)}
      aria-label={pickLocale(locale, "Scenario evolution", "Эволюция сценария")}
    >
      <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Scenario evolution", "Эволюция сценария")}</p>
      <ol className="mt-3 space-y-2">
        {tail.map((fr) => (
          <li key={`${fr.ts}-${fr.signature}`} className="flex gap-3 text-[12px] leading-snug sm:text-[13px]">
            <time className="shrink-0 font-mono text-[11px] tabular-nums text-ms-faint">
              {new Date(fr.ts).toLocaleTimeString(locale === "ru" ? "ru-RU" : "en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </time>
            <span className="min-w-0 text-ms-muted">{fr.emphasisLine}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

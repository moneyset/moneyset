"use client";

import type { ExecutionInterpretationBundle } from "@/lib/execution/derive-execution-interpretation";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";

type ExecutionInterpretationPanelProps = {
  locale: UiLocale;
  bundle: ExecutionInterpretationBundle;
  /** Preview = posture + bias; full = acceptance, defensive, tactical framework. */
  mode: "preview" | "full";
  className?: string;
  compact?: boolean;
};

function InterpretationRow({
  label,
  line,
  emphasis,
}: {
  label: string;
  line: string;
  emphasis?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="ms-data-label text-ms-faint">{label}</p>
      <p
        className={cn(
          "text-pretty text-[11px] leading-snug sm:text-[12px]",
          emphasis ? "font-medium text-ms-text/95" : "text-ms-muted",
        )}
      >
        {line}
      </p>
    </div>
  );
}

export function ExecutionInterpretationPanel({
  locale,
  bundle,
  mode,
  className,
  compact,
}: ExecutionInterpretationPanelProps) {
  const full = mode === "full";

  return (
    <section
      className={cn(
        "ms-exec-interpretation rounded-ms-lg border border-ms-border/20 bg-ms-surface/10",
        full && "ms-exec-interpretation--full",
        compact ? "p-3" : "p-3.5 sm:p-4",
        className,
      )}
      aria-label={pickLocale(locale, "Execution interpretation", "Интерпретация исполнения")}
    >
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-ms-border/12 pb-2.5">
        <p className="ms-data-label text-ms-cognition/80">
          {pickLocale(locale, "Execution intelligence", "Интеллект исполнения")}
        </p>
        {!full ? (
          <span className="ms-metadata rounded-ms-sm border border-ms-border/15 px-1.5 py-0.5">
            {pickLocale(locale, "Partial read", "Частичное прочтение")}
          </span>
        ) : null}
      </header>

      <div
        className={cn(
          "ms-exec-interpretation__grid grid gap-3 sm:gap-4",
          full && !compact && "lg:grid-cols-2",
        )}
      >
        <div className="ms-exec-interpretation__posture">
          <InterpretationRow
            label={pickLocale(locale, "Current posture", "Текущая поза")}
            line={bundle.currentPosture}
            emphasis
          />
        </div>
        {full ? (
          <>
            <InterpretationRow
              label={pickLocale(locale, "Acceptance zone", "Зона принятия")}
              line={bundle.acceptanceZone.line}
            />
            <InterpretationRow
              label={pickLocale(locale, "Defensive zone", "Защитная зона")}
              line={bundle.defensiveZone.line}
            />
          </>
        ) : null}
        <InterpretationRow
          label={pickLocale(locale, "Execution bias", "Уклон исполнения")}
          line={bundle.executionBias}
        />
        {!compact ? (
          <div className={cn("min-w-0 space-y-1", full && "lg:col-span-2")}>
            <p className="ms-data-label text-ms-faint">
              {pickLocale(locale, "Why this posture", "Почему эта поза")}
            </p>
            <p className="text-pretty text-[10px] leading-relaxed text-ms-muted sm:text-[11px]">
              {bundle.postureRationale}
            </p>
          </div>
        ) : null}
        {!compact ? (
          <div className={cn("min-w-0 space-y-1", full && "lg:col-span-2")}>
            <p className="ms-data-label text-ms-faint">
              {pickLocale(locale, "Scenario implication", "Импликация сценария")}
            </p>
            <p className="text-pretty text-[10px] leading-relaxed text-ms-muted sm:text-[11px]">
              {bundle.scenarioImplication}
            </p>
          </div>
        ) : null}
      </div>

      {full && bundle.tacticalFramework.length > 0 ? (
        <div className="mt-4 border-t border-ms-border/12 pt-3">
          <p className="ms-data-label text-ms-faint">
            {pickLocale(locale, "Tactical framework", "Тактическая рамка")}
          </p>
          <ul className="ms-exec-interpretation__framework mt-2 grid gap-2 sm:grid-cols-2">
            {bundle.tacticalFramework.map((z) => (
              <li
                key={z.id}
                className="rounded-ms-md border border-ms-border/14 bg-ms-elevated/8 px-2.5 py-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                  <span className="text-[10px] font-semibold tracking-tight text-ms-text/90">{z.title}</span>
                  <span className="tabular-nums text-[10px] text-ms-faint">{z.rangeLabel}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-pretty text-[9.5px] leading-snug text-ms-muted">{z.framing}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!full ? (
        <p className="ms-metadata mt-3 border-t border-ms-border/10 pt-2">
          {pickLocale(
            locale,
            "Acceptance / defensive zones and tactical framework — reserved execution field.",
            "Зоны принятия / защиты и тактическая рамка — в зарезервированном поле исполнения.",
          )}
        </p>
      ) : null}
    </section>
  );
}

"use client";

import type { ReactNode } from "react";

import type { LabIdentity } from "@/lib/cognition/lab-identities";
import { machineToWorld } from "@/lib/cognition/cognition-worlds";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import type { UiLocale } from "@/store/ui-prefs-store";

type CognitionMachineShellProps = {
  identity: LabIdentity;
  locale: UiLocale;
  title: string;
  purpose: string;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
};

const MACHINE_TAGLINE: Record<LabIdentity["machine"], { en: string; ru: string }> = {
  chart: { en: "Execution terrain mapper", ru: "Карта рельефа исполнения" },
  liquidity: { en: "Market pressure physics", ru: "Физика рыночного давления" },
  macro: { en: "Global regime monitor", ru: "Монитор глобального режима" },
  sentiment: { en: "Narrative tension engine", ru: "Двигатель нарративного напряжения" },
  replay: { en: "Temporal cognition replay", ru: "Временной реплей прочтения" },
  memory: { en: "Institutional memory archive", ru: "Архив институциональной памяти" },
  "cross-asset": { en: "Intermarket transmission", ru: "Межрыночная передача" },
  "risk-radar": { en: "Hidden fragility detection", ru: "Детекция скрытой хрупкости" },
};

export function CognitionMachineShell({
  identity,
  locale,
  title,
  purpose,
  children,
  aside,
  className,
}: CognitionMachineShellProps) {
  const tag = MACHINE_TAGLINE[identity.machine];
  return (
    <div
      data-ms-machine={identity.machine}
      data-ms-world={machineToWorld(identity.machine)}
      className={cn("ms-cognition-machine", `ms-cognition-machine--${identity.layout}`, className)}
      style={
        {
          "--ms-machine-accent": `var(${identity.accentVar})`,
          "--ms-machine-accent-dim": `var(${identity.accentDimVar})`,
        } as React.CSSProperties
      }
    >
      <div className="ms-cognition-machine__veil" aria-hidden />
      <header className="ms-cognition-machine__header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="ms-cognition-machine__tag">{pickLocale(locale, tag.en, tag.ru)}</p>
          <h1 className="ms-cognition-machine__title">{title}</h1>
          <details className="ms-cognition-machine__purpose-wrap">
            <summary className="ms-cognition-machine__purpose-summary" aria-label={purpose}>
              ·
            </summary>
            <p className="ms-cognition-machine__purpose">{purpose}</p>
          </details>
        </div>
        {aside ? <div className="ms-cognition-machine__aside min-w-0 shrink-0">{aside}</div> : null}
      </header>
      <div className="ms-cognition-machine__body">{children}</div>
    </div>
  );
}

"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

import { LAB_ICONS } from "@/components/labs/labs-icons";
import { SurfaceChrome } from "@/components/surfaces/surface-chrome";
import { LAB_IDENTITIES } from "@/lib/cognition/lab-identities";
import { allLabModules, labCopy } from "@/lib/labs/labs-modules";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function LabsGatewayPage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const modules = allLabModules();

  return (
    <div>
      <SurfaceChrome
        tone="support"
        eyebrow={pickLocale(locale, "Deep research environments", "Среды глубокого анализа")}
        title={pickLocale(locale, "Labs", "Лаборатории")}
        subtitle={pickLocale(
          locale,
          "Specialist analysis environments. Each lab answers a question the main surfaces don't have space for.",
          "Среды специализированного анализа. Каждая лаборатория отвечает на вопрос, для которого нет места на основных поверхностях.",
        )}
      />

      {/* Labs definition context */}
      <div className="mb-[var(--ms-block-gap)] rounded-ms-xl border border-ms-border/14 bg-ms-elevated/8 px-4 py-4 sm:px-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ms-faint/80">
          {pickLocale(locale, "What is Labs?", "Что такое Лаборатории?")}
        </p>
        <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-ms-muted sm:text-[13px]">
          {pickLocale(
            locale,
            "Labs are deep research environments. Core shows what is happening. Execution shows what to do. Labs show why — in more depth, with more precision. Use Labs when you need structural detail that goes beyond the surface read.",
            "Лаборатории — среды глубокого анализа. Core показывает, что происходит. Execution — что делать. Лаборатории показывают почему — глубже, точнее. Используйте Лаборатории, когда нужна структурная детализация, выходящая за рамки поверхностного прочтения.",
          )}
        </p>
      </div>

      <div className="ms-labs-gateway-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map((m) => {
          const Icon = LAB_ICONS[m.slug];
          const identity = LAB_IDENTITIES[m.slug];
          const href = `/labs/${m.slug}`;
          const purpose = labCopy(locale, m.purpose);
          const features = m.features.slice(0, 2).map((f) => labCopy(locale, f));
          return (
            <Link
              key={m.slug}
              href={href}
              data-ms-machine={identity.machine}
              className={cn(
                "ms-focus-ring group ms-labs-gateway-card flex flex-col rounded-ms-xl border border-ms-border/30 bg-ms-elevated/12 p-4 transition-[border-color,background-color,box-shadow] duration-200",
                "hover:border-[color-mix(in_srgb,var(--ms-machine-accent,var(--ms-cognition))_32%,var(--ms-border))] hover:bg-ms-surface/18",
              )}
              style={
                {
                  "--ms-machine-accent": `var(${identity.accentVar})`,
                } as CSSProperties
              }
            >
              {/* Icon + accent tag */}
              <div className="flex items-center gap-2">
                <Icon
                  className="size-4 shrink-0"
                  style={{ color: `var(${identity.accentVar})` }}
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span
                  className="rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] opacity-75"
                  style={{ color: `var(${identity.accentVar})`, backgroundColor: `color-mix(in srgb, var(${identity.accentVar}) 10%, transparent)` }}
                >
                  {identity.layout}
                </span>
              </div>

              {/* Title */}
              <p className="mt-2.5 text-[13px] font-semibold leading-snug tracking-tight text-ms-text">
                {labCopy(locale, m.title)}
              </p>

              {/* Purpose — why enter this lab */}
              <p className="mt-1.5 text-[11px] leading-snug text-ms-muted group-hover:text-ms-text/80">
                {purpose}
              </p>

              {/* Top features */}
              {features.length > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-ms-border/10 pt-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[10px] leading-snug text-ms-faint">
                      <span className="mt-1 size-1 shrink-0 rounded-full bg-ms-border/50" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
              ) : null}

              {/* Enter signal */}
              <p className="mt-auto pt-3 text-[10px] font-medium tracking-wide text-ms-faint/70 transition-colors duration-150 group-hover:text-ms-muted">
                {pickLocale(locale, "Open →", "Открыть →")}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

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

const GATEWAY_TAGLINE: Record<string, { en: string; ru: string }> = {
  chart: { en: "Terrain", ru: "Рельеф" },
  liquidity: { en: "Topology", ru: "Топология" },
  macro: { en: "Pressure matrix", ru: "Матрица давления" },
  sentiment: { en: "Narrative", ru: "Нарратив" },
  replay: { en: "Timeline", ru: "Таймлайн" },
  "strategy-memory": { en: "Archive", ru: "Архив" },
  "cross-asset": { en: "Transmission", ru: "Передача" },
  "risk-radar": { en: "Radar", ru: "Радар" },
};

export default function LabsGatewayPage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const modules = allLabModules();

  return (
    <div>
      <SurfaceChrome
        tone="support"
        eyebrow={pickLocale(locale, "Level 3", "Уровень 3")}
        title={pickLocale(locale, "Labs", "Лаборатории")}
        subtitle={pickLocale(locale, "Cognition machines", "Машины прочтения")}
      />

      <div className="ms-labs-gateway-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map((m) => {
          const Icon = LAB_ICONS[m.slug];
          const identity = LAB_IDENTITIES[m.slug];
          const tag = GATEWAY_TAGLINE[m.slug];
          const href = `/labs/${m.slug}`;
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
              <div className="flex items-start justify-between gap-2">
                <Icon
                  className="size-4 shrink-0"
                  style={{ color: `var(${identity.accentVar})` }}
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="text-[10px] font-medium text-ms-faint transition-colors group-hover:text-ms-muted">
                  {tag ? pickLocale(locale, tag.en, tag.ru) : pickLocale(locale, "Open", "Открыть")}
                </span>
              </div>
              <p className="mt-3 text-[13px] font-semibold leading-snug tracking-tight text-ms-text">
                {labCopy(locale, m.title)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

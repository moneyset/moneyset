"use client";

import type { ReactNode } from "react";

import { useCanAccessCapability } from "@/hooks/use-capabilities";
import { useMarketPosture } from "@/hooks/use-market-posture";
import { ScenarioEvolutionStrip } from "@/components/intelligence/scenario-evolution-strip";
import {
  confidenceLabel,
  executionBiasLabel,
  postureChangeLabel,
  postureLabel,
  riskLevelLabel,
} from "@/lib/intelligence/market-posture-engine";
import { hierarchySectionLabel } from "@/lib/i18n/section-ia";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUpgradeModalStore } from "@/store/upgrade-modal-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { Button } from "@/components/ui/button";

function PostureField({ label, children, accent }: { label: string; children: ReactNode; accent?: boolean }) {
  return (
    <div className="min-w-0 border-l border-ms-border/35 pl-3">
      <p className="ms-data-label text-ms-faint">{label}</p>
      <p className={cn("mt-1 text-[12px] font-medium leading-snug sm:text-[13px]", accent ? "text-ms-cognition" : "text-ms-text")}>
        {children}
      </p>
    </div>
  );
}

export function CurrentMarketPosture() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const posture = useMarketPosture();
  const openUpgrade = useUpgradeModalStore((s) => s.openUpgrade);

  const canZones = useCanAccessCapability("marketPostureZones");
  const canHistory = useCanAccessCapability("marketPostureHistory");
  const canInvalidation = useCanAccessCapability("invalidationLogic");
  const canDeep = useCanAccessCapability("deepInterpretation");
  const canEvolution = useCanAccessCapability("scenarioEvolution");

  const priorLabel = posture.history.priorPosture
    ? postureLabel(locale, posture.history.priorPosture)
    : pickLocale(locale, "—", "—");

  const whyLines = canDeep ? posture.why : posture.why.slice(0, 1);

  return (
    <section
      className="ms-market-posture mb-6 min-w-0 rounded-ms-xl border border-ms-border/45 bg-ms-surface/28"
      aria-label={pickLocale(locale, "Current market posture", "Текущая рыночная поза")}
    >
      <header className="border-b border-ms-border/30 px-4 py-3 sm:px-5 sm:py-3.5">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-ms-faint sm:text-[11px]">
          {hierarchySectionLabel(locale, "evidence")} · {pickLocale(locale, "Current Market Posture", "Текущая рыночная поза")}
        </p>
      </header>

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-4 sm:px-5 sm:py-5 lg:grid-cols-3">
        <PostureField label={pickLocale(locale, "Posture", "Поза")} accent>
          {postureLabel(locale, posture.posture)}
        </PostureField>
        <PostureField label={pickLocale(locale, "Confidence", "Уверенность")}>
          {confidenceLabel(locale, posture.confidence)}
        </PostureField>
        <PostureField label={pickLocale(locale, "Execution bias", "Уклон исполнения")}>
          {executionBiasLabel(locale, posture.executionBias)}
        </PostureField>
        <PostureField label={pickLocale(locale, "Risk level", "Уровень риска")}>
          {riskLevelLabel(locale, posture.riskLevel)}
        </PostureField>
        {canZones ? (
          <>
            <PostureField label={pickLocale(locale, "Primary acceptance zone", "Зона принятия")}>
              <span className="font-mono text-[11px] font-normal tabular-nums text-ms-muted sm:text-[12px]">
                {posture.primaryAcceptanceZone}
              </span>
            </PostureField>
            <PostureField label={pickLocale(locale, "Primary risk zone", "Зона риска")}>
              <span className="font-mono text-[11px] font-normal tabular-nums text-ms-muted sm:text-[12px]">
                {posture.primaryRiskZone}
              </span>
            </PostureField>
          </>
        ) : (
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-[11px] leading-snug text-ms-muted">
              {pickLocale(
                locale,
                "Price zones show where the market accepts position and where risk concentrates — visible with full access.",
                "Ценовые зоны показывают, где рынок принимает позицию и где концентрируется риск — открываются при полном доступе.",
              )}
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-2 h-8 px-2 text-[11px]" onClick={openUpgrade}>
              {pickLocale(locale, "Unlock — $79", "Открыть — $79")}
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-ms-border/25 px-4 py-4 sm:px-5">
        <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Why", "Почему")}</p>
        <ul className="mt-2 space-y-1.5">
          {whyLines.map((line) => (
            <li key={line} className="flex gap-2 text-[12px] leading-snug text-ms-muted sm:text-[13px]">
              <span className="text-ms-faint" aria-hidden>
                •
              </span>
              <span className="min-w-0 text-pretty">{line}</span>
            </li>
          ))}
        </ul>
        {!canDeep ? (
          <p className="mt-2 text-[11px] text-ms-faint">
            {pickLocale(
              locale,
              "Additional context available with full access — see what drives this posture.",
              "Дополнительный контекст открывается при полном доступе — что формирует эту позу.",
            )}
          </p>
        ) : null}
      </div>

      <div className="border-t border-ms-border/25 px-4 py-4 sm:px-5">
        <p className="ms-data-label text-ms-faint">
          {pickLocale(locale, "What this means for decisions", "Что это означает для решений")}
        </p>
        <p className="mt-2 text-pretty text-[13px] leading-relaxed text-ms-text sm:text-[14px]">
          {posture.executionImplication}
        </p>
        {canInvalidation ? (
          <p className="mt-3 text-[11px] leading-snug text-ms-faint sm:text-[12px]">
            <span className="font-medium text-ms-muted">
              {pickLocale(locale, "Invalidates if:", "Снимается, если:")}
            </span>{" "}
            {posture.invalidationRead}
          </p>
        ) : null}
      </div>

      {canEvolution ? <ScenarioEvolutionStrip /> : null}

      {canHistory ? (
        <div className="border-t border-ms-border/25 bg-ms-elevated/12 px-4 py-3 sm:px-5">
          <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Posture history", "История позы")}</p>
          <dl className="mt-2 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-3 sm:text-[12px]">
            <div className="min-w-0">
              <dt className="text-ms-faint">{pickLocale(locale, "Yesterday", "Вчера")}</dt>
              <dd className="mt-0.5 font-medium text-ms-muted">{priorLabel}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-ms-faint">{pickLocale(locale, "Today", "Сегодня")}</dt>
              <dd className="mt-0.5 font-medium text-ms-text">{postureLabel(locale, posture.posture)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-ms-faint">{pickLocale(locale, "Change", "Изменение")}</dt>
              <dd className="mt-0.5 font-medium text-ms-warning/90">
                {postureChangeLabel(locale, posture.history.change)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </section>
  );
}

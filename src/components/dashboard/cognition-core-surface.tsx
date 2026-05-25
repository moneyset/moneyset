"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useShallow } from "zustand/react/shallow";

import { DecisionLayerPanel } from "@/components/intelligence/decision-layer-panel";
import { CurrentMarketPosture } from "@/components/intelligence/current-market-posture";
import { SurfaceBlufBlock } from "@/components/cognition/surface-bluf-block";
import { ExecutionInterpretationBridge } from "@/components/execution/execution-interpretation-bridge";
import { PremiumExecutionLayer } from "@/components/dashboard/premium-execution-layer";
import { useExtendedCognitionAccess } from "@/hooks/use-extended-cognition-access";
import { useSurfaceBluf } from "@/hooks/use-surface-bluf";
import { SurfaceChrome } from "@/components/surfaces/surface-chrome";
import { useExecutionSurface } from "@/hooks/use-execution-surface";
import {
  dangerBandLabel,
  mainRiskDisplay,
  phaseLabel,
  pickLocale,
  scenarioTitle,
  topScenarioSummary,
} from "@/lib/i18n/cognition-dict";
import { executionSessionDeskStrip } from "@/lib/cognition/session-visual";
import { marketFeedStatusLabel } from "@/lib/i18n/trust-surface";
import { sectionChromeSubtitle, sectionPurpose, sectionTitle } from "@/lib/i18n/section-ia";
import { cn } from "@/lib/utils";
import { useAiCognitionStore } from "@/store/ai-cognition-store";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useMarketStore } from "@/store/market-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
function StateField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-l-2 border-ms-border/40 pl-3">
      <p className="text-[10px] font-medium text-ms-muted">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const DEEP_LINKS: { href: string; en: string; ru: string; purposeEn: string; purposeRu: string }[] = [
  { href: "/execution", en: "Execution", ru: "Исполнение", purposeEn: "What to do now", purposeRu: "Что делать" },
  { href: "/scenarios", en: "Scenarios", ru: "Сценарии", purposeEn: "What could happen next", purposeRu: "Что дальше" },
  { href: "/ops", en: "Changes", ru: "Изменения", purposeEn: "What changed", purposeRu: "Что изменилось" },
  { href: "/maps", en: "Maps", ru: "Карты", purposeEn: "Market geometry", purposeRu: "Геометрия" },
  { href: "/agents", en: "Agents", ru: "Агенты", purposeEn: "Consensus vs disagreement", purposeRu: "Консенсус" },
  { href: "/labs", en: "Labs", ru: "Лаборатории", purposeEn: "Deep modules", purposeRu: "Модули" },
  { href: "/macro", en: "Macro", ru: "Макро", purposeEn: "Macro layer", purposeRu: "Макро" },
  { href: "/risk-radar", en: "Risk", ru: "Риск", purposeEn: "Risk topology", purposeRu: "Риск" },
  { href: "/memory", en: "Memory", ru: "Память", purposeEn: "Archive", purposeRu: "Архив" },
];

export function CognitionCoreSurface() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bluf = useSurfaceBluf("core");
  const extended = useExtendedCognitionAccess();
  const cognitionMode = useUiPrefsStore((s) => s.cognitionMode);
  const compact = cognitionMode === "compressed";
  const surface = useExecutionSurface();
  const orch = useAiCognitionStore((s) => s.orchestrator);
  const market = useMarketStore(
    useShallow((s) => ({
      connection: s.connection,
      price: s.price,
    })),
  );
  const { derived, mainRisk, topScenario, scenarioBook } = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      mainRisk: s.mainRisk,
      topScenario: s.topScenario,
      scenarioBook: s.scenarioBook,
    })),
  );

  const mr = mainRiskDisplay(locale, mainRisk.riskKey, mainRisk.dangerScore);
  const topTitle = scenarioTitle(locale, topScenario.scenarioId);
  const topLine =
    scenarioBook.cards[0]?.pathConvictionLine ??
    topScenarioSummary(locale, topScenario.scenarioId, topScenario.probabilityPct);

  const biasLine =
    orch?.actionBias === "tighten_risk"
      ? pickLocale(locale, "Tighten risk", "Ужать риск")
      : orch?.actionBias === "wait_for_acceptance"
        ? pickLocale(locale, "Wait for acceptance", "Ждать принятия")
        : orch?.actionBias === "stay_measured"
          ? pickLocale(locale, "Stay measured", "Держать меру")
          : pickLocale(locale, "Neutral", "Нейтрально");

  const desk = executionSessionDeskStrip(locale);

  const stateAside = (
    <>
      <StateField label={pickLocale(locale, "Market state", "Состояние рынка")}>
        <p className="text-[13px] font-medium leading-snug text-ms-text">
          {phaseLabel(locale, derived.phase)}
          <span className="font-normal text-ms-faint"> — </span>
          <span className="text-ms-muted">{dangerBandLabel(locale, derived.dangerBand)}</span>
        </p>
        <p className="mt-1 text-[11px] tabular-nums text-ms-faint">
          {marketFeedStatusLabel(locale, market.connection)}
          {market.price ? ` · BTC ${market.price.toFixed(0)}` : ""}
        </p>
      </StateField>
      <StateField label={pickLocale(locale, "Session context", "Контекст сессии")}>
        <p className="text-[12px] leading-snug text-ms-muted">{desk}</p>
      </StateField>
      <StateField label={pickLocale(locale, "Structural bias", "Структурный уклон")}>
        <p className="text-[12px] leading-snug text-ms-text">{biasLine}</p>
      </StateField>
    </>
  );

  const supportAside = (
    <>
      <StateField label={pickLocale(locale, "Execution posture", "Поза исполнения")}>
        <p className="line-clamp-5 text-[12px] leading-relaxed text-ms-muted">{surface.executionPosture}</p>
      </StateField>
      <StateField label={pickLocale(locale, "Main structural risk", "Главный структурный риск")}>
        <p className="text-[12px] font-semibold leading-snug text-ms-danger/90">{mr.headline}</p>
      </StateField>
      <StateField label={pickLocale(locale, "Primary scenario", "Базовый сценарий")}>
        <p className="text-[13px] font-medium leading-snug text-ms-text/95">{topTitle}</p>
        {!compact ? <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-ms-muted">{topLine}</p> : null}
      </StateField>
    </>
  );

  return (
    <div className={cn("ms-page ms-cognition-surface relative", compact && "ms-density-dense")}>
      <div className="mb-3 lg:hidden">
        <p className="text-[12px] font-semibold text-ms-text">{sectionTitle(locale, "core")}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-ms-cognition/90">{sectionPurpose(locale, "core")}</p>
      </div>

      <div className="mb-[var(--ms-section-gap)] hidden lg:block">
        <SurfaceChrome
          eyebrow={sectionTitle(locale, "core")}
          title={sectionTitle(locale, "core")}
          purpose={sectionPurpose(locale, "core")}
          subtitle={sectionChromeSubtitle(locale, "core")}
        />
      </div>

      <SurfaceBlufBlock bluf={bluf} />

      <DecisionLayerPanel />

      <CurrentMarketPosture />

      <div
        className={cn(
          "lg:grid lg:items-start",
          "lg:grid-cols-[minmax(10rem,13rem)_minmax(0,1fr)_minmax(10rem,14rem)] lg:gap-x-8 xl:grid-cols-[minmax(11rem,14rem)_minmax(0,1fr)_minmax(11rem,15rem)] xl:gap-x-10",
        )}
      >
        <aside className="hidden flex-col gap-6 lg:flex lg:pt-1">{stateAside}</aside>

        <div className="min-w-0 space-y-4 lg:space-y-0">
          {!extended ? <ExecutionInterpretationBridge className="max-lg:mx-0" /> : null}
          <div className="ms-desktop-exec-gravity relative overflow-hidden rounded-ms-xl max-lg:border max-lg:border-ms-border/35 max-lg:bg-ms-elevated/12 lg:rounded-ms-2xl">
            <PremiumExecutionLayer
              mode="command"
              className="border-ms-border/25 shadow-none lg:border-ms-border/30"
            />
          </div>
        </div>

        <aside className="hidden flex-col gap-6 border-l border-ms-border/20 pl-6 opacity-[0.9] lg:flex xl:pl-8">
          {supportAside}
        </aside>
      </div>

      <nav
        aria-label={pickLocale(locale, "Deep analytical surfaces", "Глубокие аналитические поверхности")}
        className="mt-10 hidden border-t border-ms-border/25 pt-6 lg:block"
      >
        <p className="text-[10px] font-medium text-ms-faint">
          {pickLocale(locale, "Analytical depth", "Аналитическая глубина")}
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-1 gap-y-2">
          {DEEP_LINKS.map((item, i) => (
            <li key={item.href} className="flex items-center">
              {i > 0 ? <span className="mx-2 text-ms-border" aria-hidden>|</span> : null}
              <Link
                href={item.href}
                className="text-[12px] font-medium text-ms-muted transition-colors hover:text-ms-text"
                title={pickLocale(locale, item.purposeEn, item.purposeRu)}
              >
                {pickLocale(locale, item.en, item.ru)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

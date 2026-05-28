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
  { href: "/execution",      en: "Execution",    ru: "Исполнение",   purposeEn: "What should I do now.",                   purposeRu: "Что делать сейчас." },
  { href: "/scenarios",      en: "Scenarios",    ru: "Сценарии",     purposeEn: "What could happen next.",                 purposeRu: "Что может произойти дальше." },
  { href: "/ops",            en: "Changes",      ru: "Изменения",    purposeEn: "What changed and why.",                   purposeRu: "Что изменилось и почему." },
  { href: "/maps",           en: "Maps",         ru: "Карты",        purposeEn: "Structural market geometry.",             purposeRu: "Структурная геометрия рынка." },
  { href: "/agents",         en: "Agents",       ru: "Агенты",       purposeEn: "Where intelligence agrees or disagrees.", purposeRu: "Где прочтения сходятся или расходятся." },
  { href: "/labs",           en: "Labs",         ru: "Лаборатории",  purposeEn: "Deep research environments.",             purposeRu: "Среды глубокого анализа." },
  { href: "/macro",          en: "Macro",        ru: "Макро",        purposeEn: "Macro pressure layer.",                   purposeRu: "Макро-давление." },
  { href: "/risk-radar",     en: "Risk Radar",   ru: "Риск",         purposeEn: "Hidden fragility and stress.",            purposeRu: "Скрытая хрупкость." },
  { href: "/memory",         en: "Memory",       ru: "Память",       purposeEn: "Structural archive.",                     purposeRu: "Структурный архив." },
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

  const platformCenterLine = pickLocale(
    locale,
    "Start here. Everything else deepens this read.",
    "Начните здесь. Всё остальное углубляет это прочтение.",
  );

  return (
    <div className={cn("ms-page ms-cognition-surface relative", compact && "ms-density-dense")}>
      {/* Mobile header — center of the platform framing */}
      <div className="mb-4 lg:hidden">
        <div className="mb-1 flex items-baseline gap-2.5">
          <p className="text-[14px] font-semibold tracking-tight text-ms-text">
            {sectionTitle(locale, "core")}
          </p>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ms-faint/70">
            {pickLocale(locale, "Platform center", "Центр платформы")}
          </span>
        </div>
        <p className="text-[12px] font-medium leading-snug text-ms-cognition/90">
          {sectionPurpose(locale, "core")}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-ms-faint">{platformCenterLine}</p>
      </div>

      <div className="mb-[var(--ms-section-gap)] hidden lg:block">
        <SurfaceChrome
          eyebrow={pickLocale(locale, "Platform center", "Центр платформы")}
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
        aria-label={pickLocale(locale, "Analytical surfaces", "Аналитические поверхности")}
        className="mt-8 border-t border-ms-border/25 pt-6"
      >
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-ms-faint/80">
          {pickLocale(locale, "Go deeper", "Углубиться")}
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {DEEP_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="ms-focus-ring group flex flex-col gap-0.5 rounded-ms-lg border border-ms-border/20 bg-ms-elevated/8 px-3 py-2.5 transition-[border-color,background-color] duration-150 hover:border-ms-border/35 hover:bg-ms-surface/15"
              >
                <span className="text-[12px] font-medium leading-snug text-ms-text/90 group-hover:text-ms-text">
                  {pickLocale(locale, item.en, item.ru)}
                </span>
                <span className="text-[10px] leading-snug text-ms-faint group-hover:text-ms-muted">
                  {pickLocale(locale, item.purposeEn, item.purposeRu)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <footer className="ms-home-legal-footer" aria-label={pickLocale(locale, "Legal", "Правовая информация")}>
        <Link href="/privacy">{pickLocale(locale, "Privacy Policy", "Privacy Policy")}</Link>
        <Link href="/terms">{pickLocale(locale, "Terms of Service", "Terms of Service")}</Link>
      </footer>
    </div>
  );
}

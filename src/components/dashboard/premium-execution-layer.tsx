"use client";

import { useMemo, memo } from "react";
import { useShallow } from "zustand/react/shallow";

import { ExecutionBiasStrip } from "@/components/execution/execution-bias-strip";
import { ExecutionCognitionStrips } from "@/components/execution/execution-cognition-strips";
import { ExecutionInterpretationPanel } from "@/components/execution/execution-interpretation-panel";
import { ExecutionMapSurface } from "@/components/execution/execution-map-surface";
import { useExecutionInterpretation } from "@/hooks/use-execution-interpretation";
import { ExecutionPrimaryCognitionStrip } from "@/components/execution/execution-primary-cognition-strip";
import { ExecutionStructuralRail } from "@/components/execution/execution-structural-rail";
import { ExecutionZoneStack } from "@/components/execution/execution-zone-stack";
import { LiveExecutionIntelStrip } from "@/components/execution/live-execution-intel-strip";
import { MicroDeltaGlyph } from "@/components/cognition/micro-delta-glyph";
import { useAttentionPlane } from "@/components/cognition/attention-priority-context";
import { SparklineDeltaPair } from "@/components/cognition/sparkline-delta-pair";
import { PremiumGate } from "@/components/premium/premium-gate";
import { useExtendedCognitionAccess } from "@/hooks/use-extended-cognition-access";
import { executionSessionDeskStrip, utcSessionAmbientBarClass } from "@/lib/cognition/session-visual";
import { trendFromScalarDelta } from "@/lib/cognition/series-delta";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { formatPriceRange, zoneContainingPrice } from "@/lib/execution/derive-execution-layer";
import { useExecutionSurface } from "@/hooks/use-execution-surface";
import { useT } from "@/lib/i18n/use-t";
import { cn } from "@/lib/utils";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useExecutionEvolutionStore } from "@/store/execution-evolution-store";
import { useLiveExecutionIntelStore } from "@/store/live-execution-intel-store";
import { useUpgradeModalStore } from "@/store/upgrade-modal-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export type PremiumExecutionLayerMode = "command" | "workspace";

export const PremiumExecutionLayer = memo(function PremiumExecutionLayer({
  className,
  mode = "workspace",
}: {
  className?: string;
  mode?: PremiumExecutionLayerMode;
}) {
  const t = useT();
  const extended = useExtendedCognitionAccess();
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const openUpgrade = useUpgradeModalStore((s) => s.openUpgrade);
  const { derived, latent } = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
    })),
  );

  const surface = useExecutionSurface();
  const { full: interpretation } = useExecutionInterpretation();
  const commandSurface = mode === "command";

  const att = useAttentionPlane();

  const anchorDisplay =
    surface.anchorPrice !== null
      ? formatPriceRange(locale, surface.anchorPrice, surface.anchorPrice)
      : "—";

  const keyZone =
    surface.anchorPrice !== null ? zoneContainingPrice(surface.zones, surface.anchorPrice) : null;
  const primaryKind = keyZone?.kind ?? null;

  const deskStrip = executionSessionDeskStrip(locale);
  const liveIntel = useLiveExecutionIntelStore((s) => s.intel);
  const samples = useExecutionEvolutionStore((s) => s.samples);
  const evolutionTail = useMemo(() => samples.slice(-2), [samples]);

  const inner = (
    <div
      className={cn(
        "ms-premium-exec-surface relative overflow-hidden border border-ms-border/22 bg-ms-elevated/14",
        extended && "ms-premium-terminal--unlocked ms-premium-exec-surface--extended",
        !commandSurface && "ms-premium-exec-surface--dominant",
        "max-md:overflow-visible",
        "max-md:px-4 sm:max-md:px-6",
        commandSurface
          ? "rounded-none px-4 py-5 sm:px-5 sm:py-6 lg:rounded-ms-xl lg:border-x lg:px-10 lg:py-8 xl:px-12 xl:py-9 lg:ring-1 lg:ring-inset lg:ring-ms-cognition/12 lg:bg-ms-elevated/18"
          : "rounded-none px-4 py-5 sm:px-6 sm:py-6 lg:rounded-ms-xl lg:border-x lg:px-9 lg:py-8 xl:px-11 xl:py-10",
        att.executionDefensive ? "border-ms-warning/18 lg:border-ms-warning/20" : "",
        (att.anchor === "execution" || att.anchor === "invalidation") &&
          "ring-1 ring-inset ring-ms-border/16 transition-[box-shadow,border-color] duration-500 ease-out",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ms-cognition/[0.045] via-transparent to-transparent lg:h-36"
        aria-hidden
      />

      <div className={cn("relative mb-4 h-px w-full rounded-full opacity-90", utcSessionAmbientBarClass())} aria-hidden />

      <header className="relative border-b border-ms-border/18 pb-4 lg:pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="ms-data-label text-ms-faint">{t("execution.eyebrow")}</p>
            <h2 className="text-balance text-[clamp(1.08rem,2.6vw,1.55rem)] font-medium leading-snug tracking-tight text-ms-text">
              {surface.executionHeadline}
            </h2>
            {surface.structuralRationale[0] ? (
              <p className="border-l border-ms-border/25 pl-2.5 pt-1 text-[10px] leading-snug text-ms-faint/95">
                {surface.structuralRationale[0]}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 border-t border-ms-border/15 pt-3 sm:pt-3 lg:border-t-0 lg:pt-0">
            <p className="ms-exec-session-desk max-w-[14rem] text-end text-[10px] leading-snug text-ms-muted">
              {deskStrip}
            </p>
            <div className="text-end">
              <p className="ms-data-label text-ms-faint">{t("execution.anchorLabel")}</p>
              <p className="text-[13px] font-medium tabular-nums tracking-tight text-ms-text/90">{anchorDisplay}</p>
              <p className="mt-0.5 text-[10px] text-ms-faint/90">{surface.symbol}</p>
            </div>
          </div>
        </div>

        <ExecutionBiasStrip
          label={surface.executionBiasLabel}
          variant={surface.executionBiasVariant}
          className="relative mt-4"
        />
        <ExecutionCognitionStrips locale={locale} surface={surface} latent={latent} className="relative mt-3" />
        {liveIntel && !commandSurface ? (
          <LiveExecutionIntelStrip locale={locale} intel={liveIntel} className="relative mt-3" />
        ) : null}
        <ExecutionPrimaryCognitionStrip locale={locale} surface={surface} className="relative mt-4 lg:mt-5" />
      </header>

      {commandSurface ? (
        <div className="relative mt-6 space-y-4 lg:mt-8">
          <ExecutionZoneStack
            zones={surface.zones}
            surface={surface}
            primaryKind={primaryKind}
            locale={locale}
          />
          <p className="ms-data-label text-ms-faint">
            {pickLocale(locale, "Structural execution rail", "Структурный рейл исполнения")}
          </p>
          <ExecutionStructuralRail
            zones={surface.zones}
            anchorPrice={surface.anchorPrice}
            locale={locale}
            cadenceSeries={surface.cadenceSeries}
            microCognition={surface.microCognition}
            className="min-h-[min(42dvh,22rem)] lg:min-h-[min(54vh,30rem)]"
          />
        </div>
      ) : (
        <div className="relative mt-6 space-y-5 lg:mt-8 lg:grid lg:grid-cols-12 lg:gap-x-7 lg:gap-y-6 xl:gap-x-9">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-9">
          <ExecutionZoneStack
            zones={surface.zones}
            surface={surface}
            primaryKind={primaryKind}
            locale={locale}
          />

          {extended ? (
            <ExecutionInterpretationPanel locale={locale} bundle={interpretation} mode="full" className="mb-1" />
          ) : null}
          <ExecutionMapSurface locale={locale} surface={surface} derived={derived} latent={latent} />

          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="ms-data-label text-ms-faint">
                {pickLocale(locale, "Structural execution rail", "Структурный рейл исполнения")}
              </p>
            </div>
          </div>

          <ExecutionStructuralRail
            zones={surface.zones}
            anchorPrice={surface.anchorPrice}
            locale={locale}
            cadenceSeries={surface.cadenceSeries}
            microCognition={surface.microCognition}
            className="lg:min-h-[min(28vh,17rem)] xl:min-h-[280px]"
          />

          <p className="max-md:hidden text-[9px] leading-snug text-ms-dim/90">{surface.derivationNote}</p>
        </div>

        <aside
          className={cn(
            "flex min-w-0 flex-col gap-4 border-t border-ms-border/15 pt-5 lg:col-span-3 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0",
            "rounded-ms-md lg:bg-ms-surface/6 lg:px-3 lg:py-4",
            extended && "max-md:gap-5 max-md:pt-6",
          )}
        >
          <div className="space-y-3">
            <section className="space-y-1">
              <p className="ms-data-label text-ms-consensus/80">{t("execution.primaryPath")}</p>
              <p className="line-clamp-4 max-w-prose text-pretty text-[11px] leading-relaxed text-ms-text/95 sm:text-[12px]">
                {surface.primaryPath}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <MicroDeltaGlyph
                  trend={trendFromScalarDelta(surface.scenarioWeightDelta, 0.85)}
                  className="text-ms-consensus/50"
                  title={pickLocale(
                    locale,
                    "Lead structural path weight drift in recent window",
                    "Дрейф веса базового структурного пути в недавнем окне",
                  )}
                />
                <span className="text-[10px] font-medium text-ms-faint/90">
                  {pickLocale(locale, "Path weight Δ", "Δ веса пути")}
                </span>
              </div>
            </section>
            {surface.invalidationPressure.length > 0 ? (
              <section className="space-y-1 border-t border-ms-border/12 pt-3">
                <p className="ms-data-label text-ms-danger/72">{t("execution.invalidation")}</p>
                <ul className="space-y-1 border-l border-ms-danger/14 pl-2.5 pt-1">
                  {surface.invalidationPressure.slice(0, 3).map((line, i) => (
                    <li key={i} className={cn("text-[10px] leading-snug text-ms-faint", i > 0 && "max-md:hidden")}>
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <details className="group rounded-ms-md border border-ms-border/12 bg-ms-elevated/8 [&_summary::-webkit-details-marker]:hidden">
            <summary className="ms-focus-ring cursor-pointer list-none px-2.5 py-2 text-[10px] font-medium text-ms-muted transition-colors hover:bg-ms-surface/20 hover:text-ms-text">
              <span className="mr-1.5 inline-block text-ms-faint transition-transform group-open:rotate-90" aria-hidden>
                ›
              </span>
              {pickLocale(locale, "Extended structural context", "Расширенный структурный контекст")}
            </summary>
            <div className="space-y-3 border-t border-ms-border/10 px-2.5 pb-3 pt-2">
              <div>
                <p className="ms-data-label text-ms-faint">{surface.evolutionHeadline}</p>
                <ul className="mt-2 space-y-1.5">
                  {surface.evolutionLines.map((line, i) => (
                    <li key={i} className={cn("text-[10px] leading-snug text-ms-muted", i > 0 && "max-md:hidden")}>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              {extended && evolutionTail.length > 0 ? (
                <div className="border-t border-ms-border/12 pt-2">
                  <p className="ms-data-label text-ms-faint/90">
                    {pickLocale(locale, "Live evolution trace", "След живой эволюции")}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {evolutionTail.map((fr) => (
                      <li
                        key={`${fr.ts}-${fr.signature}`}
                        className="text-[9px] leading-snug text-ms-dim/90 max-md:line-clamp-2"
                      >
                        <span className="text-ms-faint">{new Date(fr.ts).toISOString().slice(11, 16)}Z</span>
                        <span className="text-ms-faint"> — </span>
                        {fr.emphasisLine}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {extended && surface.structuralMemoryLines.length > 0 ? (
                <div className="border-t border-ms-border/12 pt-2">
                  <p className="ms-data-label text-ms-cognition/75">
                    {pickLocale(locale, "Structural memory", "Структурная память")}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {surface.structuralMemoryLines.map((line, i) => (
                      <li
                        key={i}
                        className={cn(
                          "border-l border-ms-cognition/12 pl-2.5 text-[10px] leading-snug text-ms-muted/95",
                          i > 1 && "max-md:hidden",
                        )}
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {extended && surface.executionDepthLines.length > 0 ? (
                <div className="border-t border-ms-border/12 pt-2">
                  <p className="ms-data-label text-ms-faint/90">
                    {pickLocale(locale, "Execution depth", "Глубина исполнения")}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {surface.executionDepthLines.map((line, i) => (
                      <li
                        key={i}
                        className={cn("text-[10px] leading-snug text-ms-dim/95", i > 2 && "max-md:hidden")}
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </details>

          {surface.sessionLine ? (
            <p className="border-l border-ms-flow/16 pl-2.5 text-[10px] leading-snug text-ms-muted">{surface.sessionLine}</p>
          ) : null}

          <div
            className={cn(
              "flex flex-col gap-2.5 border-t border-ms-border/12 pt-3",
              surface.volTone === "expanding" &&
                (surface.dangerBand === "elevated" ||
                  surface.dangerBand === "dangerous" ||
                  surface.dangerBand === "critical") &&
                "ms-exec-micro-pulse",
            )}
          >
            <div className="flex flex-wrap items-end gap-x-3 gap-y-2 max-md:gap-x-2">
              <div>
                <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Stress", "Стресс")}</p>
                <SparklineDeltaPair
                  values={surface.stressSeries}
                  tone="danger"
                  width={60}
                  height={14}
                  restrained
                  ariaLabel={pickLocale(locale, "Stress evolution", "Динамика стресса")}
                />
              </div>
              <div>
                <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Liq", "Ликв")}</p>
                <SparklineDeltaPair
                  values={surface.liquiditySeries}
                  tone="warning"
                  width={60}
                  height={14}
                  restrained
                  ariaLabel={pickLocale(locale, "Liquidity strain", "Напряжение ликвидности")}
                />
              </div>
              <div>
                <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Vol", "Вол")}</p>
                <SparklineDeltaPair
                  values={surface.volSeries}
                  tone="flow"
                  width={60}
                  height={14}
                  restrained
                  ariaLabel={pickLocale(locale, "Volatility impulse", "Импульс волы")}
                />
              </div>
            </div>
            <div className="max-md:hidden flex flex-wrap items-end gap-x-3 gap-y-2 border-t border-ms-border/12 pt-2 max-md:gap-x-2">
              <div>
                <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Breadth", "Ширина")}</p>
                <SparklineDeltaPair
                  values={surface.participationSeries}
                  tone="flow"
                  width={60}
                  height={14}
                  restrained
                  ariaLabel={pickLocale(locale, "Participation pressure", "Давление участия")}
                />
              </div>
              <div>
                <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Scenario", "Сценарий")}</p>
                <SparklineDeltaPair
                  values={surface.scenarioSeries}
                  tone="consensus"
                  width={60}
                  height={14}
                  restrained
                  ariaLabel={pickLocale(locale, "Lead scenario weight", "Вес базового сценария")}
                />
              </div>
              <div>
                <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Coherence", "Связность")}</p>
                <SparklineDeltaPair
                  values={surface.stabilitySeries}
                  tone="muted"
                  width={60}
                  height={14}
                  restrained
                  ariaLabel={pickLocale(locale, "Structural coherence proxy", "Прокси связности структуры")}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
      )}
    </div>
  );

  return (
    <section
      id="execution-posture"
      data-ms-focus
      className={cn("relative scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)]")}
    >
      <div id="premium-layer" className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0" aria-hidden />
      <PremiumGate capability="executionMap" onUnlock={openUpgrade} className="w-full">
        {inner}
      </PremiumGate>
    </section>
  );
});

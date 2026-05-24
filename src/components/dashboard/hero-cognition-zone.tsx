"use client";

import Link from "next/link";
import { Target, Waves } from "lucide-react";
import { useMemo } from "react";

import { MicroSparkline } from "@/components/cognition/micro-sparkline";
import { StrategicPostureBlock } from "@/components/cognition/strategic-posture-block";
import { deriveStrategicPosture } from "@/lib/cognition/strategic-read";
import { deriveLiveTemporalSurface } from "@/lib/cognition/temporal-evolution";
import { cn } from "@/lib/utils";
import {
  dangerBandLabel,
  dominantHeadline,
  dominantSummaryLine,
  mainRiskDisplay,
  phaseLabel,
  pickLocale,
  scenarioTitle,
} from "@/lib/i18n/cognition-dict";
import { marketFeedStatusLabel } from "@/lib/i18n/trust-surface";
import { deriveOrchestratorBrief } from "@/lib/simulation/orchestrator-derive";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useMarketStore } from "@/store/market-store";
import { useMemoryStore } from "@/store/memory-store";
import { useShallow } from "zustand/react/shallow";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

function bandVol(v: number | null): "compressing" | "neutral" | "expanding" | null {
  if (v === null) return null;
  if (v <= 18) return "compressing";
  if (v >= 46) return "expanding";
  return "neutral";
}

function bandMomentum(v: number | null): "pos" | "neutral" | "neg" | null {
  if (typeof v !== "number") return null;
  if (v >= 35) return "pos";
  if (v <= -35) return "neg";
  return "neutral";
}

function useTwoHourDelta() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const snapshots = useMemoryStore((s) => s.snapshots);
  const cur = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
    })),
  );
  const market = useMarketStore(
    useShallow((s) => ({
      realizedVol: s.realizedVol,
      momentum: s.momentum,
      fundingRate: s.fundingRate,
      openInterest: s.openInterest,
      price: s.price,
    })),
  );

  const cutoff = Date.now() - 2 * 60 * 60_000;
  const baseline = (() => {
    const within = snapshots.filter((s) => s.ts >= cutoff);
    return within.length > 0 ? within.at(-1)! : snapshots.at(-1) ?? null;
  })();

  const bullets: string[] = [];
  const label = pickLocale(locale, "2h Δ", "2ч Δ");
  if (!baseline) return { label, bullets };

  if (baseline.consensus !== cur.derived.consensus) {
    bullets.push(pickLocale(locale, "Consensus shift", "Сборка сместилась"));
  }
  if (baseline.dangerBand !== cur.derived.dangerBand) {
    bullets.push(pickLocale(locale, "Stress band change", "Полоса стресса сменилась"));
  }
  if (cur.derived.dangerScore - baseline.dangerScore >= 7) {
    bullets.push(pickLocale(locale, "Stress +", "Стресс +"));
  }
  if (baseline.phase !== cur.derived.phase) {
    bullets.push(pickLocale(locale, "Regime phase shift", "Фаза режима сместилась"));
  }

  const vb0 = bandVol(baseline.realizedVol);
  const vb1 = bandVol(market.realizedVol);
  if (vb0 && vb1 && vb0 !== vb1) {
    bullets.push(
      vb1 === "compressing"
        ? pickLocale(locale, "Vol compressing", "Вол ↓")
        : pickLocale(locale, "Vol expanding", "Вол ↑"),
    );
  }

  const mb0 = bandMomentum(baseline.momentum);
  const mb1 = bandMomentum(market.momentum);
  if (mb0 && mb1 && mb0 !== mb1) {
    bullets.push(
      mb1 === "neg"
        ? pickLocale(locale, "Participation −", "Участие −")
        : mb1 === "pos"
          ? pickLocale(locale, "Participation +", "Участие +")
          : pickLocale(locale, "Momentum flat", "Импульс в нуле"),
    );
  }

  if (
    baseline.fundingRate !== null &&
    market.fundingRate !== null &&
    Math.abs(market.fundingRate - baseline.fundingRate) >= 0.00035
  ) {
    bullets.push(pickLocale(locale, "Funding step", "Фандинг шаг"));
  }

  if (baseline.openInterest !== null && market.openInterest !== null) {
    const d = (market.openInterest - baseline.openInterest) / Math.max(1, baseline.openInterest);
    if (Math.abs(d) >= 0.06) {
      bullets.push(
        d > 0
          ? pickLocale(locale, "OI +", "ОИ +")
          : pickLocale(locale, "OI −", "ОИ −"),
      );
    }
  }

  return { label, bullets: bullets.slice(0, 6) };
}

export function HeroCognitionZone({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const { derived, latent, dominant, history, mainRisk, topScenario, scenarioBook, agentLattice } = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      latent: s.latent,
      dominant: s.dominant,
      history: s.history,
      mainRisk: s.mainRisk,
      topScenario: s.topScenario,
      scenarioBook: s.scenarioBook,
      agentLattice: s.agentLattice,
    })),
  );
  const market = useMarketStore(
    useShallow((s) => ({
      price: s.price,
      connection: s.connection,
      fundingRate: s.fundingRate,
      realizedVol: s.realizedVol,
    })),
  );
  const change = useTwoHourDelta();

  const latticeBrief = useMemo(
    () => deriveOrchestratorBrief({ locale, latent, derived, agentRows: agentLattice }),
    [locale, latent, derived, agentLattice],
  );

  const regimeState = phaseLabel(locale, derived.phase);
  const mr = mainRiskDisplay(locale, mainRisk.riskKey, mainRisk.dangerScore);
  const dominantH = dominantHeadline(locale, dominant.headlineKey);
  const dominantS = dominantSummaryLine(locale, dominant.liquidity, dominant.leverage);
  const topTitle = scenarioTitle(locale, topScenario.scenarioId);

  const dangerAccent =
    derived.dangerBand === "critical" || derived.dangerBand === "dangerous"
      ? "danger"
      : derived.dangerBand === "elevated"
        ? "warning"
        : "neutral";

  const postureRead = useMemo(
    () =>
      deriveStrategicPosture({
        locale,
        dominantHeadline: dominantH,
        mainRisk,
        topScenario,
        scenarioCards: scenarioBook.cards,
        derived,
        latent,
        history,
      }),
    [locale, dominantH, mainRisk, topScenario, scenarioBook.cards, derived, latent, history],
  );

  const temporal = useMemo(() => deriveLiveTemporalSurface(locale, history), [locale, history]);
  const stressTone = derived.dangerScore >= 62 ? "danger" : derived.dangerScore >= 48 ? "warning" : "muted";

  const riskRibbon = `${pickLocale(locale, "Stress", "Стресс")} ${dangerBandLabel(locale, derived.dangerBand)}`;

  return (
    <section
      id="hero-cognition"
      data-ms-focus
      lang={locale === "ru" ? "ru" : "en"}
      className={cn("scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)]", className)}
      aria-label="Market read"
    >
      <div
        className={cn(
          "ms-surface-panel relative overflow-hidden rounded-ms-xl",
          "bg-ms-surface/35",
        )}
      >
        <div className="relative px-4 py-2.5 sm:px-5 sm:py-3">
          <div className="mb-3 flex flex-col gap-2 border-b border-ms-border/25 bg-ms-elevated/10 pb-3 sm:mb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-3.5">
            <div className="min-w-0 flex-1">
              <p className="ms-data-label text-ms-faint">
                {pickLocale(locale, "Live evolution", "Живая динамика")}{" "}
                <span className="font-mono text-ms-muted/90">· {temporal.windowLabel}</span>
              </p>
              {temporal.lines.length > 0 ? (
                <ul className="mt-1.5 space-y-0.5">
                  {temporal.lines.map((line) => (
                    <li key={line} className="border-l border-ms-flow/25 pl-2 text-[10px] leading-snug text-ms-muted sm:text-[11px]">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1.5 text-[10px] leading-snug text-ms-faint">
                  {pickLocale(locale, "Awaiting clearer deltas in window.", "Ждём выраженнее дельты в окне.")}
                </p>
              )}
              {temporal.sessionLine ? (
                <p className="mt-1.5 text-[9px] leading-snug text-ms-faint/90">{temporal.sessionLine}</p>
              ) : null}
              <Link
                href="/journal"
                className="ms-focus-ring mt-1.5 inline-block font-mono text-[9px] uppercase tracking-[0.12em] text-ms-faint underline-offset-2 hover:text-ms-muted hover:underline"
              >
                {pickLocale(locale, "Journal · transition capture", "Журнал · срез переходов")}
              </Link>
            </div>
            <div className="flex shrink-0 flex-wrap items-end gap-x-2 gap-y-1 opacity-[0.88] max-sm:opacity-[0.8]">
              <MicroSparkline
                values={[...temporal.stressSeries]}
                width={44}
                height={12}
                tone={stressTone}
                weight="hair"
                showEndpoint
                ariaLabel={pickLocale(locale, "Stress evolution", "Динамика стресса")}
              />
              <MicroSparkline
                values={[...temporal.participationSeries]}
                width={44}
                height={12}
                tone="flow"
                weight="hair"
                showEndpoint
                ariaLabel={pickLocale(locale, "Participation evolution", "Динамика участия")}
              />
              <MicroSparkline
                values={[...temporal.liquiditySeries]}
                width={44}
                height={12}
                tone="warning"
                weight="hair"
                showEndpoint
                ariaLabel={pickLocale(locale, "Liquidity strain evolution", "Динамика напряжения ликвидности")}
              />
              <MicroSparkline
                values={[...temporal.volSeries]}
                width={44}
                height={12}
                tone="muted"
                weight="hair"
                showEndpoint
                ariaLabel={pickLocale(locale, "Volatility impulse evolution", "Динамика импульса волы")}
              />
              <MicroSparkline
                values={[...temporal.scenarioSeries]}
                width={44}
                height={12}
                tone="consensus"
                weight="hair"
                showEndpoint
                className="max-sm:hidden"
                ariaLabel={pickLocale(locale, "Lead scenario weight evolution", "Динамика веса базы")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="min-w-0 lg:max-w-[min(100%,42rem)]">
              <p className="text-[10px] font-medium uppercase tracking-wide text-ms-faint">
                {pickLocale(locale, "State", "Срез")} ·{" "}
                <span className="normal-case text-ms-text">{regimeState}</span>
                <span className="text-ms-faint"> · </span>
                <span className={dangerAccent === "danger" ? "normal-case text-ms-danger" : "normal-case text-ms-text"}>
                  {riskRibbon}
                </span>
              </p>

              <div className="mt-2">
                <h1
                  key={dominant.headlineKey}
                  className="text-balance text-[15px] font-semibold leading-tight tracking-tight text-ms-text transition-opacity duration-200 motion-reduce:transition-none sm:text-[16px]"
                >
                  {dominantH}
                </h1>
              </div>
              <p className="mt-1 max-w-2xl font-mono text-[10px] tabular-nums leading-snug text-ms-faint">{dominantS}</p>

              <p className="mt-2.5 font-mono text-[10px] tabular-nums leading-snug text-ms-muted">
                <span className="text-ms-faint">{pickLocale(locale, "Risk ", "Риск ")}</span>
                <span className="text-ms-text/90">{mr.headline}</span>
                <span className="text-ms-faint"> · </span>
                <span className="text-ms-faint">{pickLocale(locale, "Lead ", "База ")}</span>
                <span className="text-ms-text/90">{topTitle}</span>
                <span className="text-ms-faint"> </span>
                <span className="text-ms-text">{pickLocale(locale, "Primary", "База")}</span>
              </p>

              <StrategicPostureBlock read={postureRead} className="mt-3 border-t border-ms-border/20 pt-3" />
            </div>

            <div className="shrink-0 lg:w-[min(100%,19rem)]">
              <Link
                href="/agents"
                className="ms-focus-ring block rounded-ms-xl border border-ms-border/50 bg-ms-elevated/10 px-3 py-3 transition-colors hover:border-ms-cognition/25 hover:bg-ms-surface/15 sm:px-3.5"
              >
                <p className="ms-data-label text-ms-faint/80">{pickLocale(locale, "Institutional reasoning", "Институциональное прочтение")}</p>
                <p className="mt-1.5 text-[10px] leading-snug text-ms-muted/90">{latticeBrief.line}</p>
                <p className="mt-2 text-[10px] font-medium text-ms-cognition/85">
                  {pickLocale(locale, "Open Agents workspace →", "Открыть среду Agents →")}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ms-border/15 pt-2 text-[10px] text-ms-faint/90">
                  <span className="inline-flex items-center gap-1">
                    <Waves className="size-3 text-ms-flow/70" strokeWidth={1.5} aria-hidden />
                    <span className="tabular-nums">{marketFeedStatusLabel(locale, market.connection)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Target className="size-3 text-ms-faint" strokeWidth={1.5} aria-hidden />
                    <span className="tabular-nums text-ms-muted">
                      {market.price ? `BTC ${market.price.toFixed(0)}` : "—"}
                    </span>
                  </span>
                </p>
              </Link>

              <div className="mt-2 rounded-ms-xl bg-ms-elevated/14 px-3 py-2.5">
                <p className="ms-data-label text-ms-faint">{change.label}</p>
                {change.bullets.length === 0 ? (
                  <p className="mt-1.5 text-[10px] leading-snug text-ms-faint">
                    {pickLocale(locale, "No baseline delta.", "Нет базы для дельты.")}
                  </p>
                ) : (
                  <ul className="mt-1.5 space-y-1 text-[10px] leading-snug text-ms-muted">
                    {change.bullets.map((b) => (
                      <li key={b} className="border-l border-ms-border/30 pl-2 text-ms-text/85">
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

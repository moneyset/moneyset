/**
 * Market Memory — institutional archive engine for persisted cognition snapshots
 * and structured journal intelligence.
 */

import {
  consensusLabel,
  dangerBandLabel,
  phaseLabel,
  pickLocale,
  scenarioTitle,
} from "@/lib/i18n/cognition-dict";
import type { MarketRegimeId } from "@/lib/intelligence/market-index-engine";
import type {
  JournalCognitiveLayers,
  JournalEntry,
  JournalIntelligenceRecord,
  MemoryPeriodId,
  MemorySnapshot,
  RegimeTransitionKind,
} from "@/types/memory";
import type { ScenarioId } from "@/lib/simulation/scenario-engine";
import type { UiLocale } from "@/store/ui-prefs-store";

export type RegimeTransitionEvent = Readonly<{
  id: string;
  ts: number;
  kind: RegimeTransitionKind;
  label: string;
  read: string;
  fromRegime?: string;
  toRegime?: string;
}>;

export type MemoryEvolutionLine = Readonly<{
  id: "consensus" | "scenario" | "risk";
  label: string;
  read: string;
}>;

export type MarketMemoryBundle = Readonly<{
  period: MemoryPeriodId;
  snapshots: readonly MemorySnapshot[];
  journal: readonly JournalEntry[];
  transitions: readonly RegimeTransitionEvent[];
  evolution: readonly MemoryEvolutionLine[];
  latestBullets: readonly string[];
}>;

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function periodRange(period: MemoryPeriodId, now = Date.now()): { from: number; to: number } {
  const todayStart = startOfDay(now);
  switch (period) {
    case "today":
      return { from: todayStart, to: now };
    case "yesterday": {
      const y = todayStart - 86_400_000;
      return { from: y, to: todayStart - 1 };
    }
    case "week":
      return { from: now - 7 * 86_400_000, to: now };
    case "month":
      return { from: now - 30 * 86_400_000, to: now };
    case "all":
    default:
      return { from: 0, to: now };
  }
}

export function filterSnapshotsByPeriod(
  snapshots: readonly MemorySnapshot[],
  period: MemoryPeriodId,
  now = Date.now(),
): MemorySnapshot[] {
  const { from, to } = periodRange(period, now);
  if (period === "all") return [...snapshots];
  return snapshots.filter((s) => s.ts >= from && s.ts <= to);
}

export function filterJournalByPeriod(
  journal: readonly JournalEntry[],
  period: MemoryPeriodId,
  now = Date.now(),
): JournalEntry[] {
  const { from, to } = periodRange(period, now);
  if (period === "all") return [...journal];
  return journal.filter((e) => e.ts >= from && e.ts <= to);
}

export function resolveRegimeFromSnapshot(
  locale: UiLocale,
  s: MemorySnapshot,
): { id: MarketRegimeId; label: string } {
  if (s.regimeId && s.regimeLabel) {
    return { id: s.regimeId, label: s.regimeLabel };
  }

  const phase = s.phase;
  if (phase === "panic_risk" || phase === "distribution_phase") {
    return {
      id: "structural_breakdown",
      label: pickLocale(locale, "Structural Breakdown", "Структурный срыв"),
    };
  }
  if (phase === "fragile_continuation") {
    return {
      id: "fragile_continuation",
      label: pickLocale(locale, "Fragile Continuation", "Хрупкое продолжение"),
    };
  }
  if (phase === "volatility_expansion" || s.dangerBand === "dangerous" || s.dangerBand === "critical") {
    return {
      id: "risk_expansion",
      label: pickLocale(locale, "Risk Expansion", "Расширение риска"),
    };
  }
  if (phase === "liquidity_compression") {
    return {
      id: "compression_state",
      label: pickLocale(locale, "Compression State", "Состояние сжатия"),
    };
  }
  if (phase === "regime_transition") {
    return {
      id: "regime_transition",
      label: pickLocale(locale, "Regime Transition", "Переход режима"),
    };
  }
  const liq = s.liquidityStress ?? estimateLiquidityStress(s);
  if (
    (phase === "stable_expansion" || phase === "controlled_trend") &&
    liq <= 48 &&
    s.dangerBand === "calm"
  ) {
    return {
      id: "responsive_reclaim",
      label: pickLocale(locale, "Responsive Reclaim", "Отзывчивый откуп"),
    };
  }
  return {
    id: "controlled_trend",
    label: pickLocale(locale, "Controlled Trend", "Контролируемый тренд"),
  };
}

function estimateLiquidityStress(s: MemorySnapshot): number {
  return clamp(s.dangerScore * 0.42 + s.divergenceIndex * 0.38 + (s.realizedVol ?? 28) * 0.2);
}

function estimateParticipation(s: MemorySnapshot): number {
  if (typeof s.participationPressure === "number") return s.participationPressure;
  return clamp(50 + (s.momentum ?? 0) * 0.35 + (s.openInterest ?? 0) * 0.000001);
}

function leadScenario(s: MemorySnapshot): { id: ScenarioId; p: number } | null {
  return s.scenarios[0] ?? null;
}

function transitionLabel(locale: UiLocale, kind: RegimeTransitionKind): string {
  const map: Record<RegimeTransitionKind, { en: string; ru: string }> = {
    risk_escalation: { en: "Risk escalation", ru: "Эскалация риска" },
    risk_easing: { en: "Risk easing", ru: "Снижение риска" },
    structural_break: { en: "Structural break", ru: "Структурный срыв" },
    recovery_attempt: { en: "Recovery attempt", ru: "Попытка восстановления" },
    failed_continuation: { en: "Failed continuation", ru: "Провал продолжения" },
    consensus_fracture: { en: "Consensus fracture", ru: "Разлом консенсуса" },
    scenario_rotation: { en: "Scenario rotation", ru: "Ротация сценария" },
    regime_shift: { en: "Regime shift", ru: "Смена режима" },
    stable_hold: { en: "Stable hold", ru: "Удержание режима" },
  };
  return pickLocale(locale, map[kind].en, map[kind].ru);
}

export function detectRegimeTransition(
  locale: UiLocale,
  prev: MemorySnapshot | null,
  cur: MemorySnapshot,
): RegimeTransitionKind {
  if (cur.transitionKind) return cur.transitionKind;
  if (!prev) return "stable_hold";

  const prevRegime = resolveRegimeFromSnapshot(locale, prev);
  const curRegime = resolveRegimeFromSnapshot(locale, cur);

  if (
    cur.phase === "fragile_continuation" &&
    (prev.phase === "stable_expansion" || prev.phase === "controlled_trend")
  ) {
    return "failed_continuation";
  }

  if (
    (cur.phase === "stable_expansion" || cur.phase === "controlled_trend") &&
    (prev.phase === "distribution_phase" || prev.phase === "panic_risk" || prev.dangerBand === "critical")
  ) {
    return "recovery_attempt";
  }

  if (cur.phase === "distribution_phase" || cur.phase === "panic_risk") {
    return "structural_break";
  }

  if (prevRegime.id !== curRegime.id) return "regime_shift";

  const prevLead = leadScenario(prev);
  const curLead = leadScenario(cur);
  if (prevLead && curLead && prevLead.id !== curLead.id) return "scenario_rotation";

  if (prev.consensus !== cur.consensus && cur.divergenceIndex >= prev.divergenceIndex + 4) {
    return "consensus_fracture";
  }

  const dangerRank = (b: MemorySnapshot["dangerBand"]) =>
    ({ calm: 0, moderate: 1, elevated: 2, dangerous: 3, critical: 4 })[b] ?? 0;
  if (dangerRank(cur.dangerBand) > dangerRank(prev.dangerBand) || cur.dangerScore >= prev.dangerScore + 8) {
    return "risk_escalation";
  }
  if (dangerRank(cur.dangerBand) < dangerRank(prev.dangerBand) || cur.dangerScore <= prev.dangerScore - 8) {
    return "risk_easing";
  }

  return "stable_hold";
}

export function deriveIntelligenceBullets(
  locale: UiLocale,
  cur: MemorySnapshot,
  prev: MemorySnapshot | null,
): string[] {
  if (cur.intelligenceBullets?.length) return [...cur.intelligenceBullets];

  const out: string[] = [];
  const participation = estimateParticipation(cur);
  const liq = cur.liquidityStress ?? estimateLiquidityStress(cur);
  const sponsorship = clamp(100 - liq * 0.85);

  if (prev) {
    const prevPart = estimateParticipation(prev);
    if (cur.divergenceIndex >= prev.divergenceIndex + 6) {
      out.push(
        pickLocale(locale, "Consensus weakening — lattice coherence thinning.", "Консенсус слабеет — связность решётки тоньше."),
      );
    }
    if (participation >= prevPart + 8) {
      out.push(pickLocale(locale, "Participation narrowing — crowding heat rising.", "Участие сужается — жар скопления растёт."));
    } else if (participation <= prevPart - 8) {
      out.push(pickLocale(locale, "Participation breadth thinning.", "Ширина участия истончается."));
    }
    if (liq >= (prev.liquidityStress ?? estimateLiquidityStress(prev)) + 6) {
      out.push(pickLocale(locale, "Liquidity stress building — sweep vulnerability up.", "Стресс ликвидности растёт — уязвимость к сносу выше."));
    }
    if (sponsorship <= 42 && sponsorship < 100 - (prev.liquidityStress ?? estimateLiquidityStress(prev)) * 0.85 - 4) {
      out.push(pickLocale(locale, "Sponsorship weakening at structural shelves.", "Спонсорство слабеет на структурных полках."));
    }
    if (cur.dangerScore >= prev.dangerScore + 8) {
      out.push(pickLocale(locale, "Fragility increasing — defense envelope widening.", "Хрупкость растёт — конверт защиты шире."));
    }
    if (
      cur.phase === "fragile_continuation" ||
      (prev.phase !== "fragile_continuation" && cur.dangerScore > prev.dangerScore + 5)
    ) {
      out.push(
        pickLocale(locale, "Continuation quality deteriorating.", "Качество продолжения ухудшается."),
      );
    }
    const prevLead = leadScenario(prev);
    const curLead = leadScenario(cur);
    if (prevLead && curLead && prevLead.id !== curLead.id) {
      out.push(
        pickLocale(
          locale,
          `Scenario leadership rotated — ${scenarioTitle(locale, prevLead.id)} → ${scenarioTitle(locale, curLead.id)}.`,
          `Лидерство сценария: ${scenarioTitle(locale, prevLead.id)} → ${scenarioTitle(locale, curLead.id)}.`,
        ),
      );
    }
  } else {
    out.push(
      pickLocale(
        locale,
        `${resolveRegimeFromSnapshot(locale, cur).label} · ${phaseLabel(locale, cur.phase)}.`,
        `${resolveRegimeFromSnapshot(locale, cur).label} · ${phaseLabel(locale, cur.phase)}.`,
      ),
    );
  }

  if (out.length === 0) {
    out.push(pickLocale(locale, "Structural envelope stable vs prior capture.", "Структурный конверт стабилен к прошлому снимку."));
  }
  return out.slice(0, 5);
}

export function deriveRegimeTransitions(
  locale: UiLocale,
  snapshots: readonly MemorySnapshot[],
): RegimeTransitionEvent[] {
  const out: RegimeTransitionEvent[] = [];
  for (let i = 0; i < snapshots.length - 1; i++) {
    const cur = snapshots[i]!;
    const prev = snapshots[i + 1]!;
    const kind = detectRegimeTransition(locale, prev, cur);
    if (kind === "stable_hold") continue;

    const fromRegime = resolveRegimeFromSnapshot(locale, prev).label;
    const toRegime = resolveRegimeFromSnapshot(locale, cur).label;
    out.push({
      id: `tr-${cur.id}`,
      ts: cur.ts,
      kind,
      label: transitionLabel(locale, kind),
      read: pickLocale(
        locale,
        `${fromRegime} → ${toRegime} · ${consensusLabel(locale, cur.consensus)} · ${dangerBandLabel(locale, cur.dangerBand)}`,
        `${fromRegime} → ${toRegime} · ${consensusLabel(locale, cur.consensus)} · ${dangerBandLabel(locale, cur.dangerBand)}`,
      ),
      fromRegime,
      toRegime,
    });
  }
  return out.slice(0, 24);
}

export function deriveMemoryEvolution(
  locale: UiLocale,
  snapshots: readonly MemorySnapshot[],
): MemoryEvolutionLine[] {
  if (snapshots.length < 2) return [];
  const oldest = snapshots[snapshots.length - 1]!;
  const newest = snapshots[0]!;

  const lines: MemoryEvolutionLine[] = [
    {
      id: "consensus",
      label: pickLocale(locale, "Consensus evolution", "Эволюция консенсуса"),
      read:
        oldest.consensus !== newest.consensus
          ? pickLocale(
              locale,
              `${consensusLabel(locale, oldest.consensus)} → ${consensusLabel(locale, newest.consensus)} · divergence ${oldest.divergenceIndex}→${newest.divergenceIndex}`,
              `${consensusLabel(locale, oldest.consensus)} → ${consensusLabel(locale, newest.consensus)} · дивергенция ${oldest.divergenceIndex}→${newest.divergenceIndex}`,
            )
          : pickLocale(
              locale,
              `${consensusLabel(locale, newest.consensus)} held · divergence ${newest.divergenceIndex}`,
              `${consensusLabel(locale, newest.consensus)} удержан · дивергенция ${newest.divergenceIndex}`,
            ),
    },
    {
      id: "scenario",
      label: pickLocale(locale, "Scenario evolution", "Эволюция сценария"),
      read: (() => {
        const o = leadScenario(oldest);
        const n = leadScenario(newest);
        if (o && n && o.id !== n.id) {
          return pickLocale(
            locale,
            `${scenarioTitle(locale, o.id)} → ${scenarioTitle(locale, n.id)}`,
            `${scenarioTitle(locale, o.id)} → ${scenarioTitle(locale, n.id)}`,
          );
        }
        return pickLocale(locale, "Lead path stable in window.", "База стабильна в окне.");
      })(),
    },
    {
      id: "risk",
      label: pickLocale(locale, "Risk development", "Развитие риска"),
      read: pickLocale(
        locale,
        `${dangerBandLabel(locale, oldest.dangerBand)} → ${dangerBandLabel(locale, newest.dangerBand)} · score ${oldest.dangerScore}→${newest.dangerScore}`,
        `${dangerBandLabel(locale, oldest.dangerBand)} → ${dangerBandLabel(locale, newest.dangerBand)} · индекс ${oldest.dangerScore}→${newest.dangerScore}`,
      ),
    },
  ];
  return lines;
}

function executionImplicationFromPosture(locale: UiLocale, posture: string | undefined): string {
  if (!posture) {
    return pickLocale(locale, "Honor invalidation before scaling size.", "Сначала инвалидация — потом масштаб.");
  }
  return posture;
}

export function deriveJournalIntelligenceRecord(args: {
  locale: UiLocale;
  snapshot: MemorySnapshot | null;
  prevSnapshot: MemorySnapshot | null;
  layers: JournalCognitiveLayers;
  orchestratorLine?: string | null;
  executionPosture?: string | null;
}): JournalIntelligenceRecord {
  const { locale, snapshot, prevSnapshot, layers, orchestratorLine, executionPosture } = args;

  if (!snapshot) {
    return {
      regimeState: pickLocale(locale, "Unanchored — no memory capture.", "Без привязки — нет снимка памяти."),
      scenarioState: layers.scenarioEvolution,
      primaryRisks: pickLocale(locale, "Risk unmapped without capture.", "Риск не сопоставлен без снимка."),
      structuralInterpretation: layers.structuralChange,
      executionImplication: executionImplicationFromPosture(locale, executionPosture ?? undefined),
      intelligenceSummary: [layers.stateShift],
    };
  }

  const regime = resolveRegimeFromSnapshot(locale, snapshot);
  const lead = leadScenario(snapshot);
  const bullets = deriveIntelligenceBullets(locale, snapshot, prevSnapshot);

  return {
    regimeState: `${regime.label} · ${phaseLabel(locale, snapshot.phase)} · ${dangerBandLabel(locale, snapshot.dangerBand)}`,
    scenarioState: lead
      ? `${scenarioTitle(locale, lead.id)} · ${layers.scenarioEvolution}`
      : layers.scenarioEvolution,
    primaryRisks:
      snapshot.primaryRiskLine ??
      pickLocale(
        locale,
        `${dangerBandLabel(locale, snapshot.dangerBand)} band · score ${snapshot.dangerScore}/100`,
        `Полоса ${dangerBandLabel(locale, snapshot.dangerBand)} · индекс ${snapshot.dangerScore}/100`,
      ),
    structuralInterpretation: layers.structuralChange,
    executionImplication:
      orchestratorLine ??
      executionImplicationFromPosture(locale, executionPosture ?? snapshot.executionPosture ?? undefined),
    intelligenceSummary: bullets,
  };
}

export function deriveMarketMemoryBundle(args: {
  locale: UiLocale;
  period: MemoryPeriodId;
  snapshots: readonly MemorySnapshot[];
  journal: readonly JournalEntry[];
}): MarketMemoryBundle {
  const { locale, period, snapshots, journal } = args;
  const filteredSnaps = filterSnapshotsByPeriod(snapshots, period);
  const filteredJournal = filterJournalByPeriod(journal, period);
  const transitions = deriveRegimeTransitions(locale, filteredSnaps);
  const evolution = deriveMemoryEvolution(locale, filteredSnaps);
  const latest = filteredSnaps[0];
  const prev = filteredSnaps[1] ?? null;
  const latestBullets = latest ? deriveIntelligenceBullets(locale, latest, prev) : [];

  return {
    period,
    snapshots: filteredSnaps,
    journal: filteredJournal,
    transitions,
    evolution,
    latestBullets,
  };
}

export function enrichSnapshotCapture(args: {
  locale: UiLocale;
  base: MemorySnapshot;
  prev: MemorySnapshot | null;
  executionPosture?: string | null;
  primaryRiskLine?: string | null;
  liquidityStress?: number;
  participationPressure?: number;
}): MemorySnapshot {
  const { locale, base, prev, executionPosture, primaryRiskLine, liquidityStress, participationPressure } = args;
  const regime = resolveRegimeFromSnapshot(locale, base);
  const transitionKind = detectRegimeTransition(locale, prev, base);
  const bullets = deriveIntelligenceBullets(locale, base, prev);

  return {
    ...base,
    regimeId: regime.id,
    regimeLabel: regime.label,
    intelligenceBullets: bullets,
    transitionKind,
    executionPosture: executionPosture ?? undefined,
    primaryRiskLine: primaryRiskLine ?? undefined,
    leadScenarioId: base.scenarios[0]?.id,
    liquidityStress,
    participationPressure,
  };
}

export function periodLabel(locale: UiLocale, period: MemoryPeriodId): string {
  const map: Record<MemoryPeriodId, { en: string; ru: string }> = {
    today: { en: "Today", ru: "Сегодня" },
    yesterday: { en: "Yesterday", ru: "Вчера" },
    week: { en: "Last week", ru: "Неделя" },
    month: { en: "Last month", ru: "Месяц" },
    all: { en: "All", ru: "Всё" },
  };
  return pickLocale(locale, map[period].en, map[period].ru);
}

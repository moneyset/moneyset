import type { AgentArchetypeId, AgentAccent } from "@/lib/agents/agent-archetypes";
import { archetypeMeta } from "@/lib/agents/agent-archetypes";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import { isLateContinuationRegime } from "@/lib/simulation/engine-evolve";
import type {
  AgentHistoryPoint,
  AgentLatticeRow,
  CognitiveSnapshot,
  LatentDrivers,
} from "@/lib/simulation/cognition-types";
import { deriveOrchestratorBrief } from "@/lib/simulation/orchestrator-derive";
import type { ScenarioEngineCard } from "@/lib/simulation/scenario-engine";
import { consensusLabel, pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

export type AgentEscalation = "calm" | "elevated" | "critical";

export type AgentPersona = Readonly<{
  id: AgentArchetypeId;
  conviction: number;
  influence: number;
  inertia: number;
  stress: number;
  escalation: AgentEscalation;
  posture: string;
  read: string;
  alignment: string;
  accent: AgentAccent;
  drift: "rising" | "falling" | "stable";
}>;

export type DebateConflict = Readonly<{
  id: string;
  severity: "fracture" | "tension" | "override";
  line: string;
  agents: readonly [AgentArchetypeId, AgentArchetypeId];
}>;

export type WowEventKind = "collapse" | "override" | "cascade" | "compression" | "fork";

export type WowEvent = Readonly<{
  kind: WowEventKind;
  active: boolean;
  headline: string;
  detail: string;
}>;

export type LeadershipSnapshot = Readonly<{
  leaderId: AgentArchetypeId;
  previousLeaderId: AgentArchetypeId | null;
  rotated: boolean;
  leaderRead: string;
}>;

export type TimelineEpoch = Readonly<{
  tick: number;
  leaderId: AgentArchetypeId;
  divergence: number;
  note: string;
}>;

export type ConvictionPhysics = Readonly<{
  stressAccumulation: number;
  consensusInertia: number;
  escalationPressure: number;
  confidenceDecay: number;
  reinforcement: number;
}>;

export type TensionSummary = Readonly<{
  headline: string;
  instability: AgentEscalation;
  pressure: string;
  divergence: string;
  continuation: string;
  structural: string;
}>;

export type AgentCognitionBundle = Readonly<{
  personas: readonly AgentPersona[];
  leadership: LeadershipSnapshot;
  conflicts: readonly DebateConflict[];
  wowEvents: readonly WowEvent[];
  timeline: readonly TimelineEpoch[];
  physics: ConvictionPhysics;
  tension: TensionSummary;
  consensusLabel: string;
  networkStress: number;
  simTick: number;
}>;

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

function rowMap(rows: readonly AgentLatticeRow[]): Map<AgentLatticeRow["role"], AgentLatticeRow> {
  return new Map(rows.map((r) => [r.role, r] as const));
}

function structureConviction(latent: LatentDrivers, derived: DerivedCognitionSnapshot): number {
  const phasePenalty =
    derived.phase === "fragile_continuation" ||
    derived.phase === "distribution_phase" ||
    derived.phase === "liquidity_compression" ||
    derived.phase === "panic_risk"
      ? 18
      : derived.phase === "overheated_momentum"
        ? 8
        : 0;
  const base =
    (100 - derived.divergenceIndex) * 0.42 +
    latent.macroLiquidityBackdrop * 0.18 +
    (100 - latent.liquidityStructuralStress) * 0.22 +
    latent.positioningPressure * 0.12;
  return clamp(base - phasePenalty, 28, 94);
}

function tacticalPosture(
  locale: UiLocale,
  id: AgentArchetypeId,
  latent: LatentDrivers,
  _derived: DerivedCognitionSnapshot,
): string | null {
  if (!isLateContinuationRegime(latent)) return null;
  switch (id) {
    case "structure":
      return pickLocale(locale, "Cautious continuation bias", "Осторожный уклон к продолжению");
    case "liquidity":
      return pickLocale(locale, "Liquidity sweep bias", "Уклон к сносу ликвидности");
    case "macro":
      return pickLocale(locale, "Macro fragility bias", "Уклон к макро-хрупкости");
    case "flow":
      return pickLocale(locale, "Momentum persistence bias", "Уклон к удержанию импульса");
    case "risk":
      return pickLocale(locale, "Invalidation-first bias", "Сначала инвалидация");
    case "sentiment":
      return pickLocale(locale, "Reactive crowd bias", "Уклон к реактивной толпе");
    default:
      return null;
  }
}

function structureRead(locale: UiLocale, latent: LatentDrivers, derived: DerivedCognitionSnapshot): string {
  if (derived.phase === "panic_risk") {
    return pickLocale(locale, "Continuation geometry invalidated — liquidation regime.", "Геометрия продолжения инвалидирована — режим ликвидаций.");
  }
  if (isLateContinuationRegime(latent) || derived.phase === "fragile_continuation") {
    return pickLocale(
      locale,
      "Late continuation geometry holds — fragility concentrates below reclaim, not at highs.",
      "Геометрия позднего продолжения держится — хрупкость ниже откупа, не на максимумах.",
    );
  }
  if (derived.phase === "liquidity_compression") {
    return pickLocale(locale, "Range compression — reclaim shelves dominate interpretation.", "Сжатие диапазона — полки откупа доминируют в прочтении.");
  }
  if (derived.divergenceIndex >= 54) {
    return pickLocale(locale, "Structural path fractured vs participation — geometry contested.", "Структурный путь расходится с участием — геометрия оспаривается.");
  }
  return pickLocale(locale, "Trend geometry intact — acceptance bands hold sponsorship.", "Геометрия тренда держится — полосы принятия удерживают спонсорство.");
}

type AgentHistConvictionKey = keyof Omit<AgentHistoryPoint, "simTick" | "divergenceIndex">;

function historyConviction(hist: readonly AgentHistoryPoint[], key: AgentHistConvictionKey): number | null {
  const last = hist.at(-1);
  if (!last) return null;
  return last[key];
}

function historyDrift(hist: readonly AgentHistoryPoint[], key: AgentHistConvictionKey): "rising" | "falling" | "stable" {
  if (hist.length < 2) return "stable";
  const first = hist[0]!;
  const last = hist.at(-1)!;
  const d = last[key] - first[key];
  if (d >= 5) return "rising";
  if (d <= -5) return "falling";
  return "stable";
}

function structureDrift(hist: readonly AgentHistoryPoint[]): "rising" | "falling" | "stable" {
  if (hist.length < 2) return "stable";
  const first = (hist[0]!.macro + hist[0]!.flow) / 2;
  const last = (hist.at(-1)!.macro + hist.at(-1)!.flow) / 2;
  const d = last - first;
  if (d >= 5) return "rising";
  if (d <= -5) return "falling";
  return "stable";
}

function personaFromRow(
  id: AgentArchetypeId,
  row: AgentLatticeRow | undefined,
  hist: readonly AgentHistoryPoint[],
  histKey: AgentHistConvictionKey,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  locale: UiLocale,
): AgentPersona {
  const meta = archetypeMeta(id);
  const conviction =
    id === "structure"
      ? structureConviction(latent, derived)
      : row?.confidencePct ?? 50;
  const drift = id === "structure" ? structureDrift(hist) : historyDrift(hist, histKey);
  const prev = historyConviction(hist, histKey);
  const inertia = prev === null ? 72 : clamp(100 - Math.abs(conviction - prev) * 1.4, 22, 96);

  let stress = 18;
  if (id === "risk") stress = clamp(derived.dangerScore * 0.85 + derived.divergenceIndex * 0.2);
  else if (id === "liquidity") stress = clamp(latent.liquidityStructuralStress * 0.9);
  else if (id === "sentiment") stress = clamp(latent.sentimentThermal * 0.75 + latent.positioningPressure * 0.15);
  else if (id === "macro") stress = clamp((100 - latent.macroLiquidityBackdrop) * 0.5 + derived.divergenceIndex * 0.35);
  else if (id === "flow") stress = clamp(latent.positioningPressure * 0.55 + latent.volatilityImpulse * 0.25);
  else stress = clamp(derived.divergenceIndex * 0.65 + latent.liquidityStructuralStress * 0.2);

  const escalation: AgentEscalation =
    stress >= 78 || (id === "risk" && (derived.dangerBand === "critical" || derived.dangerBand === "dangerous"))
      ? "critical"
      : stress >= 55 || derived.dangerBand === "elevated"
        ? "elevated"
        : "calm";

  return {
    id,
    conviction,
    influence: 0,
    inertia,
    stress,
    escalation,
    posture:
      tacticalPosture(locale, id, latent, derived) ??
      row?.stateLabel ??
      pickLocale(locale, "Contested", "Оспаривается"),
    read: id === "structure" ? structureRead(locale, latent, derived) : (row?.analyticLine ?? "—"),
    alignment: row?.alignmentLabel ?? pickLocale(locale, "Unmapped", "Не сопоставлено"),
    accent: id === "structure" ? "cognition" : (row?.accent ?? meta.accent),
    drift,
  };
}

function assignInfluence(personas: AgentPersona[]): AgentPersona[] {
  const raw = personas.map((p) => {
    const escMul = p.escalation === "critical" ? 1.22 : p.escalation === "elevated" ? 1.08 : 1;
    const driftMul = p.drift === "rising" ? 1.06 : p.drift === "falling" ? 0.92 : 1;
    return p.conviction * escMul * driftMul * (1 + (100 - p.inertia) * 0.002);
  });
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  return personas.map((p, i) => ({ ...p, influence: clamp((raw[i]! / sum) * 100, 8, 48) }));
}

function pickLeader(personas: readonly AgentPersona[], hist: readonly AgentHistoryPoint[]): LeadershipSnapshot {
  const sorted = [...personas].sort((a, b) => b.influence - a.influence);
  const leaderId = sorted[0]!.id;
  let previousLeaderId: AgentArchetypeId | null = null;
  if (hist.length >= 2) {
    const prevScores: { id: AgentArchetypeId; v: number }[] = [
      { id: "macro", v: hist.at(-2)!.macro },
      { id: "flow", v: hist.at(-2)!.flow },
      { id: "liquidity", v: hist.at(-2)!.liquidity },
      { id: "risk", v: hist.at(-2)!.risk },
      { id: "sentiment", v: hist.at(-2)!.sentiment },
      { id: "structure", v: (hist.at(-2)!.macro + hist.at(-2)!.flow) / 2 },
    ];
    previousLeaderId = prevScores.sort((a, b) => b.v - a.v)[0]!.id;
  }
  const rotated = previousLeaderId !== null && previousLeaderId !== leaderId;
  const leader = personas.find((p) => p.id === leaderId)!;
  return {
    leaderId,
    previousLeaderId,
    rotated,
    leaderRead: leader.read,
  };
}

function buildConflicts(
  locale: UiLocale,
  personas: readonly AgentPersona[],
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  rows: readonly AgentLatticeRow[],
): DebateConflict[] {
  const byId = new Map(personas.map((p) => [p.id, p] as const));
  const out: DebateConflict[] = [];
  const push = (
    id: string,
    severity: DebateConflict["severity"],
    en: string,
    ru: string,
    agents: [AgentArchetypeId, AgentArchetypeId],
  ) => out.push({ id, severity, line: pickLocale(locale, en, ru), agents });

  const structure = byId.get("structure")!;
  const liquidity = byId.get("liquidity")!;
  const macro = byId.get("macro")!;
  const risk = byId.get("risk")!;
  const flow = byId.get("flow")!;
  const sentiment = byId.get("sentiment")!;

  if (Math.abs(structure.conviction - liquidity.conviction) >= 22 && latent.liquidityStructuralStress >= 62) {
    push(
      "liq-structure",
      "fracture",
      "Liquidity agent diverging from structure consensus.",
      "Агент ликвидности расходится со структурным консенсусом.",
      ["liquidity", "structure"],
    );
  }
  if (macro.escalation !== "calm" && derived.divergenceIndex >= 48) {
    push(
      "macro-escalation",
      "tension",
      "Macro agent escalating instability probability.",
      "Макро-агент эскалирует вероятность нестабильности.",
      ["macro", "flow"],
    );
  }
  if (risk.conviction >= macro.conviction + 14 && risk.escalation !== "calm") {
    push(
      "risk-override",
      "override",
      "Risk agent overriding continuation confidence.",
      "Агент риска перекрывает уверенность в продолжении.",
      ["risk", "structure"],
    );
  }
  if (derived.divergenceIndex >= 56) {
    push(
      "consensus-frag",
      "fracture",
      "Consensus fragmentation detected across the lattice.",
      "Зафиксирована фрагментация консенсуса в решётке.",
      ["macro", "sentiment"],
    );
  }
  if (sentiment.stress >= 68 && flow.stress >= 62 && Math.abs(sentiment.conviction - flow.conviction) >= 18) {
    push(
      "narrative-flow",
      "tension",
      "Sentiment–flow fracture: narrative heat vs absorption quality.",
      "Разрыв настроений и потока: жар нарратива против качества поглощения.",
      ["sentiment", "flow"],
    );
  }

  const brief = deriveOrchestratorBrief({ locale, latent, derived, agentRows: [...rows] });
  for (const c of brief.contradictions) {
    if (out.length >= 6) break;
    if (out.some((x) => x.line === c)) continue;
    push(`brief-${out.length}`, "tension", c, c, ["risk", "flow"]);
  }

  return out.slice(0, 6);
}

function buildWowEvents(
  locale: UiLocale,
  personas: readonly AgentPersona[],
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  leadership: LeadershipSnapshot,
  cards: readonly ScenarioEngineCard[],
): WowEvent[] {
  const div = derived.divergenceIndex;
  const sorted = [...personas].sort((a, b) => b.influence - a.influence);
  const top = sorted[0]!;
  const rest = sorted.slice(1).reduce((s, p) => s + p.influence, 0) || 1;
  const overrideActive = top.influence >= 38 && top.influence > rest * 0.72;

  const events: WowEvent[] = [
    {
      kind: "collapse",
      active: div >= 58 && (derived.dangerBand === "elevated" || derived.dangerBand === "dangerous" || derived.dangerBand === "critical"),
      headline: pickLocale(locale, "Consensus collapse", "Коллапс консенсуса"),
      detail: pickLocale(
        locale,
        "Agent network destabilized — leadership contested, fractures widening.",
        "Сеть агентов дестабилизирована — лидерство оспаривается, трещины расширяются.",
      ),
    },
    {
      kind: "override",
      active: overrideActive,
      headline: pickLocale(locale, "Agent override", "Перехват агента"),
      detail: pickLocale(
        locale,
        `${archetypeMeta(top.id).tagEn} agent temporarily dominates system weighting.`,
        `Агент «${archetypeMeta(top.id).tagRu}» временно доминирует в весах системы.`,
      ),
    },
    {
      kind: "cascade",
      active:
        latent.liquidityStructuralStress >= 68 &&
        derived.dangerScore >= 62 &&
        personas.find((p) => p.id === "risk")!.escalation !== "calm",
      headline: pickLocale(locale, "Fragility cascade", "Каскад хрупкости"),
      detail: pickLocale(
        locale,
        "Risk signals propagating through liquidity and structure nodes.",
        "Сигналы риска распространяются через узлы ликвидности и структуры.",
      ),
    },
    {
      kind: "compression",
      active: div <= 30 && personas.every((p) => Math.abs(p.conviction - personas[0]!.conviction) <= 14),
      headline: pickLocale(locale, "Alignment compression", "Сжатие согласования"),
      detail: pickLocale(
        locale,
        "All agents converging tightly — low fracture, high inertia.",
        "Все агенты сходятся плотно — низкий разлом, высокая инерция.",
      ),
    },
    {
      kind: "fork",
      active: cards.length >= 2 && cards[0] && cards[1] && cards[0].confidence !== cards[1].confidence,
      headline: pickLocale(locale, "Scenario fork", "Развилка сценариев"),
      detail: pickLocale(
        locale,
        "Agent groups splitting across opposing scenario futures.",
        "Группы агентов расходятся по противоположным сценарным будущим.",
      ),
    },
  ];

  return events.map((e) =>
    e.kind === "override" && leadership.rotated ? { ...e, active: true } : e,
  );
}

function buildTimeline(
  locale: UiLocale,
  hist: readonly AgentHistoryPoint[],
  history: readonly CognitiveSnapshot[],
): TimelineEpoch[] {
  if (hist.length === 0) return [];
  const epochs: TimelineEpoch[] = [];
  const step = Math.max(1, Math.floor(hist.length / 8));

  for (let i = 0; i < hist.length; i += step) {
    const pt = hist[i]!;
    const scores: { id: AgentArchetypeId; v: number }[] = [
      { id: "macro", v: pt.macro },
      { id: "flow", v: pt.flow },
      { id: "liquidity", v: pt.liquidity },
      { id: "risk", v: pt.risk },
      { id: "sentiment", v: pt.sentiment },
      { id: "structure", v: (pt.macro + pt.flow) / 2 },
    ];
    const leaderId = scores.sort((a, b) => b.v - a.v)[0]!.id;
    const snap = history.find((h) => h.simTick === pt.simTick);
    let note = pickLocale(locale, "Lattice capture", "Захват решётки");
    if (snap && i > 0) {
      const prev = history.find((h) => h.simTick === hist[Math.max(0, i - step)]!.simTick);
      if (prev && prev.consensus !== snap.consensus) {
        note = pickLocale(locale, "Consensus migration", "Миграция консенсуса");
      } else if (prev && prev.dangerBand !== snap.dangerBand) {
        note = pickLocale(locale, "Stress band shift", "Сдвиг полосы стресса");
      } else if (pt.divergenceIndex >= 52) {
        note = pickLocale(locale, "Divergence widening", "Расширение расхождения");
      }
    }
    epochs.push({ tick: pt.simTick, leaderId, divergence: pt.divergenceIndex, note });
  }
  return epochs.slice(-8);
}

function buildPhysics(
  hist: readonly AgentHistoryPoint[],
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
): ConvictionPhysics {
  const divDelta = hist.length >= 2 ? hist.at(-1)!.divergenceIndex - hist[0]!.divergenceIndex : 0;
  return {
    stressAccumulation: clamp(
      derived.dangerScore * 0.5 + latent.liquidityStructuralStress * 0.25 + latent.volatilityImpulse * 0.2,
    ),
    consensusInertia: clamp(100 - Math.abs(divDelta) * 2.2 - derived.divergenceIndex * 0.15, 18, 94),
    escalationPressure: clamp(derived.divergenceIndex * 0.55 + latent.positioningPressure * 0.2, 12, 96),
    confidenceDecay: clamp(
      hist.length >= 2
        ? Math.max(
            0,
            hist[0]!.orchestrator -
              hist.at(-1)!.orchestrator +
              hist[0]!.macro -
              hist.at(-1)!.macro,
          ) * 0.35
        : 8,
      8,
      88,
    ),
    reinforcement: clamp((100 - derived.divergenceIndex) * 0.4 + latent.macroLiquidityBackdrop * 0.2, 10, 90),
  };
}

function buildTension(
  locale: UiLocale,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  personas: readonly AgentPersona[],
  leadership: LeadershipSnapshot,
): TensionSummary {
  const instability: AgentEscalation =
    derived.dangerBand === "critical" || derived.dangerBand === "dangerous"
      ? "critical"
      : derived.dangerBand === "elevated" || derived.divergenceIndex >= 54
        ? "elevated"
        : "calm";

  const leader = personas.find((p) => p.id === leadership.leaderId)!;
  const headline =
    instability === "critical"
      ? pickLocale(locale, "Cognition under institutional stress", "Прочтение под институциональным стрессом")
      : leadership.rotated
        ? pickLocale(locale, "Leadership rotation in progress", "Идёт ротация лидерства")
        : derived.divergenceIndex >= 52
          ? pickLocale(locale, "Interpretation warfare active", "Активна война интерпретаций")
          : pickLocale(locale, "Lattice coordinated — fractures contained", "Решётка согласована — разломы сдержаны");

  return {
    headline,
    instability,
    pressure:
      latent.liquidityStructuralStress >= 66
        ? pickLocale(locale, "Depth thinning · migration risk", "Истончение глубины · риск миграции")
        : pickLocale(locale, "Pressure within band", "Давление в пределах полосы"),
    divergence:
      derived.divergenceIndex >= 54
        ? pickLocale(locale, "Cross-agent fracture elevated", "Межагентный разлом повышен")
        : pickLocale(locale, "Divergence contained", "Расхождение сдержано"),
    continuation:
      leader.id === "risk" || (leader.id === "structure" && leader.conviction < 50)
        ? pickLocale(locale, "Continuation quality deteriorating", "Качество продолжения ухудшается")
        : pickLocale(locale, "Base path sponsorship intact", "Спонсорство базового пути держится"),
    structural: leader.read,
  };
}

export function deriveAgentCognitionBundle(args: {
  locale: UiLocale;
  latent: LatentDrivers;
  derived: DerivedCognitionSnapshot;
  agentLattice: readonly AgentLatticeRow[];
  agentHistory: readonly AgentHistoryPoint[];
  history: readonly CognitiveSnapshot[];
  scenarioCards: readonly ScenarioEngineCard[];
  simTick: number;
}): AgentCognitionBundle {
  const { locale, latent, derived, agentLattice, agentHistory, history, scenarioCards, simTick } = args;
  const rows = rowMap(agentLattice);

  const personas = assignInfluence([
    personaFromRow("structure", undefined, agentHistory, "macro", latent, derived, locale),
    personaFromRow("liquidity", rows.get("Liquidity"), agentHistory, "liquidity", latent, derived, locale),
    personaFromRow("macro", rows.get("Macro"), agentHistory, "macro", latent, derived, locale),
    personaFromRow("sentiment", rows.get("Sentiment"), agentHistory, "sentiment", latent, derived, locale),
    personaFromRow("risk", rows.get("Risk"), agentHistory, "risk", latent, derived, locale),
    personaFromRow("flow", rows.get("Flow"), agentHistory, "flow", latent, derived, locale),
  ]);

  const leadership = pickLeader(personas, agentHistory);
  const conflicts = buildConflicts(locale, personas, latent, derived, agentLattice);
  const wowEvents = buildWowEvents(locale, personas, latent, derived, leadership, scenarioCards);
  const timeline = buildTimeline(locale, agentHistory, history);
  const physics = buildPhysics(agentHistory, derived, latent);
  const tension = buildTension(locale, derived, latent, personas, leadership);

  const networkStress = clamp(
    personas.reduce((s, p) => s + p.stress, 0) / personas.length + derived.divergenceIndex * 0.25,
  );

  return {
    personas,
    leadership,
    conflicts,
    wowEvents,
    timeline,
    physics,
    tension,
    consensusLabel: consensusLabel(locale, derived.consensus),
    networkStress,
    simTick,
  };
}

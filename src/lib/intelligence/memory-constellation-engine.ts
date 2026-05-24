import { deriveAgentCognitionBundle } from "@/lib/agents/agent-cognition-engine";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type {
  AgentHistoryPoint,
  AgentLatticeRow,
  CognitiveSnapshot,
  LatentDrivers,
} from "@/lib/simulation/cognition-types";
import type { ScenarioEngineCard } from "@/lib/simulation/scenario-engine";
import {
  deriveStrategyMemoryBundle,
  type StrategyArchetype,
  type StrategyMemoryBundle,
} from "@/lib/intelligence/strategy-memory-view";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

export type ConstellationNodeKind =
  | "archetype"
  | "analog"
  | "cluster"
  | "lineage"
  | "fragility"
  | "sponsorship"
  | "volatility"
  | "execution";

export type ConstellationNode = Readonly<{
  id: string;
  kind: ConstellationNodeKind;
  label: string;
  read: string;
  x: number;
  y: number;
  emphasis: number;
  tone: "neutral" | "stress" | "support";
  resonating: boolean;
}>;

export type ConstellationEdge = Readonly<{
  id: string;
  fromId: string;
  toId: string;
  label: string;
  strength: number;
}>;

export type PatternEcho = Readonly<{
  id: string;
  line: string;
  severity: "neutral" | "elevated" | "critical";
  analogTick: number | null;
}>;

export type EnvironmentAnalog = Readonly<{
  id: string;
  label: string;
  similarity: number;
  read: string;
}>;

export type SurvivalIntel = Readonly<{
  id: string;
  outcome: "survived" | "failed" | "conditional";
  title: string;
  read: string;
  resonance: number;
}>;

export type MemoryEvolutionFrame = Readonly<{
  tick: number;
  headline: string;
  note: string;
  phase: "stable" | "fragility" | "collapse" | "recovery";
}>;

export type AgentMemoryNote = Readonly<{
  id: string;
  agentLabel: string;
  line: string;
  accountability: "strong" | "weak" | "fractured";
}>;

export type MemoryConstellationBundle = Readonly<{
  headline: string;
  subline: string;
  tension: "calm" | "elevated" | "critical";
  nodes: readonly ConstellationNode[];
  edges: readonly ConstellationEdge[];
  echoes: readonly PatternEcho[];
  environmentAnalogs: readonly EnvironmentAnalog[];
  survivalIntel: readonly SurvivalIntel[];
  evolution: readonly MemoryEvolutionFrame[];
  agentMemory: readonly AgentMemoryNote[];
  crossLinks: readonly string[];
  breathPhase: number;
  echoPulse: number;
  historicalDrift: number;
  simTick: number;
  analogClock: string | null;
  base: StrategyMemoryBundle;
}>;

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

function vecFromSnapshot(h: CognitiveSnapshot): readonly number[] {
  return [
    h.positioningPressure,
    h.liquidityStructuralStress,
    h.volatilityImpulse,
    h.divergenceIndex,
    h.dangerScore,
  ];
}

function vecCurrent(latent: LatentDrivers, derived: DerivedCognitionSnapshot): number[] {
  return [
    latent.positioningPressure,
    latent.liquidityStructuralStress,
    latent.volatilityImpulse,
    derived.divergenceIndex,
    derived.dangerScore,
  ];
}

function dist(a: readonly number[], b: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i]! - b[i]!) ** 2;
  return Math.sqrt(s);
}

function findNearestAnalog(
  history: readonly CognitiveSnapshot[],
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
): { snap: CognitiveSnapshot | null; distance: number } {
  const cur = vecCurrent(latent, derived);
  let best: CognitiveSnapshot | null = null;
  let bestD = Infinity;
  const lastTick = history[history.length - 1]?.simTick;
  for (const h of history) {
    if (h.simTick === lastTick) continue;
    const d = dist(vecFromSnapshot(h), cur);
    if (d < bestD) {
      bestD = d;
      best = h;
    }
  }
  return { snap: best, distance: bestD };
}

function buildEchoes(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  base: StrategyMemoryBundle,
  analog: CognitiveSnapshot | null,
): PatternEcho[] {
  const out: PatternEcho[] = [];
  const push = (id: string, en: string, ru: string, severity: PatternEcho["severity"], tick: number | null) =>
    out.push({ id, line: pickLocale(locale, en, ru), severity, analogTick: tick });

  const top = base.archetypes[0];
  if (top && top.resonance >= 62) {
    push(
      "top-archetype",
      `Current structure resonates with «${top.title}» — behavioral echo active.`,
      `Текущая структура резонирует с «${top.title}» — активен поведенческий отклик.`,
      "elevated",
      analog?.simTick ?? null,
    );
  }
  if (latent.liquidityStructuralStress >= 62 && derived.volTone === "expanding") {
    push(
      "thin-expansion",
      "Current continuation resembles prior thin-liquidity expansion.",
      "Текущее продолжение напоминает прошлое расширение на тонкой ликвидности.",
      "elevated",
      analog?.simTick ?? null,
    );
  }
  if (latent.macroLiquidityBackdrop >= 58 && derived.volTone === "compressing") {
    push(
      "macro-cpi",
      "Macro-sensitive instability mirrors previous CPI compression analog.",
      "Макро-чувствительная нестабильность отражает прошлый аналог сжатия CPI.",
      "elevated",
      analog?.simTick ?? null,
    );
  }
  if (derived.divergenceIndex >= 50 && latent.positioningPressure >= 62) {
    push(
      "part-decay",
      "Participation decay similar to prior failed breakout structure.",
      "Распад участия похож на прошлую структуру ложного пробоя.",
      "critical",
      analog?.simTick ?? null,
    );
  }
  if (base.analogClock) {
    push(
      "clock-echo",
      `Historical signature echo at ${base.analogClock} — geometry not identical.`,
      `Отклик исторического отпечатка на ${base.analogClock} — геометрия не идентична.`,
      "neutral",
      analog?.simTick ?? null,
    );
  }
  return out.slice(0, 6);
}

function buildEnvironmentAnalogs(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  distance: number,
): EnvironmentAnalog[] {
  const sim = clamp(100 - distance * 0.35);
  const push = (id: string, en: string, ru: string, enR: string, ruR: string, bonus: number): EnvironmentAnalog => ({
    id,
    label: pickLocale(locale, en, ru),
    similarity: clamp(sim + bonus),
    read: pickLocale(locale, enR, ruR),
  });

  const out: EnvironmentAnalog[] = [];
  if (derived.volTone === "compressing") {
    out.push(
      push(
        "vol-compress",
        "Volatility compression analog",
        "Аналог сжатия волатильности",
        "Stored energy — expansion handoff historically fragile without sponsorship.",
        "Накопленная энергия — передача в расширение исторически хрупка без спонсорства.",
        8,
      ),
    );
  }
  if (latent.liquidityStructuralStress >= 58) {
    out.push(
      push(
        "sponsor-decay",
        "Sponsorship deterioration analog",
        "Аналог ухудшения спонсорства",
        "Breadth decay preceded continuation failure in prior captures.",
        "Распад ширины предшествовал провалу продолжения в прошлых захватах.",
        6,
      ),
    );
  }
  if (latent.positioningPressure >= 66) {
    out.push(
      push(
        "leverage-frag",
        "Leverage fragility analog",
        "Аналог хрупкости плеча",
        "Crowding risk elevated — liquidation geometry sensitive.",
        "Риск скопления выше — чувствительная геометрия ликвидаций.",
        10,
      ),
    );
  }
  if (latent.macroLiquidityBackdrop >= 60 && derived.divergenceIndex >= 45) {
    out.push(
      push(
        "macro-instab",
        "Macro instability analog",
        "Аналог макро-нестабильности",
        "Macro backdrop dominated micro flow in nearest signature.",
        "Макро-фон доминировал микропоток в ближайшем отпечатке.",
        7,
      ),
    );
  }
  if (latent.sentimentThermal >= 68) {
    out.push(
      push(
        "crowding",
        "Crowding risk analog",
        "Аналог риска скопления",
        "One-sided narrative preceded instability in prior window.",
        "Односторонний нарратив предшествовал нестабильности в прошлом окне.",
        5,
      ),
    );
  }
  return out.slice(0, 5);
}

function buildSurvivalIntel(
  locale: UiLocale,
  archetypes: readonly StrategyArchetype[],
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
): SurvivalIntel[] {
  const hot =
    derived.dangerBand === "elevated" || derived.dangerBand === "dangerous" || derived.dangerBand === "critical";

  const items: SurvivalIntel[] = [
    {
      id: "reclaim-survived",
      outcome: latent.liquidityStructuralStress < 55 ? "survived" : "conditional",
      title: pickLocale(locale, "Successful reclaim continuation", "Успешное продолжение от откупа"),
      read: pickLocale(
        locale,
        "Structures that held shelf with reactive sponsorship historically survived next probe.",
        "Структуры, удержавшие полку со спонсорством реактивного потока, исторически переживали следующий зонд.",
      ),
      resonance: clamp(100 - latent.liquidityStructuralStress * 0.5),
    },
    {
      id: "expansion-failed",
      outcome: derived.divergenceIndex >= 52 && latent.liquidityStructuralStress >= 58 ? "failed" : "conditional",
      title: pickLocale(locale, "Failed expansion under weak participation", "Провал расширения при слабом участии"),
      read: pickLocale(
        locale,
        "Expansion legs without breadth migration historically collapsed at first counter-flow.",
        "Расширения без миграции ширины исторически схлопывались на первом встречном потоке.",
      ),
      resonance: clamp(derived.divergenceIndex * 0.55 + latent.liquidityStructuralStress * 0.3),
    },
    {
      id: "macro-collapse",
      outcome: hot && latent.macroLiquidityBackdrop >= 58 ? "failed" : "conditional",
      title: pickLocale(locale, "Macro-sensitive continuation collapse", "Схлопывание продолжения при макро-чувствительности"),
      read: pickLocale(
        locale,
        "Catalyst windows broke continuation when macro dominated and sponsorship thinned.",
        "Окна катализаторов ломали продолжение, когда макро доминировало, а спонсорство истончалось.",
      ),
      resonance: clamp(latent.macroLiquidityBackdrop * 0.4 + (hot ? 25 : 0)),
    },
    {
      id: "instab-break",
      outcome: derived.dangerBand === "dangerous" || derived.dangerBand === "critical" ? "failed" : "conditional",
      title: pickLocale(locale, "Instability-driven breakdown", "Разлом на фоне нестабильности"),
      read: pickLocale(
        locale,
        "Invalidation sensitivity spiked — structures without reclaim proof failed fastest.",
        "Чувствительность к инвалидации взлетела — структуры без доказательства откупа падали быстрее.",
      ),
      resonance: clamp(derived.dangerScore),
    },
  ];

  return items.sort((a, b) => b.resonance - a.resonance).slice(0, 4);
}

function nodeFromArchetype(a: StrategyArchetype, x: number, y: number, resonating: boolean): ConstellationNode {
  return {
    id: `arch-${a.id}`,
    kind: "archetype",
    label: a.title,
    read: a.body,
    x,
    y,
    emphasis: a.resonance,
    tone: a.resonance >= 65 ? "support" : a.resonance >= 50 ? "neutral" : "stress",
    resonating,
  };
}

function buildConstellation(
  locale: UiLocale,
  archetypes: readonly StrategyArchetype[],
  analog: CognitiveSnapshot | null,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
): { nodes: ConstellationNode[]; edges: ConstellationEdge[] } {
  const nodes: ConstellationNode[] = [];
  const edges: ConstellationEdge[] = [];

  const positions = [
    { x: 50, y: 18 },
    { x: 78, y: 32 },
    { x: 82, y: 58 },
    { x: 58, y: 78 },
    { x: 28, y: 72 },
    { x: 18, y: 48 },
  ];

  archetypes.slice(0, 6).forEach((a, i) => {
    const pos = positions[i] ?? { x: 40 + i * 8, y: 40 };
    nodes.push(nodeFromArchetype(a, pos.x, pos.y, i === 0));
  });

  if (analog) {
    nodes.push({
      id: "analog-sig",
      kind: "analog",
      label: pickLocale(locale, "Historical signature", "Исторический отпечаток"),
      read: pickLocale(locale, `Capture at ${analog.simulatedClockLabel}`, `Захват на ${analog.simulatedClockLabel}`),
      x: 50,
      y: 48,
      emphasis: 72,
      tone: "neutral",
      resonating: true,
    });
    edges.push({
      id: "e-analog-top",
      fromId: "analog-sig",
      toId: nodes[0]?.id ?? "arch-failed-breakout",
      label: pickLocale(locale, "Resonance link", "Связь резонанса"),
      strength: 68,
    });
  }

  nodes.push({
    id: "cluster-frag",
    kind: "fragility",
    label: pickLocale(locale, "Fragility cluster", "Кластер хрупкости"),
    read: pickLocale(locale, "Signatures where sponsorship decay preceded failure.", "Отпечатки, где распад спонсорства предшествовал провалу."),
    x: 34,
    y: 38,
    emphasis: clamp(derived.dangerScore + latent.liquidityStructuralStress * 0.2),
    tone: derived.dangerBand !== "calm" ? "stress" : "neutral",
    resonating: derived.dangerBand !== "calm",
  });

  nodes.push({
    id: "cluster-sponsor",
    kind: "sponsorship",
    label: pickLocale(locale, "Sponsorship lineage", "Линия спонсорства"),
    read: pickLocale(locale, "Execution genealogy through reactive proof chains.", "Генеалогия исполнения через цепочки реактивных доказательств."),
    x: 66,
    y: 42,
    emphasis: clamp(100 - latent.liquidityStructuralStress),
    tone: latent.liquidityStructuralStress < 55 ? "support" : "stress",
    resonating: latent.liquidityStructuralStress >= 58,
  });

  nodes.push({
    id: "cluster-vol",
    kind: "volatility",
    label: pickLocale(locale, "Vol behavior cluster", "Кластер поведения волы"),
    read: pickLocale(
      locale,
      derived.volTone === "expanding" ? "Expansion topology — historical handoff stress." : "Compression stored energy — release patterns archived.",
      derived.volTone === "expanding" ? "Топология расширения — стресс исторической передачи." : "Сжатие накопило энергию — паттерны выхода в архиве.",
    ),
    x: 42,
    y: 62,
    emphasis: clamp(latent.volatilityImpulse),
    tone: derived.volTone === "expanding" ? "stress" : "neutral",
    resonating: derived.volTone !== "neutral",
  });

  nodes.push({
    id: "cluster-exec",
    kind: "execution",
    label: pickLocale(locale, "Execution lineage", "Линия исполнения"),
    read: pickLocale(locale, "How structures were traded when analogs matched.", "Как торговали структуры при совпадении аналогов."),
    x: 62,
    y: 64,
    emphasis: clamp(55 + derived.divergenceIndex * 0.25),
    tone: "neutral",
    resonating: false,
  });

  for (let i = 0; i < Math.min(4, nodes.length - 1); i++) {
    const a = nodes[i]!;
    const b = nodes[i + 1]!;
    if (a.kind === "archetype" && b.kind === "archetype") {
      edges.push({
        id: `e-${a.id}-${b.id}`,
        fromId: a.id,
        toId: b.id,
        label: pickLocale(locale, "Pattern genealogy", "Генеалогия паттерна"),
        strength: clamp((a.emphasis + b.emphasis) / 2),
      });
    }
  }

  edges.push({
    id: "e-frag-sponsor",
    fromId: "cluster-frag",
    toId: "cluster-sponsor",
    label: pickLocale(locale, "Structural lineage", "Структурная линия"),
    strength: clamp(50 + latent.liquidityStructuralStress * 0.3),
  });

  return { nodes, edges };
}

function buildEvolution(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
): MemoryEvolutionFrame[] {
  if (history.length < 3) {
    return [
      {
        tick: 0,
        headline: pickLocale(locale, "Archive warming", "Архив прогревается"),
        note: pickLocale(locale, "Insufficient history for temporal lineage.", "Недостаточно истории для временной линии."),
        phase: "stable",
      },
    ];
  }
  const step = Math.max(1, Math.floor(history.length / 8));
  const frames: MemoryEvolutionFrame[] = [];
  for (let i = 0; i < history.length; i += step) {
    const snap = history[i]!;
    const next = history[Math.min(history.length - 1, i + step)];
    let phase: MemoryEvolutionFrame["phase"] = "stable";
    let note = pickLocale(locale, "Structure stable in archive window.", "Структура стабильна в окне архива.");
    if (next && next.dangerBand !== snap.dangerBand && (next.dangerBand === "dangerous" || next.dangerBand === "critical")) {
      phase = "collapse";
      note = pickLocale(locale, "Conviction collapsed — instability accelerated.", "Убеждённость схлопнулась — нестабильность ускорилась.");
    } else if (next && next.liquidityStructuralStress > snap.liquidityStructuralStress + 6) {
      phase = "fragility";
      note = pickLocale(locale, "Sponsorship disappeared — fragility emerged beneath surface.", "Спонсорство исчезло — хрупкость проявилась под поверхностью.");
    } else if (next && next.divergenceIndex > snap.divergenceIndex + 6) {
      phase = "fragility";
      note = pickLocale(locale, "Continuation degraded — participation fracture widening.", "Продолжение ослабло — расширяется разлом участия.");
    } else if (next && next.dangerBand === "calm" && snap.dangerBand !== "calm") {
      phase = "recovery";
      note = pickLocale(locale, "Structural recovery — danger band normalized.", "Структурное восстановление — нормализация полосы опасности.");
    }
    frames.push({
      tick: snap.simTick,
      headline: pickLocale(locale, `Lineage T${snap.simTick}`, `Линия T${snap.simTick}`),
      note,
      phase,
    });
  }
  return frames.slice(-8);
}

function buildAgentMemory(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  agentLattice: readonly AgentLatticeRow[],
  agentHistory: readonly AgentHistoryPoint[],
  history: readonly CognitiveSnapshot[],
  scenarioCards: readonly ScenarioEngineCard[],
  simTick: number,
): AgentMemoryNote[] {
  const agents = deriveAgentCognitionBundle({
    locale,
    latent,
    derived,
    agentLattice,
    agentHistory,
    history,
    scenarioCards,
    simTick,
  });

  const notes: AgentMemoryNote[] = [];
  const leader = agents.personas.reduce((a, b) => (b.conviction > a.conviction ? b : a), agents.personas[0]!);
  if (leader) {
    const leaderName = leader.posture || leader.id;
    notes.push({
      id: `lead-${leader.id}`,
      agentLabel: leaderName,
      line: pickLocale(
        locale,
        `${leaderName} historically led when conviction peaked — current stress ${leader.stress}.`,
        `${leaderName} исторически вёл при пике убеждённости — текущий стресс ${leader.stress}.`,
      ),
      accountability: leader.stress < 50 ? "strong" : leader.stress < 70 ? "weak" : "fractured",
    });
  }
  if (agents.conflicts.length > 0) {
    notes.push({
      id: "consensus-fail",
      agentLabel: pickLocale(locale, "War room", "Зал агентов"),
      line: pickLocale(
        locale,
        "Consensus failed in prior fractures — risk escalation was often ignored until danger band shifted.",
        "Консенсус ломался в прошлых разломах — эскалацию риска часто игнорировали до смены полосы опасности.",
      ),
      accountability: "fractured",
    });
  }
  const riskAgent = agents.personas.find((p) => p.id === "risk");
  if (riskAgent && derived.dangerBand !== "calm" && riskAgent.conviction < 45) {
    notes.push({
      id: "risk-ignored",
      agentLabel: riskAgent.posture || riskAgent.id,
      line: pickLocale(
        locale,
        "Risk agent conviction low while danger elevated — historical accountability gap.",
        "Низкая убеждённость агента риска при повышенной опасности — исторический разрыв ответственности.",
      ),
      accountability: "weak",
    });
  }
  return notes.slice(0, 4);
}

export function deriveMemoryConstellationBundle(args: {
  locale: UiLocale;
  latent: LatentDrivers;
  derived: DerivedCognitionSnapshot;
  history: readonly CognitiveSnapshot[];
  agentLattice: readonly AgentLatticeRow[];
  agentHistory: readonly AgentHistoryPoint[];
  scenarioCards: readonly ScenarioEngineCard[];
  simTick: number;
}): MemoryConstellationBundle {
  const { locale, latent, derived, history, agentLattice, agentHistory, scenarioCards, simTick } = args;

  const base = deriveStrategyMemoryBundle(locale, latent, derived, history);
  const { snap: analog, distance } = findNearestAnalog(history, latent, derived);

  const top = base.archetypes[0];
  const tension: MemoryConstellationBundle["tension"] =
    (top?.resonance ?? 0) >= 78 || derived.dangerBand === "critical"
      ? "critical"
      : (top?.resonance ?? 0) >= 58 || derived.dangerBand === "elevated"
        ? "elevated"
        : "calm";

  const { nodes, edges } = buildConstellation(locale, base.archetypes, analog, latent, derived);
  const echoes = buildEchoes(locale, latent, derived, base, analog);
  const environmentAnalogs = buildEnvironmentAnalogs(locale, latent, derived, distance);
  const survivalIntel = buildSurvivalIntel(locale, base.archetypes, latent, derived);
  const evolution = buildEvolution(locale, history);
  const agentMemory = buildAgentMemory(
    locale,
    latent,
    derived,
    agentLattice,
    agentHistory,
    history,
    scenarioCards,
    simTick,
  );

  const headline = pickLocale(locale, "Market memory constellation", "Созвездие рыночной памяти");
  const subline =
    top && top.resonance >= 55
      ? pickLocale(
          locale,
          `Dominant echo: ${top.title} — institutional pattern archive active.`,
          `Доминирующий отклик: ${top.title} — активен институциональный архив паттернов.`,
        )
      : base.intelligenceBody;

  const crossLinks = [
    pickLocale(locale, "Replay Studio: analog replay for full temporal capture.", "Replay Studio: аналоговый реплей для полного временного захвата."),
    pickLocale(locale, "Execution: apply survival intel to tactical zones.", "Исполнение: применить intel выживания к тактическим зонам."),
    pickLocale(locale, "Agents: accountability layer in war room history.", "Агенты: слой ответственности в истории зала."),
  ];

  const historicalDrift = history.length >= 2
    ? clamp(
        Math.abs(
          (history[history.length - 1]?.divergenceIndex ?? 0) - (history[0]?.divergenceIndex ?? 0),
        ),
      )
    : 20;

  return {
    headline,
    subline,
    tension,
    nodes,
    edges,
    echoes,
    environmentAnalogs,
    survivalIntel,
    evolution,
    agentMemory,
    crossLinks,
    breathPhase: (simTick % 36) / 36,
    echoPulse: clamp((top?.resonance ?? 40) * 0.8),
    historicalDrift,
    simTick,
    analogClock: base.analogClock,
    base,
  };
}

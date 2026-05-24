import type { CognitionWorldId } from "@/lib/cognition/cognition-worlds";
import { resolveMobileWorldFromPath } from "@/lib/cognition/mobile-cognition-routes";
import type { CognitionDramaBundle } from "@/lib/cognition/cognition-drama-engine";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";

export type DesktopPanelId =
  | "agents"
  | "liquidity"
  | "execution"
  | "macro"
  | "replay"
  | "risk"
  | "sentiment"
  | "cross";

export type DesktopPanelPriority = "primary" | "elevated" | "ambient";

export type DesktopPanelState = Readonly<{
  id: DesktopPanelId;
  world: CognitionWorldId;
  href: string;
  weight: number;
  priority: DesktopPanelPriority;
  expanded: boolean;
  syncEffect: string | null;
}>;

export type DesktopCommandOrchestration = Readonly<{
  panels: Record<DesktopPanelId, DesktopPanelState>;
  focusPanel: DesktopPanelId | null;
  routeWorld: CognitionWorldId | null;
  deckPhase: "calm" | "strained" | "critical" | "synchronized";
  crossSync: readonly string[];
  cssVars: Readonly<Record<string, string>>;
}>;

const PANEL_META: Record<
  DesktopPanelId,
  { world: CognitionWorldId; href: string; rail: "left" | "right" }
> = {
  macro: { world: "macro", href: "/macro", rail: "left" },
  agents: { world: "agents", href: "/agents", rail: "left" },
  risk: { world: "risk", href: "/risk-radar", rail: "left" },
  liquidity: { world: "liquidity", href: "/labs/liquidity", rail: "right" },
  execution: { world: "execution", href: "/execution", rail: "right" },
  sentiment: { world: "sentiment", href: "/sentiment", rail: "right" },
  cross: { world: "transmission", href: "/cross-asset", rail: "right" },
  replay: { world: "replay", href: "/replay", rail: "right" },
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function priorityFromWeight(w: number): DesktopPanelPriority {
  if (w >= 0.82) return "primary";
  if (w >= 0.58) return "elevated";
  return "ambient";
}

function baseWeights(
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
): Record<DesktopPanelId, number> {
  const lt = latent.liquidityStructuralStress / 100;
  const vi = latent.volatilityImpulse / 100;
  const pp = latent.positioningPressure / 100;
  const st = latent.sentimentThermal / 100;
  const mb = latent.macroLiquidityBackdrop / 100;
  const div = derived.divergenceIndex / 100;
  const danger = derived.dangerScore / 100;

  return {
    macro: 0.42 + mb * 0.45 + (mb >= 0.62 ? 0.1 : 0),
    agents: 0.38 + div * 0.5 + (derived.consensus === "divergence_increasing" ? 0.22 : 0),
    risk: 0.4 + danger * 0.42 + lt * 0.28,
    liquidity: 0.44 + lt * 0.48,
    execution: 0.46 + vi * 0.4 + (derived.volTone === "expanding" ? 0.18 : 0),
    sentiment: 0.4 + st * 0.38,
    cross: 0.38 + lt * 0.22 + div * 0.2,
    replay: 0.32 + vi * 0.18 + div * 0.12,
  };
}

function dramaBoost(
  drama: CognitionDramaBundle | null,
  weights: Record<DesktopPanelId, number>,
): Record<DesktopPanelId, number> {
  if (!drama?.activeMoment) return weights;
  const w = { ...weights };
  const moment = drama.activeMoment;
  const map: Partial<Record<CognitionWorldId | "global", DesktopPanelId>> = {
    agents: "agents",
    liquidity: "liquidity",
    execution: "execution",
    macro: "macro",
    replay: "replay",
    risk: "risk",
    sentiment: "sentiment",
    transmission: "cross",
    memory: "replay",
  };
  const panel = moment.world === "global" ? null : map[moment.world];
  if (panel) w[panel] = Math.min(1, w[panel] + moment.intensity * 0.35);
  if (moment.id === "consensus_fracture") w.agents = Math.min(1, w.agents + 0.25);
  if (moment.id === "liquidity_cascade") w.liquidity = Math.min(1, w.liquidity + 0.3);
  if (moment.id === "macro_instability_wave") w.macro = Math.min(1, w.macro + 0.28);
  if (moment.id === "structural_collapse" || moment.id === "fragility_escalation") {
    w.risk = Math.min(1, w.risk + 0.3);
    w.cross = Math.min(1, w.cross + 0.15);
  }
  return w;
}

function routeBoost(
  routeWorld: CognitionWorldId | null,
  weights: Record<DesktopPanelId, number>,
): Record<DesktopPanelId, number> {
  if (!routeWorld) return weights;
  const w = { ...weights };
  for (const id of Object.keys(PANEL_META) as DesktopPanelId[]) {
    if (PANEL_META[id].world === routeWorld) w[id] = Math.min(1, w[id] + 0.2);
  }
  return w;
}

function crossSyncEffects(
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  weights: Record<DesktopPanelId, number>,
): string[] {
  const fx: string[] = [];
  if (derived.dangerScore >= 62) fx.push("risk-to-execution");
  if (latent.macroLiquidityBackdrop >= 68) fx.push("macro-to-liquidity");
  if (derived.divergenceIndex >= 52) fx.push("agents-to-execution");
  if (latent.sentimentThermal >= 65 && derived.volTone === "expanding") fx.push("sentiment-to-vol");
  if (weights.liquidity >= 0.78) fx.push("liquidity-topology-stress");
  return fx;
}

export function deriveDesktopCommandOrchestration(input: {
  pathname: string;
  latent: LatentDrivers;
  derived: DerivedCognitionSnapshot;
  drama: CognitionDramaBundle | null;
}): DesktopCommandOrchestration {
  const routeWorld = resolveMobileWorldFromPath(input.pathname);
  let weights = baseWeights(input.latent, input.derived);
  weights = dramaBoost(input.drama, weights);
  weights = routeBoost(routeWorld, weights);

  const maxW = Math.max(...Object.values(weights));
  const focusEntry = (Object.entries(weights) as [DesktopPanelId, number][]).find(([, w]) => w === maxW);
  const focusPanel = focusEntry?.[0] ?? null;

  const crossSync = crossSyncEffects(input.latent, input.derived, weights);

  const panels = {} as Record<DesktopPanelId, DesktopPanelState>;
  for (const id of Object.keys(PANEL_META) as DesktopPanelId[]) {
    const meta = PANEL_META[id];
    const weight = clamp01(weights[id]);
    const priority = priorityFromWeight(weight / Math.max(maxW, 0.01));
    let syncEffect: string | null = null;
    if (crossSync.includes("risk-to-execution") && (id === "risk" || id === "execution")) syncEffect = "ms-desk-sync--risk-exec";
    if (crossSync.includes("macro-to-liquidity") && (id === "macro" || id === "liquidity")) syncEffect = "ms-desk-sync--macro-liq";
    if (crossSync.includes("agents-to-execution") && (id === "agents" || id === "execution")) syncEffect = "ms-desk-sync--agents-exec";
    if (crossSync.includes("sentiment-to-vol") && (id === "sentiment" || id === "execution")) syncEffect = "ms-desk-sync--sentiment-vol";

    panels[id] = {
      id,
      world: meta.world,
      href: meta.href,
      weight,
      priority,
      expanded: priority !== "ambient" || id === focusPanel,
      syncEffect,
    };
  }

  const deckPhase: DesktopCommandOrchestration["deckPhase"] =
    input.derived.dangerScore >= 72
      ? "critical"
      : input.derived.dangerScore >= 52 || input.drama?.dramaPhase === "peak"
        ? "strained"
        : input.drama?.dramaPhase === "rising"
          ? "synchronized"
          : "calm";

  const cssVars: Record<string, string> = {
    "--ms-desk-orchestration-phase": deckPhase,
    "--ms-desk-focus-weight": String(maxW),
  };
  for (const id of Object.keys(PANEL_META) as DesktopPanelId[]) {
    cssVars[`--ms-desk-panel-${id}`] = String(panels[id].weight);
  }

  return {
    panels,
    focusPanel,
    routeWorld,
    deckPhase,
    crossSync,
    cssVars,
  };
}

export function desktopPanelsForRail(
  orchestration: DesktopCommandOrchestration,
  rail: "left" | "right",
): DesktopPanelState[] {
  return (Object.keys(PANEL_META) as DesktopPanelId[])
    .map((id) => orchestration.panels[id])
    .filter((p) => PANEL_META[p.id].rail === rail)
    .sort((a, b) => b.weight - a.weight);
}

export function isDesktopCommandRoute(pathname: string): boolean {
  if (pathname.startsWith("/settings") || pathname.startsWith("/auth")) return false;
  return true;
}

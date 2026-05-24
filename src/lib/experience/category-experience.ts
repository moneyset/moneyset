import type { CognitionWorldId } from "@/lib/cognition/cognition-worlds";
import { resolveMobileWorldFromPath } from "@/lib/cognition/mobile-cognition-routes";
import type { CognitionDramaBundle } from "@/lib/cognition/cognition-drama-engine";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";

export type CategoryExperienceMode =
  | "command"
  | "temporal"
  | "pressure"
  | "tension"
  | "planetary"
  | "tactical"
  | "narrative"
  | "fragility"
  | "transmission"
  | "resonance";

export type CategoryTensionBand = "calm" | "aware" | "charged" | "critical";

export type CategoryExperienceProfile = Readonly<{
  world: CognitionWorldId | null;
  mode: CategoryExperienceMode;
  tensionBand: CategoryTensionBand;
  cadenceClass: string;
  atmosphereClass: string;
  transitionSec: number;
  enterY: number;
  breathScale: number;
  pressureScale: number;
  gravityScale: number;
  cssVars: Readonly<Record<string, string>>;
}>;

const WORLD_PROFILES: Record<CognitionWorldId, Omit<CategoryExperienceProfile, "world" | "tensionBand" | "cssVars">> = {
  liquidity: {
    mode: "pressure",
    cadenceClass: "ms-xp-cadence--sink",
    atmosphereClass: "ms-xp-atmosphere--pressure",
    transitionSec: 0.78,
    enterY: 14,
    breathScale: 0.88,
    pressureScale: 1.22,
    gravityScale: 1.08,
  },
  agents: {
    mode: "tension",
    cadenceClass: "ms-xp-cadence--tension",
    atmosphereClass: "ms-xp-atmosphere--tension",
    transitionSec: 0.52,
    enterY: 10,
    breathScale: 0.82,
    pressureScale: 1.1,
    gravityScale: 1.15,
  },
  replay: {
    mode: "temporal",
    cadenceClass: "ms-xp-cadence--temporal",
    atmosphereClass: "ms-xp-atmosphere--temporal",
    transitionSec: 1.05,
    enterY: 6,
    breathScale: 1.28,
    pressureScale: 0.95,
    gravityScale: 0.92,
  },
  macro: {
    mode: "planetary",
    cadenceClass: "ms-xp-cadence--planetary",
    atmosphereClass: "ms-xp-atmosphere--planetary",
    transitionSec: 0.88,
    enterY: 18,
    breathScale: 1.12,
    pressureScale: 1.18,
    gravityScale: 1.05,
  },
  sentiment: {
    mode: "narrative",
    cadenceClass: "ms-xp-cadence--wave",
    atmosphereClass: "ms-xp-atmosphere--narrative",
    transitionSec: 0.72,
    enterY: 12,
    breathScale: 1,
    pressureScale: 1.05,
    gravityScale: 1,
  },
  memory: {
    mode: "resonance",
    cadenceClass: "ms-xp-cadence--echo",
    atmosphereClass: "ms-xp-atmosphere--resonance",
    transitionSec: 0.92,
    enterY: 10,
    breathScale: 1.15,
    pressureScale: 1.02,
    gravityScale: 0.98,
  },
  risk: {
    mode: "fragility",
    cadenceClass: "ms-xp-cadence--fracture",
    atmosphereClass: "ms-xp-atmosphere--fragility",
    transitionSec: 0.58,
    enterY: 16,
    breathScale: 0.9,
    pressureScale: 1.2,
    gravityScale: 1.18,
  },
  transmission: {
    mode: "transmission",
    cadenceClass: "ms-xp-cadence--transmit",
    atmosphereClass: "ms-xp-atmosphere--transmission",
    transitionSec: 0.65,
    enterY: 14,
    breathScale: 0.96,
    pressureScale: 1.12,
    gravityScale: 1.08,
  },
  execution: {
    mode: "tactical",
    cadenceClass: "ms-xp-cadence--strike",
    atmosphereClass: "ms-xp-atmosphere--tactical",
    transitionSec: 0.48,
    enterY: 20,
    breathScale: 0.86,
    pressureScale: 1.08,
    gravityScale: 1.12,
  },
};

const COMMAND_DEFAULT: Omit<CategoryExperienceProfile, "world" | "tensionBand" | "cssVars"> = {
  mode: "command",
  cadenceClass: "ms-xp-cadence--command",
  atmosphereClass: "ms-xp-atmosphere--command",
  transitionSec: 0.62,
  enterY: 12,
  breathScale: 1,
  pressureScale: 1,
  gravityScale: 1,
};

function tensionBand(
  derived: DerivedCognitionSnapshot,
  drama: CognitionDramaBundle | null,
): CategoryTensionBand {
  if (derived.dangerScore >= 72 || drama?.dramaPhase === "peak") return "critical";
  if (derived.dangerScore >= 52 || drama?.dramaPhase === "rising") return "charged";
  if (derived.dangerScore >= 36 || (drama?.decisionGravity ?? 0) >= 0.45) return "aware";
  return "calm";
}

function buildCssVars(
  profile: Omit<CategoryExperienceProfile, "world" | "tensionBand" | "cssVars">,
  tension: CategoryTensionBand,
  drama: CognitionDramaBundle | null,
): Record<string, string> {
  const gravity = profile.gravityScale * (1 + (drama?.decisionGravity ?? 0) * 0.35);
  const breathDur = (6.5 * profile.breathScale).toFixed(2);
  return {
    "--ms-xp-breath-scale": String(profile.breathScale),
    "--ms-xp-pressure-scale": String(profile.pressureScale),
    "--ms-xp-gravity-scale": String(gravity.toFixed(3)),
    "--ms-xp-transition-sec": String(profile.transitionSec),
    "--ms-motion-breath-duration": `${breathDur}s`,
    "--ms-xp-tension-opacity": tension === "critical" ? "0.72" : tension === "charged" ? "0.52" : tension === "aware" ? "0.35" : "0.22",
    "--ms-signature-intensity": String(Math.min(1, (drama?.decisionGravity ?? 0.3) + (tension === "critical" ? 0.35 : 0))),
  };
}

export function deriveCategoryExperience(input: {
  pathname: string;
  latent: LatentDrivers;
  derived: DerivedCognitionSnapshot;
  drama: CognitionDramaBundle | null;
}): CategoryExperienceProfile {
  const world = resolveMobileWorldFromPath(input.pathname);
  const tension = tensionBand(input.derived, input.drama);
  const base = world ? WORLD_PROFILES[world] : COMMAND_DEFAULT;

  return {
    world,
    tensionBand: tension,
    ...base,
    cssVars: buildCssVars(base, tension, input.drama),
  };
}

export function getCategoryRouteTransition(profile: CategoryExperienceProfile) {
  return {
    durationSec: profile.transitionSec,
    enterY: profile.enterY,
    ease: [0.18, 0.92, 0.22, 1] as const,
  };
}

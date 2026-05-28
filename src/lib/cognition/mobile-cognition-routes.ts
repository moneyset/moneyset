import type { CognitionWorldId } from "@/lib/cognition/cognition-worlds";
import type { LabSlug } from "@/lib/labs/labs-modules";
import { labSlugToWorld } from "@/lib/cognition/cognition-worlds";

export type MobileWorldTransitionProfile = Readonly<{
  world: CognitionWorldId;
  /** Route enter motion — vertical offset px */
  enterY: number;
  /** Transition duration seconds */
  durationSec: number;
  /** Atmosphere depth multiplier for CSS */
  depthScale: number;
  /** Motion breath speed multiplier */
  breathScale: number;
  cadenceClass: string;
}>;

const MOBILE_WORLD_TRANSITIONS: Record<CognitionWorldId, MobileWorldTransitionProfile> = {
  liquidity: {
    world: "liquidity",
    enterY: 28,
    durationSec: 0.72,
    depthScale: 1.15,
    breathScale: 0.92,
    cadenceClass: "ms-mobile-cadence--sink",
  },
  agents: {
    world: "agents",
    enterY: 14,
    durationSec: 0.48,
    depthScale: 1.05,
    breathScale: 0.78,
    cadenceClass: "ms-mobile-cadence--tension",
  },
  replay: {
    world: "replay",
    enterY: 8,
    durationSec: 0.95,
    depthScale: 1.08,
    breathScale: 1.2,
    cadenceClass: "ms-mobile-cadence--temporal",
  },
  macro: {
    world: "macro",
    enterY: 20,
    durationSec: 0.8,
    depthScale: 1.22,
    breathScale: 1.05,
    cadenceClass: "ms-mobile-cadence--expand",
  },
  sentiment: {
    world: "sentiment",
    enterY: 16,
    durationSec: 0.68,
    depthScale: 1.1,
    breathScale: 1,
    cadenceClass: "ms-mobile-cadence--wave",
  },
  memory: {
    world: "memory",
    enterY: 12,
    durationSec: 0.88,
    depthScale: 1.12,
    breathScale: 1.15,
    cadenceClass: "ms-mobile-cadence--echo",
  },
  risk: {
    world: "risk",
    enterY: 18,
    durationSec: 0.55,
    depthScale: 1.08,
    breathScale: 0.85,
    cadenceClass: "ms-mobile-cadence--fracture",
  },
  transmission: {
    world: "transmission",
    enterY: 16,
    durationSec: 0.62,
    depthScale: 1.1,
    breathScale: 0.95,
    cadenceClass: "ms-mobile-cadence--transmit",
  },
  execution: {
    world: "execution",
    enterY: 22,
    durationSec: 0.52,
    depthScale: 1.06,
    breathScale: 0.88,
    cadenceClass: "ms-mobile-cadence--strike",
  },
};

export function resolveMobileWorldFromPath(pathname: string): CognitionWorldId | null {
  if (pathname === "/agents" || pathname.startsWith("/agents/")) return "agents";
  if (pathname === "/execution" || pathname.startsWith("/execution/")) return "execution";
  if (pathname === "/replay" || pathname.startsWith("/replay/")) return "replay";
  if (pathname === "/index" || pathname.startsWith("/index/")) return "macro";
  if (pathname === "/macro" || pathname.startsWith("/macro/")) return "macro";
  if (pathname === "/sentiment" || pathname.startsWith("/sentiment/")) return "sentiment";
  if (pathname === "/memory" || pathname.startsWith("/memory/")) return "memory";
  if (pathname === "/risk-radar" || pathname.startsWith("/risk-radar/")) return "risk";
  if (pathname === "/cross-asset" || pathname.startsWith("/cross-asset/")) return "transmission";

  const labMatch = pathname.match(/^\/labs\/([^/]+)/);
  if (labMatch?.[1]) {
    return labSlugToWorld(labMatch[1] as LabSlug);
  }

  if (pathname === "/") return "execution";
  return null;
}

export function getMobileWorldTransition(world: CognitionWorldId): MobileWorldTransitionProfile {
  return MOBILE_WORLD_TRANSITIONS[world];
}

export function mobileWorldLabel(world: CognitionWorldId, locale: "en" | "ru"): string {
  const labels: Record<CognitionWorldId, { en: string; ru: string }> = {
    liquidity: { en: "Liquidity depth", ru: "Глубина ликвидности" },
    agents: { en: "Agent war room", ru: "Зал агентов" },
    replay: { en: "Temporal replay", ru: "Временной реплей" },
    macro: { en: "Planetary macro", ru: "Планетарный макро" },
    sentiment: { en: "Narrative field", ru: "Поле нарратива" },
    memory: { en: "Memory constellation", ru: "Созвездие памяти" },
    risk: { en: "Risk topology", ru: "Топология риска" },
    transmission: { en: "Transmission", ru: "Трансмиссия" },
    execution: { en: "Tactical execution", ru: "Тактическое исполнение" },
  };
  return locale === "ru" ? labels[world].ru : labels[world].en;
}

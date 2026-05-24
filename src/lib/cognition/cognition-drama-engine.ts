import type { CognitionWorldId } from "@/lib/cognition/cognition-worlds";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type {
  CognitiveSnapshot,
  LatentDrivers,
} from "@/lib/simulation/cognition-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

export type SignatureMomentId =
  | "consensus_fracture"
  | "liquidity_cascade"
  | "macro_instability_wave"
  | "structural_collapse"
  | "fragility_escalation"
  | "sponsorship_collapse"
  | "tactical_breakdown"
  | "memory_echo_storm"
  | "planetary_pressure"
  | "replay_singularity"
  | "agent_leadership_coup";

export type DramaBeatId =
  | "consensus_collapse"
  | "fragility_escalation"
  | "macro_shock"
  | "instability_spread"
  | "scenario_divergence"
  | "tactical_breakdown";

export type SignatureMoment = Readonly<{
  id: SignatureMomentId;
  world: CognitionWorldId | "global";
  severity: "legendary" | "major";
  headline: string;
  subline: string;
  visualClass: string;
  intensity: number;
  active: boolean;
}>;

export type DramaBeat = Readonly<{
  id: DramaBeatId;
  line: string;
  gravity: number;
}>;

export type CognitionDramaBundle = Readonly<{
  simTick: number;
  dramaPhase: "calm" | "rising" | "peak" | "aftershock";
  decisionGravity: number;
  activeMoment: SignatureMoment | null;
  moments: readonly SignatureMoment[];
  beats: readonly DramaBeat[];
  cssVars: Readonly<Record<string, string>>;
}>;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function moment(
  locale: UiLocale,
  id: SignatureMomentId,
  world: CognitionWorldId | "global",
  severity: SignatureMoment["severity"],
  enH: string,
  ruH: string,
  enS: string,
  ruS: string,
  intensity: number,
  active: boolean,
): SignatureMoment {
  return {
    id,
    world,
    severity,
    headline: pickLocale(locale, enH, ruH),
    subline: pickLocale(locale, enS, ruS),
    visualClass: `ms-signature--${id.replace(/_/g, "-")}`,
    intensity: clamp01(intensity),
    active,
  };
}

function detectMoments(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  history: readonly CognitiveSnapshot[],
  simTick: number,
): SignatureMoment[] {
  const out: SignatureMoment[] = [];
  const liq = latent.liquidityStructuralStress;
  const div = derived.divergenceIndex;
  const danger = derived.dangerScore;

  if (derived.consensus === "divergence_increasing" && div >= 52) {
    out.push(
      moment(
        locale,
        "consensus_fracture",
        "agents",
        div >= 62 ? "legendary" : "major",
        "Consensus fracture",
        "Разлом консенсуса",
        "Institutional alignment splitting — probability mass fragmenting.",
        "Институциональное выравнивание расходится — масса вероятности фрагментируется.",
        div / 100,
        true,
      ),
    );
  }

  if (liq >= 70 && (derived.phase === "panic_risk" || derived.phase === "liquidity_compression")) {
    out.push(
      moment(
        locale,
        "liquidity_cascade",
        "liquidity",
        liq >= 78 ? "legendary" : "major",
        "Cascading liquidity topology",
        "Каскадная топология ликвидности",
        "Pressure universe bending — migration corridors igniting.",
        "Вселенная давления изгибается — коридоры миграции загораются.",
        liq / 100,
        true,
      ),
    );
  }

  if (latent.macroLiquidityBackdrop >= 72 && derived.volTone === "expanding") {
    out.push(
      moment(
        locale,
        "macro_instability_wave",
        "macro",
        "legendary",
        "Macro instability wave",
        "Волна макро-нестабильности",
        "Planetary pressure front advancing — geopolitical gravity distorting.",
        "Фронт планетарного давления наступает — геополитическая гравитация искажает поле.",
        (latent.macroLiquidityBackdrop + latent.volatilityImpulse) / 200,
        true,
      ),
    );
  }

  if (derived.phase === "fragile_continuation" && danger >= 58) {
    out.push(
      moment(
        locale,
        "structural_collapse",
        "execution",
        danger >= 68 ? "legendary" : "major",
        "Structural collapse geometry",
        "Геометрия структурного коллапса",
        "Execution terrain compressing — invalidation barriers tightening.",
        "Рельеф исполнения сжимается — барьеры инвалидации сжимаются.",
        danger / 100,
        true,
      ),
    );
  }

  if (liq >= 62 && latent.volatilityImpulse >= 58) {
    out.push(
      moment(
        locale,
        "fragility_escalation",
        "risk",
        "major",
        "Fragility escalation",
        "Эскалация хрупкости",
        "Instability pockets expanding across the topology.",
        "Карманы нестабильности расширяются по топологии.",
        (liq + latent.volatilityImpulse) / 200,
        true,
      ),
    );
  }

  if (liq >= 64 && latent.positioningPressure < 55) {
    out.push(
      moment(
        locale,
        "sponsorship_collapse",
        "liquidity",
        "major",
        "Sponsorship collapse zone",
        "Зона коллапса спонсорства",
        "Depth sponsorship failing — reactive geometry only.",
        "Спонсорство глубины рушится — только реактивная геометрия.",
        liq / 100,
        true,
      ),
    );
  }

  if (derived.dangerBand === "critical" || derived.dangerBand === "dangerous") {
    out.push(
      moment(
        locale,
        "tactical_breakdown",
        "execution",
        derived.dangerBand === "critical" ? "legendary" : "major",
        "Tactical breakdown",
        "Тактический срыв",
        "Decision gravity critical — corridors narrowing.",
        "Гравитация решения критична — коридоры сужаются.",
        danger / 100,
        true,
      ),
    );
  }

  const last = history[history.length - 1];
  const prev = history.length >= 2 ? history[history.length - 2] : null;
  if (last && prev && last.leadScenarioProb + 8 < prev.leadScenarioProb && div >= 48) {
    out.push(
      moment(
        locale,
        "memory_echo_storm",
        "memory",
        "major",
        "Memory echo storm",
        "Шторм эхо памяти",
        "Historical analogs resonating — pattern galaxies aligning.",
        "Исторические аналоги резонируют — галактики паттернов выстраиваются.",
        0.65,
        true,
      ),
    );
  }

  if (latent.macroLiquidityBackdrop >= 68 && liq >= 58 && div >= 50) {
    out.push(
      moment(
        locale,
        "planetary_pressure",
        "macro",
        "legendary",
        "Planetary pressure matrix",
        "Планетарная матрица давления",
        "Cross-market contagion arcs synchronizing — narrative weather systems colliding.",
        "Дуги кросс-рыночной заразы синхронизируются — погодные системы нарратива сталкиваются.",
        0.72,
        true,
      ),
    );
  }

  if (history.length >= 5 && simTick % 12 === 0 && derived.volTone === "expanding") {
    out.push(
      moment(
        locale,
        "replay_singularity",
        "replay",
        "major",
        "Temporal singularity",
        "Временная сингулярность",
        "Living market history folding — structural echoes superposed.",
        "Живая рыночная история складывается — структурные эхо наложены.",
        0.58,
        simTick % 24 < 4,
      ),
    );
  }

  if (motionLeadershipShift(history, simTick)) {
    out.push(
      moment(
        locale,
        "agent_leadership_coup",
        "agents",
        "major",
        "Leadership shift",
        "Смена лидерства",
        "Agent influence warfare — tactical override in play.",
        "Война влияния агентов — тактическое переопределение в игре.",
        0.55,
        true,
      ),
    );
  }

  const rank = { legendary: 0, major: 1 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || b.intensity - a.intensity);
}

function motionLeadershipShift(history: readonly CognitiveSnapshot[], simTick: number): boolean {
  if (history.length < 3) return simTick % 18 === 0;
  const a = history[history.length - 1]!;
  const b = history[history.length - 3]!;
  return Math.abs(a.divergenceIndex - b.divergenceIndex) >= 12;
}

function deriveBeats(locale: UiLocale, latent: LatentDrivers, derived: DerivedCognitionSnapshot): DramaBeat[] {
  const beats: DramaBeat[] = [];
  const g = derived.dangerScore / 100;

  if (derived.consensus === "divergence_increasing") {
    beats.push({
      id: "consensus_collapse",
      line: pickLocale(locale, "Consensus collapsing", "Консенсус рушится"),
      gravity: g + 0.15,
    });
  }
  if (latent.liquidityStructuralStress >= 60) {
    beats.push({
      id: "fragility_escalation",
      line: pickLocale(locale, "Fragility escalating", "Хрупкость эскалирует"),
      gravity: g + 0.1,
    });
  }
  if (latent.macroLiquidityBackdrop >= 70) {
    beats.push({
      id: "macro_shock",
      line: pickLocale(locale, "Macro shock distortion", "Искажение макро-шока"),
      gravity: g + 0.12,
    });
  }
  if (derived.divergenceIndex >= 55) {
    beats.push({
      id: "scenario_divergence",
      line: pickLocale(locale, "Scenario paths diverging", "Сценарные пути расходятся"),
      gravity: g + 0.08,
    });
  }
  if (derived.dangerBand === "dangerous" || derived.dangerBand === "critical") {
    beats.push({
      id: "tactical_breakdown",
      line: pickLocale(locale, "Tactical breakdown pressure", "Давление тактического срыва"),
      gravity: g + 0.2,
    });
  }
  return beats.slice(0, 4);
}

export function deriveCognitionDramaBundle(args: {
  locale: UiLocale;
  latent: LatentDrivers;
  derived: DerivedCognitionSnapshot;
  history: readonly CognitiveSnapshot[];
  simTick: number;
}): CognitionDramaBundle {
  const { locale, latent, derived, history, simTick } = args;
  const moments = detectMoments(locale, latent, derived, history, simTick);
  const active = moments.find((m) => m.active) ?? null;
  const decisionGravity = clamp01(
    derived.dangerScore / 100 +
      derived.divergenceIndex / 120 +
      latent.liquidityStructuralStress / 140 +
      (active?.intensity ?? 0) * 0.25,
  );

  const dramaPhase: CognitionDramaBundle["dramaPhase"] =
    active?.severity === "legendary"
      ? "peak"
      : active
        ? "rising"
        : decisionGravity >= 0.45
          ? "aftershock"
          : "calm";

  const beats = deriveBeats(locale, latent, derived);

  return {
    simTick,
    dramaPhase,
    decisionGravity,
    activeMoment: active,
    moments: moments.slice(0, 5),
    beats,
    cssVars: {
      "--ms-drama-gravity": decisionGravity.toFixed(3),
      "--ms-drama-intensity": (active?.intensity ?? 0).toFixed(3),
      "--ms-drama-phase": dramaPhase === "peak" ? "1" : dramaPhase === "rising" ? "0.65" : "0.2",
    },
  };
}

export function signatureMomentForWorld(
  bundle: CognitionDramaBundle,
  world: CognitionWorldId,
): SignatureMoment | null {
  const m =
    bundle.moments.find((x) => x.active && x.world === world) ??
    bundle.moments.find((x) => x.active && x.world === "global");
  return m ?? (bundle.activeMoment?.world === world ? bundle.activeMoment : null);
}

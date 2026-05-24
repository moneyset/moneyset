import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import { isLateContinuationRegime } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import type { ScenarioEngineCard } from "@/lib/simulation/scenario-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

import type {
  ExecutionLayerSurface,
  ExecutionStructuralZone,
  ExecutionStructuralZoneKind,
} from "@/lib/execution/derive-execution-layer";
import { formatPriceRange } from "@/lib/execution/derive-execution-layer";

export type TacticalFrameworkZone = Readonly<{
  id: string;
  title: string;
  rangeLabel: string;
  framing: string;
}>;

export type ExecutionInterpretationBundle = Readonly<{
  currentPosture: string;
  postureRationale: string;
  acceptanceZone: Readonly<{ line: string }>;
  defensiveZone: Readonly<{ line: string }>;
  executionBias: string;
  scenarioImplication: string;
  tacticalFramework: readonly TacticalFrameworkZone[];
}>;

function formatLevel(locale: UiLocale, price: number): string {
  return formatPriceRange(locale, price, price);
}

function findZone(
  zones: readonly ExecutionStructuralZone[],
  kinds: readonly ExecutionStructuralZoneKind[],
): ExecutionStructuralZone | undefined {
  for (const kind of kinds) {
    const z = zones.find((x) => x.kind === kind);
    if (z) return z;
  }
  return undefined;
}

function frameworkTitle(locale: UiLocale, kind: ExecutionStructuralZoneKind): string {
  const m: Record<ExecutionStructuralZoneKind, [string, string]> = {
    acceptance: ["Acceptance zone", "Зона принятия"],
    reclaim: ["Reclaim zone", "Зона откупа"],
    liquidity_lower: ["Liquidity trigger", "Триггер ликвидности"],
    liquidity_upper: ["Upper liquidity trigger", "Верхний триггер ликвидности"],
    compression: ["Compression zone", "Зона сжатия"],
    expansion_trigger: ["Expansion zone", "Зона расширения"],
    breakdown_trigger: ["Invalidation zone", "Зона инвалидации"],
    objective: ["Objective band", "Полоса цели"],
    extension: ["Extension zone", "Зона расширения"],
  };
  const [en, ru] = m[kind];
  return pickLocale(locale, en, ru);
}

function buildTacticalFramework(
  locale: UiLocale,
  zones: readonly ExecutionStructuralZone[],
  latent: LatentDrivers,
): TacticalFrameworkZone[] {
  const order: ExecutionStructuralZoneKind[] = [
    "expansion_trigger",
    "acceptance",
    "reclaim",
    "compression",
    "liquidity_lower",
    "liquidity_upper",
    "breakdown_trigger",
    "extension",
    "objective",
  ];
  const out: TacticalFrameworkZone[] = [];
  for (const kind of order) {
    const z = zones.find((x) => x.kind === kind);
    if (!z) continue;
    out.push({
      id: kind,
      title: frameworkTitle(locale, kind),
      rangeLabel: formatPriceRange(locale, z.low, z.high),
      framing: z.ladderFraming,
    });
    if (out.length >= 6) break;
  }
  if (out.length < 6 && latent.liquidityStructuralStress >= 58) {
    const sweep = zones.find((x) => x.kind === "liquidity_lower");
    if (sweep && !out.some((f) => f.id === "fragility")) {
      out.push({
        id: "fragility",
        title: pickLocale(locale, "Fragility area", "Зона хрупкости"),
        rangeLabel: formatPriceRange(locale, sweep.low, sweep.high),
        framing: pickLocale(
          locale,
          "Passive depth thinning elevates sweep sensitivity — not a target call.",
          "Истончение пассива повышает чувствительность к сносу — не целевой вызов.",
        ),
      });
    }
  }
  return out;
}

function deriveCurrentPosture(
  locale: UiLocale,
  surface: ExecutionLayerSurface,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
): string {
  if (!surface.hasTape) {
    return pickLocale(
      locale,
      "Posture remains conditional until live tape anchors structural bands.",
      "Поза условна, пока лента не привяжет структурные полосы.",
    );
  }
  if (isLateContinuationRegime(latent)) {
    return pickLocale(
      locale,
      "Current posture favors patience over breakout aggression — late continuation on thinning depth.",
      "Поза за терпение, не за агрессию пробоя — позднее продолжение на истончении глубины.",
    );
  }
  switch (surface.executionBiasVariant) {
    case "defensive_posture":
    case "aggression_reduced":
      return pickLocale(
        locale,
        "Current posture favors patience over breakout aggression.",
        "Поза за терпение, а не за агрессию пробоя.",
      );
    case "expansion_vulnerable":
      return pickLocale(
        locale,
        "Current posture treats expansion as vulnerable until participation breadth confirms.",
        "Поза считает расширение уязвимым, пока ширина участия не подтвердит.",
      );
    case "reclaim_required":
      return pickLocale(
        locale,
        "Current posture requires reclaim proof before continuation sizing.",
        "Поза требует доказательства откупа перед размером продолжения.",
      );
    case "continuation_strengthening":
      return pickLocale(
        locale,
        "Current posture allows measured continuation while acceptance holds.",
        "Поза допускает сдержанное продолжение, пока держится принятие.",
      );
    default:
      return surface.executionPosture.length > 140
        ? `${surface.executionPosture.slice(0, 137)}…`
        : surface.executionPosture;
  }
}

function derivePostureRationale(
  locale: UiLocale,
  surface: ExecutionLayerSurface,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
): string {
  const parts: string[] = [];
  if (surface.structuralRationale[0]) parts.push(surface.structuralRationale[0]);
  if (derived.volTone === "expanding" && latent.liquidityStructuralStress >= 55) {
    parts.push(
      pickLocale(
        locale,
        "Volatility expansion meets thin sponsorship — expansion conditions weaken without breadth.",
        "Расширение волы на фоне тонкого спонсорства — условия расширения слабеют без ширины.",
      ),
    );
  } else if (derived.volTone === "compressing") {
    parts.push(
      pickLocale(
        locale,
        "Compression coil — breakout aggression deferred until acceptance proves outside the envelope.",
        "Сжатие — агрессия пробоя отложена, пока принятие не докажет выход из конверта.",
      ),
    );
  }
  if (latent.positioningPressure >= 62 && latent.macroLiquidityBackdrop <= 52) {
    parts.push(
      pickLocale(
        locale,
        "Positioning pressure elevated against a tightening macro backdrop.",
        "Давление позиции выше на фоне сжимающегося макро.",
      ),
    );
  }
  if (parts.length === 0) {
    return pickLocale(
      locale,
      "Posture synthesizes structure, liquidity stress, and participation quality — not a directional call.",
      "Поза синтезирует структуру, стресс ликвидности и качество участия — не направленный вызов.",
    );
  }
  return parts.slice(0, 2).join(" ");
}

function deriveAcceptanceLine(
  locale: UiLocale,
  surface: ExecutionLayerSurface,
): string {
  if (!surface.hasTape) {
    return pickLocale(
      locale,
      "Acceptance geometry activates when mark/last anchors the tape.",
      "Геометрия принятия активируется при привязке метки/последней к ленте.",
    );
  }
  const acc = findZone(surface.zones, ["acceptance", "reclaim"]);
  if (!acc) {
    return pickLocale(
      locale,
      "Acceptance band not resolved in current structural window.",
      "Полоса принятия не выделена в текущем структурном окне.",
    );
  }
  const anchor = surface.anchorPrice;
  const band = formatPriceRange(locale, acc.low, acc.high);
  if (anchor !== null && anchor >= acc.low) {
    return pickLocale(
      locale,
      `Acceptance holds within ${band} — continuation conditions currently supported.`,
      `Принятие держится в ${band} — условия продолжения сейчас поддержаны.`,
    );
  }
  return pickLocale(
    locale,
    `Acceptance above ${formatLevel(locale, acc.high)} strengthens continuation conditions.`,
    `Принятие выше ${formatLevel(locale, acc.high)} усиливает условия продолжения.`,
  );
}

function deriveDefensiveLine(locale: UiLocale, surface: ExecutionLayerSurface): string {
  if (!surface.hasTape) {
    return pickLocale(
      locale,
      "Defensive geometry pending tape — invalidation bands unlock with mark/last.",
      "Защитная геометрия ждёт ленту — полосы инвалидации появятся с меткой/последней.",
    );
  }
  const def = findZone(surface.zones, ["breakdown_trigger", "liquidity_lower", "reclaim"]);
  if (!def) {
    return surface.invalidation.length > 0
      ? surface.invalidation
      : pickLocale(
          locale,
          "Defensive read tracks invalidation pressure at structural shelves.",
          "Защитное прочтение следует за давлением инвалидации у структурных полок.",
        );
  }
  return pickLocale(
    locale,
    `Failure beneath ${formatLevel(locale, def.low)} increases retracement probability.`,
    `Провал ниже ${formatLevel(locale, def.low)} повышает вероятность отката.`,
  );
}

function deriveBiasLine(locale: UiLocale, surface: ExecutionLayerSurface): string {
  switch (surface.executionBiasVariant) {
    case "defensive_posture":
    case "aggression_reduced":
      return pickLocale(
        locale,
        "Prefer reactive participation over anticipatory positioning.",
        "Предпочитайте реактивное участие, а не упреждающее позиционирование.",
      );
    case "expansion_vulnerable":
      return pickLocale(
        locale,
        "Favor proof-of-flow over expansion chase while vol transitions.",
        "Доказательства потока важнее погони за расширением при переходе волы.",
      );
    case "reclaim_required":
      return pickLocale(
        locale,
        "Size reacts to reclaim quality — sponsorship must confirm before aggression.",
        "Размер реагирует на качество откупа — спонсорство должно подтвердиться до агрессии.",
      );
    case "continuation_strengthening":
      return pickLocale(
        locale,
        "Continuation bias strengthening — still conditional on acceptance integrity.",
        "Уклон к продолжению усиливается — всё ещё условно целостности принятия.",
      );
  }
  return pickLocale(
    locale,
    `${surface.executionBiasLabel} — measured framing, not a trade instruction.`,
    `${surface.executionBiasLabel} — сдержанное прочтение, не торговая инструкция.`,
  );
}

function deriveScenarioImplication(
  locale: UiLocale,
  surface: ExecutionLayerSurface,
  leadCard: ScenarioEngineCard | null,
): string {
  if (leadCard?.structuralPath) {
    const line = leadCard.structuralPath;
    return line.length > 160 ? `${line.slice(0, 157)}…` : line;
  }
  if (surface.primaryPath) {
    const line = surface.primaryPath;
    return line.length > 160 ? `${line.slice(0, 157)}…` : line;
  }
  return pickLocale(
    locale,
    "Scenario path weights inform posture — probabilities evolve with lattice drivers.",
    "Веса сценарных путей питают позу — вероятности эволюционируют с драйверами решётки.",
  );
}

export function deriveExecutionInterpretation(args: {
  locale: UiLocale;
  surface: ExecutionLayerSurface;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  leadScenario?: ScenarioEngineCard | null;
}): ExecutionInterpretationBundle {
  const { locale, surface, derived, latent, leadScenario = null } = args;

  return {
    currentPosture: deriveCurrentPosture(locale, surface, derived, latent),
    postureRationale: derivePostureRationale(locale, surface, derived, latent),
    acceptanceZone: { line: deriveAcceptanceLine(locale, surface) },
    defensiveZone: { line: deriveDefensiveLine(locale, surface) },
    executionBias: deriveBiasLine(locale, surface),
    scenarioImplication: deriveScenarioImplication(locale, surface, leadScenario),
    tacticalFramework: buildTacticalFramework(locale, surface.zones, latent),
  };
}

/** Free-tier snapshot: posture + bias only; zones withheld. */
export function deriveExecutionInterpretationPreview(
  full: ExecutionInterpretationBundle,
): Pick<
  ExecutionInterpretationBundle,
  "currentPosture" | "postureRationale" | "executionBias" | "scenarioImplication"
> {
  return {
    currentPosture: full.currentPosture,
    postureRationale: full.postureRationale,
    executionBias: full.executionBias,
    scenarioImplication: full.scenarioImplication,
  };
}

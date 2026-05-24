import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

import type {
  ExecutionBiasVariant,
  ExecutionLayerSurface,
  ExecutionStructuralZone,
  ExecutionStructuralZoneKind,
} from "@/lib/execution/derive-execution-layer";
import { formatPriceRange, zoneContainingPrice } from "@/lib/execution/derive-execution-layer";

export type ExecutionMapInteractionKind =
  | "absorption"
  | "sweep_risk"
  | "responsive_flow"
  | "passive_weakening"
  | "continuation_fragile"
  | "expansion_sponsored";

export type ExecutionMapLaneView = Readonly<{
  kind: ExecutionStructuralZoneKind;
  ladderTitle: string;
  rangeLabel: string;
  behavioralLine: string;
  interactionKind: ExecutionMapInteractionKind;
  interactionLabel: string;
  convictionLabel: string;
  participationNote: string;
  /** 0–1 visual weight for pressure ribbon. */
  pressure: number;
  /** 0–1 glow strength for liquidity shelves only. */
  pocketGlow: number;
  /** Normalized 0–1 micro strip values for this lane context. */
  stripCoherence: number;
  stripParticipation: number;
  stripExpansion: number;
}>;

export type ExecutionMapResponseState = Readonly<{
  headline: string;
  subline: string;
}>;

export type ExecutionMapView = Readonly<{
  lanes: readonly ExecutionMapLaneView[];
  primaryKind: ExecutionStructuralZoneKind | null;
  responseState: ExecutionMapResponseState;
  timingLines: readonly string[];
}>;

function lastScalar(series: readonly number[], fallback: number): number {
  const v = series[series.length - 1];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function norm01(v: number, lo = 0, hi = 100): number {
  return Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
}

function laneInteraction(
  locale: UiLocale,
  kind: ExecutionStructuralZoneKind,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
): { kind: ExecutionMapInteractionKind; label: string } {
  const hot =
    derived.dangerBand === "elevated" ||
    derived.dangerBand === "dangerous" ||
    derived.dangerBand === "critical";
  const thin = latent.liquidityStructuralStress >= 58;

  switch (kind) {
    case "acceptance":
      if (hot && thin) {
        return {
          kind: "continuation_fragile",
          label: pickLocale(
            locale,
            "Continuation unstable near thin depth — absorption contested.",
            "Продолжение нестабильно при тонкой глубине — поглощение оспаривается.",
          ),
        };
      }
      return {
        kind: "absorption",
        label: pickLocale(
          locale,
          "Absorption likely inside shell — reactive flow preferred over chase.",
          "Поглощение вероятнее в оболочке — реактивный поток вместо погони.",
        ),
      };
    case "reclaim":
      return {
        kind: "responsive_flow",
        label: pickLocale(
          locale,
          "Reclaim-dependent participation — responsive sponsorship matters.",
          "Участие от откупа — важна реактивная поддержка.",
        ),
      };
    case "liquidity_lower":
    case "liquidity_upper":
      return {
        kind: "sweep_risk",
        label: pickLocale(
          locale,
          "Sweep risk elevated — passive liquidity may weaken ahead of continuation.",
          "Риск сноса выше — пассивная ликвидность может ослабнуть перед базой.",
        ),
      };
    case "compression":
      return {
        kind: "absorption",
        label: pickLocale(
          locale,
          "Volatility compressing — structure stabilizing until breakout quality proves.",
          "Вола сжимается — структура стабилизируется до доказательства пробоя.",
        ),
      };
    case "expansion_trigger":
      return {
        kind: "expansion_sponsored",
        label: pickLocale(
          locale,
          "Expansion valid only with sponsorship — avoid naked breakout chase.",
          "Расширение только со спонсорством — без голой погони за пробоем.",
        ),
      };
    case "breakdown_trigger":
      return {
        kind: "continuation_fragile",
        label: pickLocale(
          locale,
          "Invalidation risk expands here — momentum acceptance fails through band.",
          "Риск снятия расширяется — принятие импульса ломается через полосу.",
        ),
      };
    case "objective":
      return {
        kind: "expansion_sponsored",
        label: pickLocale(
          locale,
          "Extension statistically fragile — participation must broaden with price.",
          "Экстеншен хрупок статистически — участие должно шириться с ценой.",
        ),
      };
    case "extension":
      return {
        kind: "passive_weakening",
        label: pickLocale(
          locale,
          "Outer band — passive liquidity weakening without flow confirmation.",
          "Внешняя полоса — пассив ослабевает без подтверждения потоком.",
        ),
      };
  }
}

function lanePressure(
  kind: ExecutionStructuralZoneKind,
  surface: ExecutionLayerSurface,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
): number {
  const m = surface.microCognition;
  const stress = lastScalar(surface.stressSeries, 50) / 100;
  const liq = lastScalar(surface.liquiditySeries, latent.liquidityStructuralStress) / 100;
  const coh = m.structuralCoherence / 100;
  const part = lastScalar(surface.participationSeries, latent.positioningPressure) / 100;
  const vol = m.volImpulse / 100;
  switch (kind) {
    case "breakdown_trigger":
      return norm01(stress * 0.92 + (1 - coh) * 0.35, 0, 1.15);
    case "liquidity_lower":
    case "liquidity_upper":
      return norm01(liq * 0.85 + stress * 0.2, 0, 1.1);
    case "reclaim":
      return norm01((1 - coh) * 0.55 + stress * 0.35 + 0.12, 0, 1.05);
    case "acceptance":
      return norm01(part * 0.5 + (1 - coh) * 0.35 + 0.1, 0, 1.05);
    case "compression":
      return derived.volTone === "compressing" ? norm01(0.35 + vol * 0.25, 0, 1) : norm01(vol * 0.45 + 0.2, 0, 1);
    case "expansion_trigger":
      return norm01(vol * 0.55 + stress * 0.25, 0, 1.1);
    case "objective":
      return norm01(lastScalar(surface.scenarioSeries, 50) / 100 * 0.5 + part * 0.35, 0, 1.05);
    case "extension":
      return norm01(0.22 + (1 - part) * 0.35, 0, 0.95);
    default:
      return 0.35;
  }
}

function pocketGlowFor(kind: ExecutionStructuralZoneKind, stressLiq: number, isPrimary: boolean): number {
  if (kind !== "liquidity_lower" && kind !== "liquidity_upper") return 0;
  const base = norm01(stressLiq, 40, 92);
  return Math.min(1, base * (isPrimary ? 1.12 : 0.72) + (isPrimary ? 0.08 : 0));
}

function convictionLabel(locale: UiLocale, coh: number, danger: DerivedCognitionSnapshot["dangerBand"]): string {
  if (danger === "critical" || danger === "dangerous") {
    return pickLocale(locale, "Conviction: defensive", "Убеждённость: защита");
  }
  if (coh >= 72) return pickLocale(locale, "Conviction: structure firm", "Убеждённость: структура плотная");
  if (coh >= 52) return pickLocale(locale, "Conviction: conditional", "Убеждённость: условная");
  return pickLocale(locale, "Conviction: fragile", "Убеждённость: хрупкая");
}

function participationNote(locale: UiLocale, latent: LatentDrivers): string {
  const p = latent.positioningPressure;
  if (p >= 68) return pickLocale(locale, "Participation: broadening pressure", "Участие: давление ширины");
  if (p <= 38) return pickLocale(locale, "Participation: narrow / selective", "Участие: узко / выборочно");
  return pickLocale(locale, "Participation: balanced drift", "Участие: сбалансированный дрейф");
}

function responseFromBias(locale: UiLocale, variant: ExecutionBiasVariant, posture: string): ExecutionMapResponseState {
  const postureShort = posture.length > 64 ? `${posture.slice(0, 61)}…` : posture;
  switch (variant) {
    case "defensive_posture":
      return {
        headline: pickLocale(locale, "Defensive execution posture", "Защитная поза исполнения"),
        subline: pickLocale(
          locale,
          "Tight invalidation shelves; reactive sizing.",
          "Жёсткие полки снятия; реактивный объём.",
        ),
      };
    case "aggression_reduced":
      return {
        headline: pickLocale(locale, "Reduced aggression surface", "Поверхность с пониженной агрессией"),
        subline: postureShort,
      };
    case "expansion_vulnerable":
      return {
        headline: pickLocale(locale, "Reactive execution favored", "Реактивное исполнение в фокусе"),
        subline: pickLocale(
          locale,
          "No breakout chase — needs sponsorship + acceptance.",
          "Без погони за пробоем — нужны спонсорство и принятие.",
        ),
      };
    case "reclaim_required":
      return {
        headline: pickLocale(locale, "Reclaim-dependent participation", "Участие зависит от откупа"),
        subline: postureShort,
      };
    case "continuation_strengthening":
      return {
        headline: pickLocale(locale, "Continuation posture strengthening", "Поза продолжения усиливается"),
        subline: postureShort,
      };
    case "favor_responsive_long":
      return {
        headline: pickLocale(locale, "Responsive long posture (structural)", "Реактивная long-поза (структурно)"),
        subline: postureShort,
      };
    case "favor_responsive_short":
      return {
        headline: pickLocale(locale, "Responsive short posture (structural)", "Реактивная short-поза (структурно)"),
        subline: postureShort,
      };
    default:
      return {
        headline: pickLocale(locale, "Measured execution response", "Сдержанный отклик исполнения"),
        subline: postureShort,
      };
  }
}

function sortLanes(
  zones: readonly ExecutionStructuralZone[],
  anchor: number | null,
  primaryKind: ExecutionStructuralZoneKind | null,
): ExecutionStructuralZone[] {
  if (zones.length === 0) return [];
  const mid = (z: ExecutionStructuralZone) => (z.low + z.high) / 2;
  if (!primaryKind) return [...zones].sort((a, b) => mid(a) - mid(b));
  const prim = zones.find((z) => z.kind === primaryKind);
  const rest = zones.filter((z) => z.kind !== primaryKind);
  if (anchor === null) {
    rest.sort((a, b) => mid(a) - mid(b));
  } else {
    rest.sort((a, b) => Math.abs(mid(a) - anchor) - Math.abs(mid(b) - anchor));
  }
  return prim ? [prim, ...rest] : [...zones].sort((a, b) => mid(a) - mid(b));
}

function timingLines(
  locale: UiLocale,
  surface: ExecutionLayerSurface,
  derived: DerivedCognitionSnapshot,
): readonly string[] {
  const out: string[] = [];
  if (derived.volTone === "expanding") {
    out.push(pickLocale(locale, "Volatility transition active", "Активен переход волатильности"));
  } else if (derived.volTone === "compressing") {
    out.push(pickLocale(locale, "Compression stabilizing timing", "Тайминг стабилизации сжатия"));
  }
  if (surface.railTransitionLine) out.push(surface.railTransitionLine);
  const cont = surface.continuationRead;
  if (cont && out.length < 2) {
    out.push(cont.length > 80 ? `${cont.slice(0, 77)}…` : cont);
  }
  return out.slice(0, 2);
}

export function deriveExecutionMapView(args: {
  locale: UiLocale;
  surface: ExecutionLayerSurface;
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
}): ExecutionMapView {
  const { locale, surface, derived, latent } = args;
  const anchor = surface.anchorPrice;
  const key = anchor !== null ? zoneContainingPrice(surface.zones, anchor) : null;
  const primaryKind = key?.kind ?? null;
  const ordered = sortLanes(surface.zones, anchor, primaryKind);
  const coh = surface.microCognition.structuralCoherence;
  const stressLiq = latent.liquidityStructuralStress;

  const lanes: ExecutionMapLaneView[] = ordered.map((z) => {
    const inter = laneInteraction(locale, z.kind, derived, latent);
    const isPrimary = primaryKind !== null && z.kind === primaryKind;
    const pressure = lanePressure(z.kind, surface, derived, latent);
    const glow = pocketGlowFor(z.kind, stressLiq, isPrimary);
    const stripC = norm01(coh, 35, 95);
    const stripP = norm01(lastScalar(surface.participationSeries, latent.positioningPressure), 25, 90);
    const stripE =
      derived.volTone === "compressing"
        ? norm01(100 - surface.microCognition.volImpulse, 20, 90)
        : norm01(surface.microCognition.volImpulse, 15, 95);

    return {
      kind: z.kind,
      ladderTitle: z.ladderTitle,
      rangeLabel: formatPriceRange(locale, z.low, z.high),
      behavioralLine: z.microLine,
      interactionKind: inter.kind,
      interactionLabel: inter.label,
      convictionLabel: convictionLabel(locale, coh, derived.dangerBand),
      participationNote: participationNote(locale, latent),
      pressure,
      pocketGlow: glow,
      stripCoherence: stripC,
      stripParticipation: stripP,
      stripExpansion: stripE,
    };
  });

  return {
    lanes,
    primaryKind,
    responseState: responseFromBias(locale, surface.executionBiasVariant, surface.executionPosture),
    timingLines: timingLines(locale, surface, derived),
  };
}

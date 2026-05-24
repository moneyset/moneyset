import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

export type LiquidityPhenomenonKind =
  | "gravity_well"
  | "pressure_fracture"
  | "cascade_pathway"
  | "leverage_deformation"
  | "instability_pocket"
  | "vol_expansion_wave"
  | "sponsorship_collapse"
  | "migration_corridor";

export type LiquidityPhenomenon = Readonly<{
  id: string;
  kind: LiquidityPhenomenonKind;
  label: string;
  read: string;
  x: number;
  y: number;
  w: number;
  h: number;
  intensity: number;
  pulsing: boolean;
}>;

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

export function deriveLiquidityPhysicsPhenomena(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  gravity: number,
  simTick: number,
): readonly LiquidityPhenomenon[] {
  const out: LiquidityPhenomenon[] = [];
  const phase = (simTick % 40) / 40;
  const liq = latent.liquidityStructuralStress;
  const pp = latent.positioningPressure;
  const vi = latent.volatilityImpulse;

  out.push({
    id: "gw-primary",
    kind: "gravity_well",
    label: pickLocale(locale, "Liquidation gravity well", "Колодец гравитации ликвидаций"),
    read: pickLocale(locale, "Mass concentrates — terrain bends inward.", "Масса концентрируется — рельеф прогибается внутрь."),
    x: 38 + Math.sin(phase * Math.PI * 2) * 3,
    y: 32 + Math.cos(phase * Math.PI * 2) * 2,
    w: 22 + gravity * 0.08,
    h: 22 + gravity * 0.08,
    intensity: clamp(gravity),
    pulsing: gravity >= 60,
  });

  if (liq >= 55) {
    out.push({
      id: "fracture-a",
      kind: "pressure_fracture",
      label: pickLocale(locale, "Pressure fracture", "Трещина давления"),
      read: pickLocale(locale, "Shelf integrity splitting.", "Целостность полки расщепляется."),
      x: 62,
      y: 48,
      w: 18,
      h: 8,
      intensity: clamp(liq * 0.9),
      pulsing: liq >= 68,
    });
  }

  if (liq >= 62 || derived.phase === "panic_risk") {
    out.push({
      id: "cascade-1",
      kind: "cascade_pathway",
      label: pickLocale(locale, "Cascade pathway", "Путь каскада"),
      read: pickLocale(locale, "Chain-reaction corridor open.", "Коридор цепной реакции открыт."),
      x: 22,
      y: 58,
      w: 48,
      h: 12,
      intensity: clamp(liq + pp * 0.2),
      pulsing: true,
    });
  }

  if (pp >= 58) {
    out.push({
      id: "leverage-deform",
      kind: "leverage_deformation",
      label: pickLocale(locale, "Leverage deformation", "Деформация плеча"),
      read: pickLocale(locale, "Positioning stress warping depth.", "Стресс позиционирования искривляет глубину."),
      x: 48,
      y: 62,
      w: 28,
      h: 16,
      intensity: clamp(pp * 0.85),
      pulsing: pp >= 70,
    });
  }

  if (liq >= 50 && vi >= 48) {
    out.push({
      id: "instab-pocket",
      kind: "instability_pocket",
      label: pickLocale(locale, "Instability pocket", "Карман нестабильности"),
      read: pickLocale(locale, "Local turbulence — participation thinning.", "Локальная турбулентность — участие истончается."),
      x: 72,
      y: 28,
      w: 16,
      h: 16,
      intensity: clamp((liq + vi) / 2),
      pulsing: vi >= 62,
    });
  }

  if (derived.volTone === "expanding") {
    out.push({
      id: "vol-wave",
      kind: "vol_expansion_wave",
      label: pickLocale(locale, "Volatility expansion wave", "Волна расширения волатильности"),
      read: pickLocale(locale, "Vol perimeter advancing across terrain.", "Периметр волы наступает по рельефу."),
      x: 8,
      y: 12,
      w: 84,
      h: 10,
      intensity: clamp(vi),
      pulsing: true,
    });
  }

  if (liq >= 58 && pp < 52) {
    out.push({
      id: "sponsor-collapse",
      kind: "sponsorship_collapse",
      label: pickLocale(locale, "Sponsorship collapse", "Коллапс спонсорства"),
      read: pickLocale(locale, "Reactive fills only — sponsorship void.", "Только реактивные заполнения — пустота спонсорства."),
      x: 52,
      y: 72,
      w: 24,
      h: 14,
      intensity: clamp(liq - pp * 0.3),
      pulsing: true,
    });
  }

  if (latent.macroLiquidityBackdrop >= 55) {
    out.push({
      id: "migration-corridor",
      kind: "migration_corridor",
      label: pickLocale(locale, "Migration corridor", "Коридор миграции"),
      read: pickLocale(locale, "Pressure relocating across belts.", "Давление переносится по поясам."),
      x: 15 + phase * 12,
      y: 42,
      w: 55,
      h: 6,
      intensity: clamp(latent.macroLiquidityBackdrop * 0.7 + derived.divergenceIndex * 0.3),
      pulsing: false,
    });
  }

  return out;
}

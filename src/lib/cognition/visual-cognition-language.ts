import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { LatentDrivers } from "@/lib/simulation/cognition-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

/** Compressed institutional reads — fast, sharp, no essays. */
export type VisualCognitionChip = Readonly<{
  id: string;
  label: string;
  tone: "neutral" | "stress" | "support" | "critical";
}>;

export function compressWords(text: string, maxWords = 6): string {
  const t = text.trim();
  if (!t) return t;
  const words = t.split(/\s+/);
  if (words.length <= maxWords) return t;
  return `${words.slice(0, maxWords).join(" ")}…`;
}

export function deriveInstantCognitionChips(
  locale: UiLocale,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
): readonly VisualCognitionChip[] {
  const chips: VisualCognitionChip[] = [];

  if (latent.liquidityStructuralStress >= 58) {
    chips.push({
      id: "participation",
      label:
        latent.liquidityStructuralStress >= 72
          ? pickLocale(locale, "Participation narrowing", "Участие сужается")
          : pickLocale(locale, "Depth thinning", "Глубина истончается"),
      tone: latent.liquidityStructuralStress >= 70 ? "stress" : "neutral",
    });
  }

  if (latent.volatilityImpulse >= 55 || derived.volTone === "expanding") {
    chips.push({
      id: "vol",
      label:
        derived.volTone === "expanding"
          ? pickLocale(locale, "Volatility expanding", "Волатильность расширяется")
          : pickLocale(locale, "Vol pressure rising", "Давление волы растёт"),
      tone: derived.volTone === "expanding" ? "stress" : "neutral",
    });
  }

  if (derived.divergenceIndex >= 48) {
    chips.push({
      id: "fragility",
      label:
        derived.divergenceIndex >= 58
          ? pickLocale(locale, "Fragility increasing", "Хрупкость растёт")
          : pickLocale(locale, "Alignment drifting", "Выравнивание дрейфует"),
      tone: derived.divergenceIndex >= 58 ? "critical" : "stress",
    });
  }

  if (latent.positioningPressure >= 62 && latent.positioningPressure < 78) {
    chips.push({
      id: "continuation",
      label: pickLocale(locale, "Continuation unstable", "Продолжение нестабильно"),
      tone: "stress",
    });
  } else if (latent.positioningPressure >= 78) {
    chips.push({
      id: "continuation-hot",
      label: pickLocale(locale, "Momentum overheated", "Импульс перегрет"),
      tone: "stress",
    });
  }

  if (latent.macroLiquidityBackdrop >= 68) {
    chips.push({
      id: "macro",
      label: pickLocale(locale, "Macro sensitivity elevated", "Макро-чувствительность выше"),
      tone: "neutral",
    });
  }

  if (latent.sentimentThermal >= 65) {
    chips.push({
      id: "sentiment",
      label: pickLocale(locale, "Narrative tension high", "Нарративное напряжение высоко"),
      tone: "stress",
    });
  }

  if (derived.consensus === "divergence_increasing") {
    chips.push({
      id: "consensus",
      label: pickLocale(locale, "Consensus fracturing", "Консенсус расходится"),
      tone: "critical",
    });
  }

  if (chips.length === 0) {
    chips.push({
      id: "stable",
      label: pickLocale(locale, "Structure balanced", "Структура сбалансирована"),
      tone: "support",
    });
  }

  return chips.slice(0, 5);
}

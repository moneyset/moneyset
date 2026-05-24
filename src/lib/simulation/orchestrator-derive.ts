import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { AgentLatticeRow, LatentDrivers } from "@/lib/simulation/cognition-types";
import type { UiLocale } from "@/store/ui-prefs-store";
import { localizeDriverLine, pickLocale } from "@/lib/i18n/cognition-dict";

export type OrchestratorBrief = Readonly<{
  headline: string;
  line: string;
  contradictions: string[];
  pressureNotes: string[];
}>;

function topContradictions(
  locale: UiLocale,
  rows: AgentLatticeRow[],
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
): string[] {
  const by = new Map(rows.map((r) => [r.role, r] as const));
  const risk = by.get("Risk");
  const flow = by.get("Flow");
  const macro = by.get("Macro");
  const liq = by.get("Liquidity");
  const sent = by.get("Sentiment");

  const out: string[] = [];

  if (risk && flow && derived.dangerBand !== "calm" && latent.positioningPressure >= 66) {
    out.push(
      pickLocale(locale, "Bids vs stress.", "Биды против стресса."),
    );
  }
  if (macro && flow && latent.macroLiquidityBackdrop >= 72 && derived.divergenceIndex >= 44) {
    out.push(pickLocale(locale, "Macro vs micro.", "Макро против микро."));
  }
  if (liq && sent && latent.liquidityStructuralStress >= 68 && latent.sentimentThermal >= 72) {
    out.push(pickLocale(locale, "Heat into thin depth.", "Жар в тонкую глубину."));
  }
  if (derived.phase === "liquidity_compression" && derived.volTone !== "compressing") {
    out.push(pickLocale(locale, "Vol up. Range tight.", "Вол выше. Диапазон узкий."));
  }

  return out.slice(0, 3);
}

function pressureNotesLines(locale: UiLocale, latent: LatentDrivers, derived: DerivedCognitionSnapshot): string[] {
  const keys: string[] = [];
  if (latent.liquidityStructuralStress >= 70) keys.push("Liquidity thinning");
  if (latent.positioningPressure >= 72) keys.push("Leverage extended");
  if (latent.volatilityImpulse >= 66) keys.push("Volatility impulse");
  if (latent.sentimentThermal >= 74) keys.push("Crowd overheating");
  if (derived.divergenceIndex >= 44) keys.push("Consensus weakening");
  if (latent.macroLiquidityBackdrop >= 72 && latent.macroLiquidityBackdrop > latent.positioningPressure + 10) {
    keys.push("Macro leading");
  }
  if (keys.length === 0) keys.push("Conditions stable");
  return keys.slice(0, 4).map((k) => localizeDriverLine(locale, k));
}

export function deriveOrchestratorBrief(args: {
  locale: UiLocale;
  latent: LatentDrivers;
  derived: DerivedCognitionSnapshot;
  agentRows: AgentLatticeRow[];
}): OrchestratorBrief {
  const { locale, latent, derived, agentRows } = args;

  const contradictions = topContradictions(locale, agentRows, latent, derived);
  const pressures = pressureNotesLines(locale, latent, derived);

  const headline = pickLocale(locale, "Summary", "Сводка");

  const line =
    derived.dangerBand === "critical" || derived.dangerBand === "dangerous"
      ? pickLocale(locale, "Risk first. Cut size.", "Риск в приоритете. Режать размер.")
      : latent.liquidityStructuralStress >= 66 && latent.positioningPressure >= 62
        ? pickLocale(
            locale,
            "Thin depth. Leverage up.",
            "Тонкая глубина. Плечо выше.",
          )
        : derived.consensus === "macro_dominance_rising"
          ? pickLocale(locale, "Macro leads. Reprice.", "Макро ведёт. Переценка.")
          : derived.consensus.includes("weakening") || derived.consensus.includes("divergence")
            ? pickLocale(locale, "Breadth uneven.", "Ширина неравномерна.")
            : pickLocale(locale, "Base intact. Monitor liq.", "База держится. Следить за ликв.");

  return {
    headline,
    line,
    contradictions,
    pressureNotes: pressures,
  };
}

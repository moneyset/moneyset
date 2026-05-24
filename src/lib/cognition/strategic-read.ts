import type { UiLocale } from "@/store/ui-prefs-store";
import type {
  AgentLatticeRow,
  CognitiveSnapshot,
  ConsensusEvolutionLabel,
  LatentDrivers,
  MainRiskKey,
  TopScenarioSurface,
} from "@/lib/simulation/cognition-types";
import type { DerivedCognitionSnapshot } from "@/lib/simulation/engine-evolve";
import type { ScenarioEngineCard } from "@/lib/simulation/scenario-engine";
import {
  mainRiskDisplay,
  phaseLabel,
  pickLocale,
  scenarioInvalidation,
  scenarioTitle,
} from "@/lib/i18n/cognition-dict";

export type StrategicPostureRead = Readonly<{
  /** Mirrors dominant posture headline — single anchor. */
  marketPosture: string;
  /** Dominant structural risk line (not a trade call). */
  primaryStructuralRisk: string;
  /** Weighted working path — probabilistic language. */
  favoredPath: string;
  favoredPathProbabilityPct: number;
  /** How to lean exposure management — defensive / measured / etc. */
  strategicBias: string;
  /** Open uncertainty about read stability. */
  confidenceHeadline: string;
  confidenceDetail: string;
  /** Observable basis for confidence state (structural, not narrative). */
  confidenceEvidence: readonly string[];
  /** From lead scenario card when available. */
  invalidation: string;
}>;

function leadScenarioCard(cards: readonly ScenarioEngineCard[], top: TopScenarioSurface): ScenarioEngineCard | null {
  return cards.find((c) => c.id === top.scenarioId) ?? cards[0] ?? null;
}

function structuralRiskLine(
  locale: UiLocale,
  mainRiskKey: MainRiskKey,
  dangerScore: number,
  top: TopScenarioSurface,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
): string {
  if (derived.dangerBand === "critical" || derived.dangerBand === "dangerous") {
    return pickLocale(
      locale,
      "Fast-move tape: liquidity and leverage can gap risk.",
      "Быстрый рынок: ликв и плечо раздвигают риск.",
    );
  }
  if (top.scenarioId === "Liquidity Sweep Before Continuation" && latent.liquidityStructuralStress >= 56) {
    return pickLocale(locale, "Sweep risk before clean continuation.", "Снос раньше чистого продолжения.");
  }
  if (top.scenarioId === "Structural Breakdown Risk") {
    return pickLocale(locale, "Breakdown path gaining weight vs continuation.", "Снос тяжелее базы.");
  }
  if (latent.liquidityStructuralStress >= 68) {
    return pickLocale(locale, "Liquidity thinning is the main pressure.", "Главное — ликв тоньше.");
  }
  if (latent.volatilityImpulse > 62 && latent.positioningPressure >= 58) {
    return pickLocale(
      locale,
      "Vol up into extended leverage; fragile follow-through.",
      "Вол высок на плече; продолжение хрупкое.",
    );
  }
  return mainRiskDisplay(locale, mainRiskKey, dangerScore).headline;
}

function strategicBiasLine(locale: UiLocale, derived: DerivedCognitionSnapshot, top: TopScenarioSurface): string {
  if (derived.dangerBand === "critical" || derived.dangerBand === "dangerous") {
    return pickLocale(locale, "Defense. Invalidation first.", "Сначала снятие тезиса.");
  }
  if (derived.dangerBand === "elevated") {
    return pickLocale(
      locale,
      "Measured. Size down on divergence.",
      "Сдержанно. Резать размер при разносе.",
    );
  }
  if (derived.consensusSpreadPct <= 48 || derived.divergenceIndex >= 46) {
    return pickLocale(locale, "Low conviction.", "Убеждённость низкая.");
  }
  if (top.scenarioId === "Volatility Compression") {
    return pickLocale(
      locale,
      "Balanced. Range unresolved.",
      "В балансе. Диапазон не снят.",
    );
  }
  return pickLocale(locale, "Continuation bias; honor invalidation.", "Уклон в базу; держать снятие тезиса.");
}

export function deriveConfidencePosture(
  locale: UiLocale,
  derived: DerivedCognitionSnapshot,
  history: readonly CognitiveSnapshot[],
): { headline: string; detail: string } {
  const tail = history.slice(-5);
  if (tail.length < 2) {
    return {
      headline: pickLocale(locale, "Low sample", "Мало данных"),
      detail: pickLocale(locale, "Archive thin.", "Мало снимков в архиве."),
    };
  }
  const d0 = tail[0]!.dangerScore;
  const d1 = tail[tail.length - 1]!.dangerScore;
  const div = derived.divergenceIndex;
  const spread = derived.consensusSpreadPct;

  if (div >= 52 && spread <= 50) {
    return {
      headline: pickLocale(locale, "Inputs conflict", "Вводные бьются"),
      detail: pickLocale(
        locale,
        "Divergence wide.",
        "Разнос широкий.",
      ),
    };
  }
  if (d1 - d0 >= 8) {
    return {
      headline: pickLocale(locale, "Stress up", "Стресс набирает"),
      detail: pickLocale(locale, "Band tightening.", "Полоса жёстче."),
    };
  }
  if (d0 - d1 >= 6) {
    return {
      headline: pickLocale(locale, "Stress easing", "Стресс сходит"),
      detail: pickLocale(locale, "Band loosening.", "Полоса мягче."),
    };
  }
  if (spread >= 72 && div <= 28) {
    return {
      headline: pickLocale(locale, "Structural alignment", "Структура ровная"),
      detail: pickLocale(locale, "Participation broad · split contained.", "Участие широкое · разнос в полосе."),
    };
  }
  if (derived.volTone === "compressing" && derived.dangerBand === "moderate") {
    return {
      headline: pickLocale(locale, "Compressed surface", "Вол в сжатии"),
      detail: pickLocale(locale, "Break pending.", "Пробой висит."),
    };
  }
  return {
    headline: pickLocale(locale, "Read provisional", "Срез условный"),
    detail: pickLocale(locale, "Await next pulse.", "Ждать следующий импульс."),
  };
}

export function deriveConfidenceEvidence(
  locale: UiLocale,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  history: readonly CognitiveSnapshot[],
): string[] {
  const out: string[] = [];
  const tail = history.slice(-5);
  if (tail.length < 2) {
    return [pickLocale(locale, "Archive < 5 snapshots.", "В архиве мало снимков.")];
  }
  const d0 = tail[0]!.dangerScore;
  const d1 = tail[tail.length - 1]!.dangerScore;
  if (derived.divergenceIndex >= 52 && derived.consensusSpreadPct <= 50) {
    out.push(
      pickLocale(
        locale,
        "Divergence wide · breadth thin.",
        "Разнос широкий · ширина тонкая.",
      ),
    );
  }
  if (d1 - d0 >= 8) {
    out.push(
      pickLocale(
        locale,
        "Stress ramp (window).",
        "Набор стресса (окно).",
      ),
    );
  }
  if (derived.consensusSpreadPct <= 48 && derived.divergenceIndex >= 44) {
    out.push(pickLocale(locale, "Participation diverging.", "Участие разъезжается."));
  }
  if (latent.liquidityStructuralStress >= 60 && out.length < 3) {
    out.push(
      pickLocale(
        locale,
        "Liquidity stress (structural).",
        "Стресс ликвидности (структура).",
      ),
    );
  }
  if (out.length === 0) {
    out.push(
      pickLocale(locale, "No dominant cross-input conflict.", "Явного конфликта вводных нет."),
    );
  }
  return out.slice(0, 3);
}

export function deriveConsensusDrivers(
  locale: UiLocale,
  consensus: ConsensusEvolutionLabel,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  rows: readonly AgentLatticeRow[],
): string[] {
  const out: string[] = [];
  const agree = Math.round(derived.consensusSpreadPct);
  const div = Math.round(derived.divergenceIndex);
  const flow = rows.find((r) => r.role === "Flow");
  const risk = rows.find((r) => r.role === "Risk");

  // CONSENSUS-only: alignment/divergence statements. No vol/liq/regime narration here.
  out.push(pickLocale(locale, "Breadth read set.", "Ширина зафиксирована."));

  const pushBreadth = () => {
    if (agree <= 58) {
      out.push(
        pickLocale(
          locale,
          `Breadth thin.`,
          `Ширина тонкая.`,
        ),
      );
    }
  };

  switch (consensus) {
    case "consensus_weakening":
      pushBreadth();
      if (latent.positioningPressure >= 56) {
        out.push(
          pickLocale(
            locale,
            "Cohesion weakening.",
            "Связность слабеет.",
          ),
        );
      }
      if (flow && flow.confidencePct <= 48) {
        out.push(
          pickLocale(
            locale,
            "Confirmation thins.",
            "Принятие тоньше.",
          ),
        );
      }
      if (div >= 38 && out.length < 6) {
        out.push(pickLocale(locale, "Divergence widening.", "Разнос шире."));
      }
      break;
    case "consensus_strengthening":
      if (agree >= 68) {
        out.push(
          pickLocale(
            locale,
            "Alignment improving.",
            "Сборка крепнет.",
          ),
        );
      }
      if (div <= 30) {
        out.push(pickLocale(locale, "Divergence contained.", "Разнос в полосе."));
      }
      if (latent.positioningPressure <= 52 && out.length < 6) {
        out.push(pickLocale(locale, "Coherence stable.", "Связность держится."));
      }
      break;
    case "divergence_increasing":
      out.push(pickLocale(locale, "Structural split widening.", "Разнос нарастает."));
      pushBreadth();
      if (risk && risk.confidencePct >= 52) {
        out.push(
          pickLocale(
            locale,
            "Cross-check conflict.",
            "Сверка бьётся.",
          ),
        );
      }
      break;
    case "risk_layer_escalating":
      out.push(pickLocale(locale, "Risk lens dominating.", "Риск ведёт кадр."));
      break;
    case "macro_dominance_rising":
      out.push(pickLocale(locale, "Macro lens dominating.", "Макро ведёт кадр."));
      pushBreadth();
      break;
    default:
      break;
  }

  if (out.length === 1) {
    out.push(pickLocale(locale, "Consensus tag from latent vs tape reconcile.", "Сверка латент/лента."));
  }
  return out.slice(0, 5);
}

export function deriveMainRiskCausal(
  locale: UiLocale,
  key: MainRiskKey,
  latent: LatentDrivers,
  derived: DerivedCognitionSnapshot,
  history: readonly CognitiveSnapshot[],
): string[] {
  const out: string[] = [];
  const prev = history.length >= 2 ? history.at(-2)! : null;
  const stressDelta =
    prev && Number.isFinite(prev.dangerScore)
      ? Math.round(derived.dangerScore) - Math.round(prev.dangerScore)
      : 0;

  if (key === "forced_move") {
    if (Math.abs(stressDelta) >= 4) {
      out.push(
        pickLocale(
          locale,
          `Stress ${Math.round(derived.dangerScore)} (${stressDelta >= 0 ? "+" : ""}${stressDelta} vs prior window).`,
          `Стресс ${Math.round(derived.dangerScore)} (${stressDelta >= 0 ? "+" : ""}${stressDelta} к пред. окну).`,
        ),
      );
    }
    if (latent.liquidityStructuralStress >= 58) {
      out.push(
        pickLocale(
          locale,
          `Liquidity structural stress ${Math.round(latent.liquidityStructuralStress)}.`,
          `Стресс ликв ${Math.round(latent.liquidityStructuralStress)}.`,
        ),
      );
    }
  }
  if (key === "reversal_vol") {
    out.push(
      pickLocale(
        locale,
        `Vol impulse ${Math.round(latent.volatilityImpulse)} vs participation thermal ${Math.round(latent.sentimentThermal)}.`,
        `Вол ${Math.round(latent.volatilityImpulse)} · участие ${Math.round(latent.sentimentThermal)}.`,
      ),
    );
  }
  if (key === "reversal_fade") {
    out.push(
      pickLocale(
        locale,
        `Positioning pressure ${Math.round(latent.positioningPressure)} — momentum fade structure.`,
        `Позиции ${Math.round(latent.positioningPressure)} — импульс выдыхается.`,
      ),
    );
  }
  if (out.length === 0) {
    out.push(pickLocale(locale, "Risk key from latent vs tape reconciliation.", "Ключ риска из сверки вводных."));
  }
  return out.slice(0, 3);
}

export function deriveStressCausalNotes(
  locale: UiLocale,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  history: readonly CognitiveSnapshot[],
): string[] {
  const out: string[] = [];
  const prev = history.length >= 2 ? history.at(-2)! : null;
  if (prev && derived.dangerScore - prev.dangerScore >= 5) {
    out.push(
      pickLocale(
        locale,
        "Stress ramp (window).",
        "Набор стресса (окно).",
      ),
    );
  }
  if (derived.volTone === "expanding") {
    out.push(pickLocale(locale, "Vol tone: expanding.", "Вол разжимается."));
  }
  if (latent.liquidityStructuralStress >= 58) {
    out.push(
      pickLocale(
        locale,
        "Liquidity stress (structural).",
        "Стресс ликвидности (структура).",
      ),
    );
  }
  if (derived.consensusSpreadPct <= 52 && out.length < 4) {
    out.push(
      pickLocale(
        locale,
        "Participation breadth thin.",
        "Ширина участия тонкая.",
      ),
    );
  }
  if (out.length === 0) {
    out.push(pickLocale(locale, "No fresh trigger — band from persistence.", "Триггера нет — полоса от инерции."));
  }
  return out.slice(0, 4);
}

export function deriveStrategicPosture(args: {
  locale: UiLocale;
  dominantHeadline: string;
  mainRisk: { riskKey: MainRiskKey; dangerScore: number };
  topScenario: TopScenarioSurface;
  scenarioCards: readonly ScenarioEngineCard[];
  derived: DerivedCognitionSnapshot;
  latent: LatentDrivers;
  history: readonly CognitiveSnapshot[];
}): StrategicPostureRead {
  const { locale, dominantHeadline, mainRisk, topScenario, scenarioCards, derived, latent, history } = args;
  const lead = leadScenarioCard(scenarioCards, topScenario);
  const inv = lead
    ? scenarioInvalidation(locale, lead.id, derived.phase, derived.volTone)
    : pickLocale(locale, "Set invalidation when the lead path is loaded.", "Снятие тезиса — после загрузки базы.");
  const conf = deriveConfidencePosture(locale, derived, history);
  const confEv = deriveConfidenceEvidence(locale, derived, latent, history);

  return {
    marketPosture: dominantHeadline,
    primaryStructuralRisk: structuralRiskLine(locale, mainRisk.riskKey, mainRisk.dangerScore, topScenario, latent, derived),
    favoredPath: scenarioTitle(locale, topScenario.scenarioId),
    favoredPathProbabilityPct: topScenario.probabilityPct,
    strategicBias: strategicBiasLine(locale, derived, topScenario),
    confidenceHeadline: conf.headline,
    confidenceDetail: conf.detail,
    confidenceEvidence: confEv,
    invalidation: inv,
  };
}

/** Short causal bullets — consensus side (operational log / explain strip). */
export function deriveConsensusWhy(
  locale: UiLocale,
  derived: DerivedCognitionSnapshot,
  latent: LatentDrivers,
  rows: readonly AgentLatticeRow[],
): string[] {
  const out: string[] = [];
  const flow = rows.find((r) => r.role === "Flow");
  const risk = rows.find((r) => r.role === "Risk");

  if (latent.positioningPressure >= 62) {
    out.push(pickLocale(locale, "Leverage high — flow fragile.", "Плечо высоко — поток хрупкий."));
  } else if (flow && flow.confidencePct <= 46) {
    out.push(pickLocale(locale, "Flow unconfirmed.", "Поток без подтверждения."));
  }

  if (risk && risk.confidencePct >= 58 && derived.dangerBand !== "calm") {
    out.push(pickLocale(locale, "Risk overrides trend.", "Риск важнее тренда."));
  }

  if (latent.liquidityStructuralStress >= 60) {
    out.push(pickLocale(locale, "Liquidity stress — gap risk.", "Ликв тонкая — хвост."));
  }

  if (derived.divergenceIndex >= 42) {
    out.push(
      pickLocale(
        locale,
        "Structural split · coherence down.",
        "Структура рвётся · связность ниже.",
      ),
    );
  }

  if (out.length === 0) {
    out.push(pickLocale(locale, "Balanced observables — next stress/liq tick.", "Вводные ровные — ждать стресс/ликв."));
  }
  return out.slice(0, 4);
}

/** Short causal bullets — danger side (operational log / explain strip). */
export function deriveDangerWhy(locale: UiLocale, derived: DerivedCognitionSnapshot, latent: LatentDrivers): string[] {
  const out: string[] = [];
  if (derived.volTone === "compressing") out.push(pickLocale(locale, "Vol compressing — range break risk.", "Вол сжат — риск выхода из бока."));
  if (derived.volTone === "expanding") out.push(pickLocale(locale, "Vol expanding — wider invalidation bands.", "Вол шире — полоса снятия шире."));
  if (latent.liquidityStructuralStress >= 58) out.push(pickLocale(locale, "Liquidity below typical depth.", "Ликв ниже нормы."));
  if (latent.positioningPressure >= 64) {
    out.push(pickLocale(locale, "Leverage high — unwind if no acceptance.", "Плечо высоко — разжим без принятия."));
  }
  const spread = derived.consensusSpreadPct;
  if (spread <= 52) out.push(pickLocale(locale, "Breadth thin.", "Ширина тонкая."));
  if (out.length === 0) out.push(pickLocale(locale, "Stress flat — no new trigger.", "Стресс ровный — без нового крючка."));
  return out.slice(0, 4);
}

// formatPctInt removed: avoid synthetic precision in UI copy.

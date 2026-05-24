import type { CognitiveSnapshot, OperationalLogEntry } from "@/lib/simulation/cognition-types";
import { pickLocale, consensusLabel, phaseLabel } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

/** Timeline: material structure / risk / flow — not orchestrator chatter or bootstrap. */
export function selectStructuralTimelineEntries(
  entries: readonly OperationalLogEntry[],
  max = 14,
): OperationalLogEntry[] {
  const out: OperationalLogEntry[] = [];
  for (const e of entries) {
    if (e.message?.kind === "bootstrap") continue;
    if (e.entryType === "ORCHESTRATOR") continue;
    if (e.priority === "informational") {
      const t = e.entryType;
      if (t !== "REGIME" && t !== "VOLATILITY" && t !== "RISK" && t !== "LIQUIDITY" && t !== "FLOW") continue;
    }
    out.push(e);
    if (out.length >= max) break;
  }
  return out;
}

export function selectCatalystEntries(
  entries: readonly OperationalLogEntry[],
  max = 6,
): OperationalLogEntry[] {
  const out: OperationalLogEntry[] = [];
  for (const e of entries) {
    if (out.length >= max) break;
    if (e.entryType === "MACRO" || e.entryType === "SCENARIO") {
      out.push(e);
      continue;
    }
    if (e.message?.kind === "macro_shift" || e.message?.kind === "scenario_rebalance") {
      out.push(e);
    }
  }
  return out;
}

function slopeSimple(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const a = values[0]!;
  const b = values[values.length - 1]!;
  return (b - a) / Math.max(1, values.length - 1);
}

/** Spatial pressure drift from recent cognition history window. */
export function derivePressureMigrationLines(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
): string[] {
  if (history.length < 4) {
    return [
      pickLocale(
        locale,
        "Pressure migration: awaiting deeper structural window.",
        "Миграция давления: ждём окно структуры.",
      ),
    ];
  }
  const slice = history.slice(-14);
  const liq = slice.map((h) => h.liquidityStructuralStress);
  const lev = slice.map((h) => h.positioningPressure);
  const div = slice.map((h) => h.divergenceIndex);
  const sl = slopeSimple(liq);
  const sp = slopeSimple(lev);
  const sd = slopeSimple(div);
  const lines: string[] = [];
  if (sl > 0.55) {
    lines.push(
      pickLocale(locale, "Liquidity stress migrating higher in window.", "Стресс ликвидности ползёт вверх в окне."),
    );
  } else if (sl < -0.55) {
    lines.push(
      pickLocale(locale, "Liquidity stress easing through the window.", "Стресс ликвидности сходит в окне."),
    );
  }
  if (sp > 0.6) {
    lines.push(
      pickLocale(
        locale,
        "Leverage / participation pressure building toward extension.",
        "Давление плеча / участия к наращиванию.",
      ),
    );
  } else if (sp < -0.55) {
    lines.push(
      pickLocale(
        locale,
        "Participation pressure cooling from recent highs.",
        "Давление участия остывает от локальных максимумов.",
      ),
    );
  }
  if (sd > 0.35) {
    lines.push(
      pickLocale(
        locale,
        "Sponsorship coherence splitting — pressure redistributes across views.",
        "Сборка расходится — давление перераспределяется.",
      ),
    );
  } else if (sd < -0.35) {
    lines.push(
      pickLocale(locale, "Divergence compressing — sponsorship stabilizing.", "Расхождение сжимается — спонсорство стабилизируется."),
    );
  }
  if (lines.length === 0) {
    lines.push(
      pickLocale(
        locale,
        "Pressure migration quiet — no material spatial handoff in window.",
        "Миграция давления спокойна — существенной передачи нет.",
      ),
    );
  }
  return lines.slice(0, 3);
}

export function deriveParticipationEvolutionLines(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
  currentConsensus: CognitiveSnapshot["consensus"],
): string[] {
  if (history.length < 2) {
    return [pickLocale(locale, "Participation evolution warming…", "Эволюция участия копится…")];
  }
  const older = history[Math.max(0, history.length - 10)] ?? history[0]!;
  const lines: string[] = [];
  if (older.consensus !== currentConsensus) {
    lines.push(
      pickLocale(
        locale,
        `Consensus posture shifted: ${consensusLabel(locale, older.consensus)} → ${consensusLabel(locale, currentConsensus)}.`,
        `Сборка сменилась: ${consensusLabel(locale, older.consensus)} → ${consensusLabel(locale, currentConsensus)}.`,
      ),
    );
  }
  const spread = history.slice(-8).map((h) => h.consensusSpreadPct);
  const ds = slopeSimple(spread);
  if (ds > 0.4) {
    lines.push(
      pickLocale(
        locale,
        "Participation breadth implied wider — spread building with price context.",
        "Ширина участия расширяется — спред растёт в контексте цены.",
      ),
    );
  } else if (ds < -0.4) {
    lines.push(
      pickLocale(
        locale,
        "Participation narrowing — continuation more selective.",
        "Участие сужается — продолжение избирательнее.",
      ),
    );
  }
  const div = history.slice(-8).map((h) => h.divergenceIndex);
  const dv = slopeSimple(div);
  if (dv > 0.45) {
    lines.push(
      pickLocale(locale, "Directional crowding risk rising with divergence.", "Риск направленного скопления растёт с разносом."),
    );
  }
  if (lines.length === 0) {
    lines.push(
      pickLocale(locale, "Participation quality stable vs recent window.", "Качество участия стабильно к недавнему окну."),
    );
  }
  return lines.slice(0, 3);
}

export function deriveRegimeShiftLine(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
  currentPhase: CognitiveSnapshot["phase"],
): string {
  if (history.length < 2) {
    return pickLocale(locale, "Regime shift detection warming…", "Детекция режима копится…");
  }
  const anchor = history[Math.max(0, history.length - 12)] ?? history[0]!;
  if (anchor.phase === currentPhase) {
    return pickLocale(
      locale,
      `Structural regime holding: ${phaseLabel(locale, currentPhase)}.`,
      `Режим держится: ${phaseLabel(locale, currentPhase)}.`,
    );
  }
  return pickLocale(
    locale,
    `Regime transition detected: ${phaseLabel(locale, anchor.phase)} → ${phaseLabel(locale, currentPhase)}.`,
    `Смена режима: ${phaseLabel(locale, anchor.phase)} → ${phaseLabel(locale, currentPhase)}.`,
  );
}

export function catalystFallbackLine(locale: UiLocale): string {
  return pickLocale(
    locale,
    "No listed catalyst impact in the current window — macro and scenario layers quiet.",
    "В окне нет заявленного катализа — макро и сценарии спокойны.",
  );
}

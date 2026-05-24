/**
 * Operational log localization — terse timeline lines (trigger · implication · read).
 */

import type { UiLocale } from "@/store/ui-prefs-store";
import type {
  ConsensusEvolutionLabel,
  OperationalLogEntry,
  OpLogMessage,
} from "@/lib/simulation/cognition-types";
import {
  consensusLabel,
  dangerBandLabel,
  phaseLabel,
  pickLocale,
  scenarioTitle,
} from "@/lib/i18n/cognition-dict";

function compactConsensus(locale: UiLocale, c: ConsensusEvolutionLabel): string {
  const row: Record<ConsensusEvolutionLabel, { en: string; ru: string }> = {
    consensus_strengthening: { en: "Breadth up · alignment", ru: "Участие шире · сборка" },
    consensus_weakening: { en: "Breadth down", ru: "Участие сужается" },
    divergence_increasing: { en: "Vol · liq · participation split ↑", ru: "Разнос по слоям ↑" },
    risk_layer_escalating: { en: "Risk path dominant", ru: "Риск ведёт кадр" },
    macro_dominance_rising: { en: "Macro leads tape", ru: "Макро ведёт ленту" },
  };
  const x = row[c];
  return pickLocale(locale, x.en, x.ru);
}

function volToneWord(locale: UiLocale, t: string): string {
  if (t === "compressing") return pickLocale(locale, "compressing", "сжатие");
  if (t === "expanding") return pickLocale(locale, "expanding", "расширение");
  return pickLocale(locale, "steady", "ровно");
}

function formatMessage(
  locale: UiLocale,
  m: OpLogMessage,
): { headline: string; summary: string; whyMatters?: string; agingNote?: string } {
  switch (m.kind) {
    case "regime_phase": {
      const fromL = phaseLabel(locale, m.from);
      const toL = phaseLabel(locale, m.to);
      return {
        headline: pickLocale(locale, "Regime shift", "Сдвиг режима"),
        summary: `${fromL} → ${toL}`,
        whyMatters: pickLocale(locale, "Base continuation/reversal framing resets.", "Кадр продолжения/разворота сброшен."),
      };
    }
    case "consensus": {
      return {
        headline: consensusLabel(locale, m.consensus),
        summary: compactConsensus(locale, m.consensus),
        whyMatters: pickLocale(
          locale,
          "Thin breadth · invalidation wider if vol expands.",
          "Узкая ширина · при разгоне вола шире снятие тезиса.",
        ),
      };
    }
    case "danger_shift": {
      const prevL = dangerBandLabel(locale, m.prev);
      const nextL = dangerBandLabel(locale, m.next);
      const critical = m.next === "critical";
      const easing = m.next === "calm" || m.next === "moderate";
      return {
        headline: critical
          ? pickLocale(locale, "Stress · CRITICAL", "Стресс · КРИТ")
          : pickLocale(locale, "Stress band shift", "Сдвиг полосы стресса"),
        summary: pickLocale(locale, `${prevL} → ${nextL}`, `${prevL} → ${nextL}`),
        whyMatters: critical
          ? pickLocale(locale, "Cut risk · wait structure.", "Резать риск · ждать структуру.")
          : pickLocale(
              locale,
              easing ? "Fragility easing." : "Fragility building · tighten invalidations.",
              easing ? "Хрупкость сходит." : "Хрупкость растёт · ужать снятие тезиса.",
            ),
        agingNote: m.agingFading
          ? pickLocale(locale, "Prior spike fading.", "Пик отрабатывает.")
          : undefined,
      };
    }
    case "vol_tone": {
      const t = m.tone;
      const p = m.prev;
      return {
        headline:
          t === "compressing"
            ? pickLocale(locale, "Vol compressing", "Вол ↓")
            : t === "expanding"
              ? pickLocale(locale, "Vol expanding", "Вол ↑")
              : pickLocale(locale, "Vol steady", "Вол ровно"),
        summary:
          t === "compressing"
            ? pickLocale(
                locale,
                `Coil vs ${p} · breakout risk.`,
                `Сжатие к ${volToneWord(locale, p)} · риск выхода.`,
              )
            : t === "expanding"
              ? pickLocale(locale, `Impulse vs ${p} · widen stops context.`, `Импульс к ${volToneWord(locale, p)} · стоп‑контекст шире.`)
              : pickLocale(locale, `Flat vs ${p}.`, `Без сдвига к ${volToneWord(locale, p)}.`),
        whyMatters: pickLocale(locale, "Read invalidation pace shifts.", "Меняется скорость снятия тезиса."),
      };
    }
    case "liquidity_shock":
      return {
        headline: pickLocale(locale, "Liq stress jump", "Скачок ликв"),
        summary: pickLocale(locale, "Depth ↓ · sweep exposure ↑.", "Глубина ↓ · снос дорожает."),
        whyMatters: pickLocale(locale, "Same flow · larger prints.", "Тот же поток · крупнее ход."),
      };
    case "flow_extension":
      return {
        headline: pickLocale(locale, "Flow stretched", "Поток растянут"),
        summary: pickLocale(locale, "Price vs participation · carry risk.", "Цена vs участие · кэрри под вопросом."),
        whyMatters: pickLocale(locale, "Failed acceptance · fast mean risk.", "Нет принятия — риск быстрого отката."),
      };
    case "macro_shift":
      return {
        headline: pickLocale(locale, "Macro leads", "Макро ведёт"),
        summary: pickLocale(locale, "Macro impulse.", "Макро‑импульс."),
        whyMatters: pickLocale(locale, "Reprice scenarios.", "Пересчитать сценарии."),
      };
    case "scenario_rebalance": {
      const title = scenarioTitle(locale, m.scenarioId);
      return {
        headline: pickLocale(locale, "Scenario reweight", "Перевес"),
        summary: pickLocale(locale, `${title}`, `${title}`),
        whyMatters: pickLocale(locale, "Update invalidation.", "Обновить снятие тезиса."),
      };
    }
    case "orchestrator_weights": {
      const pl = phaseLabel(locale, m.phase);
      return {
        headline: pickLocale(locale, "Layer weights", "Веса слоёв"),
        summary: pickLocale(locale, `Sync · ${pl}`, `Синх · ${pl}`),
        whyMatters: pickLocale(locale, "Attention order only.", "Только порядок внимания."),
      };
    }
    case "sentiment_overheat":
      return {
        headline: pickLocale(locale, "Crowd heat ↑", "Толпа греется"),
        summary: pickLocale(locale, "Positioning warm · needs fresh acceptance.", "Позиции горячие · нужен новый приём."),
        whyMatters: pickLocale(locale, "Reversals often liquidity-led.", "Развороты часто через ликв."),
      };
    case "bootstrap":
      return {
        headline: pickLocale(locale, "Log live", "Лог активен"),
        summary: pickLocale(locale, "Events on material layer moves only.", "Только сдвиги по слоям."),
        whyMatters: pickLocale(locale, "Silence normal.", "Тишина — норма."),
      };
    case "mkt_vol": {
      const b = m.band;
      const bandEn = b === "compressing" ? "compressing" : b === "expanding" ? "expanding" : "neutral";
      const bandRu = b === "compressing" ? "сжатие" : b === "expanding" ? "расширение" : "нейтр.";
      return {
        headline: pickLocale(locale, "Realized vol band", "Реализ. вол"),
        summary: pickLocale(locale, `Tape: ${bandEn}.`, `Лента: ${bandRu}.`),
        whyMatters: pickLocale(locale, "Tape vol vs model tone.", "Вол ленты к тону модели."),
      };
    }
    case "mkt_momentum": {
      const b = m.band;
      const bEn = b === "pos" ? "+" : b === "neg" ? "−" : "0";
      const bRu = b === "pos" ? "+" : b === "neg" ? "−" : "0";
      return {
        headline: pickLocale(locale, "Participation shift", "Сдвиг участия"),
        summary: pickLocale(locale, `Momentum ${bEn} · continuation quality.`, `Импульс ${bRu} · качество продолжения.`),
      };
    }
    case "mkt_funding":
      return {
        headline: pickLocale(locale, "Funding step", "Шаг фандинга"),
        summary: pickLocale(locale, "Carry repriced · skew risk.", "Кэрри переценен · перекос."),
      };
    case "mkt_dislocation":
      return {
        headline: pickLocale(locale, "Book-flow gap", "Зазор книга/поток"),
        summary: pickLocale(locale, "Mismatch ↑ · widen invalidation.", "Расхождение ↑ · шире инвалидация."),
      };
    case "ai_orchestrator":
      return {
        headline: m.headline,
        summary: m.summary,
        whyMatters: m.whyMatters,
      };
    default:
      return { headline: "", summary: "" };
  }
}

export type LocalizedOperationalEntry = Pick<
  OperationalLogEntry,
  "id" | "simTick" | "simulatedClockLabel" | "entryType" | "priority"
> & {
  headline: string;
  summary: string;
  whyMatters?: string;
  agingNote?: string;
};

export function localizeOperationalLogEntry(locale: UiLocale, entry: OperationalLogEntry): LocalizedOperationalEntry {
  if (entry.message) {
    const loc = formatMessage(locale, entry.message);
    return {
      id: entry.id,
      simTick: entry.simTick,
      simulatedClockLabel: entry.simulatedClockLabel,
      entryType: entry.entryType,
      priority: entry.priority,
      headline: loc.headline,
      summary: loc.summary,
      whyMatters: loc.whyMatters,
      agingNote: loc.agingNote ?? entry.agingNote,
    };
  }
  return {
    id: entry.id,
    simTick: entry.simTick,
    simulatedClockLabel: entry.simulatedClockLabel,
    entryType: entry.entryType,
    priority: entry.priority,
    headline: entry.headline,
    summary: entry.summary,
    whyMatters: entry.whyMatters,
    agingNote: entry.agingNote,
  };
}

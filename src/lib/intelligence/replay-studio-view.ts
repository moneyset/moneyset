import { pickLocale, scenarioTitle } from "@/lib/i18n/cognition-dict";
import type { AgentHistoryPoint, CognitiveSnapshot, TopScenarioWireId } from "@/lib/simulation/cognition-types";
import type { UiLocale } from "@/store/ui-prefs-store";

export type ReplayTrailPoint = Readonly<{ t: number; v: number }>;

export type ReplayMoment = Readonly<{
  clock: string;
  headline: string;
  structuralRead: string;
  /** How execution behavior should have adapted. */
  adaptation: string;
}>;

export type ReplayLayerBundle = Readonly<{
  title: string;
  synopsis: string;
  moments: readonly ReplayMoment[];
  trail: readonly ReplayTrailPoint[];
  closingQuestion: string;
}>;

export type ReplayStudioBundle = Readonly<{
  structural: ReplayLayerBundle;
  execution: ReplayLayerBundle;
  scenario: ReplayLayerBundle;
  session: ReplayLayerBundle;
  pressure: ReplayLayerBundle;
  conviction: ReplayLayerBundle;
}>;

function hourFromClock(clock: string): number {
  const h = Number.parseInt(clock.slice(0, 2), 10);
  return Number.isFinite(h) ? h % 24 : 12;
}

type SessionBucket = "asia" | "london" | "overlap" | "ny" | "drift";

function sessionFromHour(h: number): SessionBucket {
  if (h >= 0 && h < 7) return "asia";
  if (h >= 7 && h < 13) return "london";
  if (h >= 13 && h < 16) return "overlap";
  if (h >= 16 && h < 22) return "ny";
  return "drift";
}

function sessionLabel(locale: UiLocale, b: SessionBucket): string {
  switch (b) {
    case "asia":
      return pickLocale(locale, "Asia", "Азия");
    case "london":
      return pickLocale(locale, "London", "Лондон");
    case "overlap":
      return pickLocale(locale, "Overlap", "Перекрытие");
    case "ny":
      return pickLocale(locale, "NY", "NY");
    default:
      return pickLocale(locale, "Drift", "Дрейф");
  }
}

function normTrail(values: readonly number[]): readonly ReplayTrailPoint[] {
  if (values.length === 0) return [];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(1e-6, hi - lo);
  return values.map((v, i) => ({ t: i, v: (v - lo) / span }));
}

function pushMoment(
  out: ReplayMoment[],
  cap: number,
  clock: string,
  headline: string,
  structuralRead: string,
  adaptation: string,
) {
  if (out.length >= cap) return;
  out.push({ clock, headline, structuralRead, adaptation });
}

export function deriveReplayStudioBundle(
  locale: UiLocale,
  history: readonly CognitiveSnapshot[],
  agentHistory: readonly AgentHistoryPoint[],
  topScenarioId: TopScenarioWireId,
): ReplayStudioBundle {
  const cap = 7;
  const structural: ReplayMoment[] = [];
  const execution: ReplayMoment[] = [];
  const scenario: ReplayMoment[] = [];
  const session: ReplayMoment[] = [];
  const pressure: ReplayMoment[] = [];
  const conviction: ReplayMoment[] = [];

  for (let i = 1; i < history.length; i++) {
    const p = history[i - 1]!;
    const c = history[i]!;

    if (p.phase !== c.phase) {
      pushMoment(
        structural,
        cap,
        c.simulatedClockLabel,
        pickLocale(locale, "Regime phase migration", "Миграция фазы режима"),
        pickLocale(
          locale,
          `Structural state shifted across the lattice window (${p.phase} → ${c.phase}).`,
          `Состояние структуры сместилось в окне решётки (${p.phase} → ${c.phase}).`,
        ),
        pickLocale(
          locale,
          "Execution should re-anchor zones and sponsorship tests to the new phase envelope.",
          "Исполнение: заново привязать зоны и проверки спонсорства к конверту новой фазы.",
        ),
      );
    }

    if (p.dangerBand !== c.dangerBand) {
      pushMoment(
        structural,
        cap,
        c.simulatedClockLabel,
        pickLocale(locale, "Stress band transition", "Переход полосы стресса"),
        pickLocale(
          locale,
          `Risk geometry repriced: ${p.dangerBand} → ${c.dangerBand}.`,
          `Геометрия риска переоценена: ${p.dangerBand} → ${c.dangerBand}.`,
        ),
        pickLocale(
          locale,
          "Tighten invalidation discipline; treat continuation as provisional until band stabilizes.",
          "Ужать дисциплину снятия; продолжение условно, пока полоса не стабилизируется.",
        ),
      );
      pushMoment(
        execution,
        cap,
        c.simulatedClockLabel,
        pickLocale(locale, "Execution posture stress shift", "Сдвиг стресса позы исполнения"),
        pickLocale(
          locale,
          "Invalidation and objective geometry become primary — aggression scales down automatically.",
          "Первичны геометрия снятия и цели — агрессия масштабируется вниз автоматически.",
        ),
        pickLocale(
          locale,
          "Reduce breakout chase; favor acceptance proofs and staged size.",
          "Меньше погони за пробоем; доказательства принятия и поэтапный размер.",
        ),
      );
    }

    if (p.consensus !== c.consensus) {
      pushMoment(
        structural,
        cap,
        c.simulatedClockLabel,
        pickLocale(locale, "Consensus evolution", "Эволюция консенсуса"),
        pickLocale(
          locale,
          `Lattice consensus label migrated (${p.consensus} → ${c.consensus}).`,
          `Метка консенсуса решётки сменилась (${p.consensus} → ${c.consensus}).`,
        ),
        pickLocale(
          locale,
          "Scenario weighting and flow leadership assumptions require refresh.",
          "Пересмотреть веса сценариев и допущения ведения потока.",
        ),
      );
    }

    const vPrev = p.volatilityImpulse;
    const vCur = c.volatilityImpulse;
    if (vPrev <= 46 && vCur >= 58) {
      pushMoment(
        structural,
        cap,
        c.simulatedClockLabel,
        pickLocale(locale, "Compression → expansion handoff", "Передача сжатие → расширение"),
        pickLocale(
          locale,
          "Volatility impulse crossed the expansion threshold — continuation quality now volatility-gated.",
          "Импульс волатильности пересёк порог расширения — качество продолжения теперь зависит от волы.",
        ),
        pickLocale(
          locale,
          "Widen execution bands; prioritize fill quality over pinpoint entries.",
          "Расширить полосы исполнения; приоритет исполнения, не точечного входа.",
        ),
      );
    }
    if (vPrev >= 58 && vCur <= 44) {
      pushMoment(
        structural,
        cap,
        c.simulatedClockLabel,
        pickLocale(locale, "Expansion → compression", "Расширение → сжатие"),
        pickLocale(
          locale,
          "Impulse cooled — structure favors mean-revert probes only with reclaim sponsorship.",
          "Импульс остыл — структура для возвратов к среднему только со спонсорством откупа.",
        ),
        pickLocale(
          locale,
          "Lower breakout aggression until compression resolves with flow confirmation.",
          "Снизить агрессию пробоя, пока сжатие не разрешится подтверждением потока.",
        ),
      );
    }

    if (c.positioningPressure >= 68 && p.positioningPressure < 58 && c.liquidityStructuralStress >= 58) {
      pushMoment(
        structural,
        cap,
        c.simulatedClockLabel,
        pickLocale(locale, "Continuation deterioration risk", "Риск ухудшения продолжения"),
        pickLocale(
          locale,
          "Participation heat rose into thin liquidity backdrop — fragile extension geometry.",
          "Жар участия вырос на фоне тонкой ликвидности — хрупкая геометрия продления.",
        ),
        pickLocale(
          locale,
          "Treat trend adds as conditional; tighten invalidation on new exposure.",
          "Добавления к тренду условны; ужать инвалидацию на новый экспозур.",
        ),
      );
    }

    if (Math.abs(c.leadScenarioProb - p.leadScenarioProb) >= 12) {
      pushMoment(
        scenario,
        cap,
        c.simulatedClockLabel,
        pickLocale(locale, "Primary path weight migration", "Миграция веса базового пути"),
        pickLocale(
          locale,
          "Lead scenario probability shifted materially — path deck leadership rotated.",
          "Вероятность ведущего сценария заметно сдвинулась — сменилось ведение колоды путей.",
        ),
        pickLocale(
          locale,
          "Re-evaluate tail hedges and secondary path sponsorship before scaling conviction.",
          "Переоценить хвост и спонсорство вторичных путей до масштабирования убеждённости.",
        ),
      );
    }

    const sb = sessionFromHour(hourFromClock(p.simulatedClockLabel));
    const sc = sessionFromHour(hourFromClock(c.simulatedClockLabel));
    if (sb !== sc) {
      pushMoment(
        session,
        cap,
        c.simulatedClockLabel,
        pickLocale(locale, "Session handoff", "Передача сессии"),
        pickLocale(
          locale,
          `Desk environment migrated (${sessionLabel(locale, sb)} → ${sessionLabel(locale, sc)}).`,
          `Среда стола сменилась (${sessionLabel(locale, sb)} → ${sessionLabel(locale, sc)}).`,
        ),
        pickLocale(
          locale,
          "Expect micro-structure and depth behavior to reprice — refresh passive liquidity assumptions.",
          "Микроструктура и глубина переоценятся — обновить допущения по пассивной ликвидности.",
        ),
      );
    }

    if (Math.abs(c.liquidityStructuralStress - p.liquidityStructuralStress) >= 10) {
      pushMoment(
        pressure,
        cap,
        c.simulatedClockLabel,
        pickLocale(locale, "Liquidity pressure migration", "Миграция давления ликвидности"),
        pickLocale(
          locale,
          "Structural liquidity stress trended — sweep vulnerability and pocket quality evolved.",
          "Структурный стресс ликвидности сместился — уязвимость к сносу и качество карманов изменились.",
        ),
        pickLocale(
          locale,
          "Adapt resting order style and chase distance to new thin-depth topology.",
          "Адаптировать стиль заявок и дистанцию погони к новой топологии тонкой глубины.",
        ),
      );
    }

    if (Math.abs(c.positioningPressure - p.positioningPressure) >= 12) {
      pushMoment(
        pressure,
        cap,
        c.simulatedClockLabel,
        pickLocale(locale, "Participation pressure shift", "Сдвиг давления участия"),
        pickLocale(
          locale,
          "Crowding / de-risk geometry migrated — leverage-sensitive continuation windows moved.",
          "Геометрия скопления/снятия риска сместилась — окна чувствительного к плечу продолжения сдвинулись.",
        ),
        pickLocale(
          locale,
          "Resize trend conviction; watch for divergence between price and participation envelope.",
          "Пересчитать убеждённость в тренде; следить за расхождением цены и конверта участия.",
        ),
      );
    }

    if (Math.abs(c.volatilityImpulse - p.volatilityImpulse) >= 14) {
      pushMoment(
        pressure,
        cap,
        c.simulatedClockLabel,
        pickLocale(locale, "Volatility transition", "Переход волатильности"),
        pickLocale(
          locale,
          "Impulse slope changed — expansion or compression regime for execution timing updated.",
          "Наклон импульса сменился — обновлён режим расширения/сжатия для тайминга исполнения.",
        ),
        pickLocale(
          locale,
          "Adjust bracket width and fade/chase bias to match new impulse envelope.",
          "Подстроить ширину брекетов и уклон фейд/погоня под новый конверт импульса.",
        ),
      );
    }
  }

  for (let i = 1; i < agentHistory.length; i++) {
    const p = agentHistory[i - 1]!;
    const c = agentHistory[i]!;
    const clock = history.find((h) => h.simTick === c.simTick)?.simulatedClockLabel ?? `t${c.simTick}`;

    if (c.macro - p.macro >= 10 || c.macro - p.macro <= -10) {
      pushMoment(
        conviction,
        cap,
        clock,
        pickLocale(locale, "Macro conviction migration", "Миграция макро-уверенности"),
        pickLocale(
          locale,
          "Macro lattice confidence moved — structural thesis sponsorship repriced.",
          "Уверенность макро-решётки сдвинулась — переоценено спонсорство структурного тезиса.",
        ),
        pickLocale(
          locale,
          "Refresh scenario arbitration weights before scaling macro-sensitive risk.",
          "Обновить веса арбитража сценариев до масштабирования макро-чувствительного риска.",
        ),
      );
    }
    if (c.flow - p.flow >= 10 || c.flow - p.flow <= -10) {
      pushMoment(
        conviction,
        cap,
        clock,
        pickLocale(locale, "Flow conviction migration", "Миграция уверенности потока"),
        pickLocale(
          locale,
          "Participation leadership confidence shifted — continuation quality read changed.",
          "Уверенность в ведении участия сдвинулась — изменилось прочтение качества продолжения.",
        ),
        pickLocale(
          locale,
          "Re-test sponsorship on continuation adds; avoid leaning on stale flow reads.",
          "Перепроверять спонсорство на добавлениях к продолжению; не опираться на устаревшее чтение потока.",
        ),
      );
    }
    if (c.divergenceIndex - p.divergenceIndex >= 8) {
      pushMoment(
        conviction,
        cap,
        clock,
        pickLocale(locale, "Cross-model divergence expansion", "Расширение расхождения моделей"),
        pickLocale(
          locale,
          "Agent lattice disagreement widened — institutional confidence in a single narrative fell.",
          "Разногласие решётки агентов расширилось — институциональная уверенность в одном нарративе снизилась.",
        ),
        pickLocale(
          locale,
          "Prefer conditional execution structures until convergence improves.",
          "Предпочитать условные конструкции исполнения, пока не улучшится сходимость.",
        ),
      );
    }
  }

  const fallback = (layer: "structural" | "other"): ReplayMoment[] => {
    const h = history[history.length - 1];
    const clk = h?.simulatedClockLabel ?? "—";
    if (layer === "structural") {
      return [
        {
          clock: clk,
          headline: pickLocale(locale, "Structural window initializing", "Инициализация структурного окна"),
          structuralRead: pickLocale(
            locale,
            "Insufficient captured transitions yet — replay will populate as the lattice advances.",
            "Пока мало зафиксированных переходов — реплей заполнится по мере движения решётки.",
          ),
          adaptation: pickLocale(
            locale,
            "Let the simulation run — structural replay is temporal, not archival.",
            "Дайте симуляции идти — структурный реплей временной, не архивный.",
          ),
        },
      ];
    }
    return [
      {
        clock: clk,
        headline: pickLocale(locale, "Awaiting evolution traces", "Ожидание следов эволюции"),
        structuralRead: pickLocale(
          locale,
          "No qualifying migration in this layer for the current capture depth.",
          "В этом слое нет подходящей миграции при текущей глубине захвата.",
        ),
        adaptation: pickLocale(
          locale,
          "No execution adaptation implied yet — monitor live lattice transitions.",
          "Пока нет подразумеваемой адаптации исполнения — следить за живыми переходами решётки.",
        ),
      },
    ];
  };

  const trailStructural = history.map((h) => h.dangerScore / 100);
  const trailExecution = history.map((h) => (h.dangerScore * 0.45 + h.volatilityImpulse * 0.55) / 100);
  const trailScenario = history.map((h) => h.leadScenarioProb / 100);
  const trailSession = history.map((h) => hourFromClock(h.simulatedClockLabel) / 23);
  const trailPressure = history.map((h) => (h.liquidityStructuralStress * 0.55 + h.positioningPressure * 0.45) / 100);
  const trailConviction = agentHistory.map((a) => (a.macro + a.flow + a.liquidity + a.risk) / 400);

  const closing = pickLocale(
    locale,
    "What changed structurally, and how should execution behavior have adapted?",
    "Что структурно изменилось и как должно было адаптироваться исполнение?",
  );

  return {
    structural: {
      title: pickLocale(locale, "Structural replay", "Структурный реплей"),
      synopsis: pickLocale(
        locale,
        "Compression, reclaim quality, continuation vs deterioration — evolution trails, not logs.",
        "Сжатие, качество откупа, продолжение vs ухудшение — следы эволюции, не логи.",
      ),
      moments: structural.length ? structural : fallback("structural"),
      trail: normTrail(trailStructural),
      closingQuestion: closing,
    },
    execution: {
      title: pickLocale(locale, "Execution replay", "Реплей исполнения"),
      synopsis: pickLocale(
        locale,
        "Posture, invalidation, and aggression geometry as conditions migrated.",
        "Поза, снятие и геометрия агрессии по мере миграции условий.",
      ),
      moments: execution.length ? execution : fallback("other"),
      trail: normTrail(trailExecution),
      closingQuestion: closing,
    },
    scenario: {
      title: pickLocale(locale, "Scenario replay", "Реплей сценариев"),
      synopsis: pickLocale(
        locale,
        `Primary path evolution around ${scenarioTitle(locale, topScenarioId)} — deck rotation, not forecasts.`,
        `Эволюция базового пути вокруг ${scenarioTitle(locale, topScenarioId)} — вращение колоды, не прогнозы.`,
      ),
      moments: scenario.length ? scenario : fallback("other"),
      trail: normTrail(trailScenario),
      closingQuestion: closing,
    },
    session: {
      title: pickLocale(locale, "Session replay", "Реплей сессий"),
      synopsis: pickLocale(
        locale,
        "How simulated desk hours influenced participation and volatility reads.",
        "Как симулированные часы стола влияли на участие и прочтение волатильности.",
      ),
      moments: session.length ? session : fallback("other"),
      trail: normTrail(trailSession),
      closingQuestion: closing,
    },
    pressure: {
      title: pickLocale(locale, "Pressure evolution replay", "Реплей эволюции давления"),
      synopsis: pickLocale(
        locale,
        "Liquidity, leverage, and participation stress migration across the window.",
        "Миграция стресса ликвидности, плеча и участия в окне.",
      ),
      moments: pressure.length ? pressure : fallback("other"),
      trail: normTrail(trailPressure),
      closingQuestion: closing,
    },
    conviction: {
      title: pickLocale(locale, "Conviction evolution replay", "Реплей эволюции убеждённости"),
      synopsis: pickLocale(
        locale,
        "Lattice confidence paths — macro, flow, and divergence memory.",
        "Пути уверенности решётки — макро, поток и память расхождений.",
      ),
      moments: conviction.length ? conviction : fallback("other"),
      trail: normTrail(trailConviction.length ? trailConviction : trailStructural),
      closingQuestion: closing,
    },
  };
}

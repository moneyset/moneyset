/**
 * Short trust / cadence copy for feeds, archives, and settings.
 * Operational tone — not marketing prose.
 */

import type { UiLocale } from "@/store/ui-prefs-store";
import type { MarketConnectionState } from "@/types/market-state";
import { pickLocale } from "@/lib/i18n/cognition-dict";

export function marketFeedStatusLabel(locale: UiLocale, state: MarketConnectionState): string {
  const m: Record<MarketConnectionState, { en: string; ru: string }> = {
    connecting: { en: "Reconnecting", ru: "Переподключение" },
    live: { en: "Live", ru: "Онлайн" },
    stale: { en: "Feed delayed", ru: "Задержка ленты" },
    disconnected: { en: "Disconnected", ru: "Нет соединения" },
  };
  const row = m[state];
  return pickLocale(locale, row.en, row.ru);
}

export function staleDataWarningLine(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Showing last confirmed data — live refresh paused",
    "Показаны последние подтверждённые данные — обновление приостановлено",
  );
}

export function tapeAwaitingLine(locale: UiLocale): string {
  return pickLocale(locale, "Awaiting confirmed tape", "Лента не подтверждена");
}

/** Monospace-friendly wall-clock for logs, journal, and archive rows. */
export function formatOperationalTimestamp(locale: UiLocale, ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return pickLocale(
    locale,
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${time}`,
    `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${time}`,
  );
}

/** Compact feed latency for trust strip (seconds since last WS tick). */
export function feedLatencyLabel(locale: UiLocale, seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  if (seconds < 60) return pickLocale(locale, `${seconds}s`, `${seconds} с`);
  const m = Math.floor(seconds / 60);
  return pickLocale(locale, `${m}m`, `${m} м`);
}

export function journalEmptyTitle(locale: UiLocale): string {
  return pickLocale(locale, "Journal ready", "Журнал готов");
}

export function journalEmptyPrimary(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Capture transitions: each save archives state vs prior snapshot.",
    "Фиксируйте переходы: при сохранении — дельта к прошлому снимку.",
  );
}

export function journalEmptySecondary(locale: UiLocale): string {
  return pickLocale(locale, "Bulk export: Memory.", "Выгрузка: Память.");
}

export function memoryArchiveEmptyPrimary(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Snapshots on material moves. Empty start is normal.",
    "Снимки на сдвигах. Пустой старт — норма.",
  );
}

export function cognitionWorkspaceIntro(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Posture → stress → scenarios → log.",
    "Позиция → стресс → сценарии → лента.",
  );
}

export function settingsLead(locale: UiLocale): string {
  return pickLocale(locale, "Prefs local. Sync optional.", "Локально. Синхрон по желанию.");
}

export function settingsDensityHelp(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Minimal: filter noise. Deep: reconcile strip + chain.",
    "Минимум — меньше шума. Глубоко — сверка и цепочка.",
  );
}

export function settingsMotionHelp(locale: UiLocale): string {
  return pickLocale(locale, "Low: less shell motion.", "Низкая — меньше движения в оболочке.");
}

export function settingsAlertsHelp(locale: UiLocale): string {
  return pickLocale(locale, "Threshold for alerts / Telegram.", "Порог для алертов и Telegram.");
}

/** Journal page — bilingual chrome (no mixed-language rows). */
export function journalPageTitle(locale: UiLocale): string {
  return pickLocale(locale, "Structural memory", "Структурная память");
}

export function journalPageDescription(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Capture sequence — execution evolution, pressure migration, scenario rotation.",
    "Последовательность срезов — эволюция исполнения, миграция давления, смена сценария.",
  );
}

export function journalEntriesCount(locale: UiLocale, n: number): string {
  return pickLocale(locale, `${n} entries`, `${n} записей`);
}

export function journalExportArchive(locale: UiLocale): string {
  return pickLocale(locale, "Export archive", "Экспорт архива");
}

export function journalNewEntry(locale: UiLocale): string {
  return pickLocale(locale, "New entry", "Новая запись");
}

export function journalEyebrowContext(locale: UiLocale): string {
  return pickLocale(locale, "Context", "Контекст");
}

export function journalLiveAnchorTitle(locale: UiLocale): string {
  return pickLocale(locale, "Live tape", "Лента рынка");
}

export function journalEyebrowReview(locale: UiLocale): string {
  return pickLocale(locale, "Review", "Разбор");
}

export function journalPatternsTitle(locale: UiLocale): string {
  return pickLocale(locale, "Patterns", "Паттерны");
}

export function journalListEyebrow(locale: UiLocale): string {
  return pickLocale(locale, "Memory sequence", "Последовательность памяти");
}

export function journalReplayToggle(locale: UiLocale, active: boolean): string {
  return active
    ? pickLocale(locale, "Exit sequence", "Выйти из последовательности")
    : pickLocale(locale, "Walk captures", "Пройти срезы");
}

export function journalReplayPosition(locale: UiLocale, index: number, total: number): string {
  return pickLocale(locale, `Step ${index + 1} / ${total}`, `Шаг ${index + 1} из ${total}`);
}

export function journalTransitionCapture(locale: UiLocale): string {
  return pickLocale(locale, "Transition capture", "Срез перехода");
}

export function journalDeskNote(locale: UiLocale): string {
  return pickLocale(locale, "Desk note", "Заметка стола");
}

export function journalLayerStateShift(locale: UiLocale): string {
  return pickLocale(locale, "State shift", "Сдвиг состояния");
}

export function journalLayerStructural(locale: UiLocale): string {
  return pickLocale(locale, "Structure", "Структура");
}

export function journalLayerPosture(locale: UiLocale): string {
  return pickLocale(locale, "Posture", "Позиция");
}

export function journalLayerInvalidation(locale: UiLocale): string {
  return pickLocale(locale, "Invalidation / confirmation", "Снятие / подтверждение");
}

export function journalLayerScenario(locale: UiLocale): string {
  return pickLocale(locale, "Scenario path", "Сценарий");
}

export function journalLegacyNoLayers(locale: UiLocale): string {
  return pickLocale(locale, "Legacy entry — no transition capture.", "Старая запись — без среза перехода.");
}

export function journalLinkedSnapshotPrefix(locale: UiLocale): string {
  return pickLocale(locale, "Linked snapshot", "Снимок в записи");
}

export function journalModalTitle(locale: UiLocale): string {
  return pickLocale(locale, "New journal entry", "Новая запись");
}

export function journalModalDescription(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Desk note plus auto-captured deltas vs prior snapshot.",
    "Заметка стола и авто-срез дельт к прошлому снимку.",
  );
}

export function journalDirectionLabel(locale: UiLocale, d: "long" | "short" | "flat" | "other"): string {
  const m = {
    long: pickLocale(locale, "Long", "Покупатель"),
    short: pickLocale(locale, "Short", "Продавец"),
    flat: pickLocale(locale, "Flat", "Флэт"),
    other: pickLocale(locale, "Other", "Другое"),
  };
  return m[d];
}

export function journalMetaConfidence(locale: UiLocale): string {
  return pickLocale(locale, "Confidence", "Убеждённость");
}

export function journalMetaRisk(locale: UiLocale): string {
  return pickLocale(locale, "Risk", "Риск");
}

export function journalSnapshotLinked(locale: UiLocale): string {
  return pickLocale(locale, "Snapshot linked", "Снимок привязан");
}

export function journalEmotionPrefix(locale: UiLocale): string {
  return pickLocale(locale, "Emotion ·", "Эмоция ·");
}

export function journalLessonsPrefix(locale: UiLocale): string {
  return pickLocale(locale, "Lessons ·", "Уроки ·");
}

export function journalFieldReasoning(locale: UiLocale): string {
  return pickLocale(locale, "Desk note (synthesis)", "Заметка стола (синтез)");
}

export function journalFieldEmotionOptional(locale: UiLocale): string {
  return pickLocale(locale, "Emotion (optional)", "Эмоция (опц.)");
}

export function journalFieldConfidence(locale: UiLocale): string {
  return pickLocale(locale, "Confidence", "Убеждённость");
}

export function journalFieldRiskPerception(locale: UiLocale): string {
  return pickLocale(locale, "Risk perception", "Оценка риска");
}

export function journalSaveEntry(locale: UiLocale): string {
  return pickLocale(locale, "Save entry", "Сохранить");
}

export function memoryArchiveEmptyTitle(locale: UiLocale): string {
  return pickLocale(locale, "Archive ready", "Архив готов");
}

export function journalCancel(locale: UiLocale): string {
  return pickLocale(locale, "Cancel", "Отмена");
}

/** Operational log — quiet window (not an error). */
export function operationalLogQuiet(locale: UiLocale): string {
  return pickLocale(
    locale,
    "No threshold hits this window.",
    "Нет прохода порога в окне.",
  );
}

export function journalOutcomeLabel(
  locale: UiLocale,
  o: "win" | "loss" | "scratch" | "open",
): string {
  const row: Record<typeof o, { en: string; ru: string }> = {
    win: { en: "Win", ru: "Плюс" },
    loss: { en: "Loss", ru: "Минус" },
    scratch: { en: "Scratch", ru: "Ноль" },
    open: { en: "Open", ru: "Открыто" },
  };
  return pickLocale(locale, row[o].en, row[o].ru);
}

/** First-touch entry — institutional, not promotional. */
export function cognitionEntryEyebrow(locale: UiLocale): string {
  return pickLocale(locale, "Market cognition environment", "Среда рыночного прочтения");
}

export function cognitionEntryLine1(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Interpretation over prediction. Structure, posture, and scenarios evolve with the tape.",
    "Интерпретация важнее прогноза. Структура, позиция и сценарии меняются с лентой.",
  );
}

export function cognitionEntryLine2(locale: UiLocale): string {
  return pickLocale(locale, "Entering workspace.", "Вход в рабочее поле.");
}

export function cognitionEntrySkip(locale: UiLocale): string {
  return pickLocale(locale, "Continue", "Продолжить");
}

export function cinematicIntroCopy(locale: UiLocale): Readonly<{
  tagline: string;
  loadingLine: string;
}> {
  return {
    tagline: pickLocale(locale, "Market Structure Before Consensus", "Структура рынка до консенсуса"),
    loadingLine: pickLocale(locale, "Preparing market state", "Подготовка состояния рынка"),
  };
}

export function entryOnboardingCopy(locale: UiLocale): Readonly<{
  headline: string;
  subheadline: string;
  valueLines: readonly [string, string, string];
  capabilities: readonly [
    { label: string; desc: string },
    { label: string; desc: string },
    { label: string; desc: string },
  ];
  foundingTitle: string;
  foundingPrice: string;
  foundingBullets: readonly [string, string, string, string];
  enterCta: string;
  accessCta: string;
  telegramLink: string;
  telegramHint: string;
}> {
  return {
    headline: pickLocale(locale, "WHAT IS HAPPENING NOW", "ЧТО ПРОИСХОДИТ СЕЙЧАС"),
    subheadline: pickLocale(
      locale,
      "Market posture, risk, and scenario clarity — before you act.",
      "Рыночная позиция, риск и ясность сценариев — до того, как действовать.",
    ),
    valueLines: pickLocale(
      locale,
      [
        "See what the market is doing now.",
        "Know what to do under current structure.",
        "Track what confirms or breaks the outlook.",
      ] as const,
      [
        "Видите, что рынок делает сейчас.",
        "Понимаете, что делать при текущей структуре.",
        "Отслеживаете, что подтверждает или ломает прогноз.",
      ] as const,
    ),
    capabilities: pickLocale(
      locale,
      [
        { label: "MARKET POSTURE", desc: "Regime, participation, and directional bias right now." },
        { label: "EXECUTION MAP", desc: "Where to act, where risk rises, and what invalidates the read." },
        { label: "SCENARIO MEMORY", desc: "How posture evolved — replay and compare prior states." },
      ] as const,
      [
        { label: "РЫНОЧНАЯ ПОЗИЦИЯ", desc: "Режим, участие и направленный уклон прямо сейчас." },
        { label: "КАРТА ИСПОЛНЕНИЯ", desc: "Где действовать, где растёт риск и что снимает прочтение." },
        { label: "ПАМЯТЬ СЦЕНАРИЕВ", desc: "Как менялась позиция — реплей и сравнение прошлых состояний." },
      ] as const,
    ),
    foundingTitle: pickLocale(locale, "Founding Access", "Founding Access"),
    foundingPrice: pickLocale(locale, "$149", "$149"),
    foundingBullets: pickLocale(
      locale,
      [
        "Know what to do — action steps live with market structure.",
        "Know when the thesis breaks — invalidation before the market confirms it.",
        "Six specialist reads, agent consensus, and deep interpretation.",
        "Market memory, scenario evolution, and replay continuity.",
      ] as const,
      [
        "Знайте что делать — шаги действий живут со структурой рынка.",
        "Знайте когда тезис ломается — инвалидация до подтверждения рынком.",
        "Шесть прочтений специалистов, консенсус агентов и глубокая интерпретация.",
        "Память рынка, эволюция сценариев и непрерывность реплея.",
      ] as const,
    ),
    enterCta: pickLocale(locale, "EXPLORE FREE WORKSPACE", "ОТКРЫТЬ БЕСПЛАТНОЕ ПОЛЕ"),
    accessCta: pickLocale(locale, "FOUNDING ACCESS — $149", "FOUNDING ACCESS — $149"),
    telegramLink: pickLocale(locale, "Open in Telegram", "Открыть в Telegram"),
    telegramHint: pickLocale(locale, "Awaiting Telegram session…", "Ожидание сессии Telegram…"),
  };
}

export function authSessionActionsCopy(locale: UiLocale): Readonly<{
  telegramCta: string;
  guestCta: string;
  foundingNote: string;
}> {
  return {
    telegramCta: pickLocale(locale, "Sign in with Telegram", "Войти через Telegram"),
    guestCta: pickLocale(locale, "Enter as guest", "Войти как гость"),
    foundingNote: pickLocale(
      locale,
      "Founding Access — execution map and institutional interpretation.",
      "Founding Access — карта исполнения и институциональное прочтение.",
    ),
  };
}

export function authPageTitle(locale: UiLocale): string {
  return pickLocale(locale, "Market Structure Before Consensus", "Структура рынка до консенсуса");
}

export function authPageLead(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Session on this device. No feed, no noise — access control only.",
    "Сессия на этом устройстве. Без ленты и шума — только контроль доступа.",
  );
}

export function authPageWorkspaceCta(locale: UiLocale): string {
  return pickLocale(locale, "Open cognition workspace", "Открыть рабочее поле");
}

export function authPageTierPaid(locale: UiLocale): string {
  return pickLocale(locale, "Full intelligence access active.", "Активен полный доступ к интеллекту.");
}

export function authPageTierFree(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Base workspace. Structural depth and execution-layer reads are gated.",
    "Базовое поле. Глубина структуры и слой исполнения — по доступу.",
  );
}

export function authPageTierEvaluation(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Evaluation window active — extended interpretation layers unlocked temporarily.",
    "Окно оценки — расширенные слои прочтения временно открыты.",
  );
}

export function authModalPolicyNote(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Sign-in with Google, email, or magic link. Session persists on this device. Password reset by email.",
    "Вход через Google, email или magic link. Сессия на устройстве. Сброс пароля — по email.",
  );
}

export function cognitionOnboardingFrames(
  locale: UiLocale,
): ReadonlyArray<Readonly<{ title: string; body: string }>> {
  return [
    {
      title: pickLocale(locale, "Execution posture", "Позиция исполнения"),
      body: pickLocale(
        locale,
        "How you lean under uncertainty — defensive, responsive, or measured — before any scenario wins. The terminal surfaces that stance from tape-linked state, not from narrative.",
        "Как вы стоите при неопределённости — в защите, в ответе или в мере — до того, как победит сценарий. Терминал показывает эту установку из состояния ленты, не из истории.",
      ),
    },
    {
      title: pickLocale(locale, "Structural interpretation", "Структурное прочтение"),
      body: pickLocale(
        locale,
        "Zones, rails, and ladders compress where acceptance, reclaim, and invalidation live relative to mark and vol — conditional geometry, not external levels or calls.",
        "Зоны, рейлы и лестницы сжимают, где живут принятие, откуп и снятие относительно метки и волы — условная геометрия, не внешние уровни и не сигналы.",
      ),
    },
    {
      title: pickLocale(locale, "Behavioral calibration", "Поведенческая калибровка"),
      body: pickLocale(
        locale,
        "Density, motion, and alerts tune cognitive load. The goal is disciplined scanability — fewer impulses, clearer operational hierarchy.",
        "Плотность, движение и оповещения настраивают когнитивную нагрузку. Цель — дисциплинированная читаемость: меньше импульсов, яснее операционная иерархия.",
      ),
    },
    {
      title: pickLocale(locale, "Uncertainty management", "Управление неопределённостью"),
      body: pickLocale(
        locale,
        "Scenarios compete; invalidation states what weakens each path. You keep agency — the system narrows ambiguity into operable structure.",
        "Сценарии конкурируют; снятие формулирует, что ослабит путь. Агентство у вас — система сужает неопределённость до оперируемой структуры.",
      ),
    },
    {
      title: pickLocale(locale, "Cognition layers", "Слои прочтения"),
      body: pickLocale(
        locale,
        "Core posture and log stay open; execution map, memory, replay, and deep interpretation require paid access.",
        "Ядро и лента открыты; карта исполнения, память, реплей и глубокое прочтение — по платному доступу.",
      ),
    },
    {
      title: pickLocale(locale, "Workspace cadence", "Режим рабочего поля"),
      body: pickLocale(
        locale,
        "Language, density, motion, and alert thresholds tune how much surface detail you carry. Defaults favor restraint.",
        "Язык, плотность, движение и пороги оповещений задают объём деталей. По умолчанию — сдержанно.",
      ),
    },
  ];
}

export function cognitionOnboardingEyebrow(locale: UiLocale): string {
  return pickLocale(locale, "Orientation", "Ориентация");
}

export function cognitionOnboardingPrefsHint(locale: UiLocale): string {
  return pickLocale(locale, "Adjust now; change anytime in Settings.", "Можно изменить позже в настройках.");
}

export function premiumGatePreviewPosture(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Action posture and directional bias — what the structure supports now.",
    "Поза действия и направленный уклон — что поддерживает структура сейчас.",
  );
}

export function premiumGatePreviewStructure(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Key price zones identified — where to act and where risk concentrates.",
    "Ключевые ценовые зоны определены — где действовать и где концентрируется риск.",
  );
}

export function premiumGatePreviewScenario(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Lead scenario active — tracking what would strengthen or break it.",
    "Ведущий сценарий активен — отслеживаем, что укрепит или сломает его.",
  );
}

export function premiumGatePreviewExecution(locale: UiLocale): string {
  return pickLocale(
    locale,
    "Full execution map and invalidation logic — what changes the read.",
    "Полная карта исполнения и логика снятия — что меняет прочтение.",
  );
}

export function trialAccessEndsLine(locale: UiLocale, endsTs: number): string {
  const d = new Date(endsTs);
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} UTC`;
  return pickLocale(locale, `Evaluation access ends ${stamp}.`, `Оценочный доступ до ${stamp}.`);
}

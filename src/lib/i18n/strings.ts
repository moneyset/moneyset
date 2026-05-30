import type { UiLocale } from "@/store/ui-prefs-store";

export type I18nKey =
  | "nav.core"
  | "nav.marketIndex"
  | "nav.execution"
  | "nav.scenarios"
  | "nav.ops"
  | "nav.agents"
  | "nav.macro"
  | "nav.crossAsset"
  | "nav.riskRadar"
  | "nav.sentiment"
  | "nav.maps"
  | "nav.labs"
  | "nav.replay"
  | "nav.memory"
  | "nav.journal"
  | "nav.settings"
  | "nav.surfaces"
  | "lang.label"
  | "quick.title"
  | "quick.posture"
  | "quick.danger"
  | "quick.consensus"
  | "quick.topScenario"
  | "quick.mainRisk"
  | "scenario.title"
  | "scenario.weightedPaths"
  | "scenario.eyebrow"
  | "scenario.leadLabel"
  | "operational.title"
  | "operational.restrained"
  | "operational.expand"
  | "scenario.details"
  | "agent.eyebrow"
  | "agent.title"
  | "agent.agreementVsDiv"
  | "agent.crossChecks"
  | "agent.pressureFlags"
  | "agent.confidenceWindow"
  | "agent.align"
  | "agent.split"
  | "agent.state"
  | "explain.drivers"
  | "execution.eyebrow"
  | "execution.title"
  | "execution.subtitle"
  | "execution.primaryPath"
  | "execution.posture"
  | "execution.invalidation"
  | "execution.continuation"
  | "execution.zones"
  | "execution.zonesAwaiting"
  | "execution.anchorLabel"
  | "execution.navLabel"
  | "premium.title"
  | "premium.reserved"
  | "premium.cta"
  | "premium.unlock"
  | "premium.preview"
  | "tier.free"
  | "tier.premium"
  | "tier.evaluation"
  | "upgrade.title"
  | "upgrade.subtitle"
  | "upgrade.enableDemo"
  | "upgrade.close"
  | "upgrade.trialCta"
  | "upgrade.trialHint"
  | "upgrade.resetFree"
  | "upgrade.foundingActive"
  | "upgrade.foundingInactive"
  | "upgrade.freeColumnTitle"
  | "upgrade.foundingColumnTitle"
  | "upgrade.foundingLead"
  | "upgrade.freeBullet1"
  | "upgrade.freeBullet2"
  | "upgrade.freeBullet3"
  | "upgrade.foundingBullet1"
  | "upgrade.foundingBullet2"
  | "upgrade.foundingBullet3"
  | "upgrade.foundingBullet4"
  | "upgrade.foundingBullet5"
  | "tier.founding"
  | "gate.lockedTitle"
  | "gate.lockedBody"
  | "gate.cta"
  | "auth.title"
  | "auth.subtitle"
  | "auth.google"
  | "auth.emailLabel"
  | "auth.emailPlaceholder"
  | "auth.sendMagic"
  | "auth.emailSignIn"
  | "auth.emailSignUp"
  | "auth.or"
  | "auth.missingConfig"
  | "auth.signedInAs"
  | "auth.signOut"
  | "auth.magicSent"
  | "onboarding.title"
  | "onboarding.subtitle"
  | "onboarding.back"
  | "onboarding.continue"
  | "onboarding.language"
  | "onboarding.theme"
  | "onboarding.density"
  | "onboarding.motion"
  | "onboarding.alerts"
  | "onboarding.finish"
  | "decision.aria"
  | "decision.marketPosture"
  | "decision.whatToDo"
  | "decision.pictureChanges"
  | "decision.pictureLegend"
  | "decision.foundingGate"
  | "decision.foundingCta";

type Dict = Record<I18nKey, string>;

export const STRINGS: Record<UiLocale, Dict> = {
  en: {
    "nav.core": "Core",
    "nav.marketIndex": "Market Index",
    "nav.execution": "Execution",
    "nav.scenarios": "Scenarios",
    "nav.ops": "Changes",
    "nav.agents": "Agents",
    "nav.macro": "Macro",
    "nav.crossAsset": "Cross-asset",
    "nav.riskRadar": "Risk",
    "nav.sentiment": "Sentiment",
    "nav.maps": "Maps",
    "nav.labs": "Labs",
    "nav.replay": "Replay",
    "nav.memory": "Strategy",
    "nav.journal": "Journal",
    "nav.settings": "Settings",
    "nav.surfaces": "Surfaces",

    "lang.label": "Interface language",

    "quick.title": "State",
    "quick.posture": "Posture",
    "quick.danger": "Risk",
    "quick.consensus": "Consensus",
    "quick.topScenario": "Top scenario",
    "quick.mainRisk": "Main risk",

    "scenario.title": "Possible paths forward",
    "scenario.weightedPaths": "Paths ranked by structural advantage — not price targets or certainty claims.",
    "scenario.details": "Scenario details",
    "scenario.eyebrow": "Scenarios",
    "scenario.leadLabel": "Base",

    "operational.title": "Market changes",
    "operational.restrained": "Quiet",
    "operational.expand": "Context",

    "agent.eyebrow": "Agents",
    "agent.title": "Where specialist reads agree — and where they conflict",
    "agent.agreementVsDiv": "Where agents align",
    "agent.crossChecks": "Cross-checks",
    "agent.pressureFlags": "Pressure flags",
    "agent.confidenceWindow": "Confidence window",
    "agent.align": "Aligned",
    "agent.split": "Conflicted",
    "agent.state": "State",
    "explain.drivers": "Reconcile",

    "execution.eyebrow": "Execution",
    "execution.title": "Action under current structure",
    "execution.subtitle":
      "What to do now — bias, zones, and invalidation anchored to live structure.",
    "execution.primaryPath": "Primary path",
    "execution.posture": "Execution posture",
    "execution.invalidation": "Invalidation",
    "execution.continuation": "Continuation read",
    "execution.zones": "Structural zones",
    "execution.zonesAwaiting": "Awaiting live mark or last trade to anchor structural bands.",
    "execution.anchorLabel": "Anchor",
    "execution.navLabel": "Execution map",

    "premium.title": "Founding Access",
    "premium.reserved": "Action plan · structural zones · invalidation logic",
    "premium.cta": "Unlock Founding Access",
    "premium.unlock": "See what to do now, what confirms the outlook, and what would break the current read.",
    "premium.preview": "You see what the market is doing. Founding Access shows you what to do about it.",

    "tier.free": "Free access",
    "tier.premium": "Full intelligence",
    "tier.evaluation": "Evaluation access",
    "tier.founding": "Founding Access",

    "upgrade.title": "Founding Access",
    "upgrade.subtitle":
      "Stop second-guessing. See what to do, where to act, and what would break the view.",
    "upgrade.enableDemo": "Activate extended (dev)",
    "upgrade.close": "Close",
    "upgrade.trialCta": "Open evaluation window",
    "upgrade.trialHint": "72h evaluation of full execution intelligence. One window per install.",
    "upgrade.resetFree": "Return to free access",
    "upgrade.foundingActive": "Active",
    "upgrade.foundingInactive": "Not activated",
    "upgrade.freeColumnTitle": "Free — market context only",
    "upgrade.foundingColumnTitle": "Founding Access — decision support",
    "upgrade.foundingLead": "Know what to do, not just what is happening. Action, risk, and invalidation — live.",
    "upgrade.freeBullet1": "Market state and risk level — you see what is happening",
    "upgrade.freeBullet2": "Lead scenario and posture — you see the picture",
    "upgrade.freeBullet3": "Action steps, structural zones, and invalidation are not included",
    "upgrade.foundingBullet1": "Know what to do — action steps update with every structural shift",
    "upgrade.foundingBullet2": "Know where to act — structural zones and where risk concentrates",
    "upgrade.foundingBullet3": "Know when the thesis breaks — invalidation logic before the market confirms it",
    "upgrade.foundingBullet4": "Follow how the picture shifts — scenario evolution, not just snapshots",
    "upgrade.foundingBullet5": "Six specialist reads, market memory, and full intelligence depth",

    "gate.lockedTitle": "Founding Access required",
    "gate.lockedBody":
      "See your action plan, where risk concentrates, and what would break the current read.",
    "gate.cta": "Unlock — $149",

    "auth.title": "Sign in",
    "auth.subtitle": "Structural market intelligence — sign in to save your access and unlock full depth.",
    "auth.google": "Continue with Google",
    "auth.emailLabel": "Work email",
    "auth.emailPlaceholder": "you@example.com",
    "auth.sendMagic": "Email magic link",
    "auth.emailSignIn": "Sign in with password",
    "auth.emailSignUp": "Create account",
    "auth.or": "or",
    "auth.missingConfig": "Sign-in is temporarily unavailable. Please try again later or continue as guest.",
    "auth.signedInAs": "Signed in as",
    "auth.signOut": "Sign out",
    "auth.magicSent": "Link sent. Check inbox and spam.",

    "onboarding.title": "MONEYSET",
    "onboarding.subtitle": "Operational orientation — not a product tour.",
    "onboarding.back": "Back",
    "onboarding.continue": "Continue",
    "onboarding.language": "Language",
    "onboarding.theme": "Theme",
    "onboarding.density": "Information density",
    "onboarding.motion": "Motion load",
    "onboarding.alerts": "Alert sensitivity",
    "onboarding.finish": "Enter workspace",

    "decision.aria": "Execution decision layer",
    "decision.marketPosture": "Market posture",
    "decision.whatToDo": "What to do now",
    "decision.pictureChanges": "What changes the picture",
    "decision.pictureLegend": "Confirms the read · weakens the read · invalidates the read",
    "decision.foundingGate": "See your action steps — what to do under current structure, where to act, and what would change this read.",
    "decision.foundingCta": "Founding Access — $149",
  },
  ru: {
    "nav.core": "Ядро",
    "nav.marketIndex": "Market Index",
    "nav.execution": "Исполнение",
    "nav.scenarios": "Сценарии",
    "nav.ops": "Изменения",
    "nav.agents": "Агенты",
    "nav.macro": "Макро",
    "nav.crossAsset": "Кросс-актив",
    "nav.riskRadar": "Риск",
    "nav.sentiment": "Настроения",
    "nav.maps": "Карты",
    "nav.labs": "Лабы",
    "nav.replay": "Реплей",
    "nav.memory": "Стратегия",
    "nav.journal": "Журнал",
    "nav.settings": "Настройки",
    "nav.surfaces": "Разделы",

    "lang.label": "Язык",

    "quick.title": "Срез",
    "quick.posture": "Позиция",
    "quick.danger": "Стресс",
    "quick.consensus": "Сборка",
    "quick.topScenario": "База",
    "quick.mainRisk": "Главный риск",

    "scenario.title": "Возможные пути вперёд",
    "scenario.weightedPaths": "Пути по структурному преимуществу — не целевые цены и не «уверенность в %».",
    "scenario.details": "Детали сценария",
    "scenario.eyebrow": "Сценарии",
    "scenario.leadLabel": "База",

    "operational.title": "Изменения рынка",
    "operational.restrained": "Тихо",
    "operational.expand": "Контекст",

    "agent.eyebrow": "Агенты",
    "agent.title": "Где специализированные прочтения сходятся — и где конфликтуют",
    "agent.agreementVsDiv": "Где агенты сходятся",
    "agent.crossChecks": "Сверки",
    "agent.pressureFlags": "Давление",
    "agent.confidenceWindow": "Окно убеждённости",
    "agent.align": "Сходятся",
    "agent.split": "Конфликт",
    "agent.state": "Статус",
    "explain.drivers": "Сверка",

    "execution.eyebrow": "Исполнение",
    "execution.title": "Действие при текущей структуре",
    "execution.subtitle":
      "Что делать сейчас — уклон, зоны и снятие, привязанные к живой структуре.",
    "execution.primaryPath": "Базовый путь",
    "execution.posture": "Позиция исполнения",
    "execution.invalidation": "Снятие тезиса",
    "execution.continuation": "Чтение продолжения",
    "execution.zones": "Структурные зоны",
    "execution.zonesAwaiting": "Ждём метку или последнюю сделку, чтобы привязать полосы.",
    "execution.anchorLabel": "Опора",
    "execution.navLabel": "Карта исполнения",

    "premium.title": "Founding Access",
    "premium.reserved": "План действий · структурные зоны · логика снятия",
    "premium.cta": "Открыть Founding Access",
    "premium.unlock": "Видите что делать сейчас, что подтверждает прогноз и что сломает текущее прочтение.",
    "premium.preview": "Вы видите что делает рынок. Founding Access показывает что с этим делать.",

    "tier.free": "Бесплатный доступ",
    "tier.premium": "Полный интеллект",
    "tier.evaluation": "Оценочный доступ",
    "tier.founding": "Founding Access",

    "upgrade.title": "Founding Access",
    "upgrade.subtitle":
      "Прекратите гадать. Видите, что делать, где действовать и что сломает прочтение.",
    "upgrade.enableDemo": "Включить расширение (dev)",
    "upgrade.close": "Закрыть",
    "upgrade.trialCta": "Окно оценки",
    "upgrade.trialHint": "72 ч полного execution intelligence. Одно окно на установку.",
    "upgrade.resetFree": "Вернуть бесплатный доступ",
    "upgrade.foundingActive": "Активно",
    "upgrade.foundingInactive": "Не активировано",
    "upgrade.freeColumnTitle": "Бесплатно — только контекст рынка",
    "upgrade.foundingColumnTitle": "Founding Access — поддержка решений",
    "upgrade.foundingLead": "Знайте что делать, а не только что происходит. Действие, риск и инвалидация — в реальном времени.",
    "upgrade.freeBullet1": "Состояние рынка и уровень риска — вы видите что происходит",
    "upgrade.freeBullet2": "Ведущий сценарий и поза рынка — вы видите картину",
    "upgrade.freeBullet3": "Шаги действий, структурные зоны и инвалидация — не включены",
    "upgrade.foundingBullet1": "Знайте что делать — шаги действий обновляются с каждым структурным сдвигом",
    "upgrade.foundingBullet2": "Знайте где действовать — структурные зоны и где концентрируется риск",
    "upgrade.foundingBullet3": "Знайте когда тезис ломается — логика инвалидации до подтверждения рынком",
    "upgrade.foundingBullet4": "Следите как картина смещается — эволюция сценариев, не только снимки",
    "upgrade.foundingBullet5": "Шесть прочтений специалистов, память рынка и полная глубина интеллекта",

    "gate.lockedTitle": "Требуется Founding Access",
    "gate.lockedBody":
      "Видите план действий, где концентрируется риск и что сломает текущее прочтение.",
    "gate.cta": "Открыть — $149",

    "auth.title": "Вход",
    "auth.subtitle": "Структурный рыночный интеллект — войдите, чтобы сохранить доступ и открыть полную глубину.",
    "auth.google": "Продолжить с Google",
    "auth.emailLabel": "Рабочая почта",
    "auth.emailPlaceholder": "you@example.com",
    "auth.sendMagic": "Ссылка на почту",
    "auth.emailSignIn": "Вход по паролю",
    "auth.emailSignUp": "Создать аккаунт",
    "auth.or": "или",
    "auth.missingConfig": "Вход временно недоступен. Попробуйте позже или продолжите как гость.",
    "auth.signedInAs": "Вы вошли как",
    "auth.signOut": "Выйти",
    "auth.magicSent": "Ссылка отправлена. Проверьте почту и спам.",

    "onboarding.title": "MONEYSET",
    "onboarding.subtitle": "Операционная ориентация — не тур по кнопкам.",
    "onboarding.back": "Назад",
    "onboarding.continue": "Далее",
    "onboarding.language": "Язык",
    "onboarding.theme": "Тема",
    "onboarding.density": "Плотность информации",
    "onboarding.motion": "Нагрузка анимации",
    "onboarding.alerts": "Чувствительность оповещений",
    "onboarding.finish": "Войти в поле",

    "decision.aria": "Слой решений по исполнению",
    "decision.marketPosture": "Рыночная поза",
    "decision.whatToDo": "Что делать сейчас",
    "decision.pictureChanges": "Что меняет картину",
    "decision.pictureLegend": "Подтверждает · ослабляет · снимает прочтение",
    "decision.foundingGate": "Видите шаги действий — что делать при текущей структуре, где действовать и что изменит прочтение.",
    "decision.foundingCta": "Founding Access — $149",
  },
};

export function t(locale: UiLocale, key: I18nKey): string {
  return STRINGS[locale][key];
}


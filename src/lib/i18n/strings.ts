import type { UiLocale } from "@/store/ui-prefs-store";

export type I18nKey =
  | "nav.core"
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

    "premium.title": "Full access",
    "premium.reserved": "Action plan · price zones · invalidation logic",
    "premium.cta": "Unlock access",
    "premium.unlock": "Unlock to see what to do now, what confirms the outlook, and what raises risk.",
    "premium.preview": "You can see what the market is doing. Unlock to see what to do about it.",

    "tier.free": "Free access",
    "tier.premium": "Full intelligence",
    "tier.evaluation": "Evaluation access",
    "tier.founding": "Founding access",

    "upgrade.title": "Full execution access",
    "upgrade.subtitle":
      "Institutional decision support — clarity under uncertainty, not a signal service.",
    "upgrade.enableDemo": "Activate extended (dev)",
    "upgrade.close": "Close",
    "upgrade.trialCta": "Open evaluation window",
    "upgrade.trialHint": "72h evaluation of full execution intelligence. One window per install.",
    "upgrade.resetFree": "Return to free access",
    "upgrade.foundingActive": "Active",
    "upgrade.foundingInactive": "Not activated",
    "upgrade.freeColumnTitle": "Market context — free",
    "upgrade.foundingColumnTitle": "Founding — full decision support",
    "upgrade.foundingLead": "Full decision support — structure, action, and what would break the view.",
    "upgrade.freeBullet1": "Market state and risk level — what is happening now",
    "upgrade.freeBullet2": "Lead scenario and market posture — without execution guidance",
    "upgrade.freeBullet3": "Action plan, zones, and invalidation logic are not included on free",
    "upgrade.foundingBullet1": "Action clarity — what to do under current market structure",
    "upgrade.foundingBullet2": "Price zones — where to act and where risk concentrates",
    "upgrade.foundingBullet3": "Invalidation logic — what would break the current view, before it happens",
    "upgrade.foundingBullet4": "Scenario evolution — how the picture shifts through the session",
    "upgrade.foundingBullet5": "Full specialist analysis — six agent reads, market memory, and replay",

    "gate.lockedTitle": "Full access required",
    "gate.lockedBody":
      "Unlock to see your action plan, price zones, and what would invalidate the current read.",
    "gate.cta": "Unlock — $79",

    "auth.title": "Session",
    "auth.subtitle": "Calm sign-in. No feed, no hype — access control only.",
    "auth.google": "Continue with Google",
    "auth.emailLabel": "Work email",
    "auth.emailPlaceholder": "name@domain.com",
    "auth.sendMagic": "Email magic link",
    "auth.emailSignIn": "Password sign-in (staged)",
    "auth.emailSignUp": "Create account (staged)",
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
    "decision.foundingGate": "Unlock to see your action steps — what to do now, where to act, and what would break this read.",
    "decision.foundingCta": "Unlock — $79",
  },
  ru: {
    "nav.core": "Ядро",
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

    "premium.title": "Полный доступ",
    "premium.reserved": "План действий · зоны · логика снятия",
    "premium.cta": "Открыть доступ",
    "premium.unlock": "Откройте, чтобы видеть что делать, что подтверждает прогноз и что повышает риск.",
    "premium.preview": "Вы видите, что делает рынок. Откройте, чтобы узнать, что с этим делать.",

    "tier.free": "Бесплатный доступ",
    "tier.premium": "Полный интеллект",
    "tier.evaluation": "Оценочный доступ",
    "tier.founding": "Founding доступ",

    "upgrade.title": "Полный доступ к решениям",
    "upgrade.subtitle":
      "Институциональная поддержка решений — ясность при неопределённости, не сигнальный сервис.",
    "upgrade.enableDemo": "Включить расширение (dev)",
    "upgrade.close": "Закрыть",
    "upgrade.trialCta": "Окно оценки",
    "upgrade.trialHint": "72 ч полного execution intelligence. Одно окно на установку.",
    "upgrade.resetFree": "Вернуть бесплатный доступ",
    "upgrade.foundingActive": "Активно",
    "upgrade.foundingInactive": "Не активировано",
    "upgrade.freeColumnTitle": "Контекст рынка — бесплатно",
    "upgrade.foundingColumnTitle": "Founding — полная поддержка решений",
    "upgrade.foundingLead": "Полная поддержка решений — структура, действие и что сломает прочтение.",
    "upgrade.freeBullet1": "Состояние рынка и уровень риска — что происходит сейчас",
    "upgrade.freeBullet2": "Ведущий сценарий и поза рынка — без руководства к исполнению",
    "upgrade.freeBullet3": "План действий, зоны и логика снятия — не включены в бесплатный доступ",
    "upgrade.foundingBullet1": "Ясность действий — что делать при текущей структуре рынка",
    "upgrade.foundingBullet2": "Ценовые зоны — где действовать и где концентрируется риск",
    "upgrade.foundingBullet3": "Логика снятия — что сломает текущее прочтение до того, как это произойдёт",
    "upgrade.foundingBullet4": "Эволюция сценария — как картина меняется в течение сессии",
    "upgrade.foundingBullet5": "Полный анализ специалистов — шесть прочтений, память рынка и реплей",

    "gate.lockedTitle": "Требуется полный доступ",
    "gate.lockedBody":
      "Откройте, чтобы увидеть план действий, ценовые зоны и что снимет текущее прочтение.",
    "gate.cta": "Открыть — $79",

    "auth.title": "Сессия",
    "auth.subtitle": "Спокойный вход. Без ленты и шума — только контроль доступа.",
    "auth.google": "Продолжить с Google",
    "auth.emailLabel": "Рабочая почта",
    "auth.emailPlaceholder": "name@domain.com",
    "auth.sendMagic": "Ссылка на почту",
    "auth.emailSignIn": "Вход по паролю (этап)",
    "auth.emailSignUp": "Регистрация (этап)",
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
    "decision.foundingGate": "Откройте, чтобы увидеть шаги действий — что делать, где действовать и что сломает это прочтение.",
    "decision.foundingCta": "Открыть — $79",
  },
};

export function t(locale: UiLocale, key: I18nKey): string {
  return STRINGS[locale][key];
}


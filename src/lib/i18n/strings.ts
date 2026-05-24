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
    "nav.execution": "Exec",
    "nav.scenarios": "Scenarios",
    "nav.ops": "Ops",
    "nav.agents": "Agents",
    "nav.macro": "Macro",
    "nav.crossAsset": "Cross-asset",
    "nav.riskRadar": "Risk",
    "nav.sentiment": "Sentiment",
    "nav.maps": "Maps",
    "nav.labs": "Labs",
    "nav.replay": "Replay",
    "nav.memory": "Strategy",

    "lang.label": "Interface language",

    "quick.title": "State",
    "quick.posture": "Posture",
    "quick.danger": "Risk",
    "quick.consensus": "Consensus",
    "quick.topScenario": "Top scenario",
    "quick.mainRisk": "Main risk",

    "scenario.title": "Scenarios",
    "scenario.weightedPaths": "Structural paths · ordered by relative advantage, not point forecasts.",
    "scenario.details": "Scenario details",
    "scenario.eyebrow": "Scenarios",
    "scenario.leadLabel": "Base",

    "operational.title": "Operations",
    "operational.restrained": "Quiet",
    "operational.expand": "Context",

    "agent.eyebrow": "Agents",
    "agent.title": "Inputs",
    "agent.agreementVsDiv": "Agreement vs divergence",
    "agent.crossChecks": "Cross-checks",
    "agent.pressureFlags": "Pressure flags",
    "agent.confidenceWindow": "Confidence window",
    "agent.align": "Align",
    "agent.split": "Split",
    "agent.state": "State",
    "explain.drivers": "Reconcile",

    "execution.eyebrow": "Structural execution",
    "execution.title": "Interpretation layer",
    "execution.subtitle":
      "Tape-anchored bands from mark, vol proxy, momentum, regime — conditional geometry.",
    "execution.primaryPath": "Primary path",
    "execution.posture": "Execution posture",
    "execution.invalidation": "Invalidation",
    "execution.continuation": "Continuation read",
    "execution.zones": "Structural zones",
    "execution.zonesAwaiting": "Awaiting live mark or last trade to anchor structural bands.",
    "execution.anchorLabel": "Anchor",
    "execution.navLabel": "Execution map",

    "premium.title": "Reserved field",
    "premium.reserved": "Deeper structural cognition",
    "premium.cta": "Request access",
    "premium.unlock": "Full execution calibration and structural continuity.",
    "premium.preview": "Shape and rhythm visible; resolution reserved — not a signal layer.",

    "tier.free": "Free access",
    "tier.premium": "Reserved field",
    "tier.evaluation": "Evaluation access",
    "tier.founding": "Founding access",

    "upgrade.title": "Execution intelligence access",
    "upgrade.subtitle":
      "Institutional decision support — clarity under uncertainty, not a signal service.",
    "upgrade.enableDemo": "Activate extended (dev)",
    "upgrade.close": "Close",
    "upgrade.trialCta": "Open evaluation window",
    "upgrade.trialHint": "72h evaluation of full execution intelligence. One window per install.",
    "upgrade.resetFree": "Return to free access",
    "upgrade.foundingActive": "Active",
    "upgrade.foundingInactive": "Not activated",
    "upgrade.freeColumnTitle": "Market context (free)",
    "upgrade.foundingColumnTitle": "Founding · full execution intelligence",
    "upgrade.foundingLead": "Full Execution Intelligence Access — outcomes, not feature lists.",
    "upgrade.freeBullet1": "What is happening: posture, risk, scenario summary, limited consensus",
    "upgrade.freeBullet2": "Core summary and capped market context for orientation",
    "upgrade.freeBullet3": "No execution map, zones, invalidation logic, replay, or deep interpretation",
    "upgrade.foundingBullet1": "Execution clarity — what should I do under current structure",
    "upgrade.foundingBullet2": "Reduced uncertainty — zones, invalidation, and scenario evolution over time",
    "upgrade.foundingBullet3": "Scenario awareness — how posture shifts through the session",
    "upgrade.foundingBullet4": "Risk framing — acceptance, defensive, and expansion geometry",
    "upgrade.foundingBullet5": "Market cognition — full agents, memory, replay, and deep interpretation",

    "gate.lockedTitle": "Execution intelligence reserved",
    "gate.lockedBody":
      "Founding access unlocks execution map, zones, and invalidation — decision support infrastructure, not predictions.",
    "gate.cta": "Founding access",

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
    "decision.foundingGate": "Full execution plan available with Founding Access.",
    "decision.foundingCta": "Founding access",
  },
  ru: {
    "nav.core": "Ядро",
    "nav.execution": "Исполн.",
    "nav.scenarios": "Сценарии",
    "nav.ops": "Операции",
    "nav.agents": "Агенты",
    "nav.macro": "Макро",
    "nav.crossAsset": "Кросс-актив",
    "nav.riskRadar": "Риск",
    "nav.sentiment": "Настроения",
    "nav.maps": "Карты",
    "nav.labs": "Лабы",
    "nav.replay": "Реплей",
    "nav.memory": "Стратегия",

    "lang.label": "Язык",

    "quick.title": "Срез",
    "quick.posture": "Позиция",
    "quick.danger": "Стресс",
    "quick.consensus": "Сборка",
    "quick.topScenario": "База",
    "quick.mainRisk": "Главный риск",

    "scenario.title": "Сценарии",
    "scenario.weightedPaths": "Структурные пути · порядок по относительному преимуществу, не точечный прогноз.",
    "scenario.details": "Детали сценария",
    "scenario.eyebrow": "Сценарии",
    "scenario.leadLabel": "База",

    "operational.title": "Операции",
    "operational.restrained": "Тихо",
    "operational.expand": "Контекст",

    "agent.eyebrow": "Агенты",
    "agent.title": "Вводные",
    "agent.agreementVsDiv": "Сходимость и разнос",
    "agent.crossChecks": "Сверки",
    "agent.pressureFlags": "Давление",
    "agent.confidenceWindow": "Окно убеждённости",
    "agent.align": "Сходится",
    "agent.split": "Разнос",
    "agent.state": "Статус",
    "explain.drivers": "Сверка",

    "execution.eyebrow": "Структурное исполнение",
    "execution.title": "Слой прочтения",
    "execution.subtitle":
      "Полосы от метки, прокси волы, импульса и режима — условная геометрия.",
    "execution.primaryPath": "Базовый путь",
    "execution.posture": "Позиция исполнения",
    "execution.invalidation": "Снятие тезиса",
    "execution.continuation": "Чтение продолжения",
    "execution.zones": "Структурные зоны",
    "execution.zonesAwaiting": "Ждём метку или последнюю сделку, чтобы привязать полосы.",
    "execution.anchorLabel": "Опора",
    "execution.navLabel": "Карта исполнения",

    "premium.title": "Зарезервированное поле",
    "premium.reserved": "Углублённое структурное прочтение",
    "premium.cta": "Запросить доступ",
    "premium.unlock": "Полная калибровка исполнения и структурная непрерывность.",
    "premium.preview": "Видны силуэт и ритм; деталь зарезервирована — это не слой сигналов.",

    "tier.free": "Бесплатный доступ",
    "tier.premium": "Зарезервированное поле",
    "tier.evaluation": "Оценочный доступ",
    "tier.founding": "Founding доступ",

    "upgrade.title": "Доступ к execution intelligence",
    "upgrade.subtitle":
      "Институциональная поддержка решений — ясность при неопределённости, не сигнальный сервис.",
    "upgrade.enableDemo": "Включить расширение (dev)",
    "upgrade.close": "Закрыть",
    "upgrade.trialCta": "Окно оценки",
    "upgrade.trialHint": "72 ч полного execution intelligence. Одно окно на установку.",
    "upgrade.resetFree": "Вернуть бесплатный доступ",
    "upgrade.foundingActive": "Активно",
    "upgrade.foundingInactive": "Не активировано",
    "upgrade.freeColumnTitle": "Контекст рынка (бесплатно)",
    "upgrade.foundingColumnTitle": "Founding · полный execution intelligence",
    "upgrade.foundingLead": "Полный доступ к execution intelligence — исходы, не список функций.",
    "upgrade.freeBullet1": "Что происходит: поза, риск, сценарий, ограниченный консенсус",
    "upgrade.freeBullet2": "Сводка ядра и ограниченный контекст для ориентации",
    "upgrade.freeBullet3": "Без карты исполнения, зон, снятия, реплея и глубокого прочтения",
    "upgrade.foundingBullet1": "Ясность исполнения — что делать при текущей структуре",
    "upgrade.foundingBullet2": "Меньше неопределённости — зоны, снятие, эволюция сценария",
    "upgrade.foundingBullet3": "Осознанность сценария — как поза меняется в сессии",
    "upgrade.foundingBullet4": "Рамка риска — принятие, защита, расширение",
    "upgrade.foundingBullet5": "Познание рынка — агенты, память, реплей, глубокое прочтение",

    "gate.lockedTitle": "Execution intelligence зарезервирован",
    "gate.lockedBody":
      "Founding открывает карту исполнения, зоны и снятие — инфраструктура решений, не прогнозы.",
    "gate.cta": "Founding доступ",

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
    "decision.foundingGate": "Полный план исполнения доступен с Founding Access.",
    "decision.foundingCta": "Founding доступ",
  },
};

export function t(locale: UiLocale, key: I18nKey): string {
  return STRINGS[locale][key];
}


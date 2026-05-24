import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

export const LAB_SLUGS = [
  "chart",
  "liquidity",
  "macro",
  "sentiment",
  "replay",
  "strategy-memory",
  "cross-asset",
  "risk-radar",
] as const;

export type LabSlug = (typeof LAB_SLUGS)[number];

export function isLabSlug(s: string): s is LabSlug {
  return (LAB_SLUGS as readonly string[]).includes(s);
}

type Copy = { en: string; ru: string };

export type LabModuleDef = Readonly<{
  slug: LabSlug;
  title: Copy;
  /** One-line institutional purpose — not marketing copy. */
  purpose: Copy;
  /** Compressed capability list — visual scan, not essays. */
  features: readonly Copy[];
}>;

const MODULES: readonly LabModuleDef[] = [
  {
    slug: "chart",
    title: { en: "Chart Lab", ru: "Chart Lab" },
    purpose: {
      en: "Execution-oriented structural analysis — overlays, not retail TA.",
      ru: "Структурный разбор под исполнение — оверлеи, не розничный ТА.",
    },
    features: [
      { en: "Execution overlays · reclaim shelves · invalidation zones", ru: "Оверлеи исполнения · полки откупа · зоны инвалидации" },
      { en: "Liquidity regions · structure paths · scenario overlays", ru: "Ликвидность · пути структуры · оверлеи сценариев" },
      { en: "Replay overlays · level drawing · execution mapping", ru: "Оверлеи реплея · уровни · карта исполнения" },
      { en: "AI annotations — disciplined, not indicator spam", ru: "AI-аннотации — дисциплина, без индикаторного шума" },
    ],
  },
  {
    slug: "liquidity",
    title: { en: "Liquidity Lab", ru: "Liquidity Lab" },
    purpose: {
      en: "Liquidity and pressure interpretation — abstract topology, not heatmap gambling.",
      ru: "Ликвидность и давление — абстрактная топология, не казино-теплокарты.",
    },
    features: [
      { en: "Liquidity topology · imbalance zones · leverage pressure", ru: "Топология ликвидности · дисбалансы · плечевое давление" },
      { en: "Participation density · liquidation geometry", ru: "Плотность участия · геометрия ликвидаций" },
      { en: "Structural pressure regions", ru: "Регионы структурного давления" },
    ],
  },
  {
    slug: "macro",
    title: { en: "Macro Lab", ru: "Macro Lab" },
    purpose: {
      en: "Macro interpretation — posture and windows, not calendar dumping.",
      ru: "Макро-интерпретация — поза и окна, не свалка календаря.",
    },
    features: [
      { en: "CPI / FOMC windows · macro risk posture", ru: "Окна CPI / FOMC · макро-риск" },
      { en: "Catalyst interpretation · historical analogs", ru: "Катализаторы · исторические аналоги" },
      { en: "Liquidity sensitivity · regime & execution implications", ru: "Чувствительность ликвидности · режим и исполнение" },
    ],
  },
  {
    slug: "sentiment",
    title: { en: "Sentiment Lab", ru: "Sentiment Lab" },
    purpose: {
      en: "Narrative interpretation — not a news aggregation feed.",
      ru: "Нарратив — не агрегатор новостей.",
    },
    features: [
      { en: "Crowd positioning · narrative shifts (incl. X)", ru: "Позиционирование толпы · сдвиги нарратива (вкл. X)" },
      { en: "Geopolitical & media narrative evolution", ru: "Геополитика и эволюция медиа-нарратива" },
      { en: "Sentiment fragility · narrative divergence", ru: "Хрупкость настроений · расхождение нарративов" },
      { en: "Positioning instability", ru: "Нестабильность позиционирования" },
    ],
  },
  {
    slug: "replay",
    title: { en: "Replay Studio", ru: "Replay Studio" },
    purpose: {
      en: "Structural evolution replay — sessions, scenarios, pressure.",
      ru: "Реплей эволюции структуры — сессии, сценарии, давление.",
    },
    features: [
      { en: "Scenario · execution · session replay", ru: "Реплей сценария · исполнения · сессии" },
      { en: "Structure transitions · pressure evolution", ru: "Переходы структуры · эволюция давления" },
      { en: "Regime replay · participation shifts", ru: "Реплей режима · сдвиги участия" },
    ],
  },
  {
    slug: "strategy-memory",
    title: { en: "Strategy Memory", ru: "Strategy Memory" },
    purpose: {
      en: "Institutional memory — setups, conditions, and structural recall.",
      ru: "Институциональная память — сетапы, условия, структурное вспоминание.",
    },
    features: [
      { en: "Saved structures · historical setups · execution memory", ru: "Сохранённые структуры · история · память исполнения" },
      { en: "Failed vs successful conditions · recurring patterns", ru: "Условия срыва/успеха · повторяющиеся паттерны" },
    ],
  },
  {
    slug: "cross-asset",
    title: { en: "Cross-Asset Lab", ru: "Cross-Asset Lab" },
    purpose: {
      en: "Cross-market interpretation — migration and correlation shifts.",
      ru: "Кросс-рынок — миграции и сдвиги корреляций.",
    },
    features: [
      { en: "BTC / DXY · BTC / yields · BTC / NQ · ETH / BTC", ru: "BTC/DXY · BTC/доходности · BTC/NQ · ETH/BTC" },
      { en: "Liquidity migration · cross-asset pressure", ru: "Миграция ликвидности · кросс-давление" },
      { en: "Macro correlation shifts", ru: "Сдвиги макро-корреляций" },
    ],
  },
  {
    slug: "risk-radar",
    title: { en: "Risk Radar", ru: "Risk Radar" },
    purpose: {
      en: "Hidden fragility — leverage, crowding, and structural deterioration.",
      ru: "Скрытая хрупкость — плечо, перекосы, структурное разрушение.",
    },
    features: [
      { en: "Leverage stress · crowding risk · structural fragility", ru: "Плечевой стресс · перекос толпы · хрупкость структуры" },
      { en: "Volatility pressure · instability zones", ru: "Волатильность · зоны нестабильности" },
      { en: "Hidden deterioration · sponsorship weakness", ru: "Скрытая деградация · слабость спонсорства" },
    ],
  },
];

export function getLabModule(slug: LabSlug): LabModuleDef {
  const m = MODULES.find((x) => x.slug === slug);
  if (!m) throw new Error(`Unknown lab slug: ${slug}`);
  return m;
}

export function allLabModules(): readonly LabModuleDef[] {
  return MODULES;
}

export function labCopy(locale: UiLocale, c: Copy): string {
  return pickLocale(locale, c.en, c.ru);
}

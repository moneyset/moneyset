import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

export type MobileVizSection =
  | "execution"
  | "executionMap"
  | "chartLab"
  | "liquidityLab"
  | "macroLab"
  | "sentimentLab"
  | "riskRadar"
  | "crossAsset"
  | "memoryLab";

type GateCopy = Readonly<{
  titleEn: string;
  titleRu: string;
  bodyEn: string;
  bodyRu: string;
  chipsEn: readonly string[];
  chipsRu: readonly string[];
}>;

const COPY: Record<MobileVizSection, GateCopy> = {
  execution: {
    titleEn: "Tactical execution theater",
    titleRu: "Тактический театр исполнения",
    bodyEn: "Multi-layer terrain, geometry, and path lanes need a wider canvas. Preview the posture on mobile — open on tablet or desktop for the full battlefield.",
    bodyRu: "Многослойный рельеф, геометрия и пути требуют более широкого экрана. На мобильном — превью позы; полный театр на планшете или десктопе.",
    chipsEn: ["Regime posture", "Decision gravity", "Scenario lanes"],
    chipsRu: ["Режим позы", "Гравитация решения", "Сценарные пути"],
  },
  executionMap: {
    titleEn: "Execution map",
    titleRu: "Карта исполнения",
    bodyEn: "Structural bands and lane geometry are built for desktop depth. Mobile shows a locked preview until the responsive map ships.",
    bodyRu: "Структурные полосы и геометрия рассчитаны на десктоп. На мобильном — превью до готовой адаптивной версии.",
    chipsEn: ["Structural bands", "Invalidation rails", "Lane geometry"],
    chipsRu: ["Структурные полосы", "Рельсы инвалидации", "Геометрия путей"],
  },
  chartLab: {
    titleEn: "Chart Lab terrain",
    titleRu: "Рельеф Chart Lab",
    bodyEn: "Annotated terrain layers overlap on narrow screens. Founding Access unlocks the full lab on desktop — mobile preview stays clean until layout is complete.",
    bodyRu: "Аннотированные слои рельефа пересекаются на узком экране. Founding Access открывает полный lab на десктопе — мобильное превью остаётся чистым.",
    chipsEn: ["Terrain bands", "Priority zones", "Path context"],
    chipsRu: ["Полосы рельефа", "Приоритетные зоны", "Контекст путей"],
  },
  liquidityLab: {
    titleEn: "Liquidity topology",
    titleRu: "Топология ликвидности",
    bodyEn: "Gravity, sponsorship, and fragility features need spacing to read clearly. Preview on mobile — full topology on a wider screen.",
    bodyRu: "Притяжение, спонсорство и хрупкость требуют пространства. На мобильном — превью; полная топология на широком экране.",
    chipsEn: ["Gravity wells", "Sponsorship", "Cascade risk"],
    chipsRu: ["Гравитационные зоны", "Спонсорство", "Риск каскада"],
  },
  macroLab: {
    titleEn: "Macro pressure matrix",
    titleRu: "Матрица макро-давления",
    bodyEn: "Cross-regime pressure grids are dense on phone widths. Preview the matrix — explore fully on desktop.",
    bodyRu: "Сетка макро-давления слишком плотна для телефона. Превью на мобильном — полный обзор на десктопе.",
    chipsEn: ["Pressure axes", "Regime drift", "Transmission"],
    chipsRu: ["Оси давления", "Дрейф режима", "Трансмиссия"],
  },
  sentimentLab: {
    titleEn: "Sentiment pressure matrix",
    titleRu: "Матрица сентимента",
    bodyEn: "Narrative pressure layers compete on narrow viewports. Mobile preview preserves clarity until responsive layout ships.",
    bodyRu: "Слои narrative pressure конкурируют на узком экране. Мобильное превью сохраняет ясность до адаптивной версии.",
    chipsEn: ["Crowding", "Consensus stress", "Narrative drift"],
    chipsRu: ["Скученность", "Стресс консенсуса", "Дрейф нарратива"],
  },
  riskRadar: {
    titleEn: "Systemic risk topology",
    titleRu: "Топология системного риска",
    bodyEn: "Fragility nodes and transmission arcs need room to breathe. Preview on mobile — full radar on desktop.",
    bodyRu: "Узлы хрупкости и дуги трансмиссии требуют пространства. Превью на мобильном — полный radar на десктопе.",
    chipsEn: ["Fragility nodes", "Transmission", "Stress corridors"],
    chipsRu: ["Узлы хрупкости", "Трансмиссия", "Коридоры стресса"],
  },
  crossAsset: {
    titleEn: "Cross-asset transmission",
    titleRu: "Кросс-активная трансмиссия",
    bodyEn: "Multi-asset topology overlaps on phone screens. Preview the graph — full transmission map on desktop.",
    bodyRu: "Мульти-активная топология пересекается на телефоне. Превью графа — полная карта трансмиссии на десктопе.",
    chipsEn: ["Asset links", "Stress paths", "Rotation risk"],
    chipsRu: ["Связи активов", "Пути стресса", "Риск ротации"],
  },
  memoryLab: {
    titleEn: "Strategy memory constellation",
    titleRu: "Констелляция стратегической памяти",
    bodyEn: "Historical constellation maps are unreadable on narrow widths. Preview on mobile — full memory field on desktop.",
    bodyRu: "Карта исторической констелляции нечитаема на узком экране. Превью на мобильном — полное поле памяти на десктопе.",
    chipsEn: ["Regime echoes", "Structural recall", "Pattern lineage"],
    chipsRu: ["Эхо режимов", "Структурная память", "Линия паттернов"],
  },
};

export function mobileVizGateCopy(section: MobileVizSection, locale: UiLocale) {
  const c = COPY[section];
  return {
    title: pickLocale(locale, c.titleEn, c.titleRu),
    body: pickLocale(locale, c.bodyEn, c.bodyRu),
    chips: locale === "ru" ? c.chipsRu : c.chipsEn,
    desktopNote: pickLocale(
      locale,
      "Full visualization on tablet and desktop.",
      "Полная визуализация на планшете и десктопе.",
    ),
    ribbon: pickLocale(locale, "Mobile preview", "Мобильное превью"),
  };
}

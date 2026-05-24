import type { UiLocale } from "@/store/ui-prefs-store";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { getLabModule, isLabSlug, labCopy } from "@/lib/labs/labs-modules";

/** Current route → short workspace title for the command header (desktop). */
export function workspaceTitleFromPath(pathname: string | null, locale: UiLocale): string {
  const p = pathname ?? "/";
  const normalized = p.endsWith("/") && p.length > 1 ? p.slice(0, -1) : p;

  if (normalized.startsWith("/labs/")) {
    const rest = normalized.slice("/labs/".length);
    const seg = rest.split("/")[0] ?? "";
    if (seg && isLabSlug(seg)) {
      const m = getLabModule(seg);
      return `${pickLocale(locale, "Labs", "Лаборатории")} · ${labCopy(locale, m.title)}`;
    }
  }

  const map: { prefix: string; en: string; ru: string }[] = [
    { prefix: "/settings", en: "Settings", ru: "Настройки" },
    { prefix: "/journal", en: "Journal", ru: "Журнал" },
    { prefix: "/execution", en: "Execution", ru: "Исполнение" },
    { prefix: "/scenarios", en: "Scenarios", ru: "Сценарии" },
    { prefix: "/ops", en: "Ops", ru: "Операции" },
    { prefix: "/agents", en: "Agents", ru: "Агенты" },
    { prefix: "/macro", en: "Macro intelligence", ru: "Макро-интеллект" },
    { prefix: "/cross-asset", en: "Cross-asset intelligence", ru: "Кросс-активный интеллект" },
    { prefix: "/risk-radar", en: "Risk Radar", ru: "Risk Radar" },
    { prefix: "/sentiment", en: "Sentiment intelligence", ru: "Интеллект настроений" },
    { prefix: "/maps", en: "Maps", ru: "Карты" },
    { prefix: "/labs", en: "Labs", ru: "Лаборатории" },
    { prefix: "/replay", en: "Replay Studio", ru: "Replay Studio" },
    { prefix: "/memory", en: "Strategy memory", ru: "Память стратегии" },
    { prefix: "/auth", en: "Auth", ru: "Вход" },
  ];

  for (const row of map) {
    if (normalized === row.prefix || normalized.startsWith(`${row.prefix}/`)) {
      return pickLocale(locale, row.en, row.ru);
    }
  }

  if (normalized === "/" || normalized === "") {
    return pickLocale(locale, "Core", "Ядро");
  }

  return pickLocale(locale, "Workspace", "Рабочее пространство");
}

import type { AgentLatticeRow } from "@/lib/simulation/cognition-types";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

/** Institutional minds — not chat assistants. */
export type AgentArchetypeId = "structure" | "liquidity" | "macro" | "sentiment" | "risk" | "flow";

export type AgentAccent = "cognition" | "flow" | "danger" | "sentiment" | "consensus" | "warning";

export type AgentArchetypeMeta = Readonly<{
  id: AgentArchetypeId;
  latticeRole: AgentLatticeRow["role"] | null;
  tagEn: string;
  tagRu: string;
  focusEn: string;
  focusRu: string;
  accent: AgentAccent;
}>;

export const AGENT_ARCHETYPES: readonly AgentArchetypeMeta[] = [
  {
    id: "structure",
    latticeRole: null,
    tagEn: "Structure",
    tagRu: "Структура",
    focusEn: "Reclaim · continuation · geometry",
    focusRu: "Откуп · продолжение · геометрия",
    accent: "cognition",
  },
  {
    id: "liquidity",
    latticeRole: "Liquidity",
    tagEn: "Liquidity",
    tagRu: "Ликвидность",
    focusEn: "Liquidation · imbalance · stress topology",
    focusRu: "Ликвидации · дисбаланс · топология стресса",
    accent: "consensus",
  },
  {
    id: "macro",
    latticeRole: "Macro",
    tagEn: "Macro",
    tagRu: "Макро",
    focusEn: "Regime · rates · catalyst sensitivity",
    focusRu: "Режим · ставки · чувствительность к катализаторам",
    accent: "warning",
  },
  {
    id: "sentiment",
    latticeRole: "Sentiment",
    tagEn: "Sentiment",
    tagRu: "Настроения",
    focusEn: "Narrative · crowding · geopolitical stress",
    focusRu: "Нарратив · скопление · геополитический стресс",
    accent: "sentiment",
  },
  {
    id: "risk",
    latticeRole: "Risk",
    tagEn: "Risk",
    tagRu: "Риск",
    focusEn: "Fragility · sponsorship decay · acceleration",
    focusRu: "Хрупкость · распад спонсорства · ускорение",
    accent: "danger",
  },
  {
    id: "flow",
    latticeRole: "Flow",
    tagEn: "Flow",
    tagRu: "Поток",
    focusEn: "Participation · absorption · migration",
    focusRu: "Участие · поглощение · миграция",
    accent: "flow",
  },
] as const;

export function archetypeMeta(id: AgentArchetypeId): AgentArchetypeMeta {
  return AGENT_ARCHETYPES.find((a) => a.id === id)!;
}

export function archetypeLabel(locale: UiLocale, id: AgentArchetypeId): string {
  const m = archetypeMeta(id);
  return pickLocale(locale, m.tagEn, m.tagRu);
}

export function archetypeFocus(locale: UiLocale, id: AgentArchetypeId): string {
  const m = archetypeMeta(id);
  return pickLocale(locale, m.focusEn, m.focusRu);
}

/** Hex layout positions (%) for consensus map — structure at top. */
export const AGENT_MAP_POSITIONS: Record<AgentArchetypeId, { x: number; y: number }> = {
  structure: { x: 50, y: 8 },
  macro: { x: 82, y: 28 },
  flow: { x: 82, y: 72 },
  risk: { x: 50, y: 92 },
  sentiment: { x: 18, y: 72 },
  liquidity: { x: 18, y: 28 },
};

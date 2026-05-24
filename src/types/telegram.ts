import type { UiLocale } from "@/store/ui-prefs-store";
import type { TopScenarioWireId } from "@/lib/simulation/cognition-types";

export type TelegramLinkStatus = "unlinked" | "pending" | "linked";

export type TelegramChatPrefs = Readonly<{
  locale: UiLocale;
  alertsEnabled: boolean;
  /** high-signal only by default */
  alertLevel: "rare" | "standard";
}>;

export type TelegramLinkState = Readonly<{
  status: TelegramLinkStatus;
  linkCode: string | null;
  chatId: string | null;
  username: string | null;
  prefs: TelegramChatPrefs;
  updatedAtTs: number | null;
}>;

export type TelegramPushState = Readonly<{
  symbol: string;
  price: number | null;
  realizedVol: number | null;
  momentum: number | null;
  fundingRate: number | null;
  openInterest: number | null;
  phase: string;
  dangerBand: string;
  dangerScore: number;
  consensus: string;
  divergenceIndex: number;
  topScenario: { scenarioId: TopScenarioWireId; p: number } | null;
  orchestratorLine: string | null;
  connection: string;
  ts: number;
}>;


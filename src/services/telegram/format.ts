import type { UiLocale } from "@/store/ui-prefs-store";
import type { TelegramPushState } from "@/types/telegram";
import type { ConsensusEvolutionLabel, MarketPhaseId } from "@/lib/simulation/cognition-types";
import { consensusLabel, phaseLabel, scenarioTitle } from "@/lib/i18n/cognition-dict";

function fmtNum(n: number | null, digits = 0): string {
  if (typeof n !== "number") return "—";
  return n.toFixed(digits);
}

export function tgFormatPosture(locale: UiLocale, s: TelegramPushState): string {
  const title = locale === "ru" ? "ПОЗИЦИЯ" : "POSTURE";
  return [
    `<b>${title}</b>`,
    `${s.symbol} · price ${fmtNum(s.price, 0)}`,
    `${locale === "ru" ? "фаза" : "phase"} ${phaseLabel(locale, s.phase as MarketPhaseId)}`,
    `${locale === "ru" ? "danger" : "danger"} ${s.dangerBand}`,
  ].join("\n");
}

export function tgFormatDanger(locale: UiLocale, s: TelegramPushState): string {
  const title = locale === "ru" ? "ОПАСНОСТЬ" : "DANGER";
  return [
    `<b>${title}</b>`,
    `${s.symbol} · danger ${s.dangerBand}`,
    `vol ${fmtNum(s.realizedVol, 0)} · momentum ${fmtNum(s.momentum, 0)}`,
    s.fundingRate !== null ? `funding ${fmtNum(s.fundingRate, 5)}` : `funding —`,
  ].join("\n");
}

export function tgFormatScenario(locale: UiLocale, s: TelegramPushState): string {
  const title = locale === "ru" ? "СЦЕНАРИЙ" : "SCENARIO";
  if (!s.topScenario) return `<b>${title}</b>\n${locale === "ru" ? "Нет контекста сценария." : "No scenario context yet."}`;
  const scenLine = `${scenarioTitle(locale, s.topScenario.scenarioId)}`;
  return [
    `<b>${title}</b>`,
    scenLine,
    `${locale === "ru" ? "консенсус" : "consensus"} ${consensusLabel(locale, s.consensus as ConsensusEvolutionLabel)}`,
  ].join("\n");
}

export function tgFormatConsensus(locale: UiLocale, s: TelegramPushState): string {
  const title = locale === "ru" ? "КОНСЕНСУС" : "CONSENSUS";
  return [
    `<b>${title}</b>`,
    consensusLabel(locale, s.consensus as ConsensusEvolutionLabel),
  ].join("\n");
}

export function tgFormatRegime(locale: UiLocale, s: TelegramPushState): string {
  const title = locale === "ru" ? "РЕЖИМ" : "REGIME";
  return [
    `<b>${title}</b>`,
    phaseLabel(locale, s.phase as MarketPhaseId),
    `vol ${fmtNum(s.realizedVol, 0)} · conn ${s.connection}`,
  ].join("\n");
}

export function tgFormatSummary(locale: UiLocale, s: TelegramPushState): string {
  const title = locale === "ru" ? "СВОДКА" : "SUMMARY";
  return [
    `<b>${title}</b>`,
    `${s.symbol} · ${fmtNum(s.price, 0)} · vol ${fmtNum(s.realizedVol, 0)} · mom ${fmtNum(s.momentum, 0)}`,
    `${locale === "ru" ? "фаза" : "phase"} ${phaseLabel(locale, s.phase as MarketPhaseId)}`,
    `danger ${s.dangerBand}`,
    `${locale === "ru" ? "консенсус" : "consensus"} ${consensusLabel(locale, s.consensus as ConsensusEvolutionLabel)}`,
    s.orchestratorLine ? `\n<i>${s.orchestratorLine}</i>` : "",
  ]
    .filter(Boolean)
    .join("\n");
}


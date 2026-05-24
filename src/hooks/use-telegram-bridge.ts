"use client";

import { useEffect, useRef } from "react";

import { useTelegramStore } from "@/store/telegram-store";
import { useMarketStore } from "@/store/market-store";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useAiCognitionStore } from "@/store/ai-cognition-store";
import { useShallow } from "zustand/react/shallow";
import { scenarioTitle } from "@/lib/i18n/cognition-dict";
import type { ScenarioId } from "@/lib/simulation/scenario-engine";

function cooldownReady(map: Record<string, number>, key: string, ms: number) {
  const now = Date.now();
  const last = map[key] ?? 0;
  if (now - last < ms) return false;
  map[key] = now;
  return true;
}

/**
 * Telegram bridge:
 * - pushes latest cognition state to server (for bot command replies)
 * - emits rare alerts on meaningful changes (danger/regime/consensus/scenario/orchestrator)
 */
export function useTelegramBridge(enabled = true) {
  const tg = useTelegramStore(
    useShallow((s) => ({ status: s.status, prefs: s.prefs })),
  );
  const market = useMarketStore((s) => s);
  const sim = useCognitionSimulationStore(
    useShallow((s) => ({
      derived: s.derived,
      scenarioBook: s.scenarioBook,
    })),
  );
  const orch = useAiCognitionStore((s) => s.orchestrator);

  const last = useRef<{ phase?: string; danger?: string; consensus?: string; scenario?: string; orch?: string } | null>(
    null,
  );
  const cds = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!enabled) return;
    // Always push latest state when live market exists (even if not linked yet).
    if (!market.symbol) return;

    const payload = {
      symbol: market.symbol,
      price: market.price,
      realizedVol: market.realizedVol,
      momentum: market.momentum,
      fundingRate: market.fundingRate,
      openInterest: market.openInterest,
      phase: sim.derived.phase,
      dangerBand: sim.derived.dangerBand,
      dangerScore: sim.derived.dangerScore,
      consensus: sim.derived.consensus,
      divergenceIndex: sim.derived.divergenceIndex,
      topScenario: sim.scenarioBook.cards[0]
        ? { scenarioId: sim.scenarioBook.cards[0].id, p: sim.scenarioBook.cards[0].probabilityPct }
        : null,
      orchestratorLine: orch?.synthesis ?? null,
      connection: market.connection,
      ts: Date.now(),
    };

    void fetch("/api/telegram/state/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, [
    enabled,
    market.connection,
    market.fundingRate,
    market.momentum,
    market.openInterest,
    market.price,
    market.realizedVol,
    market.symbol,
    orch?.synthesis,
    sim.derived.consensus,
    sim.derived.dangerBand,
    sim.derived.dangerScore,
    sim.derived.divergenceIndex,
    sim.derived.phase,
    sim.scenarioBook.cards,
  ]);

  useEffect(() => {
    if (!enabled) return;
    if (tg.status !== "linked") return;
    if (!tg.prefs.alertsEnabled) return;

    const next = {
      phase: sim.derived.phase,
      danger: sim.derived.dangerBand,
      consensus: sim.derived.consensus,
      scenario: sim.scenarioBook.cards[0]?.id ?? "",
      orch: orch?.synthesis ?? "",
    };

    const prev = last.current;
    last.current = next;
    if (!prev) return;

    const events: Array<{ key: string; text: string; minLevel?: "rare" | "standard" }> = [];
    if (next.danger !== prev.danger) {
      events.push({
        key: "danger",
        text: `<b>DANGER</b>\n${market.symbol} · ${prev.danger} → ${next.danger} (${sim.derived.dangerScore})`,
        minLevel: "standard",
      });
    }
    if (next.phase !== prev.phase) {
      events.push({
        key: "regime",
        text: `<b>REGIME</b>\n${market.symbol} · ${prev.phase} → ${next.phase}`,
        minLevel: "standard",
      });
    }
    if (next.consensus !== prev.consensus) {
      events.push({
        key: "consensus",
        text: `<b>CONSENSUS</b>\n${(prev.consensus ?? "").replace(/_/g, " ")} → ${next.consensus.replace(/_/g, " ")}`,
        minLevel: "standard",
      });
    }
    if (next.scenario !== prev.scenario) {
      const loc = tg.prefs.locale;
      const label = next.scenario ? scenarioTitle(loc, next.scenario as ScenarioId) : "—";
      events.push({
        key: "scenario",
        text: `<b>SCENARIO SHIFT</b>\nTop scenario → ${label}`,
        minLevel: tg.prefs.alertLevel === "rare" ? "rare" : "standard",
      });
    }
    if (next.orch && next.orch !== prev.orch) {
      events.push({
        key: "orch",
        text: `<b>SUMMARY</b>\n<i>${next.orch}</i>`,
        minLevel: "rare",
      });
    }

    events.forEach((e) => {
      const ok = cooldownReady(cds.current, `tg-${e.key}`, e.key === "orch" ? 6 * 60_000 : 2 * 60_000);
      if (!ok) return;
      void fetch("/api/telegram/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: e.text, minLevel: e.minLevel }),
      }).catch(() => {});
    });
  }, [enabled, market.symbol, orch?.synthesis, sim.derived.consensus, sim.derived.dangerBand, sim.derived.dangerScore, sim.derived.phase, sim.scenarioBook.cards, tg.prefs.alertLevel, tg.prefs.alertsEnabled, tg.prefs.locale, tg.status]);
}


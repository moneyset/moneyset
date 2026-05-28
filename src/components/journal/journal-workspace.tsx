"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Plus } from "lucide-react";

import { JournalEntryCard } from "@/components/journal/journal-entry-card";
import { JournalMemoryPanel } from "@/components/journal/journal-memory-panel";
import { IntelCard } from "@/components/ui/intel-card";
import { JournalPeriodNav } from "@/components/journal/journal-period-nav";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusPill } from "@/components/ui/status-pill";
import { useMarketMemory } from "@/hooks/use-market-memory";
import { deriveJournalCognitiveLayers } from "@/lib/journal/cognitive-layers";
import { deriveJournalIntelligenceRecord } from "@/lib/journal/market-memory-engine";
import { deriveJournalInsightReport } from "@/lib/journal/journal-insights";
import { downloadTextFile, memoryArchiveBody } from "@/lib/export/cognition-snapshot-download";
import { consensusLabel, dangerBandLabel, phaseLabel, pickLocale } from "@/lib/i18n/cognition-dict";
import {
  journalCancel,
  journalDirectionLabel,
  journalEntriesCount,
  journalExportArchive,
  journalFieldConfidence,
  journalFieldEmotionOptional,
  journalFieldReasoning,
  journalFieldRiskPerception,
  journalModalDescription,
  journalModalTitle,
  journalNewEntry,
  journalPageDescription,
  journalPageTitle,
  journalReplayPosition,
  journalReplayToggle,
  journalSaveEntry,
  journalTransitionCapture,
  journalEmptyPrimary,
  journalEmptySecondary,
  journalEmptyTitle,
  journalListEyebrow,
  journalLinkedSnapshotPrefix,
  journalLayerStateShift,
  journalLayerStructural,
  journalLayerPosture,
  journalLayerInvalidation,
  journalLayerScenario,
  journalLegacyNoLayers,
} from "@/lib/i18n/trust-surface";
import { cn } from "@/lib/utils";
import { useAiCognitionStore } from "@/store/ai-cognition-store";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useMarketStore } from "@/store/market-store";
import { useMemoryStore } from "@/store/memory-store";
import type { JournalDirection, JournalEntry, MemoryPeriodId, MemorySnapshot } from "@/types/memory";
import { useUiPrefsStore, type UiLocale } from "@/store/ui-prefs-store";
import { useShallow } from "zustand/react/shallow";

function nid() {
  return `jrnl-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

function resolveSnapshotPair(
  snapshots: MemorySnapshot[],
  snapshotId: string | undefined,
): { cur: MemorySnapshot | null; prev: MemorySnapshot | null } {
  if (!snapshots.length) return { cur: null, prev: null };
  const cur = snapshotId ? (snapshots.find((s) => s.id === snapshotId) ?? snapshots[0] ?? null) : (snapshots[0] ?? null);
  if (!cur) return { cur: null, prev: null };
  const i = snapshots.findIndex((s) => s.id === cur.id);
  const prev = i >= 0 && i + 1 < snapshots.length ? snapshots[i + 1]! : null;
  return { cur, prev };
}

function CognitiveBlock({
  locale,
  layers,
}: {
  locale: UiLocale;
  layers: JournalEntry["cognitiveLayers"];
}) {
  if (!layers) {
    return <p className="text-[10px] leading-snug text-ms-faint">{journalLegacyNoLayers(locale)}</p>;
  }
  const rows: ReadonlyArray<readonly [string, string]> = [
    [journalLayerStateShift(locale), layers.stateShift],
    [journalLayerStructural(locale), layers.structuralChange],
    [journalLayerPosture(locale), layers.postureChange],
    [journalLayerInvalidation(locale), layers.invalidationOrConfirmation],
    [journalLayerScenario(locale), layers.scenarioEvolution],
  ];
  return (
    <dl className="min-w-0 space-y-1.5">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-0.5 sm:grid-cols-[minmax(0,7.25rem)_1fr] sm:gap-x-2">
          <dt className="text-[9px] font-medium uppercase tracking-wide text-ms-faint">{k}</dt>
          <dd className="text-[11px] leading-snug text-ms-text">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function JournalWorkspace() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const market = useMarketStore(
    useShallow((s) => ({ symbol: s.symbol, price: s.price, connection: s.connection })),
  );
  const snapshots = useMemoryStore((s) => s.snapshots);
  const journal = useMemoryStore((s) => s.journal);
  const add = useMemoryStore((s) => s.addJournalEntry);
  const addInsight = useMemoryStore((s) => s.addInsight);
  const insights = useMemoryStore((s) => s.insights);

  const derived = useCognitionSimulationStore((s) => s.derived);
  const topScenario = useCognitionSimulationStore((s) => s.topScenario);
  const orch = useAiCognitionStore((s) => s.orchestrator);

  const [period, setPeriod] = useState<MemoryPeriodId>("week");
  const memory = useMarketMemory(period);

  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<JournalDirection>("other");
  const [reasoning, setReasoning] = useState("");
  const [emotion, setEmotion] = useState("");
  const [confidencePct, setConfidencePct] = useState<number>(62);
  const [riskPerception, setRiskPerception] = useState<JournalEntry["riskPerception"]>("moderate");

  const [replayOn, setReplayOn] = useState(false);
  const [replayIdx, setReplayIdx] = useState(0);

  const latestSnapshotId = snapshots[0]?.id;
  const canSave = reasoning.trim().length >= 12;

  const chrono = useMemo(
    () => [...memory.journal].sort((a, b) => a.ts - b.ts),
    [memory.journal],
  );
  const displayList = replayOn ? chrono : memory.journal;

  useEffect(() => {
    if (!replayOn || chrono.length === 0) return;
    setReplayIdx((i) => Math.max(0, Math.min(i, chrono.length - 1)));
  }, [replayOn, chrono.length]);

  useEffect(() => {
    const report = deriveJournalInsightReport(locale, snapshots, period);
    if (!report) return;
    const recent = insights[0];
    if (recent && Date.now() - recent.ts < 30 * 60_000) return;
    addInsight(report);
  }, [addInsight, insights, locale, period, snapshots]);

  const previewLayers = useMemo(() => {
    const { cur, prev } = resolveSnapshotPair(snapshots, latestSnapshotId);
    return deriveJournalCognitiveLayers(
      locale,
      cur,
      prev,
      derived.volTone,
      topScenario.scenarioId,
      orch?.actionBias,
    );
  }, [snapshots, latestSnapshotId, locale, derived.volTone, topScenario.scenarioId, orch?.actionBias]);

  const contextNote = useMemo(() => {
    const snap = snapshots.find((s) => s.id === latestSnapshotId);
    if (!snap) return null;
    return `${journalLinkedSnapshotPrefix(locale)}: ${phaseLabel(locale, snap.phase)} · ${dangerBandLabel(locale, snap.dangerBand)} · ${consensusLabel(locale, snap.consensus)}`;
  }, [latestSnapshotId, snapshots, locale]);

  return (
    <div className="ms-journal-workspace ms-page">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="ms-eyebrow">{pickLocale(locale, "Market memory", "Память рынка")}</p>
          <h2 className="ms-title mt-1 text-ms-text">{journalPageTitle(locale)}</h2>
          <p className="ms-intelligence-summary mt-2 max-w-2xl">{journalPageDescription(locale)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill accent="neutral">{journalEntriesCount(locale, journal.length)}</StatusPill>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              downloadTextFile(`moneyset-archive-${Date.now()}.json`, memoryArchiveBody(snapshots, journal));
            }}
          >
            <Download className="size-4" strokeWidth={1.5} />
            {journalExportArchive(locale)}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" strokeWidth={1.5} />
            {journalNewEntry(locale)}
          </Button>
        </div>
      </header>

      <IntelCard variant="inset" className="overflow-hidden p-0">
        <JournalPeriodNav
          active={period}
          onChange={setPeriod}
          snapshotCount={memory.snapshots.length}
          entryCount={memory.journal.length}
        />
      </IntelCard>

      <div className="ms-journal-layout">
        <JournalMemoryPanel bundle={memory} />

        <div className="min-w-0 space-y-3">
          {memory.journal.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-ms-xl border border-ms-border/55 bg-ms-elevated/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <p className="ms-data-label text-ms-faint">{journalListEyebrow(locale)}</p>
              <div className="flex flex-wrap items-center gap-2">
                {replayOn ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      disabled={replayIdx <= 0}
                      onClick={() => setReplayIdx((i) => Math.max(0, i - 1))}
                    >
                      <ChevronLeft className="size-4" strokeWidth={1.5} />
                    </Button>
                    <span className="font-mono text-[11px] tabular-nums text-ms-muted">
                      {journalReplayPosition(locale, replayIdx, displayList.length)}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      disabled={replayIdx >= displayList.length - 1}
                      onClick={() => setReplayIdx((i) => Math.min(displayList.length - 1, i + 1))}
                    >
                      <ChevronRight className="size-4" strokeWidth={1.5} />
                    </Button>
                  </>
                ) : null}
                <Button
                  type="button"
                  variant={replayOn ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setReplayOn((v) => {
                      const next = !v;
                      if (next) setReplayIdx(0);
                      return next;
                    });
                  }}
                >
                  {journalReplayToggle(locale, replayOn)}
                </Button>
              </div>
            </div>
          ) : null}

          {memory.journal.length === 0 ? (
            <div className="rounded-ms-2xl border border-ms-border/40 bg-ms-elevated/10 px-4 py-4 sm:px-5 sm:py-5">
              <p className="ms-data-label text-ms-faint">{journalListEyebrow(locale)}</p>
              <p className="ms-title mt-1 text-ms-text">{journalEmptyTitle(locale)}</p>
              <p className="ms-intelligence-summary mt-2 max-w-2xl">{journalEmptyPrimary(locale)}</p>
              <p className="mt-3 text-[11px] leading-relaxed text-ms-muted sm:text-[12px]">{journalEmptySecondary(locale)}</p>
            </div>
          ) : (
            <div className="ms-journal-feed ms-intel-card ms-intel-card--feed">
              {displayList.map((e, idx) => (
                <JournalEntryCard
                  key={e.id}
                  entry={e}
                  locale={locale}
                  focused={replayOn && idx === replayIdx}
                  dimmed={replayOn && idx !== replayIdx}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={journalModalTitle(locale)} description={journalModalDescription(locale)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["long", "short", "flat", "other"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                className={cn(
                  "ms-focus-ring rounded-ms-md border px-3 py-2 text-[12px] font-medium tracking-tight transition-[color,background-color,border-color] duration-200 ease-out",
                  direction === d ? "border-ms-cognition/50 bg-ms-cognition-dim text-ms-cognition" : "border-ms-border bg-ms-elevated/25 text-ms-muted",
                )}
              >
                {journalDirectionLabel(locale, d)}
              </button>
            ))}
          </div>

          <div>
            <p className="ms-data-label text-ms-faint">{journalFieldReasoning(locale)}</p>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              rows={5}
              className="mt-2 w-full rounded-ms-lg border border-ms-border bg-ms-surface/60 px-3 py-3 text-[13px] text-ms-text outline-none placeholder:text-ms-faint"
              placeholder={pickLocale(
                locale,
                "What structure did you assume? What invalidates it?",
                "Какую структуру заложили? Что её снимает?",
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="ms-data-label text-ms-faint">{journalFieldEmotionOptional(locale)}</p>
              <input
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                className="mt-2 w-full rounded-ms-md border border-ms-border bg-ms-surface/60 px-3 py-2 text-[13px] text-ms-text outline-none placeholder:text-ms-faint"
                placeholder={pickLocale(locale, "State tone (optional)", "Тон состояния (опц.)")}
              />
            </div>
            <div>
              <p className="ms-data-label text-ms-faint">{journalFieldConfidence(locale)}</p>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  min={34}
                  max={94}
                  value={confidencePct}
                  onChange={(e) => setConfidencePct(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-[11px] font-medium text-ms-faint">
                  {confidencePct >= 78
                    ? pickLocale(locale, "High", "Высокая")
                    : confidencePct >= 56
                      ? pickLocale(locale, "Med", "Средняя")
                      : pickLocale(locale, "Low", "Низкая")}
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className="ms-data-label text-ms-faint">{journalFieldRiskPerception(locale)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["calm", "moderate", "elevated", "dangerous"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRiskPerception(r)}
                  className={cn(
                    "ms-focus-ring rounded-ms-pill border px-3 py-2 text-[12px] font-medium tracking-tight transition-[color,background-color,border-color] duration-200 ease-out",
                    riskPerception === r ? "border-ms-warning/45 bg-ms-warning-dim text-ms-warning" : "border-ms-border bg-ms-elevated/25 text-ms-muted",
                  )}
                >
                  {dangerBandLabel(locale, r)}
                </button>
              ))}
            </div>
          </div>

          {contextNote ? (
            <div className="rounded-ms-lg border border-ms-border bg-ms-elevated/20 px-3 py-2 text-[12px] text-ms-muted">
              {contextNote}
            </div>
          ) : null}

          <div className="rounded-ms-lg border border-ms-border/60 bg-ms-elevated/15 px-3 py-2.5">
            <p className="ms-data-label text-ms-faint">{journalTransitionCapture(locale)}</p>
            <div className="mt-2 max-h-[220px] overflow-y-auto">
              <CognitiveBlock locale={locale} layers={previewLayers} />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={!canSave}
              onClick={() => {
                const { cur, prev } = resolveSnapshotPair(snapshots, latestSnapshotId);
                const cognitiveLayers = deriveJournalCognitiveLayers(
                  locale,
                  cur,
                  prev,
                  derived.volTone,
                  topScenario.scenarioId,
                  orch?.actionBias,
                );
                const intelligenceRecord = deriveJournalIntelligenceRecord({
                  locale,
                  snapshot: cur,
                  prevSnapshot: prev,
                  layers: cognitiveLayers,
                  orchestratorLine: orch?.synthesis,
                  executionPosture: orch?.actionBias ?? undefined,
                });
                add({
                  id: nid(),
                  ts: Date.now(),
                  symbol: market.symbol,
                  direction,
                  reasoning: reasoning.trim(),
                  emotion: emotion.trim() || undefined,
                  confidencePct,
                  riskPerception,
                  outcome: "open",
                  snapshotId: latestSnapshotId,
                  cognitiveLayers,
                  intelligenceRecord,
                });
                setReasoning("");
                setEmotion("");
                setDirection("other");
                setOpen(false);
              }}
            >
              {journalSaveEntry(locale)}
            </Button>
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
              {journalCancel(locale)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

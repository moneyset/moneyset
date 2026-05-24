"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { DesktopCognitionPanel } from "@/components/desktop/desktop-cognition-panel";
import { CognitionInstantChips } from "@/components/cognition/cognition-instant-chips";
import { useAgentCognition } from "@/hooks/use-agent-cognition";
import { useExecutionSurface } from "@/hooks/use-execution-surface";
import type { DesktopPanelState } from "@/lib/desktop/desktop-command-orchestrator";
import {
  consensusLabel,
  dangerBandLabel,
  phaseLabel,
  pickLocale,
} from "@/lib/i18n/cognition-dict";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

function PanelMiniViz({ panelId }: { panelId: DesktopPanelState["id"] }) {
  const { latent, derived } = useCognitionSimulationStore(
    useShallow((s) => ({ latent: s.latent, derived: s.derived })),
  );

  const bars = useMemo(() => {
    switch (panelId) {
      case "liquidity":
        return [latent.liquidityStructuralStress, latent.positioningPressure * 0.6];
      case "execution":
        return [latent.volatilityImpulse, derived.dangerScore];
      case "macro":
        return [latent.macroLiquidityBackdrop, latent.positioningPressure * 0.5];
      case "agents":
        return [derived.divergenceIndex, derived.consensusSpreadPct * 0.7];
      case "risk":
        return [derived.dangerScore, latent.liquidityStructuralStress * 0.65];
      case "sentiment":
        return [latent.sentimentThermal, latent.volatilityImpulse * 0.45];
      case "cross":
        return [latent.liquidityStructuralStress * 0.8, derived.divergenceIndex * 0.9];
      case "replay":
        return [derived.divergenceIndex * 0.7, latent.volatilityImpulse * 0.55];
      default:
        return [50, 50];
    }
  }, [panelId, latent, derived]);

  return (
    <div className="ms-desk-panel-viz mt-2 flex h-10 items-end gap-1" aria-hidden>
      {bars.map((v, i) => (
        <span
          key={i}
          className="ms-desk-panel-viz__bar flex-1 rounded-sm bg-ms-cognition/25"
          style={{ height: `${Math.max(18, Math.min(100, v))}%` }}
        />
      ))}
    </div>
  );
}

export function DesktopPanelLiveTile({ panel }: { panel: DesktopPanelState }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const { derived } = useCognitionSimulationStore(useShallow((s) => ({ derived: s.derived })));
  const agents = useAgentCognition();
  const execution = useExecutionSurface();

  const { headline, stateLine } = useMemo(() => {
    switch (panel.id) {
      case "agents":
        return {
          headline: agents.consensusLabel || consensusLabel(locale, derived.consensus),
          stateLine: pickLocale(
            locale,
            `Spread ${Math.round(derived.consensusSpreadPct)}% · divergence ${Math.round(derived.divergenceIndex)}`,
            `Разброс ${Math.round(derived.consensusSpreadPct)}% · дивергенция ${Math.round(derived.divergenceIndex)}`,
          ),
        };
      case "liquidity":
        return {
          headline:
            derived.phase === "liquidity_compression"
              ? pickLocale(locale, "Compression active", "Сжатие активно")
              : pickLocale(locale, "Topology under stress", "Топология под давлением"),
          stateLine: pickLocale(locale, "Structural depth field", "Поле структурной глубины"),
        };
      case "execution":
        return {
          headline: execution.executionHeadline || phaseLabel(locale, derived.phase),
          stateLine: execution.executionPosture.slice(0, 72),
        };
      case "macro":
        return {
          headline: phaseLabel(locale, derived.phase),
          stateLine: pickLocale(locale, "Planetary pressure matrix", "Матрица планетарного давления"),
        };
      case "risk":
        return {
          headline: dangerBandLabel(locale, derived.dangerBand),
          stateLine: pickLocale(locale, "Systemic fragility topology", "Топология системной хрупкости"),
        };
      case "sentiment":
        return {
          headline: pickLocale(locale, "Narrative field", "Поле нарратива"),
          stateLine: pickLocale(locale, "Thermal narrative stress", "Термальное давление нарратива"),
        };
      case "cross":
        return {
          headline: pickLocale(locale, "Contagion watch", "Наблюдение за заражением"),
          stateLine: pickLocale(locale, "Cross-market transmission", "Межрыночная трансмиссия"),
        };
      case "replay":
        return {
          headline: pickLocale(locale, "Temporal intelligence", "Временной интеллект"),
          stateLine: pickLocale(locale, "Synchronized replay cinema", "Синхронизированный реплей"),
        };
      default:
        return { headline: "—", stateLine: "" };
    }
  }, [panel.id, locale, derived, agents, execution]);

  return (
    <DesktopCognitionPanel panel={panel} headline={headline} stateLine={stateLine}>
      <PanelMiniViz panelId={panel.id} />
      {panel.priority !== "ambient" ? <CognitionInstantChips className="mt-2 scale-[0.92] origin-top-left" /> : null}
    </DesktopCognitionPanel>
  );
}

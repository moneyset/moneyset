"use client";

import { useMemo } from "react";

import { SparklineDeltaPair } from "@/components/cognition/sparkline-delta-pair";
import { deriveLiveTemporalSurface } from "@/lib/cognition/temporal-evolution";
import { CognitionPanel } from "@/components/ui/panel";
import { postureTags } from "@/lib/simulation/surface-derive";
import { PLACEHOLDER_MARKET_POSTURE } from "@/lib/simulation/placeholders";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { dominantSummaryLine, localizePostureTag, pickLocale } from "@/lib/i18n/cognition-dict";

export function MarketPosturePlaceholder() {
  const latent = useCognitionSimulationStore((s) => s.latent);
  const dominant = useCognitionSimulationStore((s) => s.dominant);
  const history = useCognitionSimulationStore((s) => s.history);
  const locale = useUiPrefsStore((s) => s.uiLocale);

  const tags = postureTags(latent).map((tag) => localizePostureTag(locale, tag));

  const temporal = useMemo(() => deriveLiveTemporalSurface(locale, history), [locale, history]);

  return (
    <CognitionPanel eyebrow="Posture" accent="cognition" title={PLACEHOLDER_MARKET_POSTURE.title}>
      <p className="ms-posture-title text-ms-cognition">{dominantSummaryLine(locale, dominant.liquidity, dominant.leverage)}</p>
      <p className="mt-3 text-[10px] leading-snug text-ms-faint">
        {tags.join(" · ")}
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-ms-border/20 pt-3 max-md:gap-2 max-md:opacity-[0.88]">
        <div>
          <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Participation", "Участие")}</p>
          <SparklineDeltaPair
            values={temporal.participationSeries}
            tone="flow"
            width={44}
            height={11}
            restrained
            ariaLabel={pickLocale(locale, "Participation pressure window", "Окно давления участия")}
          />
        </div>
        <div>
          <p className="ms-data-label text-ms-faint">{pickLocale(locale, "Liquidity", "Ликвидность")}</p>
          <SparklineDeltaPair
            values={temporal.liquiditySeries}
            tone="warning"
            width={44}
            height={11}
            restrained
            ariaLabel={pickLocale(locale, "Liquidity strain window", "Окно стресса ликвидности")}
          />
        </div>
      </div>
      {temporal.sessionLine ? (
        <p className="mt-3 border-t border-ms-border/15 pt-3 font-mono text-[10px] leading-snug text-ms-faint/90">
          {temporal.sessionLine}
        </p>
      ) : null}
    </CognitionPanel>
  );
}

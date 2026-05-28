"use client";

import type { MarketRegimeState } from "@/lib/intelligence/market-index-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type MarketIndexRegimeHeroProps = {
  regime: MarketRegimeState;
  synthesisLine: string;
  updatedClock: string;
};

export function MarketIndexRegimeHero({ regime, synthesisLine, updatedClock }: MarketIndexRegimeHeroProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <header
      className={cn(
        "ms-market-index-hero",
        regime.tone === "stress" && "ms-market-index-hero--stress",
        regime.tone === "support" && "ms-market-index-hero--support",
      )}
    >
      <div className="ms-market-index-hero__signal" aria-hidden />
      <div className="ms-market-index-hero__grid">
        <div className="ms-market-index-hero__primary">
          <p className="ms-market-index-hero__eyebrow">
            {pickLocale(locale, "Market regime", "Режим рынка")}
          </p>
          <h2 className="ms-intel-primary ms-market-index-hero__regime">{regime.label}</h2>
          <p className="ms-market-index-hero__synthesis">{synthesisLine}</p>
        </div>
        <div className="ms-market-index-hero__secondary">
          <div className="ms-market-index-hero__field">
            <p className="ms-market-index-hero__field-label">
              {pickLocale(locale, "Structural state", "Структурное состояние")}
            </p>
            <p className="ms-market-index-hero__field-value">{regime.structuralState}</p>
          </div>
          <div className="ms-market-index-hero__field">
            <p className="ms-market-index-hero__field-label">
              {pickLocale(locale, "Tactical posture", "Тактическая поза")}
            </p>
            <p className="ms-market-index-hero__field-value ms-market-index-hero__field-value--posture">
              {regime.tacticalPosture}
            </p>
          </div>
        </div>
      </div>
      <p className="ms-market-index-hero__clock">{updatedClock}</p>
    </header>
  );
}

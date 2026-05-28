"use client";

import { MarketIndexMetricCard } from "@/components/market-index/market-index-metric-card";
import { MarketIndexMetricDetail } from "@/components/market-index/market-index-metric-detail";
import { MarketIndexRegimeHero } from "@/components/market-index/market-index-regime-hero";
import { useMapFocus } from "@/hooks/use-map-focus";
import { useMarketIndex } from "@/hooks/use-market-index";
import type { MarketIndexMetricId } from "@/lib/intelligence/market-index-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function MarketIndexWorkspace() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const bundle = useMarketIndex();
  const { activeId, toggle, clear, containerRef } = useMapFocus<MarketIndexMetricId>();

  const activeMetric = activeId ? bundle.metrics.find((m) => m.id === activeId) : null;

  return (
    <section className="ms-market-index" ref={containerRef}>
      <MarketIndexRegimeHero
        regime={bundle.regime}
        synthesisLine={bundle.synthesisLine}
        updatedClock={bundle.updatedClock}
      />

      <div className="ms-market-index__metrics-header">
        <h3 className="ms-market-index__metrics-title">
          {pickLocale(locale, "Intelligence index", "Индекс интеллекта")}
        </h3>
        <p className="ms-market-index__metrics-hint">
          {pickLocale(locale, "Tap a metric for structural read", "Нажмите метрику для структурного прочтения")}
        </p>
      </div>

      <div className="ms-market-index__grid" role="list">
        {bundle.metrics.map((metric) => (
          <div key={metric.id} role="listitem">
            <MarketIndexMetricCard
              metric={metric}
              active={activeId === metric.id}
              onToggle={() => toggle(metric.id)}
            />
          </div>
        ))}
      </div>

      {activeMetric ? (
        <MarketIndexMetricDetail metric={activeMetric} onClose={clear} />
      ) : null}
    </section>
  );
}

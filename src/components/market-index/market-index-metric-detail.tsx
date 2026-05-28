"use client";

import { IntelDetailCard } from "@/components/ui/intel-detail-card";
import type { MarketIndexMetric } from "@/lib/intelligence/market-index-engine";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

type MarketIndexMetricDetailProps = {
  metric: MarketIndexMetric;
  onClose: () => void;
};

export function MarketIndexMetricDetail({ metric, onClose }: MarketIndexMetricDetailProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  const tone = metric.id === "risk" ? "stress" : metric.id === "sponsorship" ? "support" : "neutral";

  return (
    <IntelDetailCard
      id={`ms-market-index-detail-${metric.id}`}
      className="ms-market-index-detail"
      title={metric.label}
      kindLabel={pickLocale(locale, "Intelligence read", "Интеллектуальное прочтение")}
      tone={tone}
      onClose={onClose}
      closeLabel={pickLocale(locale, "Close detail", "Закрыть детали")}
      rows={[
        {
          label: pickLocale(locale, "Structure", "Структура"),
          value: metric.structuralExplanation,
        },
        {
          label: pickLocale(locale, "Implication", "Импликация"),
          value: metric.implication,
        },
        {
          label: pickLocale(locale, "Primary risk", "Главный риск"),
          value: metric.primaryRisk,
          emphasis: true,
        },
        {
          label: pickLocale(locale, "Tactical meaning", "Тактический смысл"),
          value: metric.tacticalMeaning,
        },
      ]}
    />
  );
}

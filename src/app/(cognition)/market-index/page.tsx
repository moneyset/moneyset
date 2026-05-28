"use client";

import { CognitionWorldFrame } from "@/components/cognition/cognition-world-frame";
import { WorldSurfaceChrome } from "@/components/cognition/world-surface-chrome";
import { MarketIndexWorkspace } from "@/components/market-index/market-index-workspace";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function MarketIndexPage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <CognitionWorldFrame world="macro" className="ms-page ms-cognition-surface relative">
      <WorldSurfaceChrome
        world="macro"
        eyebrow={pickLocale(locale, "Synthesis", "Синтез")}
        title={pickLocale(locale, "Market Index", "Market Index")}
        subtitle={pickLocale(
          locale,
          "Regime · consensus · structural intelligence — one desk read",
          "Режим · консенсус · структурный интеллект — одно прочтение стола",
        )}
      />
      <MarketIndexWorkspace />
    </CognitionWorldFrame>
  );
}

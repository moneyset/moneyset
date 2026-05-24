"use client";

import { CognitionNavRail } from "@/components/cognition/cognition-nav-rail";
import { MarketMemoryConstellation } from "@/components/memory/market-memory-constellation";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { cn } from "@/lib/utils";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function StrategyMemoryWorkspace({ className }: { className?: string }) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <section
      id="strategy-memory-workspace"
      data-ms-focus
      className={cn("ms-memory-system scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)]", className)}
      aria-label={pickLocale(locale, "Strategy memory archive", "Архив памяти стратегии")}
    >
      <MarketMemoryConstellation />
      <CognitionNavRail className="mt-6" links={[{ href: "/replay", labelEn: "Replay", labelRu: "Реплей" }]} />
    </section>
  );
}

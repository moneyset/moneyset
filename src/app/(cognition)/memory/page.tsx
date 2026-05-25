"use client";

import { PlatformAccessGate } from "@/components/access/platform-access-gate";
import { CognitionWorldFrame } from "@/components/cognition/cognition-world-frame";
import { WorldSurfaceChrome } from "@/components/cognition/world-surface-chrome";
import { MemoryArchiveSection } from "@/components/memory/memory-archive-section";
import { StrategyMemoryWorkspace } from "@/components/memory/strategy-memory-workspace";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function MemoryPage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  return (
    <CognitionWorldFrame world="memory" className="ms-page ms-cognition-surface relative">
      <WorldSurfaceChrome
        world="memory"
        eyebrow={pickLocale(locale, "Constellation", "Созвездие")}
        title={pickLocale(locale, "Strategy memory", "Память стратегии")}
        subtitle={pickLocale(
          locale,
          "Pattern resonance · temporal lineage · survival intel",
          "Резонанс паттернов · временная линия · интеллект выживания",
        )}
      />
      <PlatformAccessGate
        capability="marketMemory"
        titleEn="Market memory"
        titleRu="Память рынка"
        bodyEn="See how similar structures resolved historically — recall prior scenarios and track how the current read compares to past turning points."
        bodyRu="Как похожие структуры разрешались исторически — вызывайте предыдущие сценарии и сравнивайте текущее прочтение с прошлыми переломными моментами."
      >
        <>
          <StrategyMemoryWorkspace />
          <details className="group mt-8 rounded-ms-xl border border-ms-border/20 bg-ms-surface/5">
            <summary className="ms-focus-ring cursor-pointer list-none px-4 py-3 text-[11px] font-medium text-ms-text sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className="mr-1.5 inline-block text-ms-faint transition-transform group-open:rotate-90" aria-hidden>
                ›
              </span>
              {pickLocale(locale, "Local audit archive (snapshots)", "Локальный аудит-архив (снимки)")}
            </summary>
            <div className="border-t border-ms-border/15 px-3 py-4 sm:px-4">
              <MemoryArchiveSection />
            </div>
          </details>
        </>
      </PlatformAccessGate>
    </CognitionWorldFrame>
  );
}

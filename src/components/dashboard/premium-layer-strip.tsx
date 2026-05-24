"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import { useUpgradeModalStore } from "@/store/upgrade-modal-store";

export function PremiumLayerStrip({ className }: { className?: string }) {
  const t = useT();
  const openUpgrade = useUpgradeModalStore((s) => s.openUpgrade);
  return (
    <section
      className={cn(
        "scroll-mt-[calc(var(--ms-intel-bar-height)+0.5rem)] rounded-ms-xl bg-ms-elevated/22 px-5 py-5 sm:px-7 sm:py-6",
        className,
      )}
    >
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="ms-data-label text-ms-faint">{t("premium.reserved")}</p>
          <p className="ms-title text-ms-text">{t("premium.title")}</p>
          <p className="mt-1 max-w-md text-[10px] leading-snug text-ms-faint">{t("premium.preview")}</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={openUpgrade}>
          {t("premium.cta")}
        </Button>
      </div>
    </section>
  );
}

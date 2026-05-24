"use client";

import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { useShellStore } from "@/store/shell-store";
import { msTransition } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function MobileNavOverlay() {
  const open = useShellStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useShellStore((s) => s.setMobileNavOpen);
  const locale = useUiPrefsStore((s) => s.uiLocale);

  return (
    <AnimatePresence>
      {open ? (
        <m.div
          className="fixed inset-0 z-40 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={msTransition.fast}
        >
          <button
            type="button"
            className="absolute inset-0 bg-ms-overlay backdrop-blur-sm"
            aria-label={pickLocale(locale, "Close navigation", "Закрыть навигацию")}
            onClick={() => setMobileNavOpen(false)}
          />
          <m.div
            initial={{ x: "-104%" }}
            animate={{ x: 0 }}
            exit={{ x: "-104%" }}
            transition={msTransition.medium}
            className={cn(
              "absolute left-0 top-0 flex h-full w-[min(88vw,var(--ms-sidebar-width))] flex-col",
              "border-r border-ms-border bg-ms-elevated shadow-ms-md",
            )}
          >
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <AppSidebar className="w-full min-w-0 flex-1 border-0" />
            </div>
            <div className="shrink-0 border-t border-ms-border p-3">
              <Link
                href="/settings#preferences-appearance"
                onClick={() => setMobileNavOpen(false)}
                className="ms-focus-ring block rounded-ms-md border border-ms-border/60 bg-ms-surface/40 px-3 py-2.5 text-center text-[12px] font-medium text-ms-text transition-colors hover:border-ms-border-mid hover:bg-ms-surface/55"
              >
                {pickLocale(locale, "Language & preferences", "Язык и настройки")}
              </Link>
              <p className="mt-2 text-center text-[10px] leading-snug text-ms-faint">
                {pickLocale(locale, "Theme, density, motion, and alerts live here.", "Тема, плотность, движение и оповещения — здесь.")}
              </p>
            </div>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}

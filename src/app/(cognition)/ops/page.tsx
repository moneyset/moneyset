"use client";

import { OperationalFeed } from "@/components/dashboard/operational-feed";
import { SurfaceChrome } from "@/components/surfaces/surface-chrome";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function OpsSurfacePage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  return (
    <div className="ms-page ms-cognition-surface relative">
      <SurfaceChrome
        tone="support"
        eyebrow={pickLocale(locale, "Workspace", "Рабочая область")}
        title={pickLocale(locale, "Ops", "Операции")}
        subtitle={pickLocale(
          locale,
          "Live structural evolution — timeline, execution drift, sessions, pressure, regime.",
          "Живая структурная эволюция — шкала времени, исполнение, сессии, давление, режим.",
        )}
      />
      <OperationalFeed />
    </div>
  );
}

"use client";

import { ScenariosWorkspace } from "@/components/scenarios/scenarios-workspace";
import { SurfaceChrome } from "@/components/surfaces/surface-chrome";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export default function ScenariosSurfacePage() {
  const locale = useUiPrefsStore((s) => s.uiLocale);
  return (
    <div className="ms-page ms-cognition-surface relative">
      <SurfaceChrome
        tone="support"
        eyebrow={pickLocale(locale, "Workspace", "Рабочая область")}
        title={pickLocale(locale, "Scenarios", "Сценарии")}
        subtitle={pickLocale(
          locale,
          "Probabilistic execution framework — paths, conviction drift, triggers, rotation.",
          "Вероятностное исполнение — пути, дрейф убеждённости, триггеры, ротация.",
        )}
      />
      <ScenariosWorkspace />
    </div>
  );
}

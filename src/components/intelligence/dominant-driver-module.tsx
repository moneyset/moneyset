"use client";

import { CognitionPanel } from "@/components/ui/panel";
import { dominantPressureDriverKey, localizeDriverLine, pickLocale } from "@/lib/i18n/cognition-dict";
import { useCognitionSimulationStore } from "@/store/cognition-simulation-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

export function DominantDriverModule() {
  const latent = useCognitionSimulationStore((s) => s.latent);
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const pressure = localizeDriverLine(locale, dominantPressureDriverKey(latent));

  return (
    <CognitionPanel
      eyebrow={pickLocale(locale, "Structure", "Структура")}
      accent="flow"
      title={pickLocale(locale, "Primary pressure", "Ключевое давление")}
    >
      <p className="ms-posture-title text-ms-flow">{pressure}</p>
    </CognitionPanel>
  );
}

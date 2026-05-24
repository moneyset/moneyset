"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useUiPrefsStore, type CognitionDensityMode } from "@/store/ui-prefs-store";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import {
  cognitionOnboardingEyebrow,
  cognitionOnboardingFrames,
  cognitionOnboardingPrefsHint,
  settingsAlertsHelp,
  settingsDensityHelp,
  settingsMotionHelp,
} from "@/lib/i18n/trust-surface";
import { useT } from "@/lib/i18n/use-t";

export function CognitionOnboarding() {
  const t = useT();
  const complete = useUiPrefsStore((s) => s.onboardingComplete);
  const setComplete = useUiPrefsStore((s) => s.setOnboardingComplete);
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const cognitionMode = useUiPrefsStore((s) => s.cognitionMode);
  const setCognitionMode = useUiPrefsStore((s) => s.setCognitionMode);
  const motion = useUiPrefsStore((s) => s.motionIntensity);
  const setMotion = useUiPrefsStore((s) => s.setMotionIntensity);
  const alerts = useUiPrefsStore((s) => s.alertSensitivity);
  const setAlerts = useUiPrefsStore((s) => s.setAlertSensitivity);

  const [step, setStep] = useState(0);
  if (complete) return null;

  const frames = cognitionOnboardingFrames(locale);
  const last = frames.length - 1;
  const isPrefs = step === last;

  return (
    <div
      className="fixed inset-0 z-[56] flex items-end justify-center bg-ms-canvas/92 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12 backdrop-blur-[2px] sm:items-center sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cognition-onboarding-title"
    >
      <div className="max-h-[min(92vh,40rem)] w-full max-w-lg overflow-y-auto rounded-ms-xl border border-ms-border/80 bg-ms-surface/90 shadow-ms-md sm:max-h-[85vh]">
        <div className="border-b border-ms-border/50 px-4 py-3 sm:px-5">
          <p className="ms-data-label text-ms-faint">{cognitionOnboardingEyebrow(locale)}</p>
          <p id="cognition-onboarding-title" className="ms-title mt-1 text-balance text-ms-text">
            {frames[step]?.title}
          </p>
          <p className="mt-1 font-mono text-[10px] tabular-nums text-ms-faint">
            {step + 1}/{frames.length}
          </p>
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <p className="text-[12px] leading-relaxed text-ms-muted sm:text-[13px]">{frames[step]?.body}</p>

          {isPrefs ? (
            <div className="mt-6 space-y-5 border-t border-ms-border/40 pt-5">
              <div>
                <p className="ms-data-label text-ms-faint">{t("onboarding.language")}</p>
                <div className="mt-2">
                  <LanguageSwitcher />
                </div>
              </div>
              <div>
                <p className="ms-data-label text-ms-faint">{t("onboarding.theme")}</p>
                <div className="mt-2">
                  <ThemeToggle />
                </div>
              </div>
              <div>
                <p className="ms-data-label text-ms-faint">{t("onboarding.density")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      { id: "compressed" as const, en: "Compressed", ru: "Сжато" },
                      { id: "strategic" as const, en: "Strategic", ru: "Стратегия" },
                      { id: "deep" as const, en: "Deep", ru: "Глубоко" },
                    ] satisfies Array<{ id: CognitionDensityMode; en: string; ru: string }>
                  ).map(({ id, en, ru }) => (
                    <Button
                      key={id}
                      type="button"
                      size="sm"
                      variant={cognitionMode === id ? "cognition" : "outline"}
                      onClick={() => setCognitionMode(id)}
                    >
                      {pickLocale(locale, en, ru)}
                    </Button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-snug text-ms-faint">{settingsDensityHelp(locale)}</p>
              </div>
              <div>
                <p className="ms-data-label text-ms-faint">{t("onboarding.motion")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={motion === "standard" ? "cognition" : "outline"}
                    onClick={() => setMotion("standard")}
                  >
                    {pickLocale(locale, "Standard", "Стандарт")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={motion === "low" ? "cognition" : "outline"}
                    onClick={() => setMotion("low")}
                  >
                    {pickLocale(locale, "Low", "Низкая")}
                  </Button>
                </div>
                <p className="mt-2 text-[11px] leading-snug text-ms-faint">{settingsMotionHelp(locale)}</p>
              </div>
              <div>
                <p className="ms-data-label text-ms-faint">{t("onboarding.alerts")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["low", "standard", "high"] as const).map((a) => (
                    <Button
                      key={a}
                      type="button"
                      size="sm"
                      variant={alerts === a ? "danger" : "outline"}
                      onClick={() => setAlerts(a)}
                    >
                      {a === "low"
                        ? pickLocale(locale, "Low", "Низко")
                        : a === "standard"
                          ? pickLocale(locale, "Standard", "Стандарт")
                          : pickLocale(locale, "High", "Высоко")}
                    </Button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-snug text-ms-faint">{settingsAlertsHelp(locale)}</p>
              </div>
              <p className="text-[11px] leading-snug text-ms-faint">{cognitionOnboardingPrefsHint(locale)}</p>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-ms-border/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          {step > 0 ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))}>
              {t("onboarding.back")}
            </Button>
          ) : (
            <span className="hidden min-h-[2rem] sm:block sm:w-16" aria-hidden />
          )}
          {step < last ? (
            <Button type="button" variant="outline" size="sm" className="sm:min-w-[7rem]" onClick={() => setStep((s) => s + 1)}>
              {t("onboarding.continue")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="sm:min-w-[7rem]"
              onClick={() => {
                setComplete(true);
              }}
            >
              {t("onboarding.finish")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

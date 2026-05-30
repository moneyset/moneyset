"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

import { CognitionPanel } from "@/components/ui/panel";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { StatusPill } from "@/components/ui/status-pill";
import { useAccessStore } from "@/store/access-store";
import { useExtendedCognitionAccess } from "@/hooks/use-extended-cognition-access";
import { useProfileCenterStore } from "@/store/profile-center-store";
import { useAuthModalStore } from "@/store/auth-modal-store";
import { useAuthStore } from "@/store/auth-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { trialAccessEndsLine } from "@/lib/i18n/trust-surface";
import { Button } from "@/components/ui/button";
import { InvitationAdminPanel } from "@/components/settings/invitation-admin-panel";
import { TelegramSettingsCard } from "@/components/settings/telegram-settings-card";
import { accessTierLabel } from "@/lib/access/capabilities";
import type { CognitionDensityMode } from "@/store/ui-prefs-store";
import {
  settingsAlertsHelp,
  settingsDensityHelp,
  settingsMotionHelp,
  settingsLead,
} from "@/lib/i18n/trust-surface";
import { pickLocale } from "@/lib/i18n/cognition-dict";

export function SettingsPanel() {
  const profile = useAccessStore((s) => s.profile);
  const trialEndsAtTs = useAccessStore((s) => s.trialEndsAtTs);
  const extended = useExtendedCognitionAccess();
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const openProfileCenter = useProfileCenterStore((s) => s.openProfileCenter);
  const openAuth = useAuthModalStore((s) => s.openAuth);
  const signedIn = useAuthStore((s) => s.status === "signed_in");

  const cognitionMode = useUiPrefsStore((s) => s.cognitionMode);
  const setCognitionMode = useUiPrefsStore((s) => s.setCognitionMode);
  const motion = useUiPrefsStore((s) => s.motionIntensity);
  const setMotion = useUiPrefsStore((s) => s.setMotionIntensity);
  const alerts = useUiPrefsStore((s) => s.alertSensitivity);
  const setAlerts = useUiPrefsStore((s) => s.setAlertSensitivity);
  const chartVisualDensity = useUiPrefsStore((s) => s.chartVisualDensity);
  const setChartVisualDensity = useUiPrefsStore((s) => s.setChartVisualDensity);
  const showMobileNavLabels = useUiPrefsStore((s) => s.showMobileNavLabels);
  const setShowMobileNavLabels = useUiPrefsStore((s) => s.setShowMobileNavLabels);
  const replayMobileDetail = useUiPrefsStore((s) => s.replayMobileDetail);
  const setReplayMobileDetail = useUiPrefsStore((s) => s.setReplayMobileDetail);

  const accessLabel = accessTierLabel(profile);
  const tierLabel =
    accessLabel === "founding"
      ? pickLocale(locale, "Founding", "Founding")
      : accessLabel === "invitation"
        ? pickLocale(locale, "Invitation", "Приглашение")
        : accessLabel === "admin"
          ? pickLocale(locale, "Admin", "Админ")
          : extended
            ? pickLocale(locale, "Evaluation", "Оценка")
            : pickLocale(locale, "Free access", "Бесплатный доступ");

  return (
    <div className="ms-page ms-cognition-surface max-w-[64rem]">
      <div className="mb-[var(--ms-section-gap)] flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-medium text-ms-faint">{pickLocale(locale, "Workspace", "Рабочее пространство")}</p>
          <h1 className="mt-1 text-[1.35rem] font-semibold leading-tight tracking-tight text-ms-text sm:text-[1.5rem]">
            {pickLocale(locale, "Preferences", "Настройки")}
          </h1>
          <p className="ms-intelligence-summary mt-2 max-w-2xl text-[13px] leading-relaxed text-ms-muted">{settingsLead(locale)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill accent={extended ? "warning" : "neutral"}>{tierLabel}</StatusPill>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => (signedIn ? openProfileCenter("access") : openAuth())}
          >
            {pickLocale(locale, "Access & billing", "Доступ и оплата")}
          </Button>
        </div>
      </div>

      {trialEndsAtTs != null && trialEndsAtTs > Date.now() ? (
        <p className="mb-6 rounded-ms-lg border border-ms-border/40 bg-ms-elevated/12 px-3 py-2 font-mono text-[11px] text-ms-muted">
          {trialAccessEndsLine(locale, trialEndsAtTs)}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-[var(--ms-block-gap)] lg:grid-cols-2">
        <CognitionPanel
          id="preferences-account"
          eyebrow={pickLocale(locale, "Identity", "Идентичность")}
          accent="neutral"
          title={pickLocale(locale, "Account center", "Центр аккаунта")}
        >
          <p className="text-[12px] leading-relaxed text-ms-muted">
            {pickLocale(
              locale,
              "Sign in, billing, access tier, and sign out — one surface, no duplicate panels.",
              "Вход, оплата, уровень доступа и выход — одна поверхность, без дублирования.",
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => openProfileCenter("overview")}
          >
            {pickLocale(locale, "Open account center", "Открыть центр аккаунта")}
          </Button>
        </CognitionPanel>

        <CognitionPanel
          id="preferences-appearance"
          eyebrow={pickLocale(locale, "Localization", "Локализация")}
          accent="cognition"
          title={pickLocale(locale, "Language & theme", "Язык и тема")}
        >
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <p className="mt-4 text-[11px] leading-snug text-ms-muted">
            {pickLocale(locale, "Cognition copy follows this locale — operational, not marketing.", "Копия следует языку — операционно, не маркетинг.")}
          </p>
        </CognitionPanel>

        <CognitionPanel
          id="preferences-density"
          eyebrow={pickLocale(locale, "Cognition", "Познание")}
          accent="flow"
          title={pickLocale(locale, "Information depth", "Глубина информации")}
        >
          <div className="mt-1 flex flex-wrap gap-2">
            {(
              [
                { id: "compressed" as const, label: pickLocale(locale, "Minimal", "Минимум") },
                { id: "strategic" as const, label: pickLocale(locale, "Strategic", "Стратегия") },
                { id: "deep" as const, label: pickLocale(locale, "Deep", "Глубоко") },
              ] satisfies Array<{ id: CognitionDensityMode; label: string }>
            ).map(({ id, label }) => (
              <Button key={id} type="button" variant={cognitionMode === id ? "cognition" : "outline"} size="sm" onClick={() => setCognitionMode(id)}>
                {label}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ms-muted">{settingsDensityHelp(locale)}</p>
        </CognitionPanel>

        <CognitionPanel
          id="preferences-motion"
          eyebrow={pickLocale(locale, "Motion", "Движение")}
          accent="sentiment"
          title={pickLocale(locale, "Motion intensity", "Интенсивность движения")}
        >
          <div className="mt-1 flex flex-wrap gap-2">
            <Button type="button" variant={motion === "standard" ? "cognition" : "outline"} size="sm" onClick={() => setMotion("standard")}>
              {pickLocale(locale, "Standard", "Стандарт")}
            </Button>
            <Button type="button" variant={motion === "low" ? "cognition" : "outline"} size="sm" onClick={() => setMotion("low")}>
              {pickLocale(locale, "Low", "Низкая")}
            </Button>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ms-muted">{settingsMotionHelp(locale)}</p>
        </CognitionPanel>

        <CognitionPanel
          id="preferences-alerts"
          eyebrow={pickLocale(locale, "Risk", "Риск")}
          accent="danger"
          title={pickLocale(locale, "Execution alert sensitivity", "Чувствительность оповещений")}
        >
          <div className="mt-1 flex flex-wrap gap-2">
            <Button type="button" variant={alerts === "low" ? "danger" : "outline"} size="sm" onClick={() => setAlerts("low")}>
              {pickLocale(locale, "Low", "Низкая")}
            </Button>
            <Button type="button" variant={alerts === "standard" ? "danger" : "outline"} size="sm" onClick={() => setAlerts("standard")}>
              {pickLocale(locale, "Standard", "Стандарт")}
            </Button>
            <Button type="button" variant={alerts === "high" ? "danger" : "outline"} size="sm" onClick={() => setAlerts("high")}>
              {pickLocale(locale, "High", "Высокая")}
            </Button>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ms-muted">{settingsAlertsHelp(locale)}</p>
        </CognitionPanel>

        <CognitionPanel
          id="preferences-charts"
          eyebrow={pickLocale(locale, "Labs & maps", "Лабы и карты")}
          accent="neutral"
          title={pickLocale(locale, "Chart display density", "Плотность графиков")}
        >
          <div className="mt-1 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={chartVisualDensity === "standard" ? "cognition" : "outline"}
              size="sm"
              onClick={() => setChartVisualDensity("standard")}
            >
              {pickLocale(locale, "Balanced", "Сбалансировано")}
            </Button>
            <Button
              type="button"
              variant={chartVisualDensity === "compact" ? "cognition" : "outline"}
              size="sm"
              onClick={() => setChartVisualDensity("compact")}
            >
              {pickLocale(locale, "Compact", "Компактно")}
            </Button>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ms-muted">
            {pickLocale(
              locale,
              "Controls default padding and label cadence on chart-heavy modules — not signal logic.",
              "Задаёт отступы и каденцию подписей в модулях с графиками — не логику сигналов.",
            )}
          </p>
        </CognitionPanel>

        <CognitionPanel
          id="preferences-replay"
          eyebrow={pickLocale(locale, "Replay", "Реплей")}
          accent="neutral"
          title={pickLocale(locale, "Replay behavior (mobile)", "Поведение реплея (моб.)")}
        >
          <div className="mt-1 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={replayMobileDetail === "standard" ? "cognition" : "outline"}
              size="sm"
              onClick={() => setReplayMobileDetail("standard")}
            >
              {pickLocale(locale, "Full layers", "Полные слои")}
            </Button>
            <Button
              type="button"
              variant={replayMobileDetail === "reduced" ? "cognition" : "outline"}
              size="sm"
              onClick={() => setReplayMobileDetail("reduced")}
            >
              {pickLocale(locale, "Reduced detail", "Меньше детали")}
            </Button>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ms-muted">
            {pickLocale(
              locale,
              "Affects how much history is expanded by default inside Replay Studio on small screens.",
              "Влияет на объём раскрытой истории в Replay Studio на маленьких экранах.",
            )}
          </p>
        </CognitionPanel>

        <CognitionPanel
          id="preferences-mobile"
          eyebrow={pickLocale(locale, "Mobile", "Мобильный")}
          accent="neutral"
          title={pickLocale(locale, "Bottom navigation", "Нижняя навигация")}
        >
          <div className="mt-1 flex flex-wrap gap-2">
            <Button type="button" variant={showMobileNavLabels ? "cognition" : "outline"} size="sm" onClick={() => setShowMobileNavLabels(true)}>
              {pickLocale(locale, "Labels on", "Подписи вкл.")}
            </Button>
            <Button type="button" variant={!showMobileNavLabels ? "cognition" : "outline"} size="sm" onClick={() => setShowMobileNavLabels(false)}>
              {pickLocale(locale, "Icons only", "Только иконки")}
            </Button>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ms-muted">
            {pickLocale(
              locale,
              "Icons-only mode reduces thumb-nav noise when you already know the surface layout.",
              "Только иконки — меньше шума, если расклад поверхностей уже известен.",
            )}
          </p>
        </CognitionPanel>

        <TelegramSettingsCard />
        <InvitationAdminPanel />
      </div>

      <div className="mt-[var(--ms-section-gap)] flex items-center justify-between gap-3 rounded-ms-xl border border-ms-border/20 bg-ms-elevated/12 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-ms-md border border-ms-border/60 bg-ms-surface/40 text-ms-muted">
            <Settings className="size-4" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-medium text-ms-faint">{pickLocale(locale, "Return", "Возврат")}</p>
            <p className="text-[13px] text-ms-muted">{pickLocale(locale, "Back to operational command.", "К оперативному командному полю.")}</p>
          </div>
        </div>
        <Link
          href="/"
          className="ms-focus-ring rounded-ms-md border border-ms-border/70 bg-ms-surface/45 px-4 py-2 text-[12px] font-medium text-ms-text transition-colors hover:border-ms-border-mid"
        >
          {pickLocale(locale, "Core", "Ядро")}
        </Link>
      </div>
    </div>
  );
}

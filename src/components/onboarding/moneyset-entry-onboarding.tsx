"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { useTelegramAuth } from "@/hooks/use-telegram-auth";
import { openInExternalBrowser, openTelegramMiniApp } from "@/lib/auth/telegram-client";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { msEase, msTransition } from "@/lib/theme/motion";
import { cn } from "@/lib/utils";
import { supabaseBrowser, authCallbackUrl } from "@/lib/supabase/browser";
import { useAuthStore } from "@/store/auth-store";
import { useCheckoutModalStore } from "@/store/checkout-modal-store";
import { useEntryStore } from "@/store/entry-store";
import { useUiPrefsStore, type UiLocale } from "@/store/ui-prefs-store";

const TOTAL = 5;

/* ─── Screen 1 — Identity ───────────────────────────────────────────────── */
function Screen1({ locale }: { locale: UiLocale }) {
  const benefits = [
    pickLocale(locale, "Live market structure — posture before price", "Живая структура рынка — поза до цены"),
    pickLocale(locale, "Execution layer & invalidation logic", "Слой исполнения и логика снятия"),
    pickLocale(locale, "Founding Access · lifetime depth", "Founding Access · пожизненная глубина"),
  ];

  return (
    <div className="ms-ob__screen ms-ob__screen--identity">
      <p className="ms-ob__wordmark">MONEYSET</p>
      <p className="ms-ob__tag">
        {pickLocale(locale, "Market Structure Before Consensus", "Структура рынка до консенсуса")}
      </p>
      <p className="ms-ob__lead">
        {pickLocale(
          locale,
          "Institutional-grade intelligence for traders who read structure, not noise.",
          "Институциональный интеллект для тех, кто читает структуру, а не шум.",
        )}
      </p>
      <div className="ms-ob__benefits">
        {benefits.map((text) => (
          <div key={text} className="ms-ob__benefit">
            <span className="ms-ob__benefit-dot" aria-hidden />
            <p className="ms-ob__benefit-text">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Screen 2 — What it does ───────────────────────────────────────────── */
function Screen2({ locale }: { locale: UiLocale }) {
  return (
    <div className="ms-ob__screen">
      <p className="ms-ob__eyebrow">
        {pickLocale(locale, "What MONEYSET Does", "Что делает MONEYSET")}
      </p>
      <h2 className="ms-ob__statement">
        {pickLocale(locale, "MONEYSET does not predict markets.", "MONEYSET не предсказывает рынки.")}
      </h2>
      <p className="ms-ob__body">
        {pickLocale(
          locale,
          "It measures the quality of market structure and identifies what strengthens or invalidates active scenarios.",
          "Он измеряет качество рыночной структуры и определяет, что укрепляет или опровергает активные сценарии.",
        )}
      </p>
    </div>
  );
}

/* ─── Screen 3 — How to use it ──────────────────────────────────────────── */
const SECTIONS: Array<{ en: string; ru: string; descEn: string; descRu: string }> = [
  {
    en: "Core",
    ru: "Ядро",
    descEn: "Understand current conditions.",
    descRu: "Понять текущие условия.",
  },
  {
    en: "Execution",
    ru: "Исполнение",
    descEn: "Understand positioning.",
    descRu: "Понять позиционирование.",
  },
  {
    en: "Scenarios",
    ru: "Сценарии",
    descEn: "Understand future paths.",
    descRu: "Понять возможные пути.",
  },
  {
    en: "Agents",
    ru: "Агенты",
    descEn: "Understand agreement and disagreement.",
    descRu: "Понять, где прочтения сходятся и расходятся.",
  },
];

function Screen3({ locale }: { locale: UiLocale }) {
  return (
    <div className="ms-ob__screen">
      <p className="ms-ob__eyebrow">{pickLocale(locale, "How To Use It", "Как пользоваться")}</p>
      <div className="ms-ob__section-list ms-ob__section-list--premium">
        {SECTIONS.map((s, i) => (
          <m.div
            key={s.en}
            className="ms-ob__section-row ms-ob__section-row--premium"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, ease: msEase, delay: 0.06 + i * 0.07 }}
          >
            <p className="ms-ob__section-name">{pickLocale(locale, s.en, s.ru)}</p>
            <p className="ms-ob__section-desc">{pickLocale(locale, s.descEn, s.descRu)}</p>
          </m.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Screen 4 — What changes the picture ───────────────────────────────── */
function Screen4({ locale }: { locale: UiLocale }) {
  return (
    <div className="ms-ob__screen">
      <p className="ms-ob__eyebrow">
        {pickLocale(locale, "What Changes The Picture", "Что меняет картину")}
      </p>
      <p className="ms-ob__contrast">
        {pickLocale(locale, "Most analysis explains a view.", "Большинство аналитики объясняет точку зрения.")}
      </p>
      <h2 className="ms-ob__statement ms-ob__statement--emphasis">
        {pickLocale(
          locale,
          "MONEYSET explains what would invalidate that view.",
          "MONEYSET объясняет, что опровергнет эту точку зрения.",
        )}
      </h2>
      <p className="ms-ob__advantage">
        {pickLocale(locale, "This is the core advantage.", "Это ключевое преимущество.")}
      </p>
    </div>
  );
}

/* ─── Screen 5 — Ready ──────────────────────────────────────────────────── */
function Screen5({
  locale,
  onEnter,
  onUpgrade,
  onTelegram,
  onGoogle,
  busy,
  inTelegram,
  hasInitData,
}: {
  locale: UiLocale;
  onEnter: () => void;
  onUpgrade: () => void;
  onTelegram: () => void;
  onGoogle: () => void;
  busy: boolean;
  inTelegram: boolean;
  hasInitData: boolean;
}) {
  const showTelegramCta = inTelegram || hasInitData;

  return (
    <div className="ms-ob__screen ms-ob__screen--ready">
      <p className="ms-ob__eyebrow">{pickLocale(locale, "Ready", "Готово")}</p>
      <p className="ms-ob__ready-label">MONEYSET</p>

      <div className="ms-ob__auth-stack">
        {/* Primary — Telegram (if inside Mini App) */}
        {showTelegramCta ? (
          <button
            type="button"
            disabled={busy}
            onClick={onTelegram}
            className="ms-ob__auth-btn ms-ob__auth-btn--primary ms-focus-ring"
          >
            <span className="ms-ob__auth-btn-icon" aria-hidden>✈</span>
            {pickLocale(locale, "Continue with Telegram", "Продолжить через Telegram")}
          </button>
        ) : null}

        {/* Primary/Secondary — Enter as guest (if not in Telegram) or secondary */}
        <button
          type="button"
          disabled={busy}
          onClick={onEnter}
          className={cn(
            "ms-ob__auth-btn ms-focus-ring",
            showTelegramCta ? "ms-ob__auth-btn--secondary" : "ms-ob__auth-btn--primary",
          )}
        >
          {pickLocale(locale, "Enter MONEYSET", "Войти в MONEYSET")}
        </button>

        {/* Google — always available */}
        <button
          type="button"
          disabled={busy}
          onClick={onGoogle}
          className="ms-ob__auth-btn ms-ob__auth-btn--secondary ms-focus-ring"
        >
          <span className="ms-ob__auth-btn-icon" aria-hidden>G</span>
          {pickLocale(locale, "Continue with Google", "Продолжить через Google")}
        </button>

        {/* Telegram — open Mini App if not already inside */}
        {!showTelegramCta ? (
          <button
            type="button"
            disabled={busy}
            onClick={onTelegram}
            className="ms-ob__telegram ms-focus-ring"
          >
            {pickLocale(locale, "Open in Telegram Mini App", "Открыть в Telegram Mini App")}
          </button>
        ) : null}

        {/* Upgrade link */}
        <button
          type="button"
          disabled={busy}
          onClick={onUpgrade}
          className="ms-ob__upgrade-cta ms-focus-ring"
        >
          {pickLocale(locale, "Founding Access — $149", "Founding Access — $149")}
        </button>
      </div>
    </div>
  );
}

/* ─── Root ──────────────────────────────────────────────────────────────── */
export function MoneysetEntryOnboarding() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [googleBusy, setGoogleBusy] = useState(false);
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const entryComplete = useEntryStore((s) => s.entryComplete);
  const completeEntry = useEntryStore((s) => s.completeEntry);
  const setGuest = useAuthStore((s) => s.setGuest);
  const openCheckout = useCheckoutModalStore((s) => s.openCheckout);
  const { signInWithTelegram, busy: telegramBusy, hasInitData } = useTelegramAuth();
  const inTelegram = hasInitData;
  const sb = useMemo(() => (typeof window !== "undefined" ? supabaseBrowser() : null), []);

  useEffect(() => setMounted(true), []);

  if (!mounted || entryComplete) return null;
  if (inTelegram && hasInitData) return null;

  const busy = telegramBusy || googleBusy;

  const enter = () => {
    setGuest();
    completeEntry("guest");
  };

  const enterWithUpgrade = () => {
    setGuest();
    completeEntry("guest");
    openCheckout("founding_access");
  };

  const openTelegram = async () => {
    if (inTelegram && hasInitData) {
      await signInWithTelegram();
      return;
    }
    openTelegramMiniApp();
  };

  const continueWithGoogle = async () => {
    if (inTelegram) {
      openInExternalBrowser(`${window.location.origin}/auth`);
      return;
    }
    if (!sb) return;
    setGoogleBusy(true);
    try {
      await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: authCallbackUrl() },
      });
    } finally {
      setGoogleBusy(false);
    }
  };

  const isLast = step === TOTAL - 1;

  return (
    <m.div
      className="ms-ob ms-ob--premium"
      role="dialog"
      aria-modal="true"
      aria-label={pickLocale(locale, "MONEYSET onboarding", "Вступление MONEYSET")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={msTransition.slow}
    >
      {/* Progress rail */}
      <div className="ms-ob__progress" aria-hidden>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "ms-ob__progress-tick",
              i < step && "ms-ob__progress-tick--past",
              i === step && "ms-ob__progress-tick--active",
            )}
          />
        ))}
      </div>

      {/* Step counter */}
      <div
        className="ms-ob__counter"
        aria-label={pickLocale(locale, `Step ${step + 1} of ${TOTAL}`, `Шаг ${step + 1} из ${TOTAL}`)}
      >
        <span className="font-mono text-[10px] tabular-nums text-ms-faint/70">
          {String(step + 1).padStart(2, "0")}&thinsp;/&thinsp;{String(TOTAL).padStart(2, "0")}
        </span>
      </div>

      {/* Screen content */}
      <div className="ms-ob__scroll">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={step}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: msEase }}
            className="ms-ob__content"
          >
            {step === 0 && <Screen1 locale={locale} />}
            {step === 1 && <Screen2 locale={locale} />}
            {step === 2 && <Screen3 locale={locale} />}
            {step === 3 && <Screen4 locale={locale} />}
            {step === 4 && (
              <Screen5
                locale={locale}
                onEnter={enter}
                onUpgrade={enterWithUpgrade}
                onTelegram={() => void openTelegram()}
                onGoogle={() => void continueWithGoogle()}
                busy={busy}
                inTelegram={inTelegram}
                hasInitData={hasInitData}
              />
            )}
          </m.div>
        </AnimatePresence>
      </div>

      {/* Navigation — hidden on last screen */}
      {!isLast && (
        <nav
          className="ms-ob__nav"
          aria-label={pickLocale(locale, "Onboarding navigation", "Навигация")}
        >
          {step > 0 ? (
            <button
              type="button"
              className="ms-ob__nav-back ms-focus-ring"
              onClick={() => setStep((s) => s - 1)}
            >
              {pickLocale(locale, "Back", "Назад")}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="ms-ob__nav-next ms-focus-ring"
            onClick={() => setStep((s) => s + 1)}
          >
            {pickLocale(locale, "Continue", "Далее")}
          </button>
        </nav>
      )}
    </m.div>
  );
}

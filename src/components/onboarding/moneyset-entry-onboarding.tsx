"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";

import { useTelegramAuth } from "@/hooks/use-telegram-auth";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import { msEase, msTransition } from "@/lib/theme/motion";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useCheckoutModalStore } from "@/store/checkout-modal-store";
import { useEntryStore } from "@/store/entry-store";
import { useUiPrefsStore, type UiLocale } from "@/store/ui-prefs-store";

const TOTAL = 6;

function isTelegramWebApp(): boolean {
  return typeof window !== "undefined" && Boolean(window.Telegram?.WebApp);
}

/* ─── Screen 1 — Identity ───────────────────────────────────────── */
function Screen1({ locale }: { locale: UiLocale }) {
  return (
    <div className="ms-ob__screen ms-ob__screen--identity">
      <p className="ms-ob__wordmark">MONEYSET</p>
      <p className="ms-ob__tag">
        {pickLocale(locale, "Institutional Market Intelligence", "Институциональный рыночный интеллект")}
      </p>
      <p className="ms-ob__lead">
        {pickLocale(
          locale,
          "Understand market structure before consensus.",
          "Понять рыночную структуру до формирования консенсуса.",
        )}
      </p>
      <div className="ms-ob__triad" aria-hidden>
        <span>{pickLocale(locale, "Short.", "Точно.")}</span>
        <span className="ms-ob__triad-sep">·</span>
        <span>{pickLocale(locale, "Powerful.", "Мощно.")}</span>
        <span className="ms-ob__triad-sep">·</span>
        <span>{pickLocale(locale, "Premium.", "Премиально.")}</span>
      </div>
    </div>
  );
}

/* ─── Screen 2 — What it does ───────────────────────────────────── */
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
          "MONEYSET measures the quality of the current market structure and identifies what would strengthen or invalidate the active scenario.",
          "MONEYSET измеряет качество текущей рыночной структуры и определяет, что укрепит или опровергнет активный сценарий.",
        )}
      </p>
    </div>
  );
}

/* ─── Screen 3 — How to use it ──────────────────────────────────── */
const SECTIONS: Array<{ en: string; ru: string; descEn: string; descRu: string }> = [
  {
    en: "Core",
    ru: "Ядро",
    descEn: "Understand the current market state.",
    descRu: "Понять текущее состояние рынка.",
  },
  {
    en: "Execution",
    ru: "Исполнение",
    descEn: "Understand how to position.",
    descRu: "Понять, как позиционироваться.",
  },
  {
    en: "Scenarios",
    ru: "Сценарии",
    descEn: "Understand what could happen next.",
    descRu: "Понять, что может произойти дальше.",
  },
  {
    en: "Agents",
    ru: "Агенты",
    descEn: "Understand where intelligence agrees or disagrees.",
    descRu: "Понять, где прочтения сходятся или расходятся.",
  },
];

function Screen3({ locale }: { locale: UiLocale }) {
  return (
    <div className="ms-ob__screen">
      <p className="ms-ob__eyebrow">{pickLocale(locale, "How To Use It", "Как пользоваться")}</p>
      <div className="ms-ob__section-list">
        {SECTIONS.map((s, i) => (
          <m.div
            key={s.en}
            className="ms-ob__section-row"
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

/* ─── Screen 4 — What changes the picture ───────────────────────── */
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
          "MONEYSET explains what would invalidate the view.",
          "MONEYSET объясняет, что опровергнет эту точку зрения.",
        )}
      </h2>
      <p className="ms-ob__advantage">
        {pickLocale(locale, "This is the core advantage.", "Это ключевое преимущество.")}
      </p>
    </div>
  );
}

/* ─── Screen 5 — How to think ───────────────────────────────────── */
const TRACKS: Array<{ en: string; ru: string }> = [
  { en: "Do not seek certainty.", ru: "Не ищите определённости." },
  { en: "Track structure.", ru: "Следите за структурой." },
  { en: "Track risk.", ru: "Следите за риском." },
  { en: "Track invalidation.", ru: "Следите за снятием." },
  { en: "Track participation.", ru: "Следите за участием." },
];

function Screen5({ locale }: { locale: UiLocale }) {
  return (
    <div className="ms-ob__screen">
      <p className="ms-ob__eyebrow">{pickLocale(locale, "How To Think", "Как думать")}</p>
      <div className="ms-ob__track-list">
        {TRACKS.map((t, i) => (
          <m.p
            key={t.en}
            className={cn(
              "ms-ob__track-item",
              i === 0 && "ms-ob__track-item--lead",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: msEase, delay: 0.05 + i * 0.09 }}
          >
            {pickLocale(locale, t.en, t.ru)}
          </m.p>
        ))}
      </div>
    </div>
  );
}

/* ─── Screen 6 — Ready ──────────────────────────────────────────── */
function Screen6({
  locale,
  onEnter,
  onUpgrade,
  onTelegram,
  busy,
  inTelegram,
  hasInitData,
}: {
  locale: UiLocale;
  onEnter: () => void;
  onUpgrade: () => void;
  onTelegram: () => void;
  busy: boolean;
  inTelegram: boolean;
  hasInitData: boolean;
}) {
  return (
    <div className="ms-ob__screen ms-ob__screen--ready">
      <p className="ms-ob__eyebrow">{pickLocale(locale, "Ready", "Готово")}</p>
      <p className="ms-ob__ready-label">MONEYSET</p>
      <button
        type="button"
        disabled={busy}
        onClick={onEnter}
        className="ms-ob__enter-cta ms-focus-ring"
      >
        {pickLocale(locale, "Enter MONEYSET", "Войти в MONEYSET")}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onUpgrade}
        className="ms-ob__upgrade-cta ms-focus-ring"
      >
        {pickLocale(locale, "Unlock full intelligence", "Открыть полный доступ")}
      </button>
      {inTelegram && !hasInitData ? (
        <p className="ms-ob__footnote">
          {pickLocale(locale, "Awaiting Telegram session…", "Ожидание сессии Telegram…")}
        </p>
      ) : (
        <button
          type="button"
          className="ms-ob__telegram ms-focus-ring"
          disabled={busy}
          onClick={onTelegram}
        >
          {pickLocale(locale, "Open in Telegram", "Открыть в Telegram")}
        </button>
      )}
    </div>
  );
}

/* ─── Root ──────────────────────────────────────────────────────── */
export function MoneysetEntryOnboarding() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const entryComplete = useEntryStore((s) => s.entryComplete);
  const completeEntry = useEntryStore((s) => s.completeEntry);
  const setGuest = useAuthStore((s) => s.setGuest);
  const openCheckout = useCheckoutModalStore((s) => s.openCheckout);
  const { signInWithTelegram, busy, hasInitData } = useTelegramAuth();
  const inTelegram = isTelegramWebApp();

  useEffect(() => setMounted(true), []);

  if (!mounted || entryComplete) return null;

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
    const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim();
    window.open(bot ? `https://t.me/${bot}` : "https://t.me", "_blank", "noopener,noreferrer");
  };

  const isLast = step === TOTAL - 1;

  return (
    <m.div
      className="ms-ob"
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
      <div className="ms-ob__counter" aria-label={pickLocale(locale, `Step ${step + 1} of ${TOTAL}`, `Шаг ${step + 1} из ${TOTAL}`)}>
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
            {step === 4 && <Screen5 locale={locale} />}
            {step === 5 && (
              <Screen6
                locale={locale}
                onEnter={enter}
                onUpgrade={enterWithUpgrade}
                onTelegram={() => void openTelegram()}
                busy={busy}
                inTelegram={inTelegram}
                hasInitData={hasInitData}
              />
            )}
          </m.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {!isLast && (
        <nav className="ms-ob__nav" aria-label={pickLocale(locale, "Onboarding navigation", "Навигация")}>
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

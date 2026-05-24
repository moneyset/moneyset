"use client";

import { m } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useTelegramAuth } from "@/hooks/use-telegram-auth";
import { entryOnboardingCopy } from "@/lib/i18n/trust-surface";
import { msTransition } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useCheckoutModalStore } from "@/store/checkout-modal-store";
import { useEntryStore } from "@/store/entry-store";
import { useUiPrefsStore } from "@/store/ui-prefs-store";

const LOGO_SRC = "/brand/moneyset-logo.png";

function isTelegramWebApp(): boolean {
  return typeof window !== "undefined" && Boolean(window.Telegram?.WebApp);
}

/** Institutional entry — decision-support terminal, not retail onboarding. */
export function MoneysetEntryOnboarding() {
  const [mounted, setMounted] = useState(false);
  const locale = useUiPrefsStore((s) => s.uiLocale);
  const entryComplete = useEntryStore((s) => s.entryComplete);
  const completeEntry = useEntryStore((s) => s.completeEntry);
  const setGuest = useAuthStore((s) => s.setGuest);
  const openCheckout = useCheckoutModalStore((s) => s.openCheckout);
  const { signInWithTelegram, busy, error, hasInitData } = useTelegramAuth();
  const copy = entryOnboardingCopy(locale);
  const inTelegram = isTelegramWebApp();

  useEffect(() => setMounted(true), []);

  if (!mounted || entryComplete) return null;

  const enterWorkspace = () => {
    setGuest();
    completeEntry("guest");
  };

  const accessExecutionIntelligence = () => {
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

  return (
    <m.div
      className="ms-entry-onboarding"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ms-entry-headline"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={msTransition.slow}
    >
      <div className="ms-entry-onboarding__scroll">
        <m.div
          className="ms-entry-onboarding__panel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...msTransition.slow, delay: 0.06 }}
        >
          <div className="ms-entry-onboarding__logo-wrap">
            <Image
              src={LOGO_SRC}
              alt="MONEYSET"
              width={480}
              height={480}
              priority
              className="ms-entry-onboarding__logo"
              sizes="(max-width: 480px) 42vw, 7.5rem"
            />
          </div>

          <p className="ms-entry-onboarding__wordmark">MONEYSET</p>

          <h1 id="ms-entry-headline" className="ms-entry-onboarding__headline">
            {copy.headline}
          </h1>

          <p className="ms-entry-onboarding__subheadline">{copy.subheadline}</p>

          <ul className="ms-entry-onboarding__value-lines" aria-label={copy.subheadline}>
            {copy.valueLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          <div className="ms-entry-onboarding__capabilities" role="list">
            {copy.capabilities.map((cap, i) => (
              <m.div
                key={cap.label}
                role="listitem"
                className="ms-entry-onboarding__capability"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.45, delay: 0.12 + i * 0.06 }}
              >
                <p className="ms-entry-onboarding__capability-label">{cap.label}</p>
                <p className="ms-entry-onboarding__capability-desc">{cap.desc}</p>
              </m.div>
            ))}
          </div>

          <section className="ms-entry-onboarding__access" aria-labelledby="ms-entry-founding">
            <div className="ms-entry-onboarding__access-header">
              <h2 id="ms-entry-founding" className="ms-entry-onboarding__access-title">
                {copy.foundingTitle}
              </h2>
              <p className="ms-entry-onboarding__access-price">{copy.foundingPrice}</p>
            </div>
            <ul className="ms-entry-onboarding__access-bullets">
              {copy.foundingBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </section>

          <div className="ms-entry-onboarding__actions">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "ms-entry-onboarding__cta ms-entry-onboarding__cta--primary",
                "w-full justify-center",
              )}
              disabled={busy}
              onClick={enterWorkspace}
            >
              {copy.enterCta}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="ms-entry-onboarding__cta ms-entry-onboarding__cta--secondary w-full justify-center"
              disabled={busy}
              onClick={accessExecutionIntelligence}
            >
              {copy.accessCta}
            </Button>
          </div>

          {error ? (
            <p className="ms-entry-onboarding__footnote text-ms-warning/90">{error}</p>
          ) : inTelegram && !hasInitData ? (
            <p className="ms-entry-onboarding__footnote">{copy.telegramHint}</p>
          ) : (
            <button
              type="button"
              className="ms-entry-onboarding__telegram ms-focus-ring"
              disabled={busy}
              onClick={() => void openTelegram()}
            >
              {copy.telegramLink}
            </button>
          )}
        </m.div>
      </div>
    </m.div>
  );
}

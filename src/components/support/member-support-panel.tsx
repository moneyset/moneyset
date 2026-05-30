"use client";

import { Headphones, Mail, MessageCircle } from "lucide-react";

import { openInExternalBrowser } from "@/lib/auth/telegram-client";
import { pickLocale } from "@/lib/i18n/cognition-dict";
import {
  MEMBER_SUPPORT_EMAIL,
  MEMBER_SUPPORT_MAILTO,
  MEMBER_SUPPORT_TELEGRAM_URL,
} from "@/lib/support/member-support";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { cn } from "@/lib/utils";

export type MemberSupportVariant = "general" | "concierge" | "compact" | "auth-error" | "payment-error";

type MemberSupportPanelProps = Readonly<{
  variant?: MemberSupportVariant;
  className?: string;
}>;

function SupportTelegramButton({ className, label }: { className?: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => openInExternalBrowser(MEMBER_SUPPORT_TELEGRAM_URL)}
      className={cn("ms-member-support__btn ms-member-support__btn--telegram ms-focus-ring", className)}
    >
      <MessageCircle className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
      {label}
    </button>
  );
}

function SupportEmailButton({ className, label }: { className?: string; label: string }) {
  return (
    <a href={MEMBER_SUPPORT_MAILTO} className={cn("ms-member-support__btn ms-member-support__btn--email ms-focus-ring", className)}>
      <Mail className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
      {label}
    </a>
  );
}

export function MemberSupportPanel({ variant = "general", className }: MemberSupportPanelProps) {
  const locale = useUiPrefsStore((s) => s.uiLocale);

  if (variant === "compact") {
    return (
      <div className={cn("ms-member-support ms-member-support--compact", className)} role="complementary">
        <p className="ms-member-support__eyebrow">
          {pickLocale(locale, "Member Support", "Member Support")}
        </p>
        <div className="ms-member-support__actions ms-member-support__actions--row">
          <SupportTelegramButton label={pickLocale(locale, "Telegram", "Telegram")} />
          <SupportEmailButton label={pickLocale(locale, "Email", "Email")} />
        </div>
      </div>
    );
  }

  if (variant === "auth-error") {
    return (
      <div className={cn("ms-member-support ms-member-support--auth-error", className)} role="complementary">
        <p className="ms-member-support__lead">
          {pickLocale(locale, "Having trouble accessing your account?", "Не получается войти в аккаунт?")}
        </p>
        <p className="ms-member-support__sub">
          {pickLocale(locale, "Private support for members — we respond personally.", "Приватная поддержка для участников — отвечаем лично.")}
        </p>
        <div className="ms-member-support__actions">
          <SupportTelegramButton label={pickLocale(locale, "Contact Support", "Связаться с поддержкой")} />
          <SupportEmailButton label={pickLocale(locale, "Email Support", "Email поддержка")} />
        </div>
      </div>
    );
  }

  if (variant === "payment-error") {
    return (
      <div className={cn("ms-member-support ms-member-support--payment-error", className)} role="complementary">
        <p className="ms-member-support__lead">
          {pickLocale(locale, "Need help with payment?", "Нужна помощь с оплатой?")}
        </p>
        <p className="ms-member-support__sub">
          {pickLocale(locale, "Contact Member Support.", "Свяжитесь с Member Support.")}
        </p>
        <div className="ms-member-support__actions">
          <SupportTelegramButton label={pickLocale(locale, "Telegram Support", "Telegram Support")} />
          <SupportEmailButton label={pickLocale(locale, "Email Support", "Email Support")} />
        </div>
      </div>
    );
  }

  if (variant === "concierge") {
    return (
      <div className={cn("ms-member-support ms-member-support--concierge", className)} role="complementary">
        <div className="ms-member-support__concierge-head">
          <Headphones className="size-4 text-ms-cognition/80" strokeWidth={1.5} aria-hidden />
          <p className="ms-member-support__title">
            {pickLocale(locale, "Help & Support", "Помощь и поддержка")}
          </p>
        </div>
        <p className="ms-member-support__intro">
          {pickLocale(
            locale,
            "Private member concierge — payment, access, and account assistance.",
            "Приватный concierge для участников — оплата, доступ и аккаунт.",
          )}
        </p>
        <ul className="ms-member-support__concierge-list">
          <li>
            <p className="ms-member-support__concierge-label">
              {pickLocale(locale, "Contact Support", "Связаться с поддержкой")}
            </p>
            <div className="ms-member-support__actions ms-member-support__actions--row">
              <SupportTelegramButton label={pickLocale(locale, "Telegram", "Telegram")} />
              <SupportEmailButton label={pickLocale(locale, "Email", "Email")} />
            </div>
          </li>
          <li>
            <p className="ms-member-support__concierge-label">
              {pickLocale(locale, "Payment Assistance", "Помощь с оплатой")}
            </p>
            <p className="ms-member-support__concierge-hint">
              {pickLocale(locale, "Invoice, USDT transfer, or confirmation delays.", "Счёт, перевод USDT или задержка подтверждения.")}
            </p>
          </li>
          <li>
            <p className="ms-member-support__concierge-label">
              {pickLocale(locale, "Account Access Help", "Помощь с доступом")}
            </p>
            <p className="ms-member-support__concierge-hint">
              {pickLocale(locale, "Telegram sign-in, email access, or linking issues.", "Вход через Telegram, email или привязка.")}
            </p>
          </li>
        </ul>
        <p className="ms-member-support__contact-line">
          <span className="text-ms-faint">{MEMBER_SUPPORT_EMAIL}</span>
        </p>
      </div>
    );
  }

  return (
    <div className={cn("ms-member-support ms-member-support--general", className)} role="complementary">
      <p className="ms-member-support__eyebrow">
        {pickLocale(locale, "Need Assistance?", "Нужна помощь?")}
      </p>
      <p className="ms-member-support__intro">
        {pickLocale(locale, "Concierge Support for members.", "Concierge Support для участников.")}
      </p>
      <div className="ms-member-support__actions">
        <SupportTelegramButton label={pickLocale(locale, "Telegram Support", "Telegram Support")} />
        <SupportEmailButton label={pickLocale(locale, "Email Support", "Email Support")} />
      </div>
    </div>
  );
}

import { pickLocale } from "@/lib/i18n/cognition-dict";
import type { UiLocale } from "@/store/ui-prefs-store";

/** Map URL / API auth error codes to premium, human copy. */
export function mapAuthRedirectError(locale: UiLocale, raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const code = raw.trim().toLowerCase();

  const table: Record<string, { en: string; ru: string }> = {
    missing_code: {
      en: "Sign-in was interrupted. Please try again.",
      ru: "Вход был прерван. Попробуйте снова.",
    },
    auth_unconfigured: {
      en: "Sign-in is temporarily unavailable. Try again shortly.",
      ru: "Вход временно недоступен. Попробуйте позже.",
    },
    telegram_unconfigured: {
      en: "Telegram sign-in is temporarily unavailable.",
      ru: "Вход через Telegram временно недоступен.",
    },
    invalid_telegram_login: {
      en: "Telegram could not verify this sign-in. Try again.",
      ru: "Telegram не смог подтвердить вход. Попробуйте снова.",
    },
    telegram_session_failed: {
      en: "We couldn't complete your Telegram session. Try again.",
      ru: "Не удалось завершить сессию Telegram. Попробуйте снова.",
    },
    invalid_credentials: {
      en: "Email or password is incorrect.",
      ru: "Неверный email или пароль.",
    },
    access_denied: {
      en: "Sign-in was cancelled.",
      ru: "Вход был отменён.",
    },
  };

  if (table[code]) return pickLocale(locale, table[code].en, table[code].ru);

  if (code.includes("oauth") || code.includes("provider")) {
    return pickLocale(locale, "Browser sign-in failed. Try again.", "Вход через браузер не удался. Попробуйте снова.");
  }

  if (/^\d{3}$/.test(code) || code.includes("auth_required") || code.includes("unauthorized")) {
    return pickLocale(locale, "Please sign in to continue.", "Войдите, чтобы продолжить.");
  }

  if (raw.length > 80 || raw.includes("_") && !raw.includes(" ")) {
    return pickLocale(locale, "Sign-in could not be completed. Try again.", "Не удалось выполнить вход. Попробуйте снова.");
  }

  return raw;
}

/** Map billing API errors before showing in checkout UI. */
export function mapBillingUserMessage(locale: UiLocale, raw: string | null | undefined): string {
  if (!raw?.trim()) {
    return pickLocale(locale, "Something went wrong. Try again.", "Что-то пошло не так. Попробуйте снова.");
  }

  const lower = raw.toLowerCase();

  if (lower.includes("sign in") || lower.includes("authentication")) {
    return pickLocale(locale, "Sign in to continue to payment.", "Войдите, чтобы перейти к оплате.");
  }
  if (lower.includes("too many")) {
    return pickLocale(locale, "Please wait a moment before trying again.", "Подождите немного перед повторной попыткой.");
  }
  if (lower.includes("insufficient") || lower.includes("amount")) {
    return pickLocale(locale, "Payment amount could not be verified. Contact support if you already paid.", "Сумму оплаты не удалось подтвердить. Если вы уже оплатили — напишите в поддержку.");
  }
  if (lower.includes("not belong") || lower.includes("ownership")) {
    return pickLocale(locale, "This payment belongs to another account.", "Эта оплата привязана к другому аккаунту.");
  }
  if (lower.includes("nowpayments") || lower.includes("provider") || lower.includes("502")) {
    return pickLocale(locale, "Payment service is busy. Try again in a moment.", "Сервис оплаты занят. Попробуйте через минуту.");
  }
  if (lower.includes("missing") || lower.includes("invalid")) {
    return pickLocale(locale, "Could not prepare your order. Try again.", "Не удалось подготовить заказ. Попробуйте снова.");
  }

  return pickLocale(locale, "Payment could not be completed. Try again.", "Оплату не удалось завершить. Попробуйте снова.");
}

/** Map Telegram client/API errors for sign-in surfaces. */
export function mapTelegramAuthError(locale: UiLocale, raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const lower = raw.toLowerCase();

  if (lower.includes("open inside telegram")) {
    return pickLocale(locale, "Open MONEYSET inside Telegram to continue.", "Откройте MONEYSET внутри Telegram, чтобы продолжить.");
  }
  if (lower.includes("invalid telegram") || lower.includes("invalid_init")) {
    return pickLocale(locale, "Telegram session expired. Close and reopen the app.", "Сессия Telegram истекла. Закройте и откройте приложение снова.");
  }
  if (lower.includes("profile_sync") || lower.includes("session")) {
    return pickLocale(locale, "Sign-in almost completed — try once more.", "Вход почти завершён — попробуйте ещё раз.");
  }

  return mapAuthRedirectError(locale, raw) ?? pickLocale(locale, "Telegram sign-in failed. Try again.", "Не удалось войти через Telegram. Попробуйте снова.");
}

/** Friendly auth form errors (email/password/OAuth). */
export function mapAuthFormError(locale: UiLocale, message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return pickLocale(locale, "Email or password is incorrect.", "Неверный email или пароль.");
  }
  if (lower.includes("email not confirmed")) {
    return pickLocale(locale, "Confirm your email before signing in.", "Подтвердите email перед входом.");
  }
  if (lower.includes("user already registered")) {
    return pickLocale(locale, "An account with this email already exists. Try signing in.", "Аккаунт с этим email уже есть. Войдите.");
  }
  if (lower.includes("password")) {
    return pickLocale(locale, "Use at least 8 characters for your password.", "Используйте пароль от 8 символов.");
  }
  if (message.length > 120) {
    return pickLocale(locale, "Could not complete sign-in. Please try again.", "Не удалось выполнить вход. Попробуйте снова.");
  }
  return message;
}

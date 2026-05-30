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
    telegram_oidc_unconfigured: {
      en: "Telegram login is not configured yet. Contact support if this persists.",
      ru: "Вход через Telegram ещё не настроен. Напишите в поддержку, если это не исчезнет.",
    },
    telegram_oidc_denied: {
      en: "Telegram sign-in was cancelled.",
      ru: "Вход через Telegram был отменён.",
    },
    invalid_telegram_oidc: {
      en: "Telegram could not verify this sign-in. Try again.",
      ru: "Telegram не смог подтвердить вход. Попробуйте снова.",
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
export function mapBillingUserMessage(
  locale: UiLocale,
  raw: string | null | undefined,
  ctx?: Readonly<{ httpStatus?: number; phase?: "create" | "poll" }>,
): string {
  const status = ctx?.httpStatus;
  const phase = ctx?.phase ?? "create";

  if (status === 401 || raw?.toLowerCase().includes("authentication required") || raw?.toLowerCase().includes("sign in")) {
    return pickLocale(locale, "Sign in to continue to payment.", "Войдите, чтобы перейти к оплате.");
  }

  if (status === 429 || raw?.toLowerCase().includes("too many")) {
    return pickLocale(locale, "Please wait a moment before trying again.", "Подождите немного перед повторной попыткой.");
  }

  if (!raw?.trim()) {
    if (status === 502 || status === 503) {
      return pickLocale(
        locale,
        phase === "poll"
          ? "Payment status check is temporarily unavailable. Your payment may still be processing."
          : "Billing service is temporarily unavailable. Try again shortly.",
        phase === "poll"
          ? "Проверка статуса оплаты временно недоступна. Оплата может ещё обрабатываться."
          : "Сервис оплаты временно недоступен. Попробуйте через минуту.",
      );
    }
    return pickLocale(locale, "Something went wrong. Try again.", "Что-то пошло не так. Попробуйте снова.");
  }

  const lower = raw.toLowerCase();

  if (lower.includes("not belong") || lower.includes("ownership") || status === 403) {
    return pickLocale(locale, "This payment belongs to another account.", "Эта оплата привязана к другому аккаунту.");
  }

  if (lower.includes("insufficient") || lower.includes("amount")) {
    return pickLocale(
      locale,
      "Payment amount could not be verified. Contact support if you already paid.",
      "Сумму оплаты не удалось подтвердить. Если вы уже оплатили — напишите в поддержку.",
    );
  }

  if (lower.includes("persist payment record") || lower.includes("payment record could not") || lower.includes("access could not be activated")) {
    return pickLocale(
      locale,
      "Your payment was received but access activation failed. Contact Member Support with your invoice ID.",
      "Оплата получена, но активация доступа не удалась. Свяжитесь с Member Support и укажите номер счёта.",
    );
  }

  if (lower.includes("billing service unavailable") || lower.includes("service temporarily unavailable")) {
    return pickLocale(
      locale,
      "Billing is temporarily unavailable on our side. Try again shortly or contact Member Support.",
      "Оплата временно недоступна на нашей стороне. Попробуйте позже или напишите в Member Support.",
    );
  }

  if (lower.includes("payment provider not configured") || lower.includes("not configured")) {
    return pickLocale(
      locale,
      "Crypto checkout is not configured yet. Contact Member Support.",
      "Крипто-оплата ещё не настроена. Свяжитесь с Member Support.",
    );
  }

  // NOWPayments API errors — preserve distinction from internal failures
  if (lower.includes("nowpayments")) {
    const npStatus = raw.match(/\((\d{3})\)/)?.[1];
    if (npStatus === "429" || npStatus === "503" || npStatus === "502" || npStatus === "504") {
      return pickLocale(
        locale,
        "Crypto payment provider is temporarily unavailable. Try again in a few minutes.",
        "Криптопровайдер временно недоступен. Попробуйте через несколько минут.",
      );
    }
    if (npStatus === "401" || npStatus === "403") {
      return pickLocale(
        locale,
        "Crypto checkout is misconfigured. Contact Member Support.",
        "Крипто-оплата настроена некорректно. Свяжитесь с Member Support.",
      );
    }
    return pickLocale(
      locale,
      phase === "poll"
        ? "Could not verify payment with crypto provider. Try again or contact Member Support."
        : "Crypto provider could not create your invoice. Try again in a few minutes.",
      phase === "poll"
        ? "Не удалось проверить оплату у криптопровайдера. Повторите или напишите в Member Support."
        : "Криптопровайдер не смог создать счёт. Попробуйте через несколько минут.",
    );
  }

  if (lower.includes("missing") || lower.includes("invalid") || status === 400) {
    return pickLocale(locale, "Could not prepare your order. Try again.", "Не удалось подготовить заказ. Попробуйте снова.");
  }

  if (status === 502 || status === 503) {
    return pickLocale(
      locale,
      "Billing service is temporarily unavailable. Try again shortly.",
      "Сервис оплаты временно недоступен. Попробуйте через минуту.",
    );
  }

  if (raw.length <= 120 && !raw.includes("_")) {
    return raw;
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

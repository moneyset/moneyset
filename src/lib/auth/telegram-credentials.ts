import { createHmac } from "node:crypto";

const EMAIL_DOMAIN = "telegram.moneyset.app";

export function telegramAuthEmail(telegramId: number): string {
  return `tg_${telegramId}@${EMAIL_DOMAIN}`;
}

/**
 * Deterministic password for Telegram-bridged Supabase accounts.
 *
 * Security contract:
 * - TELEGRAM_AUTH_SECRET is an independent secret — it must NOT be the same
 *   as any Supabase key. It exists only for this HMAC derivation.
 * - In production: throws if the secret is not configured. No silent fallback
 *   to SUPABASE_SERVICE_ROLE_KEY — that would conflate security domains and
 *   expose Supabase admin credentials if the derivation were ever reversed.
 * - In development: falls back to a hard-coded dev seed so local testing works
 *   without the full secret configured.
 */
export function telegramAuthPassword(telegramId: number): string {
  const secret = process.env.TELEGRAM_AUTH_SECRET?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "TELEGRAM_AUTH_SECRET is not configured. " +
        "Set this variable in Vercel Environment Variables. " +
        "Do NOT reuse SUPABASE_SERVICE_ROLE_KEY for this purpose.",
      );
    }
    // Development: use a deterministic seed so local login works without env setup
    return createHmac("sha256", "moneyset-dev-telegram-seed").update(`tg:${telegramId}`).digest("hex");
  }

  return createHmac("sha256", secret).update(`tg:${telegramId}`).digest("hex");
}

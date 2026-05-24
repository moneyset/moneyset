import { createHmac } from "node:crypto";

import { env } from "@/lib/services/shared/env";

const EMAIL_DOMAIN = "telegram.moneyset.app";

export function telegramAuthEmail(telegramId: number): string {
  return `tg_${telegramId}@${EMAIL_DOMAIN}`;
}

/** Deterministic password — only server knows the secret. */
export function telegramAuthPassword(telegramId: number): string {
  const secret = env("TELEGRAM_AUTH_SECRET") ?? env("SUPABASE_SERVICE_ROLE_KEY") ?? "moneyset-dev";
  return createHmac("sha256", secret).update(`tg:${telegramId}`).digest("hex");
}

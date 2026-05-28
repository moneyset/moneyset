import { env } from "@/lib/services/shared/env";

/** Required for production deployment — validated at startup and /api/health. */
export const PRODUCTION_REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_WEBHOOK_SECRET",
  "NOWPAYMENTS_IPN_SECRET",
  "CRON_SECRET",
  "OPENROUTER_API_KEY",
  "NEXT_PUBLIC_SITE_URL",
] as const;

export type EnvValidationResult = Readonly<{
  ok: boolean;
  missing: string[];
  present: Record<string, boolean>;
}>;

export function validateProductionEnv(): EnvValidationResult {
  const missing: string[] = [];
  const present: Record<string, boolean> = {};

  for (const key of PRODUCTION_REQUIRED_ENV) {
    const has = Boolean(env(key));
    present[key] = has;
    if (!has) missing.push(key);
  }

  return { ok: missing.length === 0, missing, present };
}

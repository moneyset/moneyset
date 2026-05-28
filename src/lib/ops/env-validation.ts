import { env, envFirst, isPlaceholderHost, siteOriginFromEnv, vercelSiteOrigin } from "@/lib/services/shared/env";

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

/** Alias accepted when NEXT_PUBLIC_SITE_URL is unset — not a separate required key. */
export const SITE_URL_ENV_ALIASES = ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL"] as const;

export type EnvValidationResult = Readonly<{
  ok: boolean;
  missing: string[];
  invalid: string[];
  present: Record<string, boolean>;
}>;

function validateSiteUrlEnv(): string[] {
  const invalid: string[] = [];
  const raw = envFirst(...SITE_URL_ENV_ALIASES);
  if (!raw) return invalid;

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (isPlaceholderHost(url.hostname)) {
      invalid.push("NEXT_PUBLIC_SITE_URL (placeholder hostname)");
    }
  } catch {
    invalid.push("NEXT_PUBLIC_SITE_URL (malformed URL)");
  }

  return invalid;
}

function validateSupabaseUrlEnv(): string[] {
  const invalid: string[] = [];
  const raw = env("NEXT_PUBLIC_SUPABASE_URL");
  if (!raw) return invalid;

  try {
    const url = new URL(raw);
    if (isPlaceholderHost(url.hostname)) {
      invalid.push("NEXT_PUBLIC_SUPABASE_URL (placeholder hostname)");
    }
  } catch {
    invalid.push("NEXT_PUBLIC_SUPABASE_URL (malformed URL)");
  }

  return invalid;
}

export function validateProductionEnv(): EnvValidationResult {
  const missing: string[] = [];
  const present: Record<string, boolean> = {};

  for (const key of PRODUCTION_REQUIRED_ENV) {
    if (key === "NEXT_PUBLIC_SITE_URL") {
      const hasSite = Boolean(siteOriginFromEnv() || vercelSiteOrigin());
      present[key] = hasSite;
      if (!hasSite) missing.push(key);
      continue;
    }

    const has = Boolean(env(key));
    present[key] = has;
    if (!has) missing.push(key);
  }

  const invalid = [...validateSiteUrlEnv(), ...validateSupabaseUrlEnv()];

  return {
    ok: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    present,
  };
}

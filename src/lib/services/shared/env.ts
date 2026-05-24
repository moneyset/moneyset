/** Server-side env accessors — never log secret values. */

export function env(key: string): string | undefined {
  const v = process.env[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** First defined, non-empty env among keys (left-to-right priority). */
export function envFirst(...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = env(key);
    if (v) return v;
  }
  return undefined;
}

export function requireEnv(key: string): string {
  const v = env(key);
  if (!v) throw new Error(`${key} is not configured`);
  return v;
}

/** Public site origin for OAuth redirects, NOWPayments callbacks, OpenRouter referer. */
export function publicSiteUrl(): string {
  const raw = envFirst("NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL");
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      /* fall through */
    }
  }
  return "http://localhost:3000";
}

/** NOWPayments IPN callback — explicit env or derived from site URL. */
export function nowPaymentsIpnUrl(): string | undefined {
  const explicit = env("NOWPAYMENTS_IPN_URL");
  if (explicit) return explicit;
  if (process.env.NODE_ENV === "development") {
    return `${publicSiteUrl()}/api/billing/webhook`;
  }
  const site = publicSiteUrl();
  if (site.includes("localhost")) return undefined;
  return `${site}/api/billing/webhook`;
}

export function openRouterDefaultModel(): string {
  return envFirst("OPENROUTER_MODEL_DEFAULT", "OPENROUTER_DEFAULT_MODEL") ?? "openai/gpt-4o-mini";
}

/** User-safe API error text — strips env keys and stack-like fragments in production. */
export function sanitizeApiError(message: string): string {
  if (process.env.NODE_ENV !== "production") return message;
  const lower = message.toLowerCase();
  if (
    lower.includes("not configured") ||
    lower.includes("env") ||
    lower.includes("supabase") ||
    lower.includes("api_key") ||
    lower.includes("secret")
  ) {
    return "Service temporarily unavailable. Please try again shortly.";
  }
  return message.length > 160 ? `${message.slice(0, 157)}…` : message;
}

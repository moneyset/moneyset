/** Server-side env accessors — never log secret values. */

const PLACEHOLDER_HOSTS = new Set([
  "example.com",
  "www.example.com",
  "api.example.com",
  "localhost",
  "127.0.0.1",
]);

/** Hostnames that must never be used as production site origins. */
export function isPlaceholderHost(hostname: string): boolean {
  const h = hostname.trim().toLowerCase();
  if (!h) return true;
  if (PLACEHOLDER_HOSTS.has(h)) return true;
  if (h.endsWith(".example.com")) return true;
  if (h.includes("your-domain")) return true;
  return false;
}

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

function originFromUrl(raw: string): string | undefined {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (isPlaceholderHost(url.hostname)) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

/** Vercel-provided deployment / production domain (server/build only). */
export function vercelSiteOrigin(): string | undefined {
  return (
    originFromUrl(env("VERCEL_PROJECT_PRODUCTION_URL") ?? "") ??
    originFromUrl(env("VERCEL_URL") ?? "")
  );
}

/** Site origin from NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL when valid. */
export function siteOriginFromEnv(): string | undefined {
  const raw = envFirst("NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL");
  if (!raw) return undefined;
  return originFromUrl(raw);
}

/**
 * Public site origin for OAuth redirects, NOWPayments callbacks, OpenRouter referer.
 * Production never falls back to localhost or example.com.
 */
export function publicSiteUrl(): string {
  const fromEnv = siteOriginFromEnv();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    const vercel = vercelSiteOrigin();
    if (vercel) return vercel;
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured for production");
  }

  return "http://localhost:3000";
}

/** NOWPayments IPN callback — explicit env or derived from site URL. */
export function nowPaymentsIpnUrl(): string | undefined {
  const explicit = env("NOWPAYMENTS_IPN_URL");
  if (explicit) {
    const origin = originFromUrl(explicit);
    if (origin && explicit.includes("/api/billing/webhook")) return explicit;
    if (origin) return `${origin}/api/billing/webhook`;
    return explicit;
  }

  if (process.env.NODE_ENV === "development") {
    return `${publicSiteUrl()}/api/billing/webhook`;
  }

  try {
    return `${publicSiteUrl()}/api/billing/webhook`;
  } catch {
    return undefined;
  }
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

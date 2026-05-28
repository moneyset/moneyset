import { isPlaceholderHost, siteOriginFromEnv, vercelSiteOrigin } from "@/lib/services/shared/env";

/** OAuth / magic-link redirect target — must match Supabase Auth redirect allowlist. */
export function authCallbackUrl(origin?: string): string {
  // Client: runtime origin always wins — NEXT_PUBLIC_* may be stale from an old build.
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }

  if (origin) return `${origin}/auth/callback`;

  const fromEnv = siteOriginFromEnv();
  if (fromEnv) return `${fromEnv}/auth/callback`;

  if (process.env.NODE_ENV === "production") {
    const vercel = vercelSiteOrigin();
    if (vercel) return `${vercel}/auth/callback`;
  }

  return "http://localhost:3000/auth/callback";
}

/** Safe in-app path after auth — blocks open redirects. */
export function sanitizeAuthNextPath(next: string | null | undefined): string {
  const raw = (next ?? "/").trim();
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (raw.startsWith("/auth/callback")) return "/";
  return raw;
}

export { isPlaceholderHost };

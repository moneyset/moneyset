/**
 * Simple in-memory rate limiter for billing API routes.
 *
 * Note: This is a per-instance limiter — on serverless deployments each cold
 * start has its own state. This mitigates casual abuse and mistake retries;
 * it is not a substitute for a Redis-backed rate limiter in high-traffic
 * scenarios. Suitable for MONEYSET's current traffic profile.
 */

type WindowEntry = {
  count: number;
  resetAtMs: number;
};

const windows = new Map<string, WindowEntry>();

type RateLimitConfig = {
  /** Requests allowed per window. Default: 10. */
  limit?: number;
  /** Window size in milliseconds. Default: 60_000 (1 min). */
  windowMs?: number;
};

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

/**
 * Check whether the given key (typically `${route}:${ip}`) is within the
 * allowed rate.  Call this at the start of the route handler.
 */
export function checkRateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 }: RateLimitConfig = {},
): RateLimitResult {
  const now = Date.now();
  let entry = windows.get(key);

  if (!entry || now > entry.resetAtMs) {
    entry = { count: 1, resetAtMs: now + windowMs };
    windows.set(key, entry);
    return { allowed: true };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, retryAfterMs: entry.resetAtMs - now };
  }

  return { allowed: true };
}

/**
 * Extract a stable rate-limit key from a Next.js Request.
 * Uses X-Forwarded-For (set by Vercel) with a route prefix.
 */
export function rateLimitKey(req: Request, route: string): string {
  const xff = req.headers.get("x-forwarded-for") ?? "unknown";
  const ip = xff.split(",")[0]?.trim() ?? "unknown";
  return `${route}:${ip}`;
}

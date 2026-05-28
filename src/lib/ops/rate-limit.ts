/**
 * In-memory rate limiter — per serverless instance.
 * Suitable for MONEYSET traffic; not a substitute for Redis at high scale.
 */

type WindowEntry = {
  count: number;
  resetAtMs: number;
};

const windows = new Map<string, WindowEntry>();

type RateLimitConfig = {
  limit?: number;
  windowMs?: number;
};

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

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

export function rateLimitKey(req: Request, route: string): string {
  const xff = req.headers.get("x-forwarded-for") ?? "unknown";
  const ip = xff.split(",")[0]?.trim() ?? "unknown";
  return `${route}:${ip}`;
}

/**
 * Shared HTTP helpers — retries, timeouts, in-process TTL cache (server-only).
 */

export type FetchRetryOptions = Readonly<{
  retries?: number;
  backoffMs?: number;
  timeoutMs?: number;
  init?: RequestInit;
}>;

const memoryCache = new Map<string, { expires: number; value: unknown }>();

export function cacheGet<T>(key: string): T | null {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    memoryCache.delete(key);
    return null;
  }
  return hit.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  memoryCache.set(key, { expires: Date.now() + ttlMs, value });
}

export async function fetchJson<T>(
  url: string,
  options?: FetchRetryOptions,
): Promise<T> {
  const retries = options?.retries ?? 2;
  const backoffMs = options?.backoffMs ?? 400;
  const timeoutMs = options?.timeoutMs ?? 12_000;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...options?.init,
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
      }
      return (await res.json()) as T;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? new Error("fetch failed");
}

export function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

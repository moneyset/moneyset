/**
 * In-process inference cache — avoids duplicate AI spend on stable signatures.
 */

import type { CachedInferenceBundle } from "@/lib/intelligence/types";

let latest: CachedInferenceBundle | null = null;

export const INFERENCE_MIN_INTERVAL_MS = 5 * 60_000;
export const INFERENCE_FORCE_COOLDOWN_MS = 90_000;

export function getCachedInference(): CachedInferenceBundle | null {
  return latest;
}

export function setCachedInference(bundle: CachedInferenceBundle): void {
  latest = bundle;
}

export function shouldRunHeavyInference(marketSignature: string, force = false): boolean {
  if (!latest) return true;
  if (force) {
    return Date.now() - latest.inferredAt >= INFERENCE_FORCE_COOLDOWN_MS;
  }
  if (latest.marketSignature !== marketSignature) return true;
  return Date.now() - latest.inferredAt >= INFERENCE_MIN_INTERVAL_MS;
}

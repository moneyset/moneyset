/**
 * OpenRouter response cache — cost control for beta.
 */

import type { AgentOutput, OrchestratorOutput } from "@/lib/openrouter/prompts";
import { cacheGet, cacheSet } from "@/lib/services/shared/http";

export const OPENROUTER_CACHE_TTL_MS = 10 * 60_000;
export const OPENROUTER_MIN_INTERVAL_MS = 120_000;

type CachedOr = Readonly<{
  agents: AgentOutput[];
  orchestrator: OrchestratorOutput;
  ts: number;
}>;

export function openRouterCacheKey(contextHash: string): string {
  return `openrouter:cognition:${contextHash}`;
}

export function hashContextPayload(payload: string): string {
  let h = 0;
  for (let i = 0; i < payload.length; i++) {
    h = (h * 31 + payload.charCodeAt(i)) | 0;
  }
  return `h${Math.abs(h)}`;
}

export function getCachedOpenRouter(contextHash: string): CachedOr | null {
  return cacheGet<CachedOr>(openRouterCacheKey(contextHash));
}

export function setCachedOpenRouter(contextHash: string, value: CachedOr): void {
  cacheSet(openRouterCacheKey(contextHash), value, OPENROUTER_CACHE_TTL_MS);
}

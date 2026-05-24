/**
 * OpenRouter service facade — re-exports client with typed helpers.
 */

export { openRouterChat } from "@/services/openrouter/client";
export type { OpenRouterChatRequest, OpenRouterChatMessage } from "@/services/openrouter/client";
export { resolveModelRoute, modelForAgent } from "@/lib/openrouter/models";

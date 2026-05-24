import type { OpenRouterModelId } from "@/services/openrouter/client";
import { openRouterDefaultModel } from "@/lib/services/shared/env";

export type AgentId = "macro" | "flow" | "liquidity" | "risk" | "sentiment" | "orchestrator";

export type ModelRoute = Readonly<{
  defaultModel: OpenRouterModelId;
  orchestratorModel: OpenRouterModelId;
  agentModelOverrides: Partial<Record<AgentId, OpenRouterModelId>>;
}>;

export function resolveModelRoute(): ModelRoute {
  const defaultModel = openRouterDefaultModel() as OpenRouterModelId;
  const orchestratorModel = (process.env.OPENROUTER_MODEL_ORCHESTRATOR?.trim() || defaultModel) as OpenRouterModelId;

  const agentModelOverrides: Partial<Record<AgentId, OpenRouterModelId>> = {
    macro: process.env.OPENROUTER_MODEL_MACRO?.trim() as OpenRouterModelId | undefined,
    flow: process.env.OPENROUTER_MODEL_FLOW?.trim() as OpenRouterModelId | undefined,
    liquidity: process.env.OPENROUTER_MODEL_LIQUIDITY?.trim() as OpenRouterModelId | undefined,
    risk: process.env.OPENROUTER_MODEL_RISK?.trim() as OpenRouterModelId | undefined,
    sentiment: process.env.OPENROUTER_MODEL_SENTIMENT?.trim() as OpenRouterModelId | undefined,
  };

  Object.keys(agentModelOverrides).forEach((k) => {
    const key = k as AgentId;
    if (!agentModelOverrides[key]) delete agentModelOverrides[key];
  });

  return { defaultModel, orchestratorModel, agentModelOverrides };
}

export function modelForAgent(route: ModelRoute, agent: AgentId): OpenRouterModelId {
  if (agent === "orchestrator") return route.orchestratorModel;
  return route.agentModelOverrides[agent] ?? route.defaultModel;
}


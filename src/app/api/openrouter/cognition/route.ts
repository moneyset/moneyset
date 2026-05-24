import { NextResponse } from "next/server";

import { sanitizeApiError } from "@/lib/services/shared/env";
import { openRouterChat } from "@/services/openrouter/client";
import { resolveModelRoute, modelForAgent, type AgentId } from "@/lib/openrouter/models";
import { systemPrompt, userPrompt, type AgentOutput, type OrchestratorOutput } from "@/lib/openrouter/prompts";
import { parseAgentJson } from "@/lib/openrouter/parse";
import { formatContext, type CognitionContextPayload } from "@/lib/openrouter/context";
import {
  getCachedOpenRouter,
  hashContextPayload,
  setCachedOpenRouter,
} from "@/lib/intelligence/openrouter-cache";

export const dynamic = "force-dynamic";

type Req = {
  context: CognitionContextPayload;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Req;
    if (!body?.context) return NextResponse.json({ ok: false, error: "Missing context" }, { status: 400 });

    const route = resolveModelRoute();
    const ctx = formatContext(body.context);
    const contextHash = hashContextPayload(ctx);
    const cached = getCachedOpenRouter(contextHash);
    if (cached) {
      return NextResponse.json({
        ok: true,
        agents: cached.agents,
        orchestrator: cached.orchestrator,
        ts: cached.ts,
        cached: true,
        models: {
          default: route.defaultModel,
          orchestrator: route.orchestratorModel,
        },
      });
    }

    const agents: AgentId[] = ["macro", "flow", "liquidity", "risk", "sentiment"];

    const runs = await Promise.all(
      agents.map(async (agent) => {
        const model = modelForAgent(route, agent);
        const content = await openRouterChat({
          model,
          temperature: 0.3,
          max_tokens: 450,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt(agent) },
            { role: "user", content: userPrompt(agent, ctx) },
          ],
        });
        return { agent, raw: content, parsed: parseAgentJson(agent, content) };
      }),
    );

    // Orchestrator gets the agent outputs as extra context.
    const model = modelForAgent(route, "orchestrator");
    const orchCtx = [
      ctx,
      "",
      "agent_outputs:",
      ...runs.map((r) => `- ${r.agent}: ${JSON.stringify(r.parsed)}`),
    ].join("\n");

    const orchRaw = await openRouterChat({
      model,
      temperature: 0.25,
      max_tokens: 520,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt("orchestrator") },
        { role: "user", content: userPrompt("orchestrator", orchCtx) },
      ],
    });

    const orchestrator = parseAgentJson("orchestrator", orchRaw) as OrchestratorOutput;
    const ts = Date.now();
    const agentList = runs.map((r) => r.parsed as AgentOutput);
    setCachedOpenRouter(contextHash, { agents: agentList, orchestrator, ts });

    return NextResponse.json({
      ok: true,
      agents: agentList,
      orchestrator,
      ts,
      models: {
        default: route.defaultModel,
        orchestrator: route.orchestratorModel,
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: sanitizeApiError(e instanceof Error ? e.message : "Cognition unavailable"),
      },
      { status: 502 },
    );
  }
}


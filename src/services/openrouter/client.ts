import { publicSiteUrl } from "@/lib/services/shared/env";

export type OpenRouterModelId = string;

export type OpenRouterChatMessage = {
  role: "system" | "user";
  content: string;
};

export type OpenRouterChatRequest = {
  model: OpenRouterModelId;
  messages: OpenRouterChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
};

export type OpenRouterChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function openRouterChat(req: OpenRouterChatRequest): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      // optional but recommended by OpenRouter
      "HTTP-Referer": publicSiteUrl(),
      "X-Title": "MONEYSET",
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenRouter error (${res.status}): ${txt.slice(0, 280)}`);
  }

  const json = (await res.json()) as OpenRouterChatResponse;
  const content = json.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("OpenRouter response missing content");
  return content;
}


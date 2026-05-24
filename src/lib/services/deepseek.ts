/**
 * DeepSeek direct API — cost-efficient structured reasoning (optional).
 */

import { env } from "@/lib/services/shared/env";

export type DeepSeekChatRequest = Readonly<{
  model?: string;
  messages: Array<{ role: "system" | "user"; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}>;

export async function deepSeekChat(req: DeepSeekChatRequest): Promise<string> {
  const key = env("DEEPSEEK_API_KEY");
  if (!key) throw new Error("DEEPSEEK_API_KEY is not configured");

  const base = env("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com";
  const model = req.model ?? env("DEEPSEEK_DEFAULT_MODEL") ?? "deepseek-chat";

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: req.messages,
      temperature: req.temperature ?? 0.25,
      max_tokens: req.max_tokens ?? 600,
      response_format: req.response_format,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`DeepSeek error (${res.status}): ${txt.slice(0, 240)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek response missing content");
  return content;
}

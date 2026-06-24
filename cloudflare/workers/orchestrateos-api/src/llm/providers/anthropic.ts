import { DEFAULT_MODELS, type LlmEnv } from "../env";
import type { LlmCompleteRequest, LlmCompleteResponse, LlmMessage } from "../types";

type AnthropicResponse = {
  content?: { type: string; text?: string }[];
  model?: string;
};

function splitMessages(messages: LlmMessage[]): { system?: string; messages: LlmMessage[] } {
  const systemParts = messages.filter((m) => m.role === "system").map((m) => m.content);
  const rest = messages.filter((m) => m.role !== "system");
  return {
    system: systemParts.length ? systemParts.join("\n\n") : undefined,
    messages: rest,
  };
}

export async function completeAnthropic(
  env: LlmEnv,
  request: LlmCompleteRequest,
): Promise<LlmCompleteResponse> {
  const apiKey = env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const model = request.model ?? DEFAULT_MODELS.anthropic;
  const base = env.AI_GATEWAY_URL?.trim().replace(/\/$/, "");
  const url = base ? `${base}/messages` : "https://api.anthropic.com/v1/messages";
  const { system, messages } = splitMessages(request.messages);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: request.max_tokens ?? 1024,
      temperature: request.temperature ?? 0.2,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Anthropic error ${response.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await response.json()) as AnthropicResponse;
  const text = data.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) throw new Error("Empty response from Anthropic");
  return { text, provider: "anthropic", model: data.model ?? model };
}

export function tryAnthropic(env: LlmEnv, request: LlmCompleteRequest): Promise<LlmCompleteResponse> | null {
  if (!env.ANTHROPIC_API_KEY?.trim()) return null;
  return completeAnthropic(env, request);
}

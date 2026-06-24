import { DEFAULT_MODELS, type LlmEnv } from "../env";
import type { LlmCompleteRequest, LlmCompleteResponse } from "../types";

type OpenAiChatResponse = {
  choices?: { message?: { content?: string } }[];
  model?: string;
};

export async function completeOpenAi(
  env: LlmEnv,
  request: LlmCompleteRequest,
): Promise<LlmCompleteResponse> {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const model = request.model ?? DEFAULT_MODELS.openai;
  const base = env.AI_GATEWAY_URL?.trim().replace(/\/$/, "");
  const url = base ? `${base}/chat/completions` : "https://api.openai.com/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: request.messages,
      max_tokens: request.max_tokens ?? 1024,
      temperature: request.temperature ?? 0.2,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await response.json()) as OpenAiChatResponse;
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from OpenAI");
  return { text, provider: "openai", model: data.model ?? model };
}

export function tryOpenAi(env: LlmEnv, request: LlmCompleteRequest): Promise<LlmCompleteResponse> | null {
  if (!env.OPENAI_API_KEY?.trim()) return null;
  return completeOpenAi(env, request);
}

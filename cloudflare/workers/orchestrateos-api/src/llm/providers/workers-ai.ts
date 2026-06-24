import { DEFAULT_MODELS, type LlmEnv, type WorkersAiBinding } from "../env";
import type { LlmCompleteRequest, LlmCompleteResponse } from "../types";

export async function completeWorkersAi(
  ai: WorkersAiBinding,
  request: LlmCompleteRequest,
): Promise<LlmCompleteResponse> {
  const model = request.model ?? DEFAULT_MODELS["workers-ai"];
  const raw = await ai.run(model, {
    messages: request.messages,
    max_tokens: request.max_tokens ?? 1024,
    temperature: request.temperature,
  });

  const text =
    typeof raw === "string"
      ? raw.trim()
      : typeof raw?.response === "string"
        ? raw.response.trim()
        : "";

  if (!text) throw new Error("Empty response from Workers AI");
  return { text, provider: "workers-ai", model };
}

export function tryWorkersAi(env: LlmEnv, request: LlmCompleteRequest): Promise<LlmCompleteResponse> | null {
  if (!env.AI) return null;
  return completeWorkersAi(env.AI, request);
}

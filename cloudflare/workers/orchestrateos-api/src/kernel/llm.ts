import { completeLlm } from "../llm/router";
import type { LlmEnv } from "../llm/env";
import { KERNEL_MODEL } from "./agents";

export async function runKernelLlm(
  env: LlmEnv,
  systemPrompt: string,
  userContent: string,
): Promise<{ text: string; provider: string; model: string }> {
  const result = await completeLlm(env, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    model: KERNEL_MODEL,
    max_tokens: 768,
    provider: "auto",
  });
  return result;
}

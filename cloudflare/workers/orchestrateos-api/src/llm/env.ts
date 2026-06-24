import type { LlmProviderId } from "./types";

export type WorkersAiBinding = {
  run(
    model: string,
    inputs: { messages: { role: string; content: string }[]; max_tokens?: number; temperature?: number },
  ): Promise<{ response?: string } | string>;
};

export type LlmEnv = {
  AI?: WorkersAiBinding;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  AI_GATEWAY_URL?: string;
  LLM_PRIMARY_PROVIDER?: string;
  LLM_FALLBACK_PROVIDER?: string;
  LLM_DEFAULT_MODEL?: string;
};

export const DEFAULT_MODELS: Record<LlmProviderId, string> = {
  "workers-ai": "@cf/meta/llama-3.1-8b-instruct",
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
};

export function parseProvider(value: string | undefined): LlmProviderId | null {
  if (value === "workers-ai" || value === "openai" || value === "anthropic") return value;
  return null;
}

export function providerChain(env: LlmEnv): LlmProviderId[] {
  const primary = parseProvider(env.LLM_PRIMARY_PROVIDER?.trim()) ?? "workers-ai";
  const fallback = parseProvider(env.LLM_FALLBACK_PROVIDER?.trim());
  const chain = [primary];
  if (fallback && fallback !== primary) chain.push(fallback);
  for (const id of ["workers-ai", "anthropic", "openai"] as LlmProviderId[]) {
    if (!chain.includes(id)) chain.push(id);
  }
  return chain;
}

export function providerAvailable(env: LlmEnv, id: LlmProviderId): boolean {
  if (id === "workers-ai") return Boolean(env.AI);
  if (id === "openai") return Boolean(env.OPENAI_API_KEY?.trim());
  if (id === "anthropic") return Boolean(env.ANTHROPIC_API_KEY?.trim());
  return false;
}

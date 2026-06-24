import {
  DEFAULT_MODELS,
  providerAvailable,
  providerChain,
  type LlmEnv,
} from "./env";
import { tryAnthropic } from "./providers/anthropic";
import { tryOpenAi } from "./providers/openai";
import { tryWorkersAi } from "./providers/workers-ai";
import type {
  LlmCompleteRequest,
  LlmCompleteResponse,
  LlmProviderId,
  LlmProviderStatus,
} from "./types";

async function completeWithProvider(
  env: LlmEnv,
  provider: LlmProviderId,
  request: LlmCompleteRequest,
): Promise<LlmCompleteResponse> {
  const attempt =
    provider === "workers-ai"
      ? tryWorkersAi(env, request)
      : provider === "openai"
        ? tryOpenAi(env, request)
        : tryAnthropic(env, request);

  if (!attempt) {
    throw new Error(`Provider ${provider} is not configured`);
  }
  return attempt;
}

export async function completeLlm(
  env: LlmEnv,
  request: LlmCompleteRequest,
): Promise<LlmCompleteResponse> {
  if (!request.messages?.length) {
    throw new Error("messages are required");
  }

  const providers: LlmProviderId[] =
    request.provider && request.provider !== "auto"
      ? [request.provider]
      : providerChain(env);

  const errors: string[] = [];
  for (const provider of providers) {
    if (!providerAvailable(env, provider)) continue;
    try {
      return await completeWithProvider(env, provider, request);
    } catch (err) {
      errors.push(
        `${provider}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  throw new Error(
    errors.length
      ? `All LLM providers failed — ${errors.join("; ")}`
      : "No LLM providers configured (Workers AI binding or API keys required)",
  );
}

export function llmStatus(env: LlmEnv) {
  const providers: LlmProviderStatus[] = (
    ["workers-ai", "anthropic", "openai"] as LlmProviderId[]
  ).map((id) => ({
    id,
    available: providerAvailable(env, id),
    default_model: DEFAULT_MODELS[id],
  }));

  const chain = providerChain(env);
  const primary = chain.find((id) => providerAvailable(env, id)) ?? null;

  return {
    primary_provider: primary,
    provider_chain: chain,
    providers,
    ai_gateway: Boolean(env.AI_GATEWAY_URL?.trim()),
    default_model: env.LLM_DEFAULT_MODEL?.trim() || (primary ? DEFAULT_MODELS[primary] : null),
  };
}

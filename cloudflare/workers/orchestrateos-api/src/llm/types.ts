/** Shared LLM request/response types for OrchestrateOS control plane. */

export type LlmRole = "system" | "user" | "assistant";

export type LlmMessage = {
  role: LlmRole;
  content: string;
};

export type LlmProviderId = "workers-ai" | "openai" | "anthropic";

export type LlmCompleteRequest = {
  messages: LlmMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  provider?: LlmProviderId | "auto";
};

export type LlmCompleteResponse = {
  text: string;
  provider: LlmProviderId;
  model: string;
};

export type LlmProviderStatus = {
  id: LlmProviderId;
  available: boolean;
  default_model: string;
};

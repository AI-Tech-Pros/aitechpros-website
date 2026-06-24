/**
 * Client for the OrchestrateOS resume_engine control plane API.
 */

import { orchestrateOSApiBaseUrl, orchestrateOSApiKey } from "@/lib/site";

export type ResumeBlocker = {
  classification: "transient" | "partial" | "permanent";
  step_index: number;
  step_name: string;
  failure_key: string;
  message: string;
  required_action: "compensation" | "human_approval" | "prod_resume_ack";
};

export type ResumeBlockersResponse = {
  run_id: string;
  can_resume: boolean;
  blockers: ResumeBlocker[];
};

export type RunStatusResponse = {
  run_id: string;
  workflow_name: string;
  status: string;
  environment?: "dev" | "staging" | "prod";
  steps_completed: number;
  last_completed_step: number | null;
  resume_from_index: number;
  can_resume: boolean;
  resume_blockers: ResumeBlocker[];
};

export type ApiHealthResponse = {
  status: string;
  service: string;
};

export type DemoRunCatalogEntry = {
  scenario: "transient" | "partial" | "permanent";
  run_id: string;
  label: string;
  description: string;
};

export type DemoRunsResponse = {
  runs: DemoRunCatalogEntry[];
};

export type KernelAgentInfo = {
  id: string;
  name: string;
  role: string;
  status: "live";
  runtime: string;
  step_name: string;
};

export type KernelAgentsResponse = {
  model: string;
  ai_available: boolean;
  agents: KernelAgentInfo[];
};

export type KernelRunResponse = {
  run_id: string;
  workflow_name: string;
  status: string;
  model: string;
  agents: {
    id: string;
    name: string;
    step_index: number;
    output: string;
    model: string;
  }[];
};

export type LlmProviderInfo = {
  id: string;
  available: boolean;
  default_model: string;
};

export type LlmStatusResponse = {
  primary_provider: string | null;
  provider_chain: string[];
  providers: LlmProviderInfo[];
  ai_gateway: boolean;
  default_model: string | null;
};

export type LlmCompleteResponse = {
  text: string;
  provider: string;
  model: string;
};

function baseUrl(): string {
  return orchestrateOSApiBaseUrl();
}

function writeHeaders(): Record<string, string> {
  const key = orchestrateOSApiKey();
  return key ? { Authorization: `Bearer ${key}` } : {};
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...writeHeaders(),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchApiHealth(): Promise<ApiHealthResponse> {
  return apiFetch<ApiHealthResponse>("/health");
}

export async function fetchDemoRuns(): Promise<DemoRunsResponse> {
  return apiFetch<DemoRunsResponse>("/demo/runs");
}

export async function fetchKernelAgents(): Promise<KernelAgentsResponse> {
  return apiFetch<KernelAgentsResponse>("/kernel/agents");
}

export async function runKernelAgents(goal: string): Promise<KernelRunResponse> {
  return apiFetch<KernelRunResponse>("/kernel/run", {
    method: "POST",
    body: JSON.stringify({ goal }),
  });
}

export async function fetchLlmStatus(): Promise<LlmStatusResponse> {
  return apiFetch<LlmStatusResponse>("/llm/status");
}

export async function completeLlm(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options?: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
    provider?: "workers-ai" | "openai" | "anthropic" | "auto";
  },
): Promise<LlmCompleteResponse> {
  return apiFetch<LlmCompleteResponse>("/llm/complete", {
    method: "POST",
    body: JSON.stringify({ messages, ...options }),
  });
}

export async function resetDemoRuns(): Promise<{ message: string; seeded: number }> {
  return apiFetch("/demo/reset", { method: "POST", body: "{}" });
}

export async function fetchResumeBlockers(runId: string): Promise<ResumeBlockersResponse> {
  return apiFetch<ResumeBlockersResponse>(
    `/runs/${encodeURIComponent(runId)}/resume_blockers`
  );
}

export async function fetchRunStatus(runId: string): Promise<RunStatusResponse> {
  return apiFetch<RunStatusResponse>(`/runs/${encodeURIComponent(runId)}/status`);
}

export async function recordCompensation(
  runId: string,
  body: { result?: Record<string, unknown>; note?: string }
): Promise<RunStatusResponse> {
  return apiFetch<RunStatusResponse>(`/runs/${encodeURIComponent(runId)}/compensate`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function grantApproval(
  runId: string,
  body: { approved_by: string; note?: string }
): Promise<RunStatusResponse> {
  return apiFetch<RunStatusResponse>(`/runs/${encodeURIComponent(runId)}/approve`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function ackProdResume(
  runId: string,
  body: { acknowledged_by: string; note?: string }
): Promise<RunStatusResponse> {
  return apiFetch<RunStatusResponse>(
    `/runs/${encodeURIComponent(runId)}/ack_prod_resume`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export const API_ENDPOINTS = [
  { method: "GET", path: "/health", description: "Load balancer health check" },
  { method: "GET", path: "/docs", description: "API reference (HTML)" },
  { method: "POST", path: "/start_run", description: "Create a new workflow run" },
  { method: "GET", path: "/kernel/agents", description: "Nine-agent LLM kernel catalog" },
  { method: "POST", path: "/kernel/run", description: "Run all nine LLM agents on a goal" },
  { method: "GET", path: "/llm/status", description: "LLM provider availability and routing" },
  { method: "POST", path: "/llm/complete", description: "Unified LLM completion with provider failover" },
  { method: "POST", path: "/runs/{run_id}/steps", description: "Record step completion or failure" },
  { method: "GET", path: "/runs/{run_id}/status", description: "Run status + gate summary" },
  {
    method: "GET",
    path: "/runs/{run_id}/resume_blockers",
    description: "List compensation/approval gates",
  },
  { method: "POST", path: "/runs/{run_id}/compensate", description: "Record partial-failure compensation" },
  { method: "POST", path: "/runs/{run_id}/approve", description: "Grant human approval (permanent failures)" },
  {
    method: "POST",
    path: "/runs/{run_id}/ack_prod_resume",
    description: "Acknowledge production resume (prod environment)",
  },
  { method: "POST", path: "/resume", description: "Validate resume readiness (409 if gated)" },
  { method: "GET", path: "/runs/{run_id}/audit_log", description: "Deterministic audit trace" },
  { method: "GET", path: "/runs/{run_id}/audit_events", description: "Immutable governance audit events" },
  { method: "GET", path: "/runs/{run_id}/replay", description: "Deterministic replay payload" },
  { method: "GET", path: "/demo/runs", description: "Seeded demo run catalog" },
  { method: "POST", path: "/demo/reset", description: "Reset demo runs to initial gate state" },
] as const;

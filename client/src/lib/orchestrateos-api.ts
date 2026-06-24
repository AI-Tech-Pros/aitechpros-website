/**
 * Client for the OrchestrateOS resume_engine control plane API.
 */

import { orchestrateOSApiBaseUrl, orchestrateOSApiKey } from "@/lib/site";
import { readStashedRunnerKey } from "@/lib/partner-credentials";

export type ResumeBlocker = {
  classification: "transient" | "partial" | "permanent";
  step_index: number;
  step_name: string;
  failure_key: string;
  message: string;
  required_action:
    | "compensation"
    | "human_approval"
    | "consensus_approval"
    | "prod_resume_ack";
  consensus_votes?: number;
  consensus_required?: number;
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
  capabilities?: string[];
};

export type KernelUsageSummary = {
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost_usd: number;
  call_count: number;
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
    provider?: string;
    tool_invoked?: string;
  }[];
  gated?: boolean;
  blockers?: ResumeBlocker[];
  usage?: KernelUsageSummary;
  ingress_event_id?: string;
};

export type KernelObserverResponse = {
  run_id: string;
  status: string;
  environment?: string;
  goal?: string;
  blockers: ResumeBlocker[];
  can_resume: boolean;
  steps_completed: number;
  usage: KernelUsageSummary;
  optimizer?: Record<string, unknown>;
};
export type KernelAgentsResponse = {
  model: string;
  ai_available: boolean;
  agents: KernelAgentInfo[];
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

export type StartRunResponse = {
  run_id: string;
  status: string;
  environment?: string;
};

function runnerKeyForStartRun(): string {
  const stashed = readStashedRunnerKey();
  const key = stashed ?? orchestrateOSApiKey();
  if (!key) {
    throw new Error(
      "No runner API key — save your onboarding key or set VITE_ORCHESTRATEOS_DEMO_KEY",
    );
  }
  return key;
}

export async function startRun(
  workflowName = "my_pipeline",
  options?: {
    environment?: "dev" | "staging" | "prod";
    metadata?: Record<string, unknown>;
  },
): Promise<StartRunResponse> {
  const response = await fetch(`${baseUrl()}/start_run`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${runnerKeyForStartRun()}`,
    },
    body: JSON.stringify({
      workflow_name: workflowName,
      environment: options?.environment ?? "dev",
      metadata: options?.metadata,
    }),
  });
  const body = (await response.json()) as StartRunResponse & { detail?: string };
  if (!response.ok) {
    throw new Error(body.detail ?? `API error ${response.status}`);
  }
  return body;
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

export async function runKernelAgents(
  goal: string,
  options?: { environment?: "dev" | "staging" | "prod" },
): Promise<KernelRunResponse> {
  const response = await fetch(`${baseUrl()}/kernel/run`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...writeHeaders(),
    },
    body: JSON.stringify({ goal, ...options }),
  });
  const body = (await response.json()) as KernelRunResponse & { detail?: string };
  if (!response.ok && response.status !== 409) {
    throw new Error(body.detail ?? `API error ${response.status}`);
  }
  return body;
}

export async function resumeKernelRun(runId: string): Promise<KernelRunResponse> {
  return apiFetch<KernelRunResponse>(`/kernel/runs/${encodeURIComponent(runId)}/resume`, {
    method: "POST",
    body: "{}",
  });
}

export async function fetchKernelObserver(runId: string): Promise<KernelObserverResponse> {
  return apiFetch<KernelObserverResponse>(`/kernel/runs/${encodeURIComponent(runId)}/observer`);
}

export async function enqueueIngressGoal(
  goal: string,
  metadata?: Record<string, unknown>,
): Promise<{ ingress_event_id: string; status: string }> {
  return apiFetch("/ingress/queue/enqueue", {
    method: "POST",
    body: JSON.stringify({ goal, metadata }),
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

export async function submitConsensusVote(
  runId: string,
  body: { approved_by: string; note?: string },
): Promise<
  RunStatusResponse & {
    consensus?: { vote_count: number; min_approvers: number; satisfied: boolean };
  }
> {
  return apiFetch(`/runs/${encodeURIComponent(runId)}/consensus_vote`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type RetryPolicyResponse = {
  run_id: string;
  advisory: boolean;
  auto_apply: boolean;
  optimizer: Record<string, unknown> | null;
  message: string;
};

export async function fetchRetryPolicy(runId: string): Promise<RetryPolicyResponse> {
  return apiFetch<RetryPolicyResponse>(`/runs/${encodeURIComponent(runId)}/retry_policy`);
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

export type ComplianceExport = {
  export_version: string;
  exported_at: string;
  product: string;
  run: {
    run_id: string;
    workflow_name: string;
    status: string;
    environment: string;
    tenant_id: string;
    created_at: string;
    updated_at: string;
    metadata: Record<string, unknown>;
  };
  gate_summary: {
    can_resume: boolean;
    blocker_count: number;
    blockers: ResumeBlocker[];
  };
  gate_state: Record<string, unknown>;
  resume_blockers: ResumeBlocker[];
  steps: {
    step_name: string;
    step_index: number;
    status: string;
    timestamp: string;
    failure_classification: string | null;
    error_message: string | null;
    sequence: number;
    idempotency_key: string;
  }[];
  replay: {
    replay_from_index: number;
    step_count: number;
    steps: ComplianceExport["steps"];
  };
  audit_events: {
    event_type: string;
    actor: string | null;
    payload: Record<string, unknown>;
    created_at: string;
  }[];
  idempotency_analysis: {
    findings: {
      type: string;
      idempotency_key: string;
      step_indices: number[];
      sequences: number[];
      message: string;
    }[];
    side_effect_safe: boolean;
    summary: string;
  };
  integrity: {
    step_count: number;
    audit_event_count: number;
    completed_steps: number;
    failed_steps: number;
  };
};

export async function fetchComplianceExport(runId: string): Promise<ComplianceExport> {
  return apiFetch<ComplianceExport>(`/runs/${encodeURIComponent(runId)}/compliance_export`);
}

export async function downloadComplianceExport(runId: string): Promise<void> {
  const response = await fetch(
    `${baseUrl()}/runs/${encodeURIComponent(runId)}/compliance_export?download=1`,
    {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${runnerKeyForStartRun()}`,
      },
    },
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail ?? `Download failed (${response.status})`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `orchestrateos-compliance-${runId}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const API_ENDPOINTS = [
  { method: "GET", path: "/health", description: "Load balancer health check" },
  { method: "GET", path: "/docs", description: "API reference (HTML)" },
  { method: "POST", path: "/start_run", description: "Create a new workflow run" },
  { method: "GET", path: "/kernel/agents", description: "Nine-agent kernel catalog (v2)" },
  { method: "POST", path: "/kernel/run", description: "Run nine-agent kernel with tools, gates, and cost breaker" },
  { method: "POST", path: "/kernel/runs/{run_id}/resume", description: "Resume kernel after gates cleared" },
  { method: "GET", path: "/kernel/runs/{run_id}/observer", description: "Live observer status, blockers, and usage" },
  { method: "POST", path: "/ingress/webhook", description: "Partner webhook ingress (X-Ingress-Secret)" },
  { method: "POST", path: "/ingress/queue/enqueue", description: "Enqueue goal for async kernel processing" },
  { method: "POST", path: "/ingress/queue/process", description: "Drain ingress queue (cron or runner)" },
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
  { method: "GET", path: "/runs/{run_id}/compliance_export", description: "Compliance bundle (steps, gates, audit, idempotency)" },
  { method: "GET", path: "/demo/runs", description: "Seeded demo run catalog" },
  { method: "POST", path: "/demo/reset", description: "Reset demo runs to initial gate state" },
] as const;

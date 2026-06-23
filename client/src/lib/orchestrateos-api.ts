/**
 * Client for the OrchestrateOS resume_engine control plane API.
 */

import { orchestrateOSApiBaseUrl } from "@/lib/site";

export type ResumeBlocker = {
  classification: "transient" | "partial" | "permanent";
  step_index: number;
  step_name: string;
  failure_key: string;
  message: string;
  required_action: "compensation" | "human_approval";
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

function baseUrl(): string {
  return orchestrateOSApiBaseUrl();
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
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

export const API_ENDPOINTS = [
  { method: "GET", path: "/health", description: "Load balancer health check" },
  { method: "POST", path: "/start_run", description: "Create a new workflow run" },
  { method: "GET", path: "/runs/{run_id}/status", description: "Run status + gate summary" },
  {
    method: "GET",
    path: "/runs/{run_id}/resume_blockers",
    description: "List compensation/approval gates",
  },
  { method: "POST", path: "/runs/{run_id}/compensate", description: "Record partial-failure compensation" },
  { method: "POST", path: "/runs/{run_id}/approve", description: "Grant human approval (permanent failures)" },
  { method: "POST", path: "/resume", description: "Validate resume readiness (409 if gated)" },
  { method: "GET", path: "/runs/{run_id}/audit_log", description: "Deterministic audit trace" },
] as const;

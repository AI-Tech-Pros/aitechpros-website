import { platformApiBase } from "@/lib/site";

const SESSION_TOKEN_KEY = "orchestrateos_session_token";

export function getStoredSessionToken(): string | null {
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredSessionToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    else sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    /* private browsing / SSR */
  }
}

export type SessionUser = {
  authenticated: boolean;
  email?: string;
  role?: "partner" | "admin";
  partner_id?: string | null;
  partner_slug?: string | null;
};

export type PartnerProfile = {
  id: string;
  slug: string;
  company_name: string;
  phase: string;
  status: string;
  milestone: string | null;
  runner_api_key_hint: string | null;
};

export type PartnerRun = {
  run_id: string;
  workflow_name: string;
  status: string;
  environment: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
};

async function platformFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${platformApiBase()}/api${path}`;
  const token = getStoredSessionToken();
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, {
    ...init,
    credentials: "include",
    headers,
  });
}

export async function submitLead(body: {
  name: string;
  email: string;
  company?: string;
  use_case?: string;
}): Promise<{ ok: boolean; message?: string; error?: string }> {
  const res = await platformFetch("/leads", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { message?: string; detail?: string };
  if (!res.ok) {
    return { ok: false, error: data.detail ?? "Submission failed" };
  }
  return { ok: true, message: data.message };
}

export async function requestMagicLink(email: string): Promise<{ ok: boolean; message?: string }> {
  const res = await platformFetch("/auth/magic-link", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  const data = (await res.json()) as { message?: string };
  return { ok: res.ok, message: data.message };
}

export async function verifyMagicLink(token: string): Promise<{
  ok: boolean;
  redirect?: string;
  error?: string;
}> {
  const res = await platformFetch(`/auth/verify?token=${encodeURIComponent(token)}`);
  const data = (await res.json()) as {
    ok?: boolean;
    token?: string;
    redirect?: string;
    detail?: string;
  };
  if (!res.ok) return { ok: false, error: data.detail ?? "Verification failed" };
  if (data.token) setStoredSessionToken(data.token);
  return { ok: true, redirect: data.redirect ?? "/partner/dashboard" };
}

export async function fetchSession(): Promise<SessionUser> {
  const res = await platformFetch("/auth/me");
  if (!res.ok) return { authenticated: false };
  return (await res.json()) as SessionUser;
}

export async function logout(): Promise<void> {
  await platformFetch("/auth/logout", { method: "POST" });
  setStoredSessionToken(null);
}

export async function fetchPartnerMe(): Promise<{
  email: string;
  role: string;
  partner: PartnerProfile | null;
}> {
  const res = await platformFetch("/partners/me");
  if (!res.ok) throw new Error("Failed to load partner profile");
  return res.json();
}

export async function fetchPartnerRuns(): Promise<{ runs: PartnerRun[]; tenant_id: string }> {
  const res = await platformFetch("/partners/me/runs");
  if (!res.ok) throw new Error("Failed to load runs");
  return res.json();
}

export type LeadStage = "new" | "engaged" | "qualified" | "converted";

export type AdminLead = {
  id: string;
  email: string;
  name: string;
  company: string | null;
  use_case: string | null;
  stage: LeadStage;
  source: string;
  created_at: string;
  updated_at: string;
};

export type AdminPartner = {
  id: string;
  slug: string;
  company_name: string;
  contact_email: string;
  phase: string;
  status: string;
  milestone: string | null;
  runner_api_key_hint: string | null;
  created_at: string;
  updated_at: string;
};

export type PartnerPhase = "discovery" | "build" | "review" | "complete";
export type PartnerStatus = "active" | "paused" | "complete";

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await platformFetch(path, init);
  const data = (await res.json()) as T & { detail?: string };
  if (!res.ok) {
    throw new Error(data.detail ?? `Request failed (${res.status})`);
  }
  return data;
}

export async function fetchAdminLeads(stage?: LeadStage): Promise<{ leads: AdminLead[] }> {
  const q = stage ? `?stage=${encodeURIComponent(stage)}` : "";
  return adminFetch(`/admin/leads${q}`);
}

export async function upsertAdminLead(body: {
  id?: string;
  email: string;
  name: string;
  company?: string;
  use_case?: string;
  stage?: LeadStage;
  source?: string;
}): Promise<{ lead: AdminLead }> {
  return adminFetch("/admin/leads", { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteAdminLead(id: string): Promise<void> {
  await adminFetch("/admin/leads", { method: "DELETE", body: JSON.stringify({ id }) });
}

export async function fetchAdminPartners(): Promise<{ partners: AdminPartner[] }> {
  return adminFetch("/admin/partners");
}

export async function createAdminPartner(body: {
  company_name: string;
  contact_email: string;
  slug?: string;
  phase?: PartnerPhase;
  status?: PartnerStatus;
  milestone?: string;
  runner_api_key_hint?: string;
}): Promise<{
  partner: AdminPartner;
  runner_api_key?: string;
  runner_key_note?: string;
}> {
  return adminFetch("/admin/partners", { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminPartner(body: {
  id: string;
  company_name?: string;
  contact_email?: string;
  phase?: PartnerPhase;
  status?: PartnerStatus;
  milestone?: string;
  runner_api_key_hint?: string;
}): Promise<{ partner: AdminPartner }> {
  return adminFetch("/admin/partners", { method: "PUT", body: JSON.stringify(body) });
}

export type OnboardResult = {
  partner: { id: string; slug: string; company_name: string; contact_email: string };
  tenant_id: string;
  team_count: number;
  magic_link_sent: boolean;
  runner_api_key: string;
  runner_api_key_hint: string;
  message: string;
};

export type FirstWorkflowResult = {
  run_id: string;
  workflow_name: string;
  status: string;
  tenant_id: string;
  environment?: string;
  already_exists?: boolean;
  message: string;
};

export type PartnerJourney = {
  tenant_id: string;
  runner_api_key_hint: string | null;
  run_count: number;
  first_workflow_run_id: string | null;
  steps: {
    onboarded: boolean;
    runner_key: boolean;
    signed_in: boolean;
    first_workflow: boolean;
    sdk_connected: boolean;
  };
  next_action: "issue_runner_key" | "run_sample_workflow" | "wire_sdk" | "explore";
  progress_percent: number;
};

export type PartnerStartRunResult = {
  run_id: string;
  workflow_name: string;
  status: string;
  environment: string;
  tenant_id: string;
  message: string;
};

export type RotateApiKeyResult = {
  runner_api_key: string;
  runner_api_key_hint: string;
  message: string;
};

export async function fetchPartnerJourney(): Promise<PartnerJourney> {
  const res = await platformFetch("/partners/me/journey");
  if (!res.ok) throw new Error("Failed to load partner journey");
  return res.json() as Promise<PartnerJourney>;
}

export async function rotatePartnerApiKey(): Promise<RotateApiKeyResult> {
  const res = await platformFetch("/partners/me/rotate-api-key", { method: "POST", body: "{}" });
  const data = (await res.json()) as RotateApiKeyResult & { detail?: string };
  if (!res.ok) throw new Error(data.detail ?? `Request failed (${res.status})`);
  return data;
}

export async function startPartnerFirstWorkflow(): Promise<FirstWorkflowResult> {
  const res = await platformFetch("/partners/me/first-workflow", { method: "POST", body: "{}" });
  const data = (await res.json()) as FirstWorkflowResult & { detail?: string };
  if (!res.ok) throw new Error(data.detail ?? `Request failed (${res.status})`);
  return data;
}

export async function startPartnerSdkRun(options?: {
  workflow_name?: string;
  environment?: "dev" | "staging" | "prod";
  metadata?: Record<string, unknown>;
}): Promise<PartnerStartRunResult> {
  const res = await platformFetch("/partners/me/start-run", {
    method: "POST",
    body: JSON.stringify({
      workflow_name: options?.workflow_name,
      environment: options?.environment,
      metadata: options?.metadata,
    }),
  });
  const data = (await res.json()) as PartnerStartRunResult & { detail?: string };
  if (!res.ok) throw new Error(data.detail ?? `Request failed (${res.status})`);
  return data;
}

export type PlatformReadiness = {
  session_secret: boolean;
  resend_api_key: boolean;
  demo_operator_key: boolean;
  admin_emails: boolean;
  notify_email: boolean;
  cron_secret: boolean;
  api_keys_json: boolean;
  site_url: boolean;
  ready_for_onboarding: boolean;
  onboarding_url: string;
  partners: {
    total: number;
    active: number;
    with_runner_key: number;
  };
};

export type ProvisionRunnerKeyResult = {
  partner: AdminPartner;
  runner_api_key?: string;
  runner_key_note?: string;
  already_exists?: boolean;
  issued?: boolean;
  rotated?: boolean;
  message?: string;
};

export async function fetchAdminPlatformReadiness(): Promise<PlatformReadiness> {
  return adminFetch("/admin/platform-readiness");
}

export async function provisionAdminPartnerRunnerKey(
  partnerId: string,
  options?: { rotate?: boolean },
): Promise<ProvisionRunnerKeyResult> {
  return adminFetch(`/admin/partners/${encodeURIComponent(partnerId)}/provision-runner-key`, {
    method: "POST",
    body: JSON.stringify(options ?? {}),
  });
}

export async function submitPartnerOnboard(body: {
  company_name: string;
  contact_name: string;
  contact_email: string;
  team_emails?: string;
  slug?: string;
  use_case?: string;
}): Promise<OnboardResult> {
  const res = await platformFetch("/partners/onboard", { method: "POST", body: JSON.stringify(body) });
  const data = (await res.json()) as OnboardResult & { detail?: string };
  if (!res.ok) throw new Error(data.detail ?? `Request failed (${res.status})`);
  return data;
}

export type AdminOutcome = {
  run_id: string;
  workflow_name: string;
  tenant_id: string;
  partner_company: string | null;
  status: string;
  environment: string;
  can_resume: boolean;
  blocker_count: number;
  steps_completed: number;
  created_at: string;
  updated_at: string;
  journey: {
    checklist_completed: boolean;
    first_workflow_at: string | null;
  };
};

export async function fetchAdminOutcomes(tenant?: string): Promise<{
  outcomes: AdminOutcome[];
  count: number;
}> {
  const q = tenant ? `?tenant=${encodeURIComponent(tenant)}` : "";
  return adminFetch(`/admin/outcomes${q}`);
}

export type TenantGatePolicy = {
  prod_requires_ack: boolean;
  permanent_consensus_min: number;
  partial_requires_compensation: boolean;
};

export async function fetchPartnerGatePolicy(): Promise<{
  tenant_id: string | null;
  policy: TenantGatePolicy;
}> {
  const res = await platformFetch("/partners/me/gate-policy");
  if (!res.ok) throw new Error("Failed to load gate policy");
  return res.json();
}

export async function fetchPartnerComplianceExport(
  runId: string,
): Promise<import("@/lib/orchestrateos-api").ComplianceExport> {
  const res = await platformFetch(
    `/partners/me/runs/${encodeURIComponent(runId)}/compliance_export`,
  );
  const data = (await res.json()) as import("@/lib/orchestrateos-api").ComplianceExport & {
    detail?: string;
  };
  if (!res.ok) throw new Error(data.detail ?? "Export failed");
  return data;
}

export async function downloadPartnerComplianceExport(runId: string): Promise<void> {
  const res = await platformFetch(
    `/partners/me/runs/${encodeURIComponent(runId)}/compliance_export?download=1`,
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail ?? `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `orchestrateos-compliance-${runId}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function updateAdminPartnerGatePolicy(
  partnerId: string,
  policy: Partial<TenantGatePolicy>,
): Promise<{ tenant_id: string; policy: TenantGatePolicy }> {
  return adminFetch(`/admin/partners/${encodeURIComponent(partnerId)}/gate-policy`, {
    method: "PUT",
    body: JSON.stringify(policy),
  });
}

export async function fetchAdminPartnerGatePolicy(
  partnerId: string,
): Promise<{ tenant_id: string; policy: TenantGatePolicy }> {
  return adminFetch(`/admin/partners/${encodeURIComponent(partnerId)}/gate-policy`);
}

export const DEFAULT_TENANT_GATE_POLICY: TenantGatePolicy = {
  prod_requires_ack: true,
  permanent_consensus_min: 0,
  partial_requires_compensation: true,
};

export type GovernanceMetrics = {
  tenant_id: string;
  runs_total: number;
  runs_blocked: number;
  gate_events_30d: number;
  gate_clears_30d: number;
  avg_clear_hours: number | null;
  recent_approvers: string[];
  gate_event_breakdown: Record<string, number>;
};

export async function fetchPartnerGovernanceMetrics(): Promise<GovernanceMetrics> {
  const res = await platformFetch("/partners/me/governance-metrics");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<GovernanceMetrics>;
}

export type PartnerApiKeyRow = {
  role: string;
  key_prefix: string;
  hint: string;
  created_at: string;
  revoked_at: string | null;
};

export async function fetchAdminPartnerApiKeys(
  partnerId: string,
): Promise<{ tenant_id: string; keys: PartnerApiKeyRow[] }> {
  return adminFetch(`/admin/partners/${encodeURIComponent(partnerId)}/api-keys`);
}

export async function provisionAdminPartnerApiKey(
  partnerId: string,
  role: "runner" | "operator" | "auditor",
): Promise<{ role: string; tenant_id: string; api_key: string; key_hint: string; message: string }> {
  return adminFetch(`/admin/partners/${encodeURIComponent(partnerId)}/provision-api-key`, {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

export type OpsSummary = {
  ingress_pending: number;
  ingress_failed: number;
  runs_blocked_total: number;
  nurture_pending: number;
};

export type IngressEvent = {
  id: string;
  tenant_id: string;
  source: string;
  source_id: string | null;
  status: string;
  run_id: string | null;
  created_at: string;
  processed_at: string | null;
};

export async function fetchAdminOpsSummary(): Promise<OpsSummary> {
  return adminFetch("/admin/ops/summary");
}

export async function fetchAdminIngressQueue(): Promise<{ events: IngressEvent[] }> {
  return adminFetch("/admin/ops/ingress");
}

export async function fetchOidcConfig(): Promise<{ enabled: boolean }> {
  const res = await fetch(`${platformApiBase()}/auth/oidc/config`);
  if (!res.ok) return { enabled: false };
  return res.json() as Promise<{ enabled: boolean }>;
}

export async function startOidcLogin(): Promise<{ authorize_url: string; state: string }> {
  const res = await fetch(`${platformApiBase()}/auth/oidc/start`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail ?? "SSO not available");
  }
  return res.json() as Promise<{ authorize_url: string; state: string }>;
}

export async function exchangeOidcCode(code: string): Promise<{
  ok: boolean;
  token: string;
  role: string;
  redirect: string;
}> {
  const res = await fetch(`${platformApiBase()}/auth/oidc/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail ?? "SSO sign-in failed");
  }
  return res.json() as Promise<{
    ok: boolean;
    token: string;
    role: string;
    redirect: string;
  }>;
}

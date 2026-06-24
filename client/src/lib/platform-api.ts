import { platformApiBase } from "@/lib/site";

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
  return fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
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
  const data = (await res.json()) as { ok?: boolean; redirect?: string; detail?: string };
  if (!res.ok) return { ok: false, error: data.detail ?? "Verification failed" };
  return { ok: true, redirect: data.redirect ?? "/partner/dashboard" };
}

export async function fetchSession(): Promise<SessionUser> {
  const res = await platformFetch("/auth/me");
  if (!res.ok) return { authenticated: false };
  return (await res.json()) as SessionUser;
}

export async function logout(): Promise<void> {
  await platformFetch("/auth/logout", { method: "POST" });
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
}): Promise<{ partner: AdminPartner; runner_key_note?: string }> {
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
  runner_key_note: string;
  message: string;
};

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

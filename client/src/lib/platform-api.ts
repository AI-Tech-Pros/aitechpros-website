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

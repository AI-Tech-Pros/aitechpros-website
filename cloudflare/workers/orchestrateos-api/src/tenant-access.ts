/** Tenant-scoped run access — Phase 5b isolation for non-demo reads/writes. */

import type { Context } from "hono";
import { authEnabled, isDemoRunId, type AuthContext, type AuthEnv } from "./auth";
import type { SessionPayload } from "./platform/session";
import type { RunRow } from "./serialize";

export function effectiveTenantId(run: RunRow): string {
  return run.tenant_id?.trim() || "default";
}

export function isPublicDemoRun(run: RunRow): boolean {
  return isDemoRunId(run.run_id) || effectiveTenantId(run) === "demo";
}

export function canAccessTenant(
  runTenant: string,
  auth: AuthContext,
  session: SessionPayload | null,
): boolean {
  if (session?.role === "admin") return true;
  if (session?.role === "partner" && session.partnerSlug === runTenant) return true;

  if (!auth.authenticated) return false;

  if (auth.isDemoOperator) return runTenant === "demo";

  const keyTenant = auth.tenant?.trim();
  if (keyTenant) return keyTenant === runTenant;

  return runTenant === "default";
}

function hasCredentials(auth: AuthContext, session: SessionPayload | null): boolean {
  return auth.authenticated || session !== null;
}

type RunAccessContext = {
  env: AuthEnv;
  get(key: "auth"): AuthContext;
  get(key: "session"): SessionPayload | null;
  json: Context["json"];
};

export function assertRunAccess(c: RunAccessContext, run: RunRow): Response | null {
  if (!authEnabled(c.env)) return null;
  if (isPublicDemoRun(run)) return null;

  const auth = c.get("auth");
  const session = c.get("session");

  if (!hasCredentials(auth, session)) {
    return c.json({ detail: "Authentication required" }, 401);
  }

  const runTenant = effectiveTenantId(run);
  if (!canAccessTenant(runTenant, auth, session)) {
    return c.json({ detail: "Access denied for this tenant" }, 403);
  }

  return null;
}

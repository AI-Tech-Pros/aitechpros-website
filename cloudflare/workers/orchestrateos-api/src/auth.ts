/** API key authentication and role-based access control. */

import type { Context } from "hono";
import { DEMO_RUN_IDS } from "./demo-runs";

export type AuthEnv = {
  API_AUTH_ENABLED?: string;
  API_KEYS_JSON?: string;
  DEMO_OPERATOR_KEY?: string;
};

export type ApiRole = "auditor" | "operator" | "runner";

export type AuthContext = {
  authenticated: boolean;
  role: ApiRole | null;
  token: string | null;
  isDemoOperator: boolean;
};

const ROLE_RANK: Record<ApiRole, number> = {
  auditor: 1,
  runner: 2,
  operator: 3,
};

const DEMO_RUN_ID_SET = new Set(Object.values(DEMO_RUN_IDS));

export function parseApiKeys(json: string | undefined): Map<string, ApiRole> {
  const map = new Map<string, ApiRole>();
  if (!json) return map;
  try {
    const parsed = JSON.parse(json) as Record<string, string>;
    for (const [key, role] of Object.entries(parsed)) {
      if (role === "auditor" || role === "operator" || role === "runner") {
        map.set(key, role);
      }
    }
  } catch {
    return map;
  }
  return map;
}

export function authEnabled(env: AuthEnv): boolean {
  return env.API_AUTH_ENABLED === "true" || env.API_AUTH_ENABLED === "1";
}

export function resolveAuth(
  authHeader: string | undefined,
  apiKeys: Map<string, ApiRole>,
  demoOperatorKey: string | undefined,
): AuthContext {
  if (!authHeader?.startsWith("Bearer ")) {
    return { authenticated: false, role: null, token: null, isDemoOperator: false };
  }
  const token = authHeader.slice(7).trim();
  const role = apiKeys.get(token) ?? null;
  if (role) {
    return { authenticated: true, role, token, isDemoOperator: false };
  }
  if (demoOperatorKey && token === demoOperatorKey) {
    return { authenticated: true, role: "operator", token, isDemoOperator: true };
  }
  return { authenticated: false, role: null, token, isDemoOperator: false };
}

export function requiresAuth(method: string, path: string): boolean {
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return false;
  if (path === "/health" || path === "/demo/runs") return false;
  return true;
}

export function requiredRole(method: string, path: string): ApiRole {
  if (
    path === "/demo/reset" ||
    path.includes("/compensate") ||
    path.includes("/approve") ||
    path.includes("/ack_prod_resume")
  ) {
    return "operator";
  }
  if (
    path === "/start_run" ||
    path.includes("/steps") ||
    path === "/resume" ||
    method === "PATCH"
  ) {
    return "runner";
  }
  return "runner";
}

export function hasRole(ctx: AuthContext, min: ApiRole): boolean {
  if (!ctx.role) return false;
  return ROLE_RANK[ctx.role] >= ROLE_RANK[min];
}

export function extractRunId(path: string): string | null {
  const match = path.match(/^\/runs\/([^/]+)/);
  return match?.[1] ?? null;
}

export function isDemoRunId(runId: string): boolean {
  return DEMO_RUN_ID_SET.has(runId as (typeof DEMO_RUN_IDS)[keyof typeof DEMO_RUN_IDS]);
}

export function actorLabel(ctx: AuthContext): string {
  if (!ctx.role) return "anonymous";
  if (!ctx.token) return ctx.role;
  return `${ctx.role}:${ctx.token.slice(0, 8)}`;
}

export async function enforceAuth(c: Context<{ Bindings: AuthEnv; Variables: { auth: AuthContext } }>) {
  const defaultAuth: AuthContext = {
    authenticated: false,
    role: null,
    token: null,
    isDemoOperator: false,
  };

  if (!requiresAuth(c.req.method, c.req.path)) {
    c.set("auth", defaultAuth);
    return null;
  }
  if (!authEnabled(c.env)) {
    c.set("auth", defaultAuth);
    return null;
  }

  const keys = parseApiKeys(c.env.API_KEYS_JSON);
  const ctx = resolveAuth(c.req.header("Authorization"), keys, c.env.DEMO_OPERATOR_KEY);
  if (!ctx.authenticated) {
    return c.json({ detail: "Missing or invalid API key" }, 401);
  }

  const minRole = requiredRole(c.req.method, c.req.path);
  if (!hasRole(ctx, minRole)) {
    return c.json({ detail: `Requires ${minRole} role` }, 403);
  }

  if (ctx.isDemoOperator && minRole === "operator") {
    const runId = extractRunId(c.req.path);
    if (c.req.path !== "/demo/reset" && runId && !isDemoRunId(runId)) {
      return c.json({ detail: "Demo operator key is only valid for demo runs" }, 403);
    }
  }

  c.set("auth", ctx);
  return null;
}

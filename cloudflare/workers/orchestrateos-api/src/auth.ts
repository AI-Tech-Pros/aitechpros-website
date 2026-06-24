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
  tenant: string | null;
};

const ROLE_RANK: Record<ApiRole, number> = {
  auditor: 1,
  runner: 2,
  operator: 3,
};

const DEMO_RUN_ID_SET = new Set(Object.values(DEMO_RUN_IDS));

export type ApiKeyEntry = ApiRole | { role: ApiRole; tenant?: string };

export function parseApiKeys(json: string | undefined): Map<string, ApiKeyEntry> {
  const map = new Map<string, ApiKeyEntry>();
  if (!json) return map;
  try {
    const parsed = JSON.parse(json) as Record<string, ApiKeyEntry>;
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        if (value === "auditor" || value === "operator" || value === "runner") {
          map.set(key, value);
        }
      } else if (value && typeof value === "object" && "role" in value) {
        const role = value.role;
        if (role === "auditor" || role === "operator" || role === "runner") {
          map.set(key, value);
        }
      }
    }
  } catch {
    return map;
  }
  return map;
}

function entryRole(entry: ApiKeyEntry | undefined): ApiRole | null {
  if (!entry) return null;
  return typeof entry === "string" ? entry : entry.role;
}

function entryTenant(entry: ApiKeyEntry | undefined): string | null {
  if (!entry || typeof entry === "string") return null;
  return entry.tenant?.trim() || null;
}

export function authEnabled(env: AuthEnv): boolean {
  return env.API_AUTH_ENABLED === "true" || env.API_AUTH_ENABLED === "1";
}

export function resolveAuth(
  authHeader: string | undefined,
  apiKeys: Map<string, ApiKeyEntry>,
  demoOperatorKey: string | undefined,
): AuthContext {
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      authenticated: false,
      role: null,
      token: null,
      isDemoOperator: false,
      tenant: null,
    };
  }
  const token = authHeader.slice(7).trim();
  const entry = apiKeys.get(token);
  const role = entryRole(entry);
  if (role) {
    return {
      authenticated: true,
      role,
      token,
      isDemoOperator: false,
      tenant: entryTenant(entry),
    };
  }
  if (demoOperatorKey && token === demoOperatorKey) {
    return {
      authenticated: true,
      role: "operator",
      token,
      isDemoOperator: true,
      tenant: "demo",
    };
  }
  return { authenticated: false, role: null, token, isDemoOperator: false, tenant: null };
}

export function requiresAuth(method: string, path: string): boolean {
  if (path.startsWith("/api/")) return false;
  if (path.startsWith("/internal/")) return false;
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
    path === "/kernel/run" ||
    path === "/llm/complete" ||
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

type AuthMiddlewareContext = {
  env: AuthEnv;
  req: {
    method: string;
    path: string;
    header(name: string): string | undefined;
  };
  set(key: "auth", value: AuthContext): void;
  json: Context["json"];
};

export async function enforceAuth(c: AuthMiddlewareContext) {
  const defaultAuth: AuthContext = {
    authenticated: false,
    role: null,
    token: null,
    isDemoOperator: false,
    tenant: null,
  };

  const keys = parseApiKeys(c.env.API_KEYS_JSON);
  const resolved = resolveAuth(
    c.req.header("Authorization"),
    keys,
    c.env.DEMO_OPERATOR_KEY,
  );

  if (!requiresAuth(c.req.method, c.req.path)) {
    c.set("auth", authEnabled(c.env) ? resolved : defaultAuth);
    return null;
  }
  if (!authEnabled(c.env)) {
    c.set("auth", defaultAuth);
    return null;
  }

  const ctx = resolved;
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

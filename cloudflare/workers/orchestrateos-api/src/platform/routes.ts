/** Platform layer — leads, magic-link auth, partner portal (Phase 5a). */

import { Hono } from "hono";
import type { Context } from "hono";
import { adminApp } from "./admin-routes";
import { leadNotifyEmail, magicLinkEmail, sendEmail, type EmailEnv } from "./email";
import {
  clearSessionCookieHeader,
  hashToken,
  readSessionCookie,
  sessionCookieHeader,
  signSession,
  type SessionPayload,
  verifySession,
} from "./session";

export type PlatformEnv = EmailEnv & {
  DB: D1Database;
  SESSION_SECRET?: string;
  ADMIN_EMAILS?: string;
};

type PartnerRow = {
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

type RunSummaryRow = {
  run_id: string;
  workflow_name: string;
  status: string;
  environment: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
};

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

export const platformApp = new Hono<{
  Bindings: PlatformEnv;
  Variables: { session: SessionPayload | null };
}>();

platformApp.use("*", async (c, next) => {
  c.set("session", null);
  const secret = c.env.SESSION_SECRET;
  if (secret) {
    const raw = readSessionCookie(c.req.header("Cookie"));
    if (raw) {
      const session = await verifySession(raw, secret);
      if (session) c.set("session", session);
    }
  }
  return next();
});

platformApp.route("/admin", adminApp);

platformApp.post("/leads", async (c) => {
  const body = await c.req.json<{
    name?: string;
    email?: string;
    company?: string;
    use_case?: string;
  }>();
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  if (!name || !email || !email.includes("@")) {
    return c.json({ detail: "name and valid email are required" }, 400);
  }
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(
      `INSERT INTO leads (id, email, name, company, use_case, stage, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'new', 'landing', ?, ?)`,
    )
      .bind(id, email, name, body.company?.trim() || null, body.use_case?.trim() || null, now, now)
      .run();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return c.json({ detail: "A lead with this email already exists" }, 409);
    }
    throw e;
  }
  if (c.env.NOTIFY_EMAIL) {
    const { subject, html } = leadNotifyEmail({
      name,
      email,
      company: body.company,
      use_case: body.use_case,
    });
    await sendEmail(c.env, c.env.NOTIFY_EMAIL, subject, html);
  }
  return c.json({ id, message: "Thank you — we will be in touch shortly." }, 201);
});

platformApp.post("/auth/magic-link", async (c) => {
  const secret = requireSessionSecret(c);
  if (!secret) return c.json({ detail: "Auth not configured" }, 503);

  const body = await c.req.json<{ email?: string }>();
  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return c.json({ detail: "Valid email is required" }, 400);
  }

  const allowed = await canLoginWithEmail(c.env.DB, email, c.env.ADMIN_EMAILS);
  if (!allowed) {
    return c.json({
      message: "If an account exists for this email, a sign-in link has been sent.",
    });
  }

  const token = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS).toISOString();
  await c.env.DB.prepare(
    `INSERT INTO magic_link_tokens (token_hash, email, expires_at) VALUES (?, ?, ?)`,
  )
    .bind(tokenHash, email, expiresAt)
    .run();

  const siteUrl = c.env.SITE_URL ?? "https://orchestrateos.pages.dev";
  const { subject, html } = magicLinkEmail(siteUrl, token);
  await sendEmail(c.env, email, subject, html);

  return c.json({
    message: "If an account exists for this email, a sign-in link has been sent.",
  });
});

platformApp.get("/auth/verify", async (c) => {
  const secret = requireSessionSecret(c);
  if (!secret) return c.json({ detail: "Auth not configured" }, 503);

  const token = c.req.query("token")?.trim();
  if (!token) return c.json({ detail: "token is required" }, 400);

  const tokenHash = await hashToken(token);
  const row = await c.env.DB.prepare(
    `SELECT email, expires_at, used_at FROM magic_link_tokens WHERE token_hash = ?`,
  )
    .bind(tokenHash)
    .first<{ email: string; expires_at: string; used_at: string | null }>();

  if (!row || row.used_at) return c.json({ detail: "Invalid or expired link" }, 400);
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return c.json({ detail: "Invalid or expired link" }, 400);
  }

  await c.env.DB.prepare(
    `UPDATE magic_link_tokens SET used_at = ? WHERE token_hash = ?`,
  )
    .bind(new Date().toISOString(), tokenHash)
    .run();

  const sessionUser = await resolveOrCreateSessionUser(c.env.DB, row.email, c.env.ADMIN_EMAILS);
  if (!sessionUser) return c.json({ detail: "No account for this email" }, 403);

  const jwt = await signSession(
    {
      sub: sessionUser.userId,
      email: sessionUser.email,
      role: sessionUser.role,
      partnerId: sessionUser.partnerId,
      partnerSlug: sessionUser.partnerSlug,
    },
    secret,
  );

  const now = new Date().toISOString();
  await c.env.DB.prepare(`UPDATE users SET last_login_at = ? WHERE id = ?`)
    .bind(now, sessionUser.userId)
    .run();

  return new Response(
    JSON.stringify({
      ok: true,
      role: sessionUser.role,
      redirect: sessionUser.role === "admin" ? "/admin/capture" : "/partner/dashboard",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": sessionCookieHeader(jwt),
      },
    },
  );
});

platformApp.get("/auth/me", (c) => {
  const session = c.get("session");
  if (!session) return c.json({ authenticated: false }, 401);
  return c.json({
    authenticated: true,
    email: session.email,
    role: session.role,
    partner_id: session.partnerId ?? null,
    partner_slug: session.partnerSlug ?? null,
  });
});

platformApp.post("/auth/logout", (c) => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearSessionCookieHeader(),
    },
  });
});

platformApp.get("/partners/me", async (c) => {
  const session = requirePartnerSession(c);
  if (session instanceof Response) return session;

  if (!session.partnerId) {
    return c.json({
      email: session.email,
      role: session.role,
      partner: null,
    });
  }

  const partner = await c.env.DB.prepare(`SELECT * FROM design_partners WHERE id = ?`)
    .bind(session.partnerId)
    .first<PartnerRow>();

  return c.json({
    email: session.email,
    role: session.role,
    partner: partner
      ? {
          id: partner.id,
          slug: partner.slug,
          company_name: partner.company_name,
          phase: partner.phase,
          status: partner.status,
          milestone: partner.milestone,
          runner_api_key_hint: partner.runner_api_key_hint,
        }
      : null,
  });
});

platformApp.get("/partners/me/runs", async (c) => {
  const session = requirePartnerSession(c);
  if (session instanceof Response) return session;

  const tenantId = session.partnerSlug;
  if (!tenantId) {
    return c.json({ runs: [] });
  }

  const { results } = await c.env.DB.prepare(
    `SELECT run_id, workflow_name, status, environment, tenant_id, created_at, updated_at
     FROM runs WHERE tenant_id = ?
     ORDER BY updated_at DESC
     LIMIT 100`,
  )
    .bind(tenantId)
    .all<RunSummaryRow>();

  return c.json({ runs: results ?? [], tenant_id: tenantId });
});

function requireSessionSecret(c: { env: PlatformEnv }): string | null {
  return c.env.SESSION_SECRET?.trim() || null;
}

function requirePartnerSession(
  c: Context<{ Bindings: PlatformEnv; Variables: { session: SessionPayload | null } }>,
): SessionPayload | Response {
  const session = c.get("session");
  if (!session) return c.json({ detail: "Authentication required" }, 401);
  if (session.role !== "partner" && session.role !== "admin") {
    return c.json({ detail: "Partner access required" }, 403);
  }
  return session;
}

async function canLoginWithEmail(
  db: D1Database,
  email: string,
  adminEmails?: string,
): Promise<boolean> {
  if (isAdminEmail(email, adminEmails)) return true;
  const user = await db
    .prepare(`SELECT id FROM users WHERE email = ?`)
    .bind(email)
    .first();
  if (user) return true;
  const partner = await db
    .prepare(`SELECT id FROM design_partners WHERE lower(contact_email) = ?`)
    .bind(email)
    .first();
  return !!partner;
}

function isAdminEmail(email: string, adminEmails?: string): boolean {
  if (!adminEmails) return false;
  const list = adminEmails.split(",").map((e) => e.trim().toLowerCase());
  return list.includes(email.toLowerCase());
}

async function resolveOrCreateSessionUser(
  db: D1Database,
  email: string,
  adminEmails?: string,
): Promise<{
  userId: string;
  email: string;
  role: "partner" | "admin";
  partnerId?: string;
  partnerSlug?: string;
} | null> {
  if (isAdminEmail(email, adminEmails)) {
    const userId = await ensureUser(db, email, "admin", null, null);
    return { userId, email, role: "admin" };
  }

  const existing = await db
    .prepare(`SELECT id, role, partner_id FROM users WHERE email = ?`)
    .bind(email)
    .first<{ id: string; role: string; partner_id: string | null }>();

  if (existing) {
    let partnerSlug: string | undefined;
    if (existing.partner_id) {
      const p = await db
        .prepare(`SELECT slug FROM design_partners WHERE id = ?`)
        .bind(existing.partner_id)
        .first<{ slug: string }>();
      partnerSlug = p?.slug;
    }
    return {
      userId: existing.id,
      email,
      role: existing.role === "admin" ? "admin" : "partner",
      partnerId: existing.partner_id ?? undefined,
      partnerSlug,
    };
  }

  const partner = await db
    .prepare(`SELECT * FROM design_partners WHERE lower(contact_email) = ?`)
    .bind(email)
    .first<PartnerRow>();

  if (partner) {
    const userId = await ensureUser(db, email, "partner", partner.id, partner.company_name);
    return {
      userId,
      email,
      role: "partner",
      partnerId: partner.id,
      partnerSlug: partner.slug,
    };
  }

  return null;
}

async function ensureUser(
  db: D1Database,
  email: string,
  role: "partner" | "admin",
  partnerId: string | null,
  name: string | null,
): Promise<string> {
  const existing = await db
    .prepare(`SELECT id FROM users WHERE email = ?`)
    .bind(email)
    .first<{ id: string }>();
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO users (id, email, name, role, partner_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, email, name, role, partnerId, now)
    .run();
  return id;
}

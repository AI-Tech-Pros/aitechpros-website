/** Platform layer — leads, magic-link auth, partner portal (Phase 5a). */

import { Hono } from "hono";
import type { Context } from "hono";
import { adminApp } from "./admin-routes";
import { storeAndSendMagicLink } from "./auth-links";
import { leadNotifyEmail, sendEmail, type EmailEnv } from "./email";
import {
  createDesignPartner,
  ensureUser,
  parseEmailList,
  partnerContactExists,
} from "./partner-db";
import { createPartnerFirstWorkflow } from "./partner-first-workflow";
import { createPartnerStartRun } from "./partner-start-run";
import { getPartnerJourney } from "./partner-journey";
import { buildComplianceExport } from "../compliance-export";
import { complianceExportHtml } from "../compliance-export-html";
import { getTenantGatePolicy, parseGatePolicy, type TenantGatePolicy } from "../gate-policies";
import { provisionPartnerRunnerKey, rotatePartnerRunnerKey } from "../tenant-api-keys";
import { buildTenantGovernanceMetrics } from "../governance-metrics";
import { buildOidcAuthorizeUrl, exchangeOidcCode, oidcEnabled } from "./oidc-auth";
import { enrollWelcomeSequence } from "./nurture/service";
import {
  clearSessionCookieHeader,
  hashToken,
  readBearerToken,
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
  DEMO_OPERATOR_KEY?: string;
  CRON_SECRET?: string;
  API_KEYS_JSON?: string;
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

export const platformApp = new Hono<{
  Bindings: PlatformEnv;
  Variables: { session: SessionPayload | null };
}>();

platformApp.use("*", async (c, next) => {
  c.set("session", null);
  const secret = c.env.SESSION_SECRET;
  if (secret) {
    const raw =
      readSessionCookie(c.req.header("Cookie")) ??
      readBearerToken(c.req.header("Authorization"));
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
  await enrollWelcomeSequence(c.env.DB, id);
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

  await storeAndSendMagicLink(c.env, email);

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
      token: jwt,
      role: sessionUser.role,
      redirect:
        sessionUser.role === "admin"
          ? "/admin/capture"
          : "/partner/dashboard?welcome=1",
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

platformApp.get("/auth/oidc/config", (c) => c.json({ enabled: oidcEnabled(c.env) }));

platformApp.get("/auth/oidc/start", async (c) => {
  const start = await buildOidcAuthorizeUrl(c.env);
  if (!start) return c.json({ detail: "OIDC not configured" }, 503);
  return c.json(start);
});

platformApp.post("/auth/oidc/exchange", async (c) => {
  const secret = requireSessionSecret(c);
  if (!secret) return c.json({ detail: "Auth not configured" }, 503);

  const body = await c.req.json<{ code?: string }>();
  const code = body.code?.trim();
  if (!code) return c.json({ detail: "code is required" }, 400);

  try {
    const { email } = await exchangeOidcCode(c.env, code);
    const sessionUser = await resolveOrCreateSessionUser(c.env.DB, email, c.env.ADMIN_EMAILS);
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

    return c.json({
      ok: true,
      token: jwt,
      role: sessionUser.role,
      redirect:
        sessionUser.role === "admin" ? "/admin/capture" : "/partner/dashboard?welcome=1",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OIDC exchange failed";
    return c.json({ detail: msg }, 401);
  }
});

platformApp.get("/partners/me/governance-metrics", async (c) => {
  const session = requirePartnerSession(c);
  if (session instanceof Response) return session;
  const tenantId = session.partnerSlug;
  if (!tenantId) return c.json({ detail: "Partner tenant not found" }, 400);
  const metrics = await buildTenantGovernanceMetrics(c.env.DB, tenantId);
  return c.json(metrics);
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

platformApp.get("/partners/me/gate-policy", async (c) => {
  const session = requirePartnerSession(c);
  if (session instanceof Response) return session;

  const tenantId = session.partnerSlug;
  if (!tenantId) {
    return c.json({ tenant_id: null, policy: parseGatePolicy(null) });
  }

  const policy = await getTenantGatePolicy(c.env.DB, tenantId);
  return c.json({ tenant_id: tenantId, policy });
});

platformApp.get("/partners/me/runs/:runId/compliance_export", async (c) => {
  const session = requirePartnerSession(c);
  if (session instanceof Response) return session;

  const tenantId = session.partnerSlug;
  if (!tenantId) return c.json({ detail: "Partner tenant not found" }, 400);

  const runId = c.req.param("runId")?.trim();
  if (!runId) return c.json({ detail: "runId is required" }, 400);

  const run = await c.env.DB.prepare(`SELECT * FROM runs WHERE run_id = ?`)
    .bind(runId)
    .first<{
      run_id: string;
      workflow_name: string;
      status: string;
      environment: string;
      tenant_id?: string;
      created_at: string;
      updated_at: string;
      metadata_json: string;
    }>();
  if (!run) return c.json({ detail: "Run not found" }, 404);
  if ((run.tenant_id?.trim() || "default") !== tenantId) {
    return c.json({ detail: "Access denied for this run" }, 403);
  }

  const { results: steps } = await c.env.DB.prepare(
    `SELECT * FROM step_records WHERE run_id = ? ORDER BY sequence ASC`,
  )
    .bind(runId)
    .all<{
      id: number;
      run_id: string;
      step_name: string;
      step_index: number;
      input_json: string;
      input_hash: string;
      output_json: string | null;
      status: string;
      idempotency_key: string;
      timestamp: string;
      failure_classification: string | null;
      error_message: string | null;
      sequence: number;
    }>();

  const bundle = await buildComplianceExport(c.env.DB, run, steps ?? []);
  if (c.req.query("download") === "pdf" || c.req.query("format") === "html") {
    const html = complianceExportHtml(bundle);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="orchestrateos-compliance-${runId}.html"`,
      },
    });
  }
  if (c.req.query("download") === "1") {
    return new Response(JSON.stringify(bundle, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="orchestrateos-compliance-${runId}.json"`,
      },
    });
  }
  return c.json(bundle);
});

platformApp.get("/partners/me/journey", async (c) => {
  const session = requirePartnerSession(c);
  if (session instanceof Response) return session;

  if (!session.partnerId || !session.partnerSlug) {
    return c.json({ detail: "Partner profile not found" }, 400);
  }

  const partner = await c.env.DB.prepare(`SELECT runner_api_key_hint FROM design_partners WHERE id = ?`)
    .bind(session.partnerId)
    .first<{ runner_api_key_hint: string | null }>();

  const journey = await getPartnerJourney(
    c.env.DB,
    session.partnerId,
    session.partnerSlug,
    partner?.runner_api_key_hint ?? null,
  );
  return c.json(journey);
});

platformApp.post("/partners/me/rotate-api-key", async (c) => {
  const session = requirePartnerSession(c);
  if (session instanceof Response) return session;

  if (!session.partnerId || !session.partnerSlug) {
    return c.json({ detail: "Partner profile not found" }, 400);
  }

  const { key, hint } = await rotatePartnerRunnerKey(
    c.env.DB,
    session.partnerId,
    session.partnerSlug,
  );

  return c.json({
    runner_api_key: key,
    runner_api_key_hint: hint,
    message: "New runner API key issued. Previous keys are revoked. Copy this key now — it is shown only once.",
  });
});

platformApp.post("/partners/me/first-workflow", async (c) => {
  const session = requirePartnerSession(c);
  if (session instanceof Response) return session;

  const tenantId = session.partnerSlug;
  if (!tenantId) {
    return c.json({ detail: "Partner tenant not found" }, 400);
  }

  const existing = await c.env.DB.prepare(
    `SELECT run_id FROM runs WHERE tenant_id = ? AND workflow_name = 'partner_first_workflow' LIMIT 1`,
  )
    .bind(tenantId)
    .first<{ run_id: string }>();

  if (existing) {
    return c.json({
      run_id: existing.run_id,
      workflow_name: "partner_first_workflow",
      status: "completed",
      tenant_id: tenantId,
      already_exists: true,
      message: "You already have a sample workflow. Open Gate explorer to view it.",
    });
  }

  const result = await createPartnerFirstWorkflow(c.env.DB, tenantId, session.email);
  return c.json(result, 201);
});

platformApp.post("/partners/me/start-run", async (c) => {
  const session = requirePartnerSession(c);
  if (session instanceof Response) return session;

  const tenantId = session.partnerSlug;
  if (!tenantId) return c.json({ detail: "Partner tenant not found" }, 400);

  const body = await c.req.json<{
    workflow_name?: string;
    environment?: "dev" | "staging" | "prod";
    metadata?: Record<string, unknown>;
  }>();

  const workflowName = body.workflow_name?.trim() || "my_pipeline";
  try {
    const result = await createPartnerStartRun(c.env.DB, tenantId, session.email, workflowName, {
      environment: body.environment,
      metadata: body.metadata,
    });
    return c.json(result, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "start_run failed";
    return c.json({ detail: message }, 400);
  }
});

platformApp.post("/partners/onboard", async (c) => {
  const body = await c.req.json<{
    company_name?: string;
    contact_name?: string;
    contact_email?: string;
    team_emails?: string[] | string;
    slug?: string;
    use_case?: string;
  }>();

  const companyName = body.company_name?.trim();
  const contactName = body.contact_name?.trim();
  const contactEmail = body.contact_email?.trim().toLowerCase();
  if (!companyName || !contactName || !contactEmail || !contactEmail.includes("@")) {
    return c.json({ detail: "company_name, contact_name, and valid contact_email are required" }, 400);
  }

  if (await partnerContactExists(c.env.DB, contactEmail)) {
    return c.json({ detail: "This contact email is already onboarded as a design partner" }, 409);
  }

  const teamEmails = parseEmailList(body.team_emails).filter((e) => e !== contactEmail);

  try {
    const partner = await createDesignPartner(c.env.DB, {
      company_name: companyName,
      contact_email: contactEmail,
      contact_name: contactName,
      slug: body.slug,
      milestone: body.use_case?.trim() || "Self-service onboarding",
    });

    for (const email of teamEmails) {
      await ensureUser(c.env.DB, email, "partner", partner.id, null);
    }

    const now = new Date().toISOString();
    await c.env.DB.prepare(
      `UPDATE leads SET stage = 'converted', company = COALESCE(company, ?), updated_at = ?
       WHERE lower(email) = ?`,
    )
      .bind(companyName, now, contactEmail)
      .run();

    const { key: runnerApiKey, hint } = await provisionPartnerRunnerKey(
      c.env.DB,
      partner.id,
      partner.slug,
    );

    const magicLinkSent = await storeAndSendMagicLink(c.env, contactEmail);

    return c.json({
      partner: {
        id: partner.id,
        slug: partner.slug,
        company_name: partner.company_name,
        contact_email: partner.contact_email,
      },
      tenant_id: partner.slug,
      team_count: teamEmails.length + 1,
      magic_link_sent: magicLinkSent,
      runner_api_key: runnerApiKey,
      runner_api_key_hint: hint,
      message: magicLinkSent
        ? "Partner workspace created. Save your runner API key below — it is shown only once. Check your email for a sign-in link."
        : "Partner workspace created. Save your runner API key below — it is shown only once. Use Partner login to request a sign-in link.",
    }, 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return c.json({ detail: "Partner or email already exists" }, 409);
    }
    throw e;
  }
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

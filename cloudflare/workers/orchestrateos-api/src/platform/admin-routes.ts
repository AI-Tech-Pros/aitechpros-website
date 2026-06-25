/** Admin platform routes — lead capture CRUD and design partner management (Phase 5c). */

import { Hono } from "hono";
import type { Context } from "hono";
import type { PlatformEnv } from "./routes";
import {
  createDesignPartner,
  ensureUser,
  type PartnerRow,
  runnerKeyNote,
} from "./partner-db";
import { provisionPartnerRunnerKey, rotatePartnerRunnerKey, ensurePartnerRunnerKey, provisionPartnerOperatorKey, provisionPartnerAuditorKey, listPartnerApiKeys } from "../tenant-api-keys";
import { buildOpsSummary } from "../governance-metrics";
import { enrollWelcomeSequence, onLeadStageChanged } from "./nurture/service";
import type { SessionPayload } from "./session";
import { runGateSummary } from "../resume-blockers";
import { parseGatePolicy, type TenantGatePolicy } from "../gate-policies";
import { parseMetadata, type RunRow, type StepRow } from "../serialize";

const LEAD_STAGES = new Set(["new", "engaged", "qualified", "converted"]);
const PARTNER_PHASES = new Set(["discovery", "build", "review", "complete"]);
const PARTNER_STATUSES = new Set(["active", "paused", "complete"]);

type LeadRow = {
  id: string;
  email: string;
  name: string;
  company: string | null;
  use_case: string | null;
  stage: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export const adminApp = new Hono<{
  Bindings: PlatformEnv;
  Variables: { session: SessionPayload | null };
}>();

adminApp.get("/leads", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const stage = c.req.query("stage")?.trim();
  if (stage && !LEAD_STAGES.has(stage)) {
    return c.json({ detail: "Invalid stage filter" }, 400);
  }

  const sql = stage
    ? `SELECT * FROM leads WHERE stage = ? ORDER BY created_at DESC`
    : `SELECT * FROM leads ORDER BY created_at DESC`;
  const { results } = stage
    ? await c.env.DB.prepare(sql).bind(stage).all<LeadRow>()
    : await c.env.DB.prepare(sql).all<LeadRow>();

  return c.json({ leads: results ?? [] });
});

adminApp.put("/leads", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const body = await c.req.json<{
    id?: string;
    email?: string;
    name?: string;
    company?: string;
    use_case?: string;
    stage?: string;
    source?: string;
  }>();

  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim();
  if (!email || !email.includes("@") || !name) {
    return c.json({ detail: "name and valid email are required" }, 400);
  }

  const stage = body.stage?.trim() || "new";
  if (!LEAD_STAGES.has(stage)) {
    return c.json({ detail: "Invalid stage" }, 400);
  }

  const now = new Date().toISOString();
  const company = body.company?.trim() || null;
  const useCase = body.use_case?.trim() || null;
  const source = body.source?.trim() || "admin";

  if (body.id) {
    const prior = await c.env.DB.prepare(`SELECT stage FROM leads WHERE id = ?`)
      .bind(body.id)
      .first<{ stage: string }>();

    const conflict = await c.env.DB.prepare(
      `SELECT id FROM leads WHERE email = ? AND id != ?`,
    )
      .bind(email, body.id)
      .first();
    if (conflict) return c.json({ detail: "A lead with this email already exists" }, 409);

    await c.env.DB.prepare(
      `UPDATE leads SET email = ?, name = ?, company = ?, use_case = ?, stage = ?, source = ?, updated_at = ?
       WHERE id = ?`,
    )
      .bind(email, name, company, useCase, stage, source, now, body.id)
      .run();

    const lead = await c.env.DB.prepare(`SELECT * FROM leads WHERE id = ?`)
      .bind(body.id)
      .first<LeadRow>();
    if (!lead) return c.json({ detail: "Lead not found" }, 404);
    await onLeadStageChanged(c.env.DB, body.id, prior?.stage ?? null, stage);
    return c.json({ lead });
  }

  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(
      `INSERT INTO leads (id, email, name, company, use_case, stage, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, email, name, company, useCase, stage, source, now, now)
      .run();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return c.json({ detail: "A lead with this email already exists" }, 409);
    }
    throw e;
  }

  const lead = await c.env.DB.prepare(`SELECT * FROM leads WHERE id = ?`)
    .bind(id)
    .first<LeadRow>();
  await enrollWelcomeSequence(c.env.DB, id);
  if (stage === "engaged") {
    await onLeadStageChanged(c.env.DB, id, null, "engaged");
  }
  return c.json({ lead }, 201);
});

adminApp.delete("/leads", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const body = await c.req.json<{ id?: string }>();
  if (!body.id) return c.json({ detail: "id is required" }, 400);

  const existing = await c.env.DB.prepare(`SELECT id FROM leads WHERE id = ?`)
    .bind(body.id)
    .first();
  if (!existing) return c.json({ detail: "Lead not found" }, 404);

  await c.env.DB.prepare(`DELETE FROM leads WHERE id = ?`).bind(body.id).run();
  return c.json({ ok: true });
});

adminApp.get("/partners", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM design_partners ORDER BY created_at DESC`,
  ).all<PartnerRow>();

  return c.json({ partners: results ?? [] });
});

adminApp.post("/partners", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const body = await c.req.json<{
    company_name?: string;
    contact_email?: string;
    slug?: string;
    phase?: string;
    status?: string;
    milestone?: string;
    runner_api_key_hint?: string;
  }>();

  const companyName = body.company_name?.trim();
  const contactEmail = body.contact_email?.trim().toLowerCase();
  if (!companyName || !contactEmail || !contactEmail.includes("@")) {
    return c.json({ detail: "company_name and valid contact_email are required" }, 400);
  }

  const phase = body.phase?.trim() || "discovery";
  const status = body.status?.trim() || "active";
  if (!PARTNER_PHASES.has(phase)) return c.json({ detail: "Invalid phase" }, 400);
  if (!PARTNER_STATUSES.has(status)) return c.json({ detail: "Invalid status" }, 400);

  try {
    const partner = await createDesignPartner(c.env.DB, {
      company_name: companyName,
      contact_email: contactEmail,
      slug: body.slug,
      phase,
      status,
      milestone: body.milestone?.trim() || null,
      runner_api_key_hint: body.runner_api_key_hint?.trim() || null,
    });

    const { key: runnerApiKey, hint } = await provisionPartnerRunnerKey(
      c.env.DB,
      partner.id,
      partner.slug,
    );

    return c.json({
      partner: { ...partner, runner_api_key_hint: hint },
      runner_api_key: runnerApiKey,
      runner_key_note: runnerKeyNote(partner.slug),
    }, 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return c.json({ detail: "Partner or email already exists" }, 409);
    }
    throw e;
  }
});

adminApp.put("/partners", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const body = await c.req.json<{
    id?: string;
    company_name?: string;
    contact_email?: string;
    phase?: string;
    status?: string;
    milestone?: string;
    runner_api_key_hint?: string;
  }>();

  if (!body.id) return c.json({ detail: "id is required" }, 400);

  const existing = await c.env.DB.prepare(`SELECT * FROM design_partners WHERE id = ?`)
    .bind(body.id)
    .first<PartnerRow>();
  if (!existing) return c.json({ detail: "Partner not found" }, 404);

  const companyName = body.company_name?.trim() || existing.company_name;
  const contactEmail = body.contact_email?.trim().toLowerCase() || existing.contact_email;
  const phase = body.phase?.trim() || existing.phase;
  const status = body.status?.trim() || existing.status;
  if (!PARTNER_PHASES.has(phase)) return c.json({ detail: "Invalid phase" }, 400);
  if (!PARTNER_STATUSES.has(status)) return c.json({ detail: "Invalid status" }, 400);

  const milestone =
    body.milestone !== undefined ? body.milestone.trim() || null : existing.milestone;
  const hint =
    body.runner_api_key_hint !== undefined
      ? body.runner_api_key_hint.trim() || null
      : existing.runner_api_key_hint;

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `UPDATE design_partners SET
      company_name = ?, contact_email = ?, phase = ?, status = ?,
      milestone = ?, runner_api_key_hint = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(companyName, contactEmail, phase, status, milestone, hint, now, body.id)
    .run();

  if (contactEmail !== existing.contact_email) {
    await ensureUser(c.env.DB, contactEmail, "partner", body.id, companyName);
  }

  const partner = await c.env.DB.prepare(`SELECT * FROM design_partners WHERE id = ?`)
    .bind(body.id)
    .first<PartnerRow>();

  return c.json({ partner });
});

adminApp.get("/platform-readiness", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const env = c.env;
  const flags = {
    session_secret: Boolean(env.SESSION_SECRET?.trim()),
    resend_api_key: Boolean(env.RESEND_API_KEY?.trim()),
    demo_operator_key: Boolean(env.DEMO_OPERATOR_KEY?.trim()),
    admin_emails: Boolean(env.ADMIN_EMAILS?.trim()),
    notify_email: Boolean(env.NOTIFY_EMAIL?.trim()),
    cron_secret: Boolean(env.CRON_SECRET?.trim()),
    api_keys_json: Boolean(env.API_KEYS_JSON?.trim()),
    site_url: Boolean(env.SITE_URL?.trim()),
  };

  const partnerStats = await c.env.DB.prepare(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
       SUM(CASE WHEN runner_api_key_hint IS NOT NULL THEN 1 ELSE 0 END) AS with_runner_key
     FROM design_partners`,
  ).first<{ total: number; active: number; with_runner_key: number }>();

  const readyForOnboarding =
    flags.session_secret &&
    flags.resend_api_key &&
    flags.site_url &&
    flags.admin_emails;

  const siteBase = env.SITE_URL?.replace(/\/$/, "") ?? "https://orchestrateos.pages.dev";

  return c.json({
    ...flags,
    ready_for_onboarding: readyForOnboarding,
    onboarding_url: `${siteBase}/onboarding`,
    partners: {
      total: partnerStats?.total ?? 0,
      active: partnerStats?.active ?? 0,
      with_runner_key: partnerStats?.with_runner_key ?? 0,
    },
  });
});

adminApp.post("/partners/:id/provision-runner-key", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const partnerId = c.req.param("id")?.trim();
  if (!partnerId) return c.json({ detail: "Partner id is required" }, 400);

  const body = await c.req.json<{ rotate?: boolean }>().catch(() => ({} as { rotate?: boolean }));

  const partner = await c.env.DB.prepare(`SELECT * FROM design_partners WHERE id = ?`)
    .bind(partnerId)
    .first<PartnerRow>();
  if (!partner) return c.json({ detail: "Partner not found" }, 404);

  if (body.rotate) {
    const { key, hint } = await rotatePartnerRunnerKey(c.env.DB, partner.id, partner.slug);
    return c.json({
      partner: { ...partner, runner_api_key_hint: hint },
      runner_api_key: key,
      runner_key_note: runnerKeyNote(partner.slug),
      rotated: true,
    });
  }

  const issued = await ensurePartnerRunnerKey(c.env.DB, partner.id, partner.slug);
  if (!issued) {
    return c.json({
      partner,
      already_exists: true,
      runner_api_key_hint: partner.runner_api_key_hint,
      message:
        "Partner already has an active runner key. Pass { \"rotate\": true } to issue a new one.",
    });
  }

  return c.json(
    {
      partner: { ...partner, runner_api_key_hint: issued.hint },
      runner_api_key: issued.key,
      runner_key_note: runnerKeyNote(partner.slug),
      issued: true,
    },
    201,
  );
});

adminApp.get("/partners/:id/gate-policy", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const partnerId = c.req.param("id")?.trim();
  if (!partnerId) return c.json({ detail: "Partner id is required" }, 400);

  const partner = await c.env.DB.prepare(`SELECT slug, gate_policy_json FROM design_partners WHERE id = ?`)
    .bind(partnerId)
    .first<{ slug: string; gate_policy_json: string | null }>();
  if (!partner) return c.json({ detail: "Partner not found" }, 404);

  return c.json({
    tenant_id: partner.slug,
    policy: parseGatePolicy(partner.gate_policy_json),
  });
});

adminApp.put("/partners/:id/gate-policy", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const partnerId = c.req.param("id")?.trim();
  if (!partnerId) return c.json({ detail: "Partner id is required" }, 400);

  const body = await c.req.json<Partial<TenantGatePolicy>>();
  const policy = parseGatePolicy(JSON.stringify(body));

  const existing = await c.env.DB.prepare(`SELECT id, slug FROM design_partners WHERE id = ?`)
    .bind(partnerId)
    .first<PartnerRow>();
  if (!existing) return c.json({ detail: "Partner not found" }, 404);

  await c.env.DB.prepare(
    `UPDATE design_partners SET gate_policy_json = ?, updated_at = ? WHERE id = ?`,
  )
    .bind(JSON.stringify(policy), new Date().toISOString(), partnerId)
    .run();

  return c.json({ tenant_id: existing.slug, policy });
});

adminApp.get("/partners/:id/api-keys", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const partnerId = c.req.param("id")?.trim();
  if (!partnerId) return c.json({ detail: "Partner id is required" }, 400);

  const partner = await c.env.DB.prepare(`SELECT id, slug FROM design_partners WHERE id = ?`)
    .bind(partnerId)
    .first<{ id: string; slug: string }>();
  if (!partner) return c.json({ detail: "Partner not found" }, 404);

  const keys = await listPartnerApiKeys(c.env.DB, partnerId);
  return c.json({ tenant_id: partner.slug, keys });
});

adminApp.post("/partners/:id/provision-api-key", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const partnerId = c.req.param("id")?.trim();
  const body = await c.req.json<{ role?: string }>();
  const role = body.role?.trim() ?? "operator";
  if (role !== "operator" && role !== "auditor" && role !== "runner") {
    return c.json({ detail: "role must be runner, operator, or auditor" }, 400);
  }

  const partner = await c.env.DB.prepare(`SELECT id, slug FROM design_partners WHERE id = ?`)
    .bind(partnerId)
    .first<{ id: string; slug: string }>();
  if (!partner) return c.json({ detail: "Partner not found" }, 404);

  let issued: { key: string; hint: string };
  if (role === "runner") {
    issued = await provisionPartnerRunnerKey(c.env.DB, partner.id, partner.slug);
  } else if (role === "operator") {
    issued = await provisionPartnerOperatorKey(c.env.DB, partner.id, partner.slug);
  } else {
    issued = await provisionPartnerAuditorKey(c.env.DB, partner.id, partner.slug);
  }

  return c.json(
    {
      role,
      tenant_id: partner.slug,
      api_key: issued.key,
      key_hint: issued.hint,
      message: `${role} API key issued — copy now, shown once.`,
    },
    201,
  );
});

adminApp.get("/ops/summary", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  const summary = await buildOpsSummary(c.env.DB);
  return c.json(summary);
});

adminApp.get("/ops/ingress", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10) || 50, 100);
  const { results } = await c.env.DB.prepare(
    `SELECT id, tenant_id, source, source_id, status, run_id, created_at, processed_at
     FROM ingress_events ORDER BY created_at DESC LIMIT ?`,
  )
    .bind(limit)
    .all();
  return c.json({ events: results ?? [] });
});

adminApp.get("/outcomes", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const tenant = c.req.query("tenant")?.trim();
  const sql = tenant
    ? `SELECT r.*, dp.company_name AS partner_company
       FROM runs r
       LEFT JOIN design_partners dp ON dp.slug = r.tenant_id
       WHERE r.tenant_id != 'demo' AND r.tenant_id = ?
       ORDER BY r.updated_at DESC
       LIMIT 200`
    : `SELECT r.*, dp.company_name AS partner_company
       FROM runs r
       LEFT JOIN design_partners dp ON dp.slug = r.tenant_id
       WHERE r.tenant_id != 'demo'
       ORDER BY r.updated_at DESC
       LIMIT 200`;

  type OutcomeRunRow = RunRow & { partner_company: string | null };
  const { results } = tenant
    ? await c.env.DB.prepare(sql).bind(tenant).all<OutcomeRunRow>()
    : await c.env.DB.prepare(sql).all<OutcomeRunRow>();

  const outcomes = [];
  for (const run of results ?? []) {
    const { results: stepRows } = await c.env.DB.prepare(
      `SELECT * FROM step_records WHERE run_id = ? ORDER BY sequence ASC`,
    )
      .bind(run.run_id)
      .all<StepRow>();
    const steps = stepRows ?? [];
    const gates = runGateSummary(run, steps);
    const metadata = parseMetadata(run.metadata_json);
    const journey = metadata.journey as Record<string, unknown> | undefined;

    outcomes.push({
      run_id: run.run_id,
      workflow_name: run.workflow_name,
      tenant_id: run.tenant_id ?? "default",
      partner_company: run.partner_company,
      status: run.status,
      environment: run.environment ?? "dev",
      can_resume: gates.can_resume,
      blocker_count: gates.blocker_count,
      steps_completed: steps.filter((s) => s.status === "completed").length,
      created_at: run.created_at,
      updated_at: run.updated_at,
      journey: {
        checklist_completed: journey?.checklist_completed === true,
        first_workflow_at:
          typeof journey?.first_workflow_at === "string" ? journey.first_workflow_at : null,
      },
    });
  }

  return c.json({ outcomes, count: outcomes.length });
});

function requireAdmin(
  c: Context<{ Bindings: PlatformEnv; Variables: { session: SessionPayload | null } }>,
): Response | null {
  const session = c.get("session");
  if (!session) return c.json({ detail: "Authentication required" }, 401);
  if (session.role !== "admin") return c.json({ detail: "Admin access required" }, 403);
  return null;
}

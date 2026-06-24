/** Admin platform routes — lead capture CRUD and design partner management (Phase 5c). */

import { Hono } from "hono";
import type { Context } from "hono";
import type { PlatformEnv } from "./routes";
import type { SessionPayload } from "./session";

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

  const baseSlug = slugify(body.slug?.trim() || companyName);
  if (!baseSlug) return c.json({ detail: "Could not derive tenant slug" }, 400);

  const slug = await uniqueSlug(c.env.DB, baseSlug);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO design_partners (
      id, slug, company_name, contact_email, phase, status, milestone,
      runner_api_key_hint, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      slug,
      companyName,
      contactEmail,
      phase,
      status,
      body.milestone?.trim() || null,
      body.runner_api_key_hint?.trim() || null,
      now,
      now,
    )
    .run();

  await ensureUser(c.env.DB, contactEmail, "partner", id, companyName);

  const partner = await c.env.DB.prepare(`SELECT * FROM design_partners WHERE id = ?`)
    .bind(id)
    .first<PartnerRow>();

  return c.json({
    partner,
    runner_key_note: `Add to API_KEYS_JSON: {"<key>": {"role":"runner","tenant":"${slug}"}}`,
  }, 201);
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

function requireAdmin(
  c: Context<{ Bindings: PlatformEnv; Variables: { session: SessionPayload | null } }>,
): Response | null {
  const session = c.get("session");
  if (!session) return c.json({ detail: "Authentication required" }, 401);
  if (session.role !== "admin") return c.json({ detail: "Admin access required" }, 403);
  return null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function uniqueSlug(db: D1Database, base: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const row = await db.prepare(`SELECT id FROM design_partners WHERE slug = ?`)
      .bind(slug)
      .first();
    if (!row) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
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
  if (existing) {
    if (partnerId) {
      await db
        .prepare(`UPDATE users SET partner_id = ?, role = ?, name = COALESCE(name, ?) WHERE id = ?`)
        .bind(partnerId, role, name, existing.id)
        .run();
    }
    return existing.id;
  }
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

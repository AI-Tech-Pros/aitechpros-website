/** Shared design partner + user persistence (admin + onboarding). */

export type PartnerRow = {
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

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function uniqueSlug(db: D1Database, base: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const row = await db.prepare(`SELECT id FROM design_partners WHERE slug = ?`).bind(slug).first();
    if (!row) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

export async function ensureUser(
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

export async function partnerContactExists(db: D1Database, email: string): Promise<boolean> {
  const row = await db
    .prepare(`SELECT id FROM design_partners WHERE lower(contact_email) = ?`)
    .bind(email.toLowerCase())
    .first();
  return !!row;
}

export type CreatePartnerInput = {
  company_name: string;
  contact_email: string;
  contact_name?: string;
  slug?: string;
  phase?: string;
  status?: string;
  milestone?: string | null;
  runner_api_key_hint?: string | null;
};

export async function createDesignPartner(
  db: D1Database,
  input: CreatePartnerInput,
): Promise<PartnerRow> {
  const companyName = input.company_name.trim();
  const contactEmail = input.contact_email.trim().toLowerCase();
  const baseSlug = slugify(input.slug?.trim() || companyName);
  if (!baseSlug) throw new Error("Could not derive tenant slug");

  const slug = await uniqueSlug(db, baseSlug);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const phase = input.phase?.trim() || "discovery";
  const status = input.status?.trim() || "active";

  await db
    .prepare(
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
      input.milestone ?? null,
      input.runner_api_key_hint ?? null,
      now,
      now,
    )
    .run();

  await ensureUser(db, contactEmail, "partner", id, input.contact_name?.trim() || companyName);

  const partner = await db.prepare(`SELECT * FROM design_partners WHERE id = ?`)
    .bind(id)
    .first<PartnerRow>();
  if (!partner) throw new Error("Partner insert failed");
  return partner;
}

export function runnerKeyNote(slug: string): string {
  return `Add to API_KEYS_JSON: {"<key>": {"role":"runner","tenant":"${slug}"}}`;
}

export function parseEmailList(values: string[] | string | undefined): string[] {
  if (!values) return [];
  const raw = Array.isArray(values) ? values : values.split(/[\n,;]+/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw) {
    const email = part.trim().toLowerCase();
    if (!email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

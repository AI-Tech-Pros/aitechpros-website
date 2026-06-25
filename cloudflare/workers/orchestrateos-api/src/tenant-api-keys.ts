/** D1-provisioned tenant API keys (auto-issued at partner onboarding). */

import type { ApiRole, AuthContext } from "./auth";

export async function hashApiKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateRunnerApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const encoded = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `oos_${encoded}`;
}

export function apiKeyHint(key: string): string {
  return key.length >= 4 ? `…${key.slice(-4)}` : "****";
}

export async function provisionPartnerRunnerKey(
  db: D1Database,
  partnerId: string,
  tenantId: string,
): Promise<{ key: string; hint: string }> {
  return provisionPartnerTenantKey(db, partnerId, tenantId, "runner");
}

export async function provisionPartnerOperatorKey(
  db: D1Database,
  partnerId: string,
  tenantId: string,
): Promise<{ key: string; hint: string }> {
  return provisionPartnerTenantKey(db, partnerId, tenantId, "operator");
}

export async function provisionPartnerAuditorKey(
  db: D1Database,
  partnerId: string,
  tenantId: string,
): Promise<{ key: string; hint: string }> {
  return provisionPartnerTenantKey(db, partnerId, tenantId, "auditor");
}

export async function provisionPartnerTenantKey(
  db: D1Database,
  partnerId: string,
  tenantId: string,
  role: ApiRole,
): Promise<{ key: string; hint: string }> {
  const key = generateRunnerApiKey();
  const keyHash = await hashApiKey(key);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const hint = apiKeyHint(key);

  await db
    .prepare(
      `INSERT INTO tenant_api_keys (id, partner_id, tenant_id, key_prefix, key_hash, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, partnerId, tenantId, key.slice(0, 12), keyHash, role, now)
    .run();

  if (role === "runner") {
    await db
      .prepare(`UPDATE design_partners SET runner_api_key_hint = ?, updated_at = ? WHERE id = ?`)
      .bind(hint, now, partnerId)
      .run();
  }

  return { key, hint };
}

export async function listPartnerApiKeys(
  db: D1Database,
  partnerId: string,
): Promise<{ role: string; key_prefix: string; hint: string; created_at: string; revoked_at: string | null }[]> {
  const { results } = await db
    .prepare(
      `SELECT role, key_prefix, created_at, revoked_at FROM tenant_api_keys
       WHERE partner_id = ? ORDER BY created_at DESC`,
    )
    .bind(partnerId)
    .all<{ role: string; key_prefix: string; created_at: string; revoked_at: string | null }>();

  return (results ?? []).map((row) => ({
    ...row,
    hint: row.key_prefix ? `${row.key_prefix}…` : "****",
  }));
}

export async function revokePartnerRunnerKeys(db: D1Database, partnerId: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE tenant_api_keys SET revoked_at = ? WHERE partner_id = ? AND revoked_at IS NULL`,
    )
    .bind(now, partnerId)
    .run();
}

export async function rotatePartnerRunnerKey(
  db: D1Database,
  partnerId: string,
  tenantId: string,
): Promise<{ key: string; hint: string }> {
  await revokePartnerRunnerKeys(db, partnerId);
  return provisionPartnerRunnerKey(db, partnerId, tenantId);
}

export async function partnerHasActiveRunnerKey(
  db: D1Database,
  partnerId: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM tenant_api_keys
       WHERE partner_id = ? AND revoked_at IS NULL`,
    )
    .bind(partnerId)
    .first<{ count: number }>();
  return (row?.count ?? 0) > 0;
}

/** Issue a key only when the partner has none (legacy backfill). */
export async function ensurePartnerRunnerKey(
  db: D1Database,
  partnerId: string,
  tenantId: string,
): Promise<{ key: string; hint: string } | null> {
  if (await partnerHasActiveRunnerKey(db, partnerId)) return null;
  return provisionPartnerRunnerKey(db, partnerId, tenantId);
}

export async function lookupTenantApiKey(
  db: D1Database,
  token: string,
): Promise<AuthContext | null> {
  const keyHash = await hashApiKey(token);
  const row = await db
    .prepare(
      `SELECT tenant_id, role FROM tenant_api_keys
       WHERE key_hash = ? AND revoked_at IS NULL`,
    )
    .bind(keyHash)
    .first<{ tenant_id: string; role: string }>();

  if (!row) return null;
  const role = row.role as ApiRole;
  if (role !== "runner" && role !== "auditor" && role !== "operator") return null;

  return {
    authenticated: true,
    role,
    token,
    isDemoOperator: false,
    tenant: row.tenant_id,
  };
}

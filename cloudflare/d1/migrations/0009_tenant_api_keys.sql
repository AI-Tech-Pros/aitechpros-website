-- Tenant-scoped API keys provisioned at partner onboarding (hashed at rest)

CREATE TABLE IF NOT EXISTS tenant_api_keys (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'runner' CHECK (role IN ('runner', 'auditor', 'operator')),
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (partner_id) REFERENCES design_partners(id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_tenant ON tenant_api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_partner ON tenant_api_keys(partner_id);

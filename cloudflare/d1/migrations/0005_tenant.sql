-- Phase 5a/5b: tenant isolation on runs

ALTER TABLE runs ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'demo';

CREATE INDEX IF NOT EXISTS idx_runs_tenant_id ON runs(tenant_id);

-- Phase 5a: leads, users, design partners, magic links

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company TEXT,
  use_case TEXT,
  stage TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'landing',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS design_partners (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'discovery',
  status TEXT NOT NULL DEFAULT 'active',
  milestone TEXT,
  runner_api_key_hint TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL,
  partner_id TEXT,
  created_at TEXT NOT NULL,
  last_login_at TEXT,
  FOREIGN KEY (partner_id) REFERENCES design_partners(id)
);

CREATE TABLE IF NOT EXISTS magic_link_tokens (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_design_partners_slug ON design_partners(slug);
CREATE INDEX IF NOT EXISTS idx_users_partner ON users(partner_id);

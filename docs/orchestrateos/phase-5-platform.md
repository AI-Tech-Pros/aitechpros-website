# Phase 5 — Platform layer (Cloudflare)

**Status:** Spec (not yet implemented)  
**Date:** June 2026  
**Stack:** Cloudflare Pages + Workers + D1 + (optional) Workers KV · **No Polsia / Neon / Express**

Phase 5 adds a **commercial platform layer** on top of the shipped control plane (Phases 1–4). Execution, gates, and audit remain in `orchestrateos-api` + `resume_engine`. This phase adds **leads, auth, partner portal, admin ops, light nurture, and outcomes** — all on the same Cloudflare account.

**Related:** [Design partner playbook](./design-partner-playbook.md) · [Integration cookbook](./cookbook-design-partner.md) · [Cloudflare deploy](../cloudflare-deploy.md)

---

## 1. Goals

| Goal | How |
|------|-----|
| Capture prospects on `orchestrateos.pages.dev` | Lead form → D1 → notify + nurture |
| Onboard design partners without manual spreadsheets | Partner record + API key mapping + read-only portal |
| Reduce Calendly-only dependency | Self-service onboarding + status visibility |
| Keep one execution truth | Portal shows **real** `run_id`s from D1 `runs` — no fake workflow UI |
| Stay on Option 1 | Extend existing Pages app + Worker + D1; no second hosting stack |

**Non-goals (Phase 5):**

- Full Mailchimp-class nurture builder  
- Nine autonomous agents running in production UI (story only on landing + `/governance`)  
- Replacing `resume_engine` or duplicating gate logic in a new backend  
- Password auth (magic link first; passwords deferred)  
- Neon / Render / Polsia  

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  orchestrateos.pages.dev (Vite / React — existing Pages project)         │
│  Public: /  /install  /governance  /compare  + NEW lead form on /      │
│  Auth:   /login  /auth/verify                                          │
│  Partner: /partner/dashboard  (session required)                        │
│  Admin:   /admin/capture  /admin/partners  /admin/outcomes  (admin)     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS + cookies (session JWT)
┌───────────────────────────────▼─────────────────────────────────────────┐
│  orchestrateos-api Worker (extend OR route prefix /platform/*)          │
│  Existing: /runs/*  /start_run  /demo/*  (API keys, RBAC)               │
│  New:      /api/leads  /api/auth/*  /api/partners/*  /api/admin/*      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│  D1 `orchestrateos` (single DB, new tables + tenant_id on runs — 5b)    │
│  KV (optional): magic_link tokens, rate limits                          │
└─────────────────────────────────────────────────────────────────────────┘
                                ▲
                                │ RemoteCheckpointStore (unchanged)
┌───────────────────────────────┴─────────────────────────────────────────┐
│  Customer / partner apps — pip install resume_engine[remote]              │
└─────────────────────────────────────────────────────────────────────────┘
```

**Recommendation:** Extend the **existing** `orchestrateos-api` Worker with a `/api/*` platform router (Hono sub-app). One D1 database, one deploy pipeline.

**Email:** Cloudflare Email Routing is receive-only. For outbound magic links + nurture use **Resend** or **Mailchannels** (Worker binding). Store `RESEND_API_KEY` as a Worker secret.

**Sessions:** HttpOnly cookie `orchestrateos_session` = signed JWT (HMAC with `SESSION_SECRET`). Roles: `prospect`, `partner`, `admin`.

---

## 3. Vertical slice (build first — Phase 5a)

Ship this before any admin CRM or nurture automation.

### 3.1 User stories

1. Prospect submits lead form on landing page.  
2. Admin receives notification (email or webhook).  
3. Partner receives magic link email, clicks link, lands on read-only dashboard.  
4. Dashboard lists **their** `run_id`s from D1 with links to gate explorer + audit API.

### 3.2 UI routes (OrchestrateOS Pages)

| Route | Auth | Purpose |
|-------|------|---------|
| `/` | Public | Add **lead capture** section (name, email, company, use case) |
| `/login` | Public | Enter email → “Check your inbox” |
| `/auth/verify` | Public | `?token=` → set session cookie → redirect |
| `/partner/dashboard` | Partner | Cohort status, assigned runs, deep links |

### 3.3 API (new)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/leads` | Public (rate-limited) | Create lead |
| `POST` | `/api/auth/magic-link` | Public | Send magic link email |
| `GET` | `/api/auth/verify` | Public | Exchange token → session |
| `POST` | `/api/auth/logout` | Session | Clear cookie |
| `GET` | `/api/partners/me` | Partner | Profile + cohort |
| `GET` | `/api/partners/me/runs` | Partner | Runs where `tenant_id` = partner slug |

### 3.4 D1 schema (migration `0004_platform.sql`)

```sql
-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company TEXT,
  use_case TEXT,
  stage TEXT NOT NULL DEFAULT 'new',  -- new | engaged | qualified | converted
  source TEXT NOT NULL DEFAULT 'landing',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Users (partners + admins; prospects become users on convert)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL,  -- partner | admin
  partner_id TEXT,     -- FK design_partners.id when role=partner
  created_at TEXT NOT NULL,
  last_login_at TEXT
);

-- Design partners (cohort)
CREATE TABLE IF NOT EXISTS design_partners (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,       -- tenant_id for runs
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'discovery',  -- discovery | build | review | complete
  status TEXT NOT NULL DEFAULT 'active',
  milestone TEXT,
  runner_api_key_hint TEXT,        -- last 4 chars of issued runner key (not the key)
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Magic links (or use KV with TTL 15m)
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

-- Link leads to partners on conversion
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_runs_tenant ON runs(tenant_id);  -- requires 0005_tenant.sql
```

**Tenant column (Phase 5a or 5b):** `ALTER TABLE runs ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'demo';`  
Demo runs keep `tenant_id = 'demo'` (public gate explorer). Partner runs use `tenant_id = design_partners.slug`.

### 3.5 Acceptance criteria (5a)

- [ ] `POST /api/leads` returns 201; duplicate email returns 409  
- [ ] Magic link email delivered; link works once; expires in 15 minutes  
- [ ] Partner session required for `/partner/dashboard`; others redirect to `/login`  
- [ ] Partner sees only runs matching their `tenant_id`  
- [ ] Each run row links to `/#gates` (prefill run ID) and `/docs` audit paths  
- [ ] `sales_demo_smoke.ps1` still passes  
- [ ] No regression on existing API key auth for SDK  

---

## 4. Sensible build order (5b → 5g)

### Phase 5b — Tenant isolation (security prerequisite for multi-partner)

| Item | Detail |
|------|--------|
| `runs.tenant_id` | Set on `POST /start_run` from API key → tenant map |
| `API_KEYS_JSON` v2 | `{"key": {"role":"runner","tenant":"acme"}}` (backward compatible with string roles) |
| Scoped GET | Non-demo `/runs/{id}` requires session or API key with matching tenant |
| Demo runs | `tenant_id = 'demo'` — still public read for gate explorer |

### Phase 5c — Admin: capture + design partners

| Route | Purpose |
|-------|---------|
| `/admin/capture` | Lead list, stage filters, manual CRUD |
| `/admin/partners` | Cohort table, phase/milestone edits, issue runner key hint |

| API | Purpose |
|-----|---------|
| `GET/PUT/DELETE /api/admin/leads` | Lead CRUD |
| `GET/POST/PUT /api/admin/partners` | Partner CRUD + link user |

Admin role: emails in `ADMIN_EMAILS` env var or `users.role = admin`.

### Phase 5d — Partner onboarding (`/onboarding`)

Multi-step form (company → team emails → confirm):

- `POST /api/partners/onboard` creates `design_partners` row + `users` + sends magic link  
- Auto-assign `tenant_id` slug  
- Document runner key issuance (manual or scripted `wrangler secret` update)

### Phase 5e — Nurture (minimal)

Two sequences only:

| Sequence | Trigger | Touchpoints |
|----------|---------|-------------|
| **Welcome** | New lead | Email 0 (immediate), Email 1 (+3d) |
| **Post-demo** | Admin marks lead `engaged` | Email 0 (+1d) |

Tables:

```sql
CREATE TABLE nurture_sequences (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE nurture_enrollments (
  id TEXT PRIMARY KEY,
  sequence_id TEXT NOT NULL,
  lead_id TEXT,
  partner_id TEXT,
  next_send_at TEXT,
  status TEXT NOT NULL DEFAULT 'active'
);
```

Cron: Cloudflare **Cron Trigger** on Worker daily → `POST /internal/nurture/tick` (protected by `CRON_SECRET`).

Templates: markdown bodies with `{{name}}`, `{{company}}` in D1 or repo `cloudflare/email-templates/`.

### Phase 5f — Outcomes (real runs)

| Route | Purpose |
|-------|---------|
| `/admin/outcomes` | Table of `runs` joined with `design_partners` — status, gates, audit links |

No fake kernel canvas. Columns:

- `run_id`, `workflow_name`, `tenant_id`, `status`, `environment`  
- `can_resume`, blocker count  
- Links: gate explorer, `GET /runs/{id}/audit_events`, `GET /runs/{id}/replay`

Optional: “Customer journey” flags stored in `runs.metadata_json` (`checklist_completed`, `first_workflow_at`).

### Phase 5g — Nine-agent story (content only)

Update existing pages — **no new agent runtime**:

| Page | Content |
|------|---------|
| `/` | Perceive → Plan → Act → Observe → Learn loop diagram; map to **checkpoint + gates** honestly |
| `/governance` | Nine-agent kernel as **reference architecture**; live product = governed resume |

When real agent workloads exist, link outcome rows to agent step names — do not simulate agents in UI.

---

## 5. Product story mapping (honest)

| Marketing concept | Implemented in Phase 5 |
|-------------------|------------------------|
| Perceive → Plan → Act → Observe → Learn | Landing copy + `/governance`; maps to run lifecycle + audit |
| Nine-agent kernel | Narrative + diagram; agents not instantiated in Worker |
| Governance gates | **Live** — existing gate explorer + API |
| Workflow builder | **5f** — list/configure metadata on real runs; not a drag-drop fake kernel |
| Cost circuit breaker / consensus gate | Roadmap copy on `/governance`; implement when billing/metrics exist |

---

## 6. Secrets & configuration

| Secret / var | Purpose |
|--------------|---------|
| `SESSION_SECRET` | Sign session JWT |
| `RESEND_API_KEY` | Outbound email |
| `NOTIFY_EMAIL` | Admin alert on new lead |
| `ADMIN_EMAILS` | Comma-separated admin allowlist |
| `CRON_SECRET` | Protect nurture cron endpoint |
| `API_KEYS_JSON` | Extended with `tenant` per key (5b) |

Existing secrets unchanged: `API_KEYS_JSON`, `DEMO_OPERATOR_KEY`, `ORCHESTRATEOS_*` GitHub secrets for CI.

---

## 7. Client implementation notes

- **Router:** Extend `OrchestrateOSRouter` in `client/src/App.tsx` with new routes.  
- **Auth context:** `useSession()` — `GET /api/auth/me` on load.  
- **Lead form:** Component on `OrchestrateOS.tsx` hero or dedicated section; `fetch` to Worker API.  
- **Admin layout:** Shared `/admin/*` shell with nav: Capture | Partners | Outcomes.  
- **Styling:** Reuse existing OrchestrateOS design tokens (dark + cyan); no new design system required for 5a.

---

## 8. CI/CD changes

| Change | File |
|--------|------|
| D1 migrate `0004_platform.sql`, `0005_tenant.sql` | `cloudflare-deploy.yml` |
| Smoke: `POST /api/leads` test lead + cleanup | `cloudflare-deploy.yml` or `sales_demo_smoke.ps1` |
| New secrets documented | `docs/cloudflare-deploy.md`, root `README.md` |

---

## 9. Implementation checklist (ordered)

```
5a  [ ] D1 migration 0004_platform (+ 0005 tenant on runs)
5a  [ ] Worker: /api/leads, /api/auth/*, /api/partners/me/*
5a  [ ] Resend integration for magic link + lead notify
5a  [ ] Pages: lead form, /login, /auth/verify, /partner/dashboard
5a  [ ] Session middleware + partner route guard
5b  [ ] tenant_id on start_run + scoped GET
5c  [ ] /admin/capture, /admin/partners
5d  [ ] /onboarding flow
5e  [ ] Welcome + post-demo sequences + cron
5f  [ ] /admin/outcomes (real runs)
5g  [ ] Landing + /governance nine-agent narrative refresh
```

---

## 10. Success metrics

| Metric | Target (90 days post-5a) |
|--------|--------------------------|
| Lead capture → stored | 100% form submissions in D1 |
| Partner time-to-dashboard | < 5 min from invite email |
| Partner self-serve run visibility | 100% pilot partners see their `run_id`s |
| Manual spreadsheet tracking | Eliminated for cohort phase/milestone |
| SDK / gate explorer regression | 0 smoke test failures |

---

## 11. Open decisions

| Decision | Recommendation |
|----------|----------------|
| Same Worker vs `platform-api` Worker | **Same Worker** — simpler CORS and D1 binding |
| KV vs D1 for magic links | **D1** for auditability; KV if volume high |
| Convert lead → partner | Manual in admin (5c) before automating |
| Password auth | Defer past 5a |

---

**Next implementation PR:** Phase **5a** only — schema + lead form + magic link + partner dashboard.

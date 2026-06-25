# OrchestrateOS — Enterprise roadmap (Phase C+)

Capabilities beyond the self-serve pilot control plane. **Phases A–B** (product clarity, compliance export, timeline, analytics) are shipped; this doc tracks **C+** and **D** ops surfaces.

## Authentication & access

| Item | Status | Notes |
|------|--------|-------|
| Magic-link partner login | Shipped | `/login` + Bearer session |
| API key RBAC (auditor / runner / operator) | Shipped | D1 `tenant_api_keys` + `API_KEYS_JSON` |
| SSO (OIDC) for partner portal | Shipped (foundation) | Set `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` — `/login` SSO button |
| Separate operator vs runner keys in UI | Shipped | `/admin/partners` → Issue runner/operator/auditor keys |

## Compliance & ops

| Item | Status | Notes |
|------|--------|-------|
| Compliance JSON export | Shipped | `GET /runs/:id/compliance_export` |
| Compliance PDF/HTML export | Shipped | `?download=pdf` or partner dashboard **Export PDF** |
| Run timeline UI | Shipped | Partner dashboard + gate explorer |
| Idempotency analysis in export | Shipped | Collision findings in bundle |
| Governance analytics (30d) | Shipped | Partner dashboard metrics panel |
| Audit retention policies | Planned | Per-tenant retention windows |

## Gate policies

| Item | Status | Notes |
|------|--------|-------|
| Per-tenant gate policy JSON | Shipped | `gate_policy_json` on `design_partners` |
| Admin policy editor UI | Shipped | `/admin/partners` edit form |
| Automated retry policy apply | Shipped | `POST /runs/:id/retry_policy/apply` |

## Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Custom domain | Documented | See [cloudflare-deploy.md](../cloudflare-deploy.md#custom-domain-optional) |
| Dedicated single-tenant Worker | Planned | Regulated pilots |
| SESSION_SECRET / RESEND in CI sync | Shipped | GitHub secrets → wrangler on deploy |
| Observer alerts on blocked runs | Shipped | `OBSERVER_WEBHOOK_URL` or email via `NOTIFY_EMAIL` |

## Framework parity

| Item | Status | Notes |
|------|--------|-------|
| Plain Python quickstart | Shipped | `partner_plain_python.py` |
| LangGraph quickstart | Shipped | `partner_langgraph.py` + CI `framework_smoke.py` |
| CrewAI quickstart | Shipped | `partner_crewai.py` + CI smoke |

## Phase D — Ops product

| Surface | Status | Notes |
|---------|--------|-------|
| Ingress queue UI | Shipped | `/admin/ops` + `GET /ingress/queue` |
| Observer alerts | Shipped | On failed step with active blockers |
| Auditor scheduled digest | Shipped | Daily nurture cron when blocked runs > 0 |
| Optimizer auto-apply | Shipped | `POST /runs/:id/retry_policy/apply` |

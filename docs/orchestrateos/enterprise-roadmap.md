# OrchestrateOS — Enterprise roadmap (Phase C+)

Planned capabilities beyond the current self-serve pilot control plane.

## Authentication & access

| Item | Status | Notes |
|------|--------|-------|
| Magic-link partner login | Shipped | `/login` + session cookie |
| API key RBAC (auditor / runner / operator) | Shipped | `API_KEYS_JSON` + tenant keys |
| SSO (SAML/OIDC) for partner portal | Planned | Okta / Entra ID |
| Separate operator vs runner keys in UI | Partial | Roles exist on API; admin UI planned |

## Compliance & ops

| Item | Status | Notes |
|------|--------|-------|
| Compliance JSON export | Shipped | `GET /runs/:id/compliance_export` |
| Run timeline UI | Shipped | Partner dashboard + gate explorer |
| Idempotency analysis in export | Shipped | Collision findings in bundle |
| PDF export | Planned | Render JSON bundle for auditors |
| Audit retention policies | Planned | Per-tenant retention windows |

## Gate policies

| Item | Status | Notes |
|------|--------|-------|
| Per-tenant gate policy JSON | Shipped | `gate_policy_json` on `design_partners` |
| Admin policy editor UI | Shipped | `/admin/partners` edit form |
| Automated retry policy apply | Roadmap | Optimizer metrics advisory today |

## Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Custom domain | Planned | DNS + Pages custom domain |
| Dedicated single-tenant Worker | Planned | Regulated pilots |
| SESSION_SECRET / RESEND in CI sync | Shipped | GitHub secrets → wrangler on deploy |

## Framework parity

| Item | Status | Notes |
|------|--------|-------|
| Plain Python quickstart | Shipped | `partner_plain_python.py` |
| LangGraph quickstart | Shipped | `partner_langgraph.py` |
| CrewAI quickstart | Shipped | `partner_crewai.py` |

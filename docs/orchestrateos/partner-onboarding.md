# Partner onboarding (Phase 5d)

Self-service design partner setup at [orchestrateos.pages.dev/onboarding](https://orchestrateos.pages.dev/onboarding).

**Related:** [Phase 5 spec](./phase-5-platform.md) · [Integration cookbook](./cookbook-design-partner.md) · [Admin partners UI](/admin/partners)

---

## Flow

1. **Company** — name, optional tenant slug, use case  
2. **Team** — primary contact + optional additional emails  
3. **Confirm** — `POST /api/partners/onboard` creates tenant + users + runner key  

Primary contact receives a **magic link** (15 min) to `/partner/dashboard`. The **runner API key** is returned once in the onboard response — save it immediately.

---

## Tenant slug

Auto-generated from company name (lowercase, hyphenated). Collisions get a numeric suffix (`acme`, `acme-1`, …).

This slug is the **`tenant_id`** on all runs created with that partner's runner key.

---

## Runner API key (auto-provisioned)

Onboarding **does not** require manual `wrangler secret put API_KEYS_JSON` for partner keys.

`POST /api/partners/onboard` calls `provisionPartnerRunnerKey`, which:

1. Inserts a hashed runner key into D1 `tenant_api_keys` scoped to the partner slug  
2. Returns the plaintext key **once** in the response (`runner_api_key`)  
3. Stores the last-four hint on `design_partners.runner_api_key_hint`

Share the key with the partner for:

```powershell
$env:ORCHESTRATEOS_API_KEY = "<runner-key-from-onboard-response>"
$env:ORCHESTRATEOS_API_URL = "https://orchestrateos-api.nevaquit.workers.dev"
```

Runs started with this key get `tenant_id = '<slug>'` and appear on the partner dashboard.

**Rotate or re-issue:** Partner dashboard → **Rotate API key**, or admin **Provision runner key** at `/admin/partners`.

**Legacy `API_KEYS_JSON`:** Still used for CI smoke keys and shared operator keys — not for per-partner onboarding.

---

## Admin alternative

Admins can still create partners manually at `/admin/partners` (Phase 5c). Runner keys are provisioned the same way via D1 (`tenant_api_keys`).

---

## API

```http
POST /api/partners/onboard
Content-Type: application/json

{
  "company_name": "Acme Robotics",
  "contact_name": "Jane Doe",
  "contact_email": "jane@acme.com",
  "team_emails": "dev@acme.com, ops@acme.com",
  "slug": "acme",
  "use_case": "LangGraph claims pipeline"
}
```

Response `201`:

```json
{
  "tenant_id": "acme",
  "magic_link_sent": true,
  "runner_api_key": "okey_…",
  "runner_api_key_hint": "…abcd",
  "message": "Partner workspace created. Save your runner API key below — it is shown only once. Check your email for a sign-in link."
}
```

Duplicate contact email → `409`.

---

## Prerequisites (Worker secrets)

Self-service onboarding requires these Worker secrets (see [cloudflare-deploy](../cloudflare-deploy.md)):

| Secret | Purpose |
|--------|---------|
| `SESSION_SECRET` | Sign session JWT after magic-link verify |
| `RESEND_API_KEY` | Outbound magic-link email |
| `SITE_URL` | Magic-link redirect base (e.g. `https://orchestrateos.pages.dev`) |
| `ADMIN_EMAILS` | Admin allowlist |

Check readiness at `/admin/capture` → **Platform readiness** panel.

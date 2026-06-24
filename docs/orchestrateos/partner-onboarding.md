# Partner onboarding (Phase 5d)

Self-service design partner setup at [orchestrateos.pages.dev/onboarding](https://orchestrateos.pages.dev/onboarding).

**Related:** [Phase 5 spec](./phase-5-platform.md) · [Integration cookbook](./cookbook-design-partner.md) · [Admin partners UI](/admin/partners)

---

## Flow

1. **Company** — name, optional tenant slug, use case  
2. **Team** — primary contact + optional additional emails  
3. **Confirm** — `POST /api/partners/onboard` creates tenant + users  

Primary contact receives a **magic link** (15 min) to `/partner/dashboard`.

---

## Tenant slug

Auto-generated from company name (lowercase, hyphenated). Collisions get a numeric suffix (`acme`, `acme-1`, …).

This slug is the **`tenant_id`** on all runs created with a runner key scoped to that tenant.

---

## Issue a runner API key

After onboarding, add a tenant-scoped runner key to the Worker secret:

```powershell
cd cloudflare/workers/orchestrateos-api
# Merge into existing JSON — do not overwrite other keys
wrangler secret put API_KEYS_JSON
```

Example entry for partner slug `acme`:

```json
{
  "your-existing-keys": "runner",
  "acme-pilot-key-abc123": { "role": "runner", "tenant": "acme" }
}
```

Share `acme-pilot-key-abc123` with the partner for:

```powershell
$env:ORCHESTRATEOS_API_KEY = "acme-pilot-key-abc123"
```

Runs started with this key get `tenant_id = 'acme'` and appear on the partner dashboard.

---

## Admin alternative

Admins can still create partners manually at `/admin/partners` (Phase 5c) without the self-service form.

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
  "runner_key_note": "Add to API_KEYS_JSON: {\"<key>\": {\"role\":\"runner\",\"tenant\":\"acme\"}}",
  "message": "Partner workspace created. Check your email for a sign-in link."
}
```

Duplicate contact email → `409`.

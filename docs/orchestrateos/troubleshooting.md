# OrchestrateOS Troubleshooting

Symptoms, causes, and fixes for the gate explorer, Worker API, Python SDK, and deployment pipeline.

**See also:** [User guide](./user-guide.md) · [Cloudflare deployment](../cloudflare-deploy.md)

---

## Quick diagnostic checklist

Run these in order:

```powershell
# 1. API health
curl -fsS https://orchestrateos-api.nevaquit.workers.dev/health

# 2. Demo catalog (read — no auth)
curl -fsS https://orchestrateos-api.nevaquit.workers.dev/demo/runs

# 3. Gate status on partial demo run
curl -fsS https://orchestrateos-api.nevaquit.workers.dev/runs/d0000002-0000-4000-8000-000000000002/resume_blockers

# 4. Authenticated write (replace YOUR_RUNNER_KEY)
curl -fsS -X POST https://orchestrateos-api.nevaquit.workers.dev/start_run `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_RUNNER_KEY" `
  -d '{"workflow_name":"diag_test"}'
```

| Check | Expected |
|-------|----------|
| `/health` | `{"status":"ok",...}` |
| `/demo/runs` | JSON with `"scenario":"partial"` |
| partial demo blockers | `can_resume: false`, compensation blocker |
| `start_run` with runner key | `run_id` returned |
| `start_run` without key | `401` Missing or invalid API key |

---

## Gate explorer (UI)

### API shows "offline"

**Symptoms:** Red or gray API badge; "Could not reach the API."

**Causes & fixes:**

| Cause | Fix |
|-------|-----|
| Worker not deployed | Check GitHub Actions **Cloudflare Deploy** → worker job |
| Wrong API URL in build | Verify `VITE_ORCHESTRATEOS_API_URL` in `.env.orchestrateos` / Pages env |
| CORS / network block | Test `/health` in browser directly; check corporate proxy |
| Temporary Cloudflare outage | Retry; check https://www.cloudflarestatus.com |

### Write buttons disabled ("VITE_ORCHESTRATEOS_DEMO_KEY required")

**Symptoms:** Compensate / Approve / Reset buttons grayed out; amber hint about demo key.

**Cause:** Production has `API_AUTH_ENABLED=true`. The gate explorer needs the demo operator key at **build time**.

**Fix:**

1. Ensure GitHub secret `ORCHESTRATEOS_DEMO_KEY` matches Worker secret `DEMO_OPERATOR_KEY`.
2. Redeploy OrchestrateOS Pages (push to `main` or re-run workflow).
3. For local dev, add to `.env.orchestrateos`:
   ```env
   VITE_ORCHESTRATEOS_DEMO_KEY=<same-as-DEMO_OPERATOR_KEY>
   ```
4. Restart `npm run dev:orchestrateos`.

### "401" or "Missing or invalid API key" on gate actions

**Symptoms:** Error banner after clicking Compensate, Approve, or Reset.

**Causes & fixes:**

| Cause | Fix |
|-------|-----|
| Demo key not in built bundle | Rebuild Pages with `ORCHESTRATEOS_DEMO_KEY` secret |
| Key mismatch | `DEMO_OPERATOR_KEY` (Worker) must equal `ORCHESTRATEOS_DEMO_KEY` (GitHub) |
| Wrong key type | Gate explorer needs **demo operator** key, not runner key |
| Acting on non-demo run with demo key | Demo key only works on the three seeded UUIDs; use full operator key via API/curl for other runs |

### Transient demo still shows a gate

**Expected behavior:** The transient demo run uses `environment=prod`. Even transient failures require **prod resume acknowledgment** — not a bug.

**Fix:** Click **Acknowledge prod resume** (or `POST /runs/{id}/ack_prod_resume` with operator key).

### Demo runs in wrong state after testing

**Symptoms:** Partial demo shows `can_resume: true` when you expected blockers.

**Fix:**

```powershell
curl -X POST https://orchestrateos-api.nevaquit.workers.dev/demo/reset `
  -H "Authorization: Bearer YOUR_DEMO_OR_OPERATOR_KEY" `
  -H "Content-Type: application/json" `
  -d "{}"
```

Or use **Reset demos** in the gate explorer.

### Custom run_id always shows "can_resume: true" with no steps

**Symptoms:** New run from API lookup has no blockers and zero steps.

**Cause:** `POST /start_run` only creates the run — steps are recorded when the SDK executes or you `POST /runs/{id}/steps`.

**Fix:** Run your Python workflow with `RemoteCheckpointStore`, or record steps via API. Until a step fails, there are no gates.

---

## Python SDK

### `httpx.HTTPStatusError: 401` on RemoteCheckpointStore

**Cause:** API auth enabled; no or wrong `api_key`.

**Fix:**

```powershell
$env:ORCHESTRATEOS_API_KEY = "<runner-role-key>"
```

```python
RemoteCheckpointStore(url, api_key=os.environ["ORCHESTRATEOS_API_KEY"])
```

### `httpx.HTTPStatusError: 403`

**Cause:** Key valid but wrong role (e.g. auditor key used for `start_run`).

**Fix:** Use **runner** key for steps/start; **operator** key for compensate/approve.

### `ResumeBlockedError` on resume()

**Symptoms:** SDK raises with "Resume blocked: ..."

**Cause:** Active gate (partial, permanent, or prod acknowledgment).

**Fix:**

1. `engine.get_resume_blockers(run_id)` — inspect blockers
2. Clear via SDK:
   - `engine.record_compensation(run_id)` for partial
   - `engine.grant_human_approval(run_id, approved_by="...")` for permanent
3. For prod environment, use API `ack_prod_resume` (operator)
4. Then `engine.resume(...)`

### Steps re-execute on resume (not idempotent)

**Symptoms:** Side effects fire twice.

**Causes & fixes:**

| Cause | Fix |
|-------|-----|
| Step input changed between attempts | Idempotency keys include input hash — keep input identical |
| Different store backend | Don't mix SQLite and Remote for same run |
| Remote store without `idempotency_key` on steps | Use current `resume_engine` + Worker (passes key) |

### `Run not found` after remote execution

**Cause:** Wrong API URL, run created in different environment, or typo in `run_id`.

**Fix:** Verify `ORCHESTRATEOS_API_URL` and `GET /runs/{id}` with curl.

### ImportError for `RemoteCheckpointStore` / httpx

**Fix:**

```powershell
pip install "resume_engine[remote]"
```

---

## Worker API

### All writes return 401

**Cause:** `API_AUTH_ENABLED=true` without `Authorization` header.

**Fix:** Add `Authorization: Bearer <key>` to POST/PATCH requests.

### `403 Requires operator role`

**Cause:** Runner key used for compensate/approve/reset.

**Fix:** Use operator key from `API_KEYS_JSON`.

### `409 Run already exists` on start_run

**Cause:** Duplicate `run_id` in `POST /start_run`.

**Fix:** Omit `run_id` to auto-generate, or use a new UUID.

### `404` on GET /runs/{id}

**Cause:** Run never created or wrong ID.

**Fix:** Confirm `POST /start_run` succeeded; copy exact UUID.

### `401 Authentication required` on GET /runs/{id} (non-demo)

**Symptoms:** `GET /runs/{uuid}` returns 401 when `API_AUTH_ENABLED=true`.

**Cause:** Phase 5b tenant isolation — non-demo runs require auth (API key or partner session cookie).

**Fix:**

1. Add `Authorization: Bearer <runner-key>` header matching the run's tenant
2. Or browse from `orchestrateos.pages.dev` with a valid partner session (same-origin proxy sends cookies)
3. Demo runs (`d0000001`–`d0000003`) remain public — no auth needed

### `403 Access denied for this tenant`

**Symptoms:** Authenticated request but wrong tenant scope.

**Causes & fixes:**

| Cause | Fix |
|-------|-----|
| Runner key tenant ≠ run `tenant_id` | Use key with matching `tenant` in `API_KEYS_JSON` v2 |
| Legacy key (no tenant) on non-default run | Legacy keys only access `tenant_id = 'default'` |
| Partner session for different slug | Log in as the partner who owns the run |
| Demo operator key on non-demo run | Use full operator/runner key, or stick to demo UUIDs |

### `GET /idempotency/{key}` 404

**Cause:** No **completed** step with that key yet (failed/running steps are not returned).

**Expected:** Only completed or `skipped_replay` steps are idempotency-cache hits.

### Gate cleared in UI but SDK still blocked

**Cause:** SDK reads `human_approval` metadata; UI writes `approvals[key]` — production Worker syncs **both** on approve. If you only patched metadata manually, formats may diverge.

**Fix:** Use `POST /approve` or `engine.grant_human_approval()` — not raw metadata edits.

### D1 migration errors on deploy

**Symptoms:** CI migration step fails with "duplicate column name: environment"

**Cause:** `0003_governance.sql` `ALTER TABLE` already applied.

**Fix:** CI uses `continue-on-error: true` on governance migration. If schema is broken, run diagnostics in Cloudflare D1 dashboard or re-apply `schema.sql` on a fresh database (destructive).

---

## Authentication & secrets

### Rotating API keys

1. Generate new keys; update `API_KEYS_JSON` via `wrangler secret put API_KEYS_JSON`
2. Update `ORCHESTRATEOS_API_KEY` and `ORCHESTRATEOS_DEMO_KEY` in GitHub secrets
3. Redeploy Worker + Pages
4. Distribute new keys to developers

### CI smoke test fails on `start_run`

**Symptoms:** Cloudflare Deploy worker job fails at smoke test.

**Causes & fixes:**

| Cause | Fix |
|-------|-----|
| Missing `ORCHESTRATEOS_API_KEY` in GitHub | Add runner key secret |
| Key not in `API_KEYS_JSON` | Ensure same key string in Worker secret |
| Auth disabled in wrangler but CI sends auth | Harmless — or align `API_AUTH_ENABLED` |

### `API_KEYS_JSON` invalid

**Symptoms:** All keys rejected.

**Fix:** Must be valid JSON object, e.g.:

```json
{"abc123runner":"runner","def456operator":"operator"}
```

No trailing commas. Roles must be exactly `auditor`, `runner`, or `operator`.

---

## Deployment & CI/CD

### Pages deploy OK but site shows old content

**Fix:** Hard refresh (Ctrl+Shift+R); Cloudflare cache may lag minutes.

### OrchestrateOS routes 404 (`/install`, `/compliance`, etc.)

**Cause:** SPA — routes exist in client router; need OrchestrateOS **build profile** (`build:orchestrateos`), not main site build.

**Fix:** Deploy to project `orchestrateos`, not `aitechpros-website`.

### Worker deploy OK but D1 empty

**Fix:** Check seed step in workflow; manually:

```powershell
cd cloudflare/workers/orchestrateos-api
npx wrangler d1 execute orchestrateos --remote --file=../../d1/seed.sql
```

### PyPI publish fails

| Error | Fix |
|-------|-----|
| `403 Invalid or non-existent authentication` | Set `PYPI_API_TOKEN` GitHub secret |
| `File already exists` | Bump `version` in `pyproject.toml` |
| Tests fail in workflow | Fix locally: `python -m pytest resume_engine/tests` |

---

## Failure classification reference

| Exception / signal | Classification | Auto-resume (dev) |
|--------------------|----------------|-------------------|
| `TransientStepError` | transient | Yes |
| `PartialStepError` | partial | No — compensate first |
| `PermanentStepError` | permanent | No — approve first |
| `ConnectionError`, `TimeoutError` | transient | Yes |
| `ValueError`, `KeyError` | permanent | No |
| Unknown `Exception` | transient (default) | Yes |

Override in code by raising the typed errors above.

---

## Environment-specific issues

### `prod` runs won't resume after clearing transient failure

**Expected:** Prod requires `POST /runs/{id}/ack_prod_resume` even when failure classification is transient.

### Staging run behaves like dev

**Check:** `environment` is set at `start_run` — not inferred from metadata alone unless your code passes `metadata.environment` to `RemoteCheckpointStore.create_run`.

---

## Log and audit debugging

```powershell
# Step trace
curl -fsS https://orchestrateos-api.nevaquit.workers.dev/runs/RUN_ID/audit_log

# Governance events (who compensated/approved)
curl -fsS https://orchestrateos-api.nevaquit.workers.dev/runs/RUN_ID/audit_events

# Full run + steps (SDK shape)
curl -fsS https://orchestrateos-api.nevaquit.workers.dev/runs/RUN_ID
```

---

## Still stuck?

1. Collect: `run_id`, endpoint, HTTP status, response body, whether auth is enabled
2. Confirm secrets alignment (Worker ↔ GitHub ↔ local env)
3. Open an issue: https://github.com/AI-Tech-Pros/aitechpros-website/issues
4. Enterprise support: https://calendly.com/aitechpros/15min

# OrchestrateOS User Guide

Step-by-step guide for developers, operators, and deployers using OrchestrateOS (`resume_engine` + Cloudflare control plane).

**Related:** [Troubleshooting](./troubleshooting.md) · [Cloudflare deployment](../cloudflare-deploy.md) · [API docs](https://orchestrateos-api.nevaquit.workers.dev/docs)

---

## 1. What you are using

| Layer | What it does | URL / package |
|-------|----------------|---------------|
| **Product site** | Marketing, gate explorer, install docs | https://orchestrateos.pages.dev |
| **Control plane API** | Runs, steps, gates, audit (Worker + D1) | https://orchestrateos-api.nevaquit.workers.dev |
| **Python SDK** | Execute workflows with checkpointing | [`resume_engine` on PyPI](https://pypi.org/project/resume-engine/) |

**Mental model:**

```
Your app (LangGraph / CrewAI / Python)
    → resume_engine (ResumeEngine)
        → CheckpointStore (SQLite local OR RemoteCheckpointStore → Worker API)
            → Gate explorer + operators clear compensation/approval gates
```

---

## 2. Who this guide is for

| Persona | Start here |
|---------|------------|
| **Developer** | [§3 Install](#3-install-the-sdk) → [§5 Run a workflow](#5-run-a-workflow-locally) → [§7 Remote store](#7-connect-to-the-live-control-plane) |
| **Operator** | [§9 Gate explorer](#9-gate-explorer-live-demo) → [§10 Clear gates via API](#10-clear-gates-via-api) |
| **Platform / DevOps** | [§12 Deploy & secrets](#12-deployment-and-secrets) → [§13 CI/CD](#13-cicd) |

---

## 3. Install the SDK

### 3.1 From PyPI (recommended)

```powershell
pip install resume_engine
```

Optional extras:

```powershell
pip install "resume_engine[remote]"    # Cloudflare Worker checkpoint store
pip install "resume_engine[langgraph]" # LangGraph node wrapper
pip install "resume_engine[crewai]"    # CrewAI task wrapper
pip install "resume_engine[api]"       # Self-hosted FastAPI service
pip install "resume_engine[dev]"       # pytest + httpx
```

### 3.2 From source (repo contributors)

```powershell
git clone https://github.com/AI-Tech-Pros/aitechpros-website.git
cd aitechpros-website
pip install -e ".[remote,dev]"
```

### 3.3 Verify install

```powershell
python -c "from resume_engine import ResumeEngine; print('ok')"
```

---

## 4. Core concepts (5 minutes)

### 4.1 Run lifecycle

1. **start_run** — creates a workflow execution with a unique `run_id`.
2. **execute_step** — runs one step, checkpoints input/output to the store.
3. On failure — run status becomes `failed`; classification is recorded.
4. **resume** — continues from the last *completed* step (skips earlier steps via idempotency).

### 4.2 Failure classifications

| Type | Meaning | Resume policy |
|------|---------|----------------|
| **transient** | Safe to retry (timeout, network) | Auto-resume allowed (unless `environment=prod`; see §8) |
| **partial** | Side effects may have run | **Compensation** required before resume |
| **permanent** | Bad config / invalid input | **Human approval** required before resume |

Raise typed errors in your steps:

```python
from resume_engine.core.failure_classifier import (
    TransientStepError,
    PartialStepError,
    PermanentStepError,
)
```

### 4.3 Resume gates

Gates are stored in `run.metadata["gates"]` and enforced by both the Python SDK and the Worker API before resume.

| Gate | Trigger | How to clear |
|------|---------|--------------|
| Compensation | `partial` failure | `engine.record_compensation(run_id)` or `POST /runs/{id}/compensate` |
| Human approval | `permanent` failure | `engine.grant_human_approval(run_id, approved_by=...)` or `POST /runs/{id}/approve` |
| Prod resume ack | Any failure when `environment=prod` | `POST /runs/{id}/ack_prod_resume` |

---

## 5. Run a workflow locally

### 5.1 Minimal example (SQLite)

```python
from resume_engine import ResumeEngine, SQLiteCheckpointStore

store = SQLiteCheckpointStore("sqlite:///my_workflow.db")
engine = ResumeEngine(store)

run = engine.start_run("hello_pipeline")

steps = [
    ("fetch", lambda inp, key: {"value": inp["id"] * 2}),
    ("save", lambda inp, key: {"saved": True, "value": inp["value"]}),
]

engine.execute_workflow(run.run_id, steps, initial_input={"id": 21})
print(engine.get_audit_log(run.run_id))
```

### 5.2 Handle failure and resume

```python
try:
    engine.execute_workflow(run.run_id, steps, initial_input={"id": 21})
except Exception:
    engine.resume(run.run_id, steps, initial_input={"id": 21})
```

### 5.3 Run the included benchmark demo

```powershell
python resume_engine/demo_restart_vs_resume.py
```

Compares naive restart vs resume on a 50-step simulated pipeline.

---

## 6. Framework adapters

### 6.1 LangGraph

Wrap nodes without rewriting your graph:

```python
from resume_engine.adapters.langgraph_adapter import wrap_langgraph_node

wrapped = wrap_langgraph_node(engine, run.run_id, step_index=0, step_name="research")
# Use `wrapped` as your LangGraph node callable
```

### 6.2 CrewAI

```python
from resume_engine.adapters.crewai_adapter import wrap_crewai_task

wrapped_task = wrap_crewai_task(engine, run.run_id, step_index=1, step_name="analyze")
```

See `resume_engine/README.md` for full adapter examples.

---

## 7. Connect to the live control plane

Use this when you want runs to appear in D1 and the gate explorer at https://orchestrateos.pages.dev/#gates.

### 7.1 Set environment variables

```powershell
$env:ORCHESTRATEOS_API_URL = "https://orchestrateos-api.nevaquit.workers.dev"
$env:ORCHESTRATEOS_API_KEY = "<your-runner-api-key>"
```

Production requires API auth. Use a **runner**-role key for `start_run`, steps, and `PATCH`.

### 7.2 RemoteCheckpointStore

```python
from resume_engine.core.checkpoint_store import ResumeEngine
from resume_engine.storage.remote_backend import RemoteCheckpointStore

API = "https://orchestrateos-api.nevaquit.workers.dev"

with RemoteCheckpointStore(API, api_key="YOUR_RUNNER_KEY") as store:
    engine = ResumeEngine(store)
    run = engine.start_run(
        "claims_pipeline",
        metadata={"environment": "staging"},
    )
    # execute_step / execute_workflow / resume — same as SQLite
    print("Run ID for gate explorer:", run.run_id)
```

### 7.3 Run the remote demo script

```powershell
pip install "resume_engine[remote]"
$env:ORCHESTRATEOS_API_KEY = "<runner-key>"
python resume_engine/demo_remote_pipeline.py
```

The script prints a `run_id` — paste it into the gate explorer.

---

## 8. Deployment environments

When starting a run (SDK or API), set `environment`:

| Value | Behavior |
|-------|----------|
| `dev` | Standard gate rules |
| `staging` | Standard gate rules |
| `prod` | **All failures** (including transient) require operator acknowledgment via `ack_prod_resume` before resume |

**API:**

```json
POST /start_run
{
  "workflow_name": "prod_pipeline",
  "environment": "prod"
}
```

**SDK:** pass in metadata when using remote store:

```python
run = engine.start_run("prod_pipeline", metadata={"environment": "prod"})
```

---

## 9. Gate explorer (live demo)

URL: https://orchestrateos.pages.dev/#gates

### 9.1 Step-by-step

1. Open the site → scroll to **Gate status explorer** (or use **Live API demo** tab).
2. Confirm **API online** badge is green.
3. Click a scenario card:

   | Scenario | Run ID | What you see |
   |----------|--------|--------------|
   | Transient (prod) | `d0000001-0000-4000-8000-000000000001` | Prod acknowledgment gate |
   | Partial | `d0000002-0000-4000-8000-000000000002` | Compensation required |
   | Permanent | `d0000003-0000-4000-8000-000000000003` | Human approval required |

4. Read blockers and **Resume blocked** / **Resume allowed** banner.
5. Clear gates using the action buttons (requires demo operator key when auth is enabled — see §12).
6. Click **Reset demos** to restore seeded state after testing.

### 9.2 Look up your own run

1. Paste a `run_id` from `demo_remote_pipeline.py` or your SDK.
2. Click **Check gates**.
3. View live blockers from the Worker API.

### 9.3 Offline preview

Use the **Offline preview** tab to walk through gate logic without calling the API.

---

## 10. Clear gates via API

Base URL: `https://orchestrateos-api.nevaquit.workers.dev`

All **write** requests require:

```http
Authorization: Bearer <api-key>
Content-Type: application/json
```

### 10.1 Check status

```http
GET /runs/{run_id}/resume_blockers
```

Response includes `can_resume` and `blockers[]`.

### 10.2 Partial failure — compensation

```http
POST /runs/{run_id}/compensate
{
  "result": { "reversed": true },
  "note": "Manual compensation"
}
```

Requires **operator** role.

### 10.3 Permanent failure — approval

```http
POST /runs/{run_id}/approve
{
  "approved_by": "ops@yourcompany.com",
  "note": "Credentials rotated"
}
```

Requires **operator** role.

### 10.4 Production — resume acknowledgment

```http
POST /runs/{run_id}/ack_prod_resume
{
  "acknowledged_by": "ops@yourcompany.com",
  "note": "Approved prod resume"
}
```

Requires **operator** role. Only applies when `environment=prod`.

### 10.5 Validate resume readiness

```http
POST /resume
{ "run_id": "..." }
```

Returns `409` if gates are still active.

### 10.6 Audit and replay

```http
GET /runs/{run_id}/audit_events    # Immutable governance log
GET /runs/{run_id}/audit_log       # Step trace string
GET /runs/{run_id}/replay          # Completed steps for replay
```

Reads are public (no auth required).

---

## 11. API roles (RBAC)

Configured via Worker secret `API_KEYS_JSON`:

```json
{
  "<runner-secret>": "runner",
  "<operator-secret>": "operator",
  "<auditor-secret>": "auditor"
}
```

| Role | Permissions |
|------|-------------|
| **auditor** | Read runs, status, audit, replay |
| **runner** | auditor + `start_run`, record steps, `PATCH` run, `POST /resume` |
| **operator** | runner + compensate, approve, ack_prod_resume, demo reset |

**Demo operator key** (`DEMO_OPERATOR_KEY`): scoped operator access **only** for the three seeded demo run IDs — used by the gate explorer UI.

---

## 12. Deployment and secrets

### 12.1 Production URLs

| Service | URL |
|---------|-----|
| OrchestrateOS site | https://orchestrateos.pages.dev |
| API | https://orchestrateos-api.nevaquit.workers.dev |
| API docs | https://orchestrateos-api.nevaquit.workers.dev/docs |

### 12.2 Cloudflare Worker secrets

From `cloudflare/workers/orchestrateos-api`:

```powershell
npx wrangler secret put API_KEYS_JSON
# Paste: {"<runner-key>":"runner","<operator-key>":"operator"}

npx wrangler secret put DEMO_OPERATOR_KEY
# Paste: <demo-operator-key-for-gate-explorer>
```

`wrangler.toml` sets `API_AUTH_ENABLED = "true"` in production.

### 12.3 GitHub Actions secrets

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Deploy Pages + Worker + D1 |
| `CLOUDFLARE_ACCOUNT_ID` | `365965a7234fe266200abe63be3b63ba` |
| `ORCHESTRATEOS_API_KEY` | Runner key for CI smoke tests |
| `ORCHESTRATEOS_DEMO_KEY` | Baked into Pages as `VITE_ORCHESTRATEOS_DEMO_KEY` |
| `PYPI_API_TOKEN` | Publish `resume_engine` to PyPI (optional) |

### 12.4 Local frontend development

```powershell
npm run dev:orchestrateos
```

Optional `.env.orchestrateos` (not committed with secrets):

```env
VITE_APP=orchestrateos
VITE_SITE_URL=https://orchestrateos.pages.dev
VITE_ORCHESTRATEOS_API_URL=https://orchestrateos-api.nevaquit.workers.dev
VITE_ORCHESTRATEOS_DEMO_KEY=<demo-operator-key>
```

### 12.5 Local Worker development

```powershell
cd cloudflare/workers/orchestrateos-api
npm install
npm run dev
```

Seed local D1:

```powershell
npm run db:migrate:local
npm run db:seed:local
```

---

## 13. CI/CD

Workflow: `.github/workflows/cloudflare-deploy.yml`

On push to `main` (client/cloudflare paths):

1. Deploy marketing Pages site
2. Deploy OrchestrateOS Pages (with `VITE_ORCHESTRATEOS_DEMO_KEY`)
3. Migrate D1 → seed demos → deploy Worker → smoke test API

PyPI publish: `.github/workflows/pypi-publish.yml` (manual or GitHub Release).

---

## 14. Site reference pages

| Path | Content |
|------|---------|
| https://orchestrateos.pages.dev/install | Install + quickstart |
| https://orchestrateos.pages.dev/governance | Observability vs governance |
| https://orchestrateos.pages.dev/compliance | Audit, RBAC, regulated use cases |
| https://orchestrateos.pages.dev/compare | Printable comparison (Save as PDF) |

---

## 15. Typical end-to-end workflows

### A. Design partner — first integration

1. `pip install "resume_engine[remote]"`
2. Get runner + operator API keys from your admin
3. Wire `RemoteCheckpointStore` into one LangGraph or CrewAI workflow
4. Run in `staging`; note `run_id` on failure
5. Operator clears gates in gate explorer or via API
6. Call `engine.resume(run_id, steps)` from your app

### B. Sales demo (15 min)

1. Open gate explorer → Partial scenario
2. Show blocked resume → record compensation → resume allowed
3. Open Transient (prod) → show prod acknowledgment gate
4. Show `/compare` PDF for competitive positioning
5. `pip install resume_engine` + Calendly follow-up

### C. Compliance review

1. `GET /runs/{id}/audit_events` — who approved, when
2. `GET /runs/{id}/replay` — deterministic step outputs
3. Review https://orchestrateos.pages.dev/compliance

---

## 16. Getting help

- **Troubleshooting:** [troubleshooting.md](./troubleshooting.md)
- **API reference:** https://orchestrateos-api.nevaquit.workers.dev/docs
- **Early access / enterprise:** https://calendly.com/aitechpros/15min
- **Issues:** https://github.com/AI-Tech-Pros/aitechpros-website/issues

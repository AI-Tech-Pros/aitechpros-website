# Cloudflare deployment (Pages + Workers + D1)

Production uses **Cloudflare default domains** — no custom domain required.

| Service | URL |
|---------|-----|
| **Marketing site** | https://aitechpros-website.pages.dev |
| **OrchestrateOS** | https://orchestrateos.pages.dev |
| **API** | https://orchestrateos-api.nevaquit.workers.dev |

## Architecture

| Product | Pages project | Build |
|---------|---------------|-------|
| **Marketing site** | `aitechpros-website` | `npm run build:pages` |
| **OrchestrateOS** | `orchestrateos` | `npm run build:orchestrateos` |
| **Control plane API** | Worker `orchestrateos-api` + D1 | `wrangler deploy` |
| **Python SDK** | `resume_engine/` — local / CI only | — |

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/cloudflare-deploy.yml`

**Triggers:** push to `main` (paths: `client/`, `cloudflare/`, build config) or manual **Run workflow**.

**Jobs:**
1. **pages-main** — `npm run build:pages` → deploy `aitechpros-website`
2. **pages-orchestrateos** — `npm run build:orchestrateos` → deploy `orchestrateos`
3. **worker** — D1 schema migrate → seed demo runs → `wrangler deploy` → smoke tests

### Demo runs (gate explorer)

Fixed run IDs seeded on every deploy (`cloudflare/d1/seed.sql`):

| Scenario | Run ID |
|----------|--------|
| Transient | `d0000001-0000-4000-8000-000000000001` |
| Partial (compensation gate) | `d0000002-0000-4000-8000-000000000002` |
| Permanent (approval gate) | `d0000003-0000-4000-8000-000000000003` |

Reset after testing: `POST /demo/reset` · Catalog: `GET /demo/runs` · Docs: `/docs`

### Phase 2 — Python SDK → Worker (remote checkpoint store)

The `RemoteCheckpointStore` persists runs and steps to the Worker API so real Python workflows appear in D1 and the gate explorer.

```powershell
pip install -e ".[remote]"
$env:ORCHESTRATEOS_API_URL = "https://orchestrateos-api.nevaquit.workers.dev"
python resume_engine/demo_remote_pipeline.py
```

Worker endpoints used by the SDK:

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/start_run` | Create run (optional `run_id`, `metadata`) |
| `GET` | `/runs/{id}` | Full run + steps (`Run.from_dict` shape) |
| `PATCH` | `/runs/{id}` | Update `status` / `metadata` |
| `POST` | `/runs/{id}/steps` | Append step (passes `idempotency_key`) |
| `GET` | `/idempotency/{key}` | Idempotent step lookup |

Gate metadata: permanent failures accept both `metadata.gates.human_approval` (Python SDK) and `metadata.gates.approvals[key]` (gate explorer UI).

### Phase 3 — Governance (auth, audit, deployment environments)

**API authentication (optional, off by default):** set `API_AUTH_ENABLED=true` on the Worker and configure secrets:

| Secret | Purpose |
|--------|---------|
| `API_KEYS_JSON` | `{"<runner-key>":"runner","<operator-key>":"operator"}` |
| `DEMO_OPERATOR_KEY` | Scoped operator key for gate explorer demo runs only |

Roles: `auditor` (read), `runner` (start/steps/resume), `operator` (+ compensate/approve/prod ack).

**Deployment environments:** `environment` on runs (`dev` \| `staging` \| `prod`). Prod runs require `POST /runs/{id}/ack_prod_resume` even for transient failures.

**Immutable audit:** `GET /runs/{id}/audit_events` — append-only governance log (compensate, approve, step recorded, etc.).

**Deterministic replay:** `GET /runs/{id}/replay` — completed steps for SDK replay mode.

Gate explorer writes use `VITE_ORCHESTRATEOS_DEMO_KEY` when auth is enabled (set in `.env.orchestrateos` / Pages build env).

```powershell
# Enable auth (one-time, via wrangler)
cd cloudflare/workers/orchestrateos-api
npx wrangler secret put API_KEYS_JSON
npx wrangler secret put DEMO_OPERATOR_KEY
# Then set API_AUTH_ENABLED = "true" in wrangler.toml and redeploy
```

### GitHub secrets (required)

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | API token with Workers, Pages, D1 edit |
| `CLOUDFLARE_ACCOUNT_ID` | `365965a7234fe266200abe63be3b63ba` |
| `ORCHESTRATEOS_API_KEY` | Runner-role key (CI smoke tests + SDK) |
| `ORCHESTRATEOS_DEMO_KEY` | Demo operator key (`VITE_ORCHESTRATEOS_DEMO_KEY` at build) |

### Build profiles

| Profile | Command | Env file |
|---------|---------|----------|
| Main site | `npm run build:pages` | `.env.production` (optional) |
| OrchestrateOS | `npm run build:orchestrateos` | `.env.orchestrateos` |

`.env.orchestrateos` sets `VITE_APP=orchestrateos` and `VITE_SITE_URL=https://orchestrateos.pages.dev`.

## One-time local setup

```powershell
cd cloudflare/workers/orchestrateos-api
npm install
npx wrangler login
npx wrangler d1 create orchestrateos   # if not created
# Set database_id in wrangler.toml
npx wrangler d1 execute orchestrateos --remote --file=../../d1/schema.sql
npx wrangler deploy
```

Pages (from repo root):

```powershell
npm run build:pages
npx wrangler pages deploy dist/public --project-name=aitechpros-website

npm run build:orchestrateos
npx wrangler pages deploy dist/public --project-name=orchestrateos
```

## Local development

```powershell
npm run dev                    # main marketing site
npm run dev:orchestrateos      # OrchestrateOS product at /
# API worker (separate terminal):
cd cloudflare/workers/orchestrateos-api && npm run dev
```

## Legacy hosting

- **Namecheap FTP:** `.github/workflows/deploy-website.yml` — manual only (`workflow_dispatch`)
- **Manus:** previous host, retired

## Python SDK vs Worker API

| Use case | Where |
|----------|--------|
| Gate explorer UI | Worker + D1 |
| LangGraph / CrewAI in your apps | `pip install -e .` locally |
| Python → live control plane (D1) | `pip install "resume_engine[remote]"` + `RemoteCheckpointStore` |
| Full Python FastAPI on Cloudflare | [Cloudflare Containers](https://developers.cloudflare.com/containers/) (paid)

### Phase 4 — Go-to-market (PyPI + sales content)

**Site pages** (orchestrateos.pages.dev):

| Path | Purpose |
|------|---------|
| `/install` | PyPI install + remote control plane quickstart |
| `/governance` | Objection-handling — observability vs governance |
| `/compliance` | Healthcare/finance audit & RBAC positioning |
| `/compare` | Printable comparison one-pager (browser → Save as PDF) |

**PyPI publish:** workflow `.github/workflows/pypi-publish.yml`

1. Create PyPI account + API token for `resume_engine`
2. Add GitHub secret `PYPI_API_TOKEN`
3. Bump `version` in `pyproject.toml`
4. Create a GitHub Release, or run workflow **Publish resume_engine to PyPI** manually

```powershell
pip install resume_engine
pip install "resume_engine[remote]"
```

**Internal sales script:** `docs/orchestrateos/sales-displacement-script.md`

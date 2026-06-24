# AI Tech Pros — Official Website & OrchestrateOS

**AI Engineers and Cybersecurity experts building autonomous enterprise solutions.**

| Product | URL |
|---------|-----|
| **Marketing site** | https://aitechpros-website.pages.dev |
| **OrchestrateOS** | https://orchestrateos.pages.dev |
| **Control plane API** | https://orchestrateos-api.nevaquit.workers.dev |
| **Python SDK (PyPI)** | https://pypi.org/project/resume-engine/ |

🌐 [Website](https://aitechpros-website.pages.dev) · [OrchestrateOS](https://orchestrateos.pages.dev) · [Install](https://orchestrateos.pages.dev/install) · [PyPI](https://pypi.org/project/resume-engine/0.2.0/) · [API docs](https://orchestrateos-api.nevaquit.workers.dev/docs)

**Documentation:** [User guide](docs/orchestrateos/user-guide.md) · [Troubleshooting](docs/orchestrateos/troubleshooting.md) · [Design partner playbook](docs/orchestrateos/design-partner-playbook.md) · [Sales script](docs/orchestrateos/sales-displacement-script.md) · [Cloudflare deploy](docs/cloudflare-deploy.md)

---

## About

AITechPros builds a governance-first agent orchestration layer (`resume_engine` / OrchestrateOS). Production hosting uses **Cloudflare Pages + Workers + D1** on `*.pages.dev` and `*.workers.dev` — no custom domain required for the product stack.

> **Note:** `aitechpros.ai` is a separate legacy/marketing domain (Namecheap). OrchestrateOS does **not** run on `aitechpros.ai` or `orchestrateos.aitechpros.ai`.

---

## Product status

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **1** | Live gate explorer, D1 demo runs, Worker `/docs`, step APIs | ✅ Shipped |
| **2** | `RemoteCheckpointStore` — Python SDK → Worker + D1 | ✅ Shipped |
| **3** | API auth/RBAC, `audit_events`, prod gates, replay | ✅ Shipped (`API_AUTH_ENABLED=true`) |
| **4** | GTM pages, PyPI publish workflow, `resume_engine` **0.2.0** on PyPI | ✅ Shipped |
| **Next** | Design partner #1 on a real workflow; tenant isolation for multi-customer SaaS | Planned |

---

## PyPI — `resume_engine`

The SDK is **published and installable from PyPI** (not repo-only).

| | |
|--|--|
| **Package** | [`resume_engine`](https://pypi.org/project/resume-engine/) |
| **Latest** | [0.2.0](https://pypi.org/project/resume-engine/0.2.0/) |
| **Install page** | https://orchestrateos.pages.dev/install |

```powershell
pip install resume_engine
pip install "resume_engine[remote]"    # Cloudflare Worker checkpoint store
pip install "resume_engine[langgraph]" # LangGraph node wrapper
pip install "resume_engine[crewai]"    # CrewAI task wrapper
pip install "resume_engine[api]"       # optional self-hosted FastAPI
```

Verify install:

```powershell
python -c "from resume_engine import ResumeEngine; print('ok')"
```

**Publish a new version:** bump `version` in `pyproject.toml`, then run workflow [`.github/workflows/pypi-publish.yml`](.github/workflows/pypi-publish.yml) (GitHub Release or manual dispatch). Requires GitHub secret `PYPI_API_TOKEN`.

---

## OrchestrateOS (`resume_engine`)

Deterministic workflow execution for LangGraph, CrewAI, and plain Python — resume from the last completed step instead of restarting from zero.

| Component | Location |
|-----------|----------|
| Python package (source) | `resume_engine/` |
| PyPI | https://pypi.org/project/resume-engine/ |
| Product site | https://orchestrateos.pages.dev |
| Gate explorer | https://orchestrateos.pages.dev/#gates |
| GTM pages | [/install](https://orchestrateos.pages.dev/install) · [/governance](https://orchestrateos.pages.dev/governance) · [/compliance](https://orchestrateos.pages.dev/compliance) · [/compare](https://orchestrateos.pages.dev/compare) |
| Control plane API | https://orchestrateos-api.nevaquit.workers.dev |
| SDK docs | [resume_engine/README.md](resume_engine/README.md) |

### Capabilities

- **Checkpointing** — durable step input/output; resume from last success
- **Idempotency** — side effects cannot fire twice on resume
- **Failure gates** — `transient`, `partial` (compensation), `permanent` (approval), `prod` (`ack_prod_resume`)
- **Remote store** — `RemoteCheckpointStore` syncs runs to the same D1 DB as the gate explorer
- **Governance** — RBAC (`runner` / `operator` / `auditor`), `audit_events`, deterministic `replay`

```powershell
# Run tests (contributors)
pip install -e ".[dev,api]"
python -m pytest resume_engine/tests -q

# Remote demo (requires ORCHESTRATEOS_API_KEY)
pip install "resume_engine[remote]"
$env:ORCHESTRATEOS_API_KEY = "<runner-key>"
$env:ORCHESTRATEOS_API_URL = "https://orchestrateos-api.nevaquit.workers.dev"
python resume_engine/demo_remote_pipeline.py
```

---

## Repository layout

| Path | Purpose |
|------|---------|
| `client/` | React 19 + Vite frontend (marketing + OrchestrateOS product site) |
| `resume_engine/` | Python SDK — checkpointing, gates, LangGraph/CrewAI adapters |
| `cloudflare/` | Worker API, D1 schema, demo seed data |
| `docs/` | Deployment, user guide, troubleshooting, sales & design-partner playbooks |
| `.github/workflows/` | CI/CD (Cloudflare, PyPI, optional Namecheap/GHCR) |

---

## Production architecture

```
┌─────────────────────────────────────────────────────────────┐
│  orchestrateos.pages.dev          Product UI + gate explorer │
│  aitechpros-website.pages.dev     Marketing site             │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────┐
│  orchestrateos-api.*.workers.dev   Control plane (Worker + D1) │
│  • runs, steps, gates, audit, RBAC, replay                     │
└───────────────────────────▲─────────────────────────────────┘
                            │ RemoteCheckpointStore
┌───────────────────────────┴─────────────────────────────────┐
│  Customer runtime — pip install resume_engine (PyPI)           │
└─────────────────────────────────────────────────────────────┘
```

**Cloudflare account ID:** `365965a7234fe266200abe63be3b63ba`

---

## CI/CD (GitHub Actions)

| Workflow | Trigger | What it deploys |
|----------|---------|-----------------|
| [`cloudflare-deploy.yml`](.github/workflows/cloudflare-deploy.yml) | Push to `main` (client/cloudflare paths) | Both Pages sites + Worker + D1 migrate/seed |
| [`pypi-publish.yml`](.github/workflows/pypi-publish.yml) | Release or manual | `resume_engine` → [PyPI](https://pypi.org/project/resume-engine/) |
| [`deploy-website.yml`](.github/workflows/deploy-website.yml) | Manual only | Legacy Namecheap FTP (`aitechpros.ai`) |
| [`orchestrateos-api.yml`](.github/workflows/orchestrateos-api.yml) | Push to `main` (resume_engine paths) | Docker image to GHCR (optional self-host) |

### GitHub secrets

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Workers, Pages, D1 deploy |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account |
| `ORCHESTRATEOS_API_KEY` | Runner key — CI smoke tests + SDK |
| `ORCHESTRATEOS_DEMO_KEY` | Demo operator key → `VITE_ORCHESTRATEOS_DEMO_KEY` at OrchestrateOS Pages build |
| `PYPI_API_TOKEN` | Publish `resume_engine` to PyPI |

### Worker secrets (`wrangler secret put`)

| Secret | Purpose |
|--------|---------|
| `API_KEYS_JSON` | `{"<key>":"runner","<key>":"operator",...}` |
| `DEMO_OPERATOR_KEY` | Scoped operator key for gate explorer demo runs |

Production Worker has `API_AUTH_ENABLED = "true"` — all API writes require `Authorization: Bearer <key>`. Public `GET` endpoints remain open for the gate explorer.

Full setup: **[docs/cloudflare-deploy.md](docs/cloudflare-deploy.md)**

---

## Sales demo & design partners

**15-min demo flow:** [docs/orchestrateos/sales-displacement-script.md](docs/orchestrateos/sales-displacement-script.md)

**Pre-call smoke test** (API, gate scenarios, GTM pages, PyPI):

```powershell
.\resume_engine\scripts\sales_demo_smoke.ps1
```

**First paid pilot:** [docs/orchestrateos/design-partner-playbook.md](docs/orchestrateos/design-partner-playbook.md)

---

## Local development

```powershell
npm install

# Marketing site (localhost:3000)
npm run dev

# OrchestrateOS product site
npm run dev:orchestrateos

# Worker API (separate terminal)
cd cloudflare/workers/orchestrateos-api
npm install
npm run dev

# Python SDK (contributors)
pip install -e ".[dev,remote]"
python -m pytest resume_engine/tests -q
```

### Build profiles

| Command | Output | Env |
|---------|--------|-----|
| `npm run build:pages` | `dist/public` → `aitechpros-website` Pages | `.env.production` (optional) |
| `npm run build:orchestrateos` | `dist/public` → `orchestrateos` Pages | `.env.orchestrateos` |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Vite |
| Product API | Cloudflare Workers (Hono) + D1 |
| Python SDK | `resume_engine` 0.2.0 — SQLAlchemy, httpx (remote) |
| Distribution | [PyPI](https://pypi.org/project/resume-engine/), GitHub Actions |
| CI/CD | GitHub Actions, Wrangler |

---

## Connect

- **Website:** https://aitechpros-website.pages.dev
- **OrchestrateOS:** https://orchestrateos.pages.dev
- **PyPI:** https://pypi.org/project/resume-engine/
- **LinkedIn:** [AI Tech Pros](https://www.linkedin.com/company/ai-tech-pros)
- **X/Twitter:** [@AITechProsAI](https://x.com/AITechProsAI)
- **GitHub:** [AI-Tech-Pros](https://github.com/AI-Tech-Pros)
- **Early access:** https://calendly.com/aitechpros/15min

## License

Website: © 2026 AI Tech Pros LLC. · SDK: MIT — see [LICENSE](LICENSE).

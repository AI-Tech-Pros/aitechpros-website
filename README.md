# AI Tech Pros — Official Website & OrchestrateOS

**AI Engineers and Cybersecurity experts building autonomous enterprise solutions.**

| Product | URL |
|---------|-----|
| **Marketing site** | https://aitechpros-website.pages.dev |
| **OrchestrateOS** | https://orchestrateos.pages.dev |
| **Control plane API** | https://orchestrateos-api.nevaquit.workers.dev |

🌐 [Website](https://aitechpros-website.pages.dev) · [OrchestrateOS](https://orchestrateos.pages.dev) · [API docs](https://orchestrateos-api.nevaquit.workers.dev/docs)

**Documentation:** [User guide](docs/orchestrateos/user-guide.md) · [Troubleshooting](docs/orchestrateos/troubleshooting.md) · [Cloudflare deploy](docs/cloudflare-deploy.md)

---

## About

AITechPros builds a governance-first agent orchestration layer (`resume_engine` / OrchestrateOS). Production hosting uses **Cloudflare Pages + Workers + D1** on `*.pages.dev` and `*.workers.dev` — no custom domain required for the product stack.

> **Note:** `aitechpros.ai` is a separate legacy/marketing domain (Namecheap). OrchestrateOS does **not** run on `aitechpros.ai` or `orchestrateos.aitechpros.ai`.

---

## Repository layout

| Path | Purpose |
|------|---------|
| `client/` | React 19 + Vite frontend (marketing + OrchestrateOS product site) |
| `resume_engine/` | Python SDK — checkpointing, gates, LangGraph/CrewAI adapters |
| `cloudflare/` | Worker API, D1 schema, demo seed data |
| `docs/` | Deployment, user guide, troubleshooting, sales script |
| `.github/workflows/` | CI/CD (Cloudflare, PyPI, optional Namecheap/GHCR) |

---

## OrchestrateOS (`resume_engine`)

Deterministic workflow execution for LangGraph, CrewAI, and plain Python — resume from the last completed step instead of restarting from zero.

```powershell
pip install resume_engine
pip install "resume_engine[remote]"   # sync to Cloudflare control plane
```

| Component | Location |
|-----------|----------|
| Python package | `resume_engine/` (PyPI: `resume_engine` 0.2.0) |
| Product site | https://orchestrateos.pages.dev |
| Gate explorer | https://orchestrateos.pages.dev/#gates |
| Control plane API | https://orchestrateos-api.nevaquit.workers.dev |
| SDK docs | [resume_engine/README.md](resume_engine/README.md) |

```powershell
# Run tests
pip install -e ".[dev]"
python -m pytest resume_engine/tests -q

# Remote demo (requires ORCHESTRATEOS_API_KEY)
pip install -e ".[remote]"
$env:ORCHESTRATEOS_API_KEY = "<runner-key>"
python resume_engine/demo_remote_pipeline.py
```

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
│  Customer runtime — pip install resume_engine                  │
└─────────────────────────────────────────────────────────────┘
```

---

## CI/CD (GitHub Actions)

| Workflow | Trigger | What it deploys |
|----------|---------|-----------------|
| [`cloudflare-deploy.yml`](.github/workflows/cloudflare-deploy.yml) | Push to `main` (client/cloudflare paths) | Both Pages sites + Worker + D1 migrate/seed |
| [`pypi-publish.yml`](.github/workflows/pypi-publish.yml) | Release or manual | `resume_engine` to PyPI |
| [`deploy-website.yml`](.github/workflows/deploy-website.yml) | Manual only | Legacy Namecheap FTP (`aitechpros.ai`) |
| [`orchestrateos-api.yml`](.github/workflows/orchestrateos-api.yml) | Push to `main` (resume_engine paths) | Docker image to GHCR (optional self-host) |

### Cloudflare secrets (required)

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Workers, Pages, D1 deploy |
| `CLOUDFLARE_ACCOUNT_ID` | `365965a7234fe266200abe63be3b63ba` |
| `ORCHESTRATEOS_API_KEY` | Runner key — CI smoke tests |
| `ORCHESTRATEOS_DEMO_KEY` | Demo operator key → `VITE_ORCHESTRATEOS_DEMO_KEY` at build |

### Worker secrets (via `wrangler secret put`)

| Secret | Purpose |
|--------|---------|
| `API_KEYS_JSON` | `{"<key>":"runner","<key>":"operator",...}` |
| `DEMO_OPERATOR_KEY` | Scoped operator key for gate explorer demo runs |

Production Worker has `API_AUTH_ENABLED = "true"` — all API writes require `Authorization: Bearer <key>`.

Full setup: **[docs/cloudflare-deploy.md](docs/cloudflare-deploy.md)**

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

# Python SDK
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
| Python SDK | `resume_engine` — SQLAlchemy, httpx (remote) |
| CI/CD | GitHub Actions, Wrangler |

---

## Connect

- **Website:** https://aitechpros-website.pages.dev
- **OrchestrateOS:** https://orchestrateos.pages.dev
- **LinkedIn:** [AI Tech Pros](https://www.linkedin.com/company/ai-tech-pros)
- **X/Twitter:** [@AITechProsAI](https://x.com/AITechProsAI)
- **GitHub:** [AI-Tech-Pros](https://github.com/AI-Tech-Pros)
- **Early access:** https://calendly.com/aitechpros/15min

## License

Website: © 2026 AI Tech Pros LLC. · SDK: MIT — see [LICENSE](LICENSE).

# Cloudflare deployment (Pages + Workers + D1)

Production uses **Cloudflare default domains** — no custom domain required.

| Service | URL |
|---------|-----|
| **Website** | https://aitechpros-website.pages.dev |
| **OrchestrateOS** | https://aitechpros-website.pages.dev/orchestrateos |
| **API** | https://orchestrateos-api.nevaquit.workers.dev |

## Architecture

| Product | Hosts |
|---------|-------|
| **Pages** | React SPA (`dist/public`) |
| **Workers + D1** | OrchestrateOS control plane API |
| **Python SDK** | `resume_engine/` — local / CI only |

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/cloudflare-deploy.yml`

**Triggers:** push to `main` (paths: `client/`, `cloudflare/`, build config) or manual **Run workflow**.

**Jobs:**
1. **Pages** — `npm ci` → `npm run build:pages` → `wrangler pages deploy`
2. **Worker** — D1 schema migrate → `wrangler deploy` → `/health` smoke test

### GitHub secrets (required)

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | API token with Workers, Pages, D1 edit |
| `CLOUDFLARE_ACCOUNT_ID` | `365965a7234fe266200abe63be3b63ba` |

Create token: Cloudflare dashboard → **My Profile → API Tokens → Create Token**  
Use template *Edit Cloudflare Workers* and add **Cloudflare Pages — Edit** + **D1 — Edit**.

### GitHub variables (optional overrides)

| Variable | Default |
|----------|---------|
| `VITE_SITE_URL` | `https://aitechpros-website.pages.dev` |
| `VITE_ORCHESTRATEOS_API_URL` | `https://orchestrateos-api.nevaquit.workers.dev` |

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
```

## Local development

```powershell
npm run dev
# API worker (separate terminal):
cd cloudflare/workers/orchestrateos-api && npm run dev
```

`.env` (optional):

```
VITE_ORCHESTRATEOS_API_URL=http://127.0.0.1:8787
VITE_SITE_URL=http://localhost:3001
```

## Legacy hosting

- **Namecheap FTP:** `.github/workflows/deploy-website.yml` — manual only (`workflow_dispatch`)
- **Manus:** previous host, retired

## Python SDK vs Worker API

| Use case | Where |
|----------|--------|
| Gate explorer UI | Worker + D1 |
| LangGraph / CrewAI in your apps | `pip install -e .` locally |
| Full Python FastAPI on Cloudflare | [Cloudflare Containers](https://developers.cloudflare.com/containers/) (paid)

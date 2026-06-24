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
3. **worker** — D1 schema migrate → `wrangler deploy` → `/health` smoke test

### GitHub secrets (required)

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | API token with Workers, Pages, D1 edit |
| `CLOUDFLARE_ACCOUNT_ID` | `365965a7234fe266200abe63be3b63ba` |

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
| Full Python FastAPI on Cloudflare | [Cloudflare Containers](https://developers.cloudflare.com/containers/) (paid)

# Cloudflare deployment (Pages + Workers + D1)

All-in on Cloudflare for **aitechpros.ai** and **OrchestrateOS**.

| Product | Hosts | Free tier |
|---------|-------|-----------|
| **Pages** | React SPA — `aitechpros.ai`, `/orchestrateos`, `orchestrateos.aitechpros.ai` | Yes |
| **Workers** | API — `api.orchestrateos.aitechpros.ai` | 100k req/day |
| **D1** | SQLite DB for runs, steps, gates | 5M reads/day |

The Python `resume_engine/` package remains in-repo for **SDK use** (LangGraph, CrewAI, local dev). Production API is the TypeScript Worker in `cloudflare/workers/orchestrateos-api/`.

## One-time setup

### 1. Cloudflare account

1. Add **aitechpros.ai** to Cloudflare (DNS → nameservers at Namecheap).
2. Create API token: **My Profile → API Tokens → Create Token**
   - Template: *Edit Cloudflare Workers* + *Cloudflare Pages* + *D1*
3. GitHub secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID` (dashboard sidebar)

### 2. D1 database

```bash
cd cloudflare/workers/orchestrateos-api
npm install
npx wrangler d1 create orchestrateos
```

Copy the `database_id` into `wrangler.toml` (`REPLACE_WITH_D1_DATABASE_ID`).

Apply schema:

```bash
npx wrangler d1 execute orchestrateos --remote --file=../../d1/schema.sql
```

### 3. Pages project

Dashboard → **Workers & Pages → Create → Pages → Connect to Git**  
Or let CI create via `pages deploy --project-name=aitechpros-website`.

| Setting | Value |
|---------|--------|
| Build command | `npm ci && npm run build:pages` |
| Output directory | `dist/public` |
| Env | `VITE_ORCHESTRATEOS_API_URL=https://api.orchestrateos.aitechpros.ai` |

Custom domains: `aitechpros.ai`, `www.aitechpros.ai`, `orchestrateos.aitechpros.ai`

### 4. Worker route

After `wrangler deploy`, add route in dashboard or keep `wrangler.toml` routes:

- `api.orchestrateos.aitechpros.ai/*` → `orchestrateos-api` worker

DNS (automatic if zone is on Cloudflare):

| Type | Name | Target |
|------|------|--------|
| CNAME | `api.orchestrateos` | Worker (wrangler sets this) |
| CNAME | `@` / `www` | Pages project |

### 5. Retire Namecheap / Manus hosting

Once Pages is live on custom domains:

- Remove Namecheap `public_html` deploy workflow (optional)
- Remove legacy `cname.manus.space` DNS records
- Cancel unused Namecheap Stellar if no longer needed

## Local development

```powershell
# Frontend
npm run dev

# API worker (separate terminal)
cd cloudflare/workers/orchestrateos-api
npm run db:migrate:local
npm run dev
```

Set `VITE_ORCHESTRATEOS_API_URL=http://127.0.0.1:8787` in `.env` for local gate explorer.

## CI

`.github/workflows/cloudflare-deploy.yml` — on push to `main`:

1. Build Pages → deploy `dist/public`
2. Migrate D1 + deploy Worker

## Python SDK vs Cloudflare API

| Use case | Where |
|----------|--------|
| Gate explorer UI | Worker API (D1) |
| LangGraph / CrewAI in your apps | `pip install resume_engine` (local/CI) |
| Heavy step execution | Your app process — API stores checkpoints only |

To run the **full Python FastAPI** on Cloudflare instead, use **Cloudflare Containers** (paid) with the existing Docker image — see [Containers docs](https://developers.cloudflare.com/containers/).

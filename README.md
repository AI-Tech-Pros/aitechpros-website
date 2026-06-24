# AI Tech Pros — Official Website

**AI Engineers and Cybersecurity experts building autonomous enterprise solutions on Google Cloud.**

🌐 [aitechpros.ai](https://aitechpros.ai) · [OrchestrateOS](https://aitechpros.ai/orchestrateos)

---

## About

AITechPros.ai is engineering a proprietary agentic orchestration layer. We are currently partnering with a select cohort of design partners to refine our core engine before a wider release.

## OrchestrateOS (`resume_engine`)

Deterministic workflow execution for LangGraph, CrewAI, and plain Python — resume from the last completed step instead of restarting from zero.

| Component | Location |
|-----------|----------|
| Python package | `resume_engine/` |
| Product page | `/orchestrateos` (or `orchestrateos.aitechpros.ai` after DNS) |
| API (separate deploy) | Docker / Cloud Run — see `resume_engine/README.md` |

```powershell
# Local full stack
npm run dev
docker compose -f resume_engine/docker-compose.yml up --build
python -m pytest resume_engine/tests -q
```

---

## Hosting architecture (target: all Cloudflare)

| Layer | Product | Hosts |
|-------|---------|-------|
| **Frontend** | [Cloudflare Pages](https://pages.cloudflare.com) | `aitechpros.ai`, `/orchestrateos` |
| **API** | [Cloudflare Workers](https://workers.cloudflare.com) + [D1](https://developers.cloudflare.com/d1/) | `api.orchestrateos.aitechpros.ai` |
| **Domain** | Namecheap registrar → Cloudflare DNS | Nameservers on Cloudflare |

Full setup: **[docs/cloudflare-deploy.md](docs/cloudflare-deploy.md)**

The Python `resume_engine/` package stays in-repo for SDK/adapters (LangGraph, CrewAI). Production gate-explorer API is the Worker in `cloudflare/workers/orchestrateos-api/`.

Legacy Namecheap FTP deploy: [docs/namecheap-deploy.md](docs/namecheap-deploy.md) (optional, superseded by Pages).

---

## Deploy checklist

### 1. Cloudflare (recommended)

1. Add `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` to GitHub secrets
2. Create D1 database, update `database_id` in `cloudflare/workers/orchestrateos-api/wrangler.toml`
3. Point domain nameservers to Cloudflare
4. Push to `main` → `.github/workflows/cloudflare-deploy.yml`

```powershell
npm run build:pages   # local verify
```

### 2. Python SDK (local / your apps)

```powershell
docker compose -f resume_engine/docker-compose.yml up --build
python -m pytest resume_engine/tests -q
```

---

## Tech Stack (Website)

- **Frontend:** React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Build:** Vite (`npm run build:pages` for Cloudflare Pages)
- **Hosting:** Cloudflare Pages + Workers + D1

## Connect

- **Website:** [aitechpros.ai](https://aitechpros.ai)
- **LinkedIn:** [AI Tech Pros](https://www.linkedin.com/company/ai-tech-pros)
- **X/Twitter:** [@AITechProsAI](https://x.com/AITechProsAI)
- **GitHub:** [AI-Tech-Pros](https://github.com/AI-Tech-Pros)

## License

All rights reserved. © 2026 AI Tech Pros LLC.

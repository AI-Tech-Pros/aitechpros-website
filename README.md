# AI Tech Pros — Official Website

**AI Engineers and Cybersecurity experts building autonomous enterprise solutions on Google Cloud.**

🌐 [Website](https://aitechpros-website.pages.dev) · [OrchestrateOS](https://aitechpros-website.pages.dev/orchestrateos)

---

## About

AITechPros.ai is engineering a proprietary agentic orchestration layer. We are currently partnering with a select cohort of design partners to refine our core engine before a wider release.

## OrchestrateOS (`resume_engine`)

Deterministic workflow execution for LangGraph, CrewAI, and plain Python — resume from the last completed step instead of restarting from zero.

| Component | Location |
|-----------|----------|
| Python package | `resume_engine/` |
| Product page | https://aitechpros-website.pages.dev/orchestrateos |
| API | https://orchestrateos-api.nevaquit.workers.dev |

```powershell
# Local full stack
npm run dev
docker compose -f resume_engine/docker-compose.yml up --build
python -m pytest resume_engine/tests -q
```

---

## Hosting (Cloudflare)

| Layer | Product | URL |
|-------|---------|-----|
| **Frontend** | Pages | https://aitechpros-website.pages.dev |
| **API** | Workers + D1 | https://orchestrateos-api.nevaquit.workers.dev |
| **CI/CD** | GitHub Actions | `.github/workflows/cloudflare-deploy.yml` |

Setup: **[docs/cloudflare-deploy.md](docs/cloudflare-deploy.md)**

Python `resume_engine/` remains for SDK/adapters (LangGraph, CrewAI). Production gate-explorer API is the Worker in `cloudflare/workers/orchestrateos-api/`.

Legacy Namecheap FTP: [docs/namecheap-deploy.md](docs/namecheap-deploy.md) — manual `workflow_dispatch` only.

---

## Deploy checklist

### 1. Cloudflare CI/CD

GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (`365965a7234fe266200abe63be3b63ba`)

Push to `main` → `.github/workflows/cloudflare-deploy.yml`

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

- **Website:** https://aitechpros-website.pages.dev
- **LinkedIn:** [AI Tech Pros](https://www.linkedin.com/company/ai-tech-pros)
- **X/Twitter:** [@AITechProsAI](https://x.com/AITechProsAI)
- **GitHub:** [AI-Tech-Pros](https://github.com/AI-Tech-Pros)

## License

All rights reserved. © 2026 AI Tech Pros LLC.

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

## Hosting architecture (verified)

| Layer | Provider |
|-------|----------|
| **DNS nameservers** | Registrar (`pdns*.registrar-servers.com`) |
| **Site origin** | [Manus](https://manus.im) (`cname.manus.space`, `manus-runtime` in production HTML) |
| **Edge CDN** | Cloudflare (proxied A/CNAME records) |

The marketing site is **not** GitHub Pages or Vercel. Redeploy the site through your **Manus project publish flow** after pushing to `main`.

---

## Deploy checklist (before DNS changes)

Do these first; add subdomains last.

### 1. Redeploy site on Manus

```powershell
npm run build
# Publish dist/ via Manus dashboard (connects to this repo)
```

Verify: https://aitechpros.ai/orchestrateos shows the OrchestrateOS page and gate explorer.

### 2. Deploy API (Cloud Run or Docker host)

```powershell
docker compose -f resume_engine/docker-compose.yml up --build
# Or: resume_engine/scripts/deploy_cloud_run.ps1 -ProjectId YOUR_GCP_PROJECT
```

Smoke test:

```powershell
.\resume_engine\scripts\smoke_test_api.ps1 -BaseUrl http://127.0.0.1:8000
```

CI builds the API Docker image on push to `main` (`.github/workflows/orchestrateos-api.yml`).

### 3. DNS (last step — not required for initial testing)

When ready:

- `orchestrateos.aitechpros.ai` → CNAME `cname.manus.space` (or Manus-provided target)
- `api.orchestrateos.aitechpros.ai` → Cloud Run URL or API host

---

## Tech Stack (Website)

- **Frontend:** React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Build:** Vite + Express static server (`npm run build` / `npm start`)
- **Hosting:** Manus origin, Cloudflare edge, registrar DNS

## Connect

- **Website:** [aitechpros.ai](https://aitechpros.ai)
- **LinkedIn:** [AI Tech Pros](https://www.linkedin.com/company/ai-tech-pros)
- **X/Twitter:** [@AITechProsAI](https://x.com/AITechProsAI)
- **GitHub:** [AI-Tech-Pros](https://github.com/AI-Tech-Pros)

## License

All rights reserved. © 2026 AI Tech Pros LLC.

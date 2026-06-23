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

## Hosting architecture

| Layer | Provider |
|-------|----------|
| **Domain registrar / DNS** | Namecheap |
| **Web hosting** | Namecheap Stellar (`public_html` via cPanel) |
| **CI/CD** | GitHub Actions → FTPS deploy on push to `main` |
| **Edge CDN** | Cloudflare (optional, if proxied) |

The marketing site deploys as a **static SPA** (`dist/public`) — no Node process required on shared hosting. See [docs/namecheap-deploy.md](docs/namecheap-deploy.md) for FTP secrets and DNS cutover.

**OrchestrateOS API** remains a separate Docker/Cloud Run deploy (`resume_engine/`).

---

## Deploy checklist

### 1. Website (automatic on push to `main`)

Add GitHub secrets: `NAMECHEAP_FTP_SERVER`, `NAMECHEAP_FTP_USERNAME`, `NAMECHEAP_FTP_PASSWORD`.  
Optional environment: `namecheap-production`.

```powershell
npm run build   # local verify
git push origin main   # triggers .github/workflows/deploy-website.yml
```

### 2. API (Cloud Run or Docker)

```powershell
docker compose -f resume_engine/docker-compose.yml up --build
# Or: resume_engine/scripts/deploy_cloud_run.ps1 -ProjectId YOUR_GCP_PROJECT
```

### 3. DNS (when cutting over from Manus)

Point `@` A record to your Namecheap server IP (cPanel → Server Information).  
Subdomains last: `orchestrateos`, `api.orchestrateos`.

---

## Tech Stack (Website)

- **Frontend:** React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Build:** Vite (static) + optional Express for local preview
- **Hosting:** Namecheap Stellar, deployed via GitHub Actions FTPS

## Connect

- **Website:** [aitechpros.ai](https://aitechpros.ai)
- **LinkedIn:** [AI Tech Pros](https://www.linkedin.com/company/ai-tech-pros)
- **X/Twitter:** [@AITechProsAI](https://x.com/AITechProsAI)
- **GitHub:** [AI-Tech-Pros](https://github.com/AI-Tech-Pros)

## License

All rights reserved. © 2026 AI Tech Pros LLC.

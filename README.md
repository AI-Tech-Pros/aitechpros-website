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
| **Web hosting (production)** | Namecheap Stellar — `server97.web-hosting.com` / `198.54.116.40` |
| **CI/CD** | GitHub Actions → SFTP deploy (SSH key) on push to `main` |
| **Docroot** | `/home/aitevrpo/public_html/` |

The marketing site is a **static SPA** (`dist/public`) on Namecheap shared hosting. See [docs/namecheap-deploy.md](docs/namecheap-deploy.md) and [docs/namecheap-ssh-key.md](docs/namecheap-ssh-key.md).

**OrchestrateOS API** is a separate Docker/Cloud Run deploy (`resume_engine/`).

---

## Deploy checklist

### 1. Website (automatic on push to `main`)

GitHub secrets (environment `namecheap-production`):

| Secret | Value |
|--------|-------|
| `NAMECHEAP_FTP_SERVER` | `server97.web-hosting.com` |
| `NAMECHEAP_FTP_USERNAME` | `aitevrpo` |
| `NAMECHEAP_SSH_PRIVATE_KEY` | Deploy key (see `docs/namecheap-ssh-key.md`) |

```powershell
npm run build   # local verify
git push origin main   # triggers .github/workflows/deploy-website.yml
```

### 2. API (Cloud Run or Docker)

```powershell
docker compose -f resume_engine/docker-compose.yml up --build
# Or: resume_engine/scripts/deploy_cloud_run.ps1 -ProjectId YOUR_GCP_PROJECT
```

### 3. DNS (Namecheap Advanced DNS)

**Current (live traffic still on Manus):**

| Host | Type | Current value |
|------|------|---------------|
| `@` | A | `104.18.26.246`, `104.18.27.246` (Cloudflare → Manus) |
| `www` | CNAME | `cname.manus.space` |

**Required for Namecheap hosting:**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | `198.54.116.40` | Automatic |
| **CNAME** | `www` | `aitechpros.ai` | Automatic |

Remove the `www` → `cname.manus.space` record when updating. Subdomains (later): `orchestrateos` → same docroot; `api.orchestrateos` → Cloud Run URL.

---

## Tech Stack (Website)

- **Frontend:** React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Build:** Vite (static) + optional Express for local preview
- **Hosting:** Namecheap Stellar (`server97.web-hosting.com`), GitHub Actions SFTP

## Connect

- **Website:** [aitechpros.ai](https://aitechpros.ai)
- **LinkedIn:** [AI Tech Pros](https://www.linkedin.com/company/ai-tech-pros)
- **X/Twitter:** [@AITechProsAI](https://x.com/AITechProsAI)
- **GitHub:** [AI-Tech-Pros](https://github.com/AI-Tech-Pros)

## License

All rights reserved. © 2026 AI Tech Pros LLC.

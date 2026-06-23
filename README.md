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

| Layer | Provider | Status |
|-------|----------|--------|
| **Domain registrar** | Namecheap | Active |
| **Live site (what visitors see today)** | Manus (`cname.manus.space` / Cloudflare) | **Serving** `aitechpros.ai` + `/orchestrateos` |
| **Namecheap Stellar** | `server97.web-hosting.com` / `198.54.116.40` | Account active; `public_html` empty until deploy + DNS |
| **CI/CD (optional)** | GitHub Actions → Namecheap SFTP | Manual — see below |

**If the site looks fine in your browser**, Manus is already publishing it. Pushing to `main` updates the repo; **publish in your Manus project** to refresh the live build.

To **move the live site to Namecheap** instead: authorize the SSH key ([docs/namecheap-ssh-key.md](docs/namecheap-ssh-key.md)), run **Deploy Website** in Actions, then point DNS `@` → `198.54.116.40` in Namecheap Advanced DNS.

---

## Deploy checklist

### 1. Website — live today (Manus)

Push to `main`, then **publish** from your Manus project dashboard (connected to this repo).

### 1b. Website — Namecheap (optional cutover)

Manual deploy only (Actions → **Deploy Website** → Run workflow). Requires SSH key in cPanel — [docs/namecheap-ssh-key.md](docs/namecheap-ssh-key.md).

### 2. API (Cloud Run or Docker)

```powershell
docker compose -f resume_engine/docker-compose.yml up --build
# Or: resume_engine/scripts/deploy_cloud_run.ps1 -ProjectId YOUR_GCP_PROJECT
```

### 3. DNS (Namecheap Advanced DNS)

**Hosting** is on Namecheap (`198.54.116.40`). **Public DNS** may still point elsewhere until you update records — visitors follow DNS, not where you pay for hosting.

| Type | Host | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | `198.54.116.40` | Automatic |
| **CNAME** | `www` | `aitechpros.ai` | Automatic |

Remove any old apex A records and `www` CNAMEs that do not target Namecheap.  
Subdomains (later): `orchestrateos` → same docroot; `api.orchestrateos` → Cloud Run URL.

After DNS propagates, `https://aitechpros.ai/orchestrateos` serves from the same `public_html` bundle as the home page.

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

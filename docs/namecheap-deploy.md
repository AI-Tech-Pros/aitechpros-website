# Namecheap CI/CD (aitechpros.ai)

The site is a static Vite SPA deployed to **Namecheap Stellar** shared hosting via GitHub Actions (`.github/workflows/deploy-website.yml`).

## One-time setup

### 1. Get FTP credentials from cPanel

1. Namecheap → **Hosting List** → **GO TO CPANEL** for `aitechpros.ai`
2. **Files** → **FTP Accounts** (or use the main cPanel account FTP user)
3. Note:
   - **FTP server** — e.g. `server123.web-hosting.com` (from cPanel sidebar)
   - **Username** — cPanel username or FTP account name
   - **Password** — FTP account password
   - **Remote directory** — usually `/public_html/` for the primary domain

### 2. Add GitHub secrets and variables

Repo → **Settings** → **Secrets and variables** → **Actions**

**Secrets** (required for deploy):

| Name | Example |
|------|---------|
| `NAMECHEAP_FTP_SERVER` | `server123.web-hosting.com` |
| `NAMECHEAP_FTP_USERNAME` | `aitechpros` |
| `NAMECHEAP_FTP_PASSWORD` | *(FTP password)* |

**Variables** (optional):

| Name | Purpose |
|------|---------|
| `NAMECHEAP_FTP_REMOTE_DIR` | Default `/public_html/` if unset |
| `VITE_ORCHESTRATEOS_API_URL` | API URL baked into the gate explorer at build time |
| `VITE_ANALYTICS_ENDPOINT` | Umami/analytics script base URL |
| `VITE_ANALYTICS_WEBSITE_ID` | Analytics site ID |

### 3. Create GitHub environment (optional but recommended)

**Settings** → **Environments** → **New environment** → `namecheap-production`

Add the FTP secrets to this environment so deploys are auditable and can require approval.

### 4. Point DNS to Namecheap (when ready to cut over)

In Namecheap **Advanced DNS** for `aitechpros.ai`:

| Type | Host | Value |
|------|------|-------|
| A | `@` | Namecheap server IP (from cPanel → **Server Information**) |
| CNAME | `www` | `aitechpros.ai` |

Remove or replace any `cname.manus.space` records when switching off Manus.

Subdomains (later):

- `orchestrateos` → same docroot (`public_html`) or addon domain
- `api.orchestrateos` → Cloud Run URL (CNAME)

## How deploy works

```
push to main → npm ci → npm run build → dist/public → FTPS → public_html
```

- **Pull requests** — build only (no FTP upload)
- **Push to `main`** — build + deploy + smoke test `https://aitechpros.ai/`
- **Manual** — Actions → Deploy Website → Run workflow

## Local verify before DNS cutover

```powershell
npm run build
# Upload dist/public to public_html via File Manager or FTP client
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 404 on `/orchestrateos` | Ensure `.htaccess` is in `public_html` (copied from `client/public/`) |
| FTPS connection refused | Confirm server hostname from cPanel, port 21, protocol FTPS |
| Old Manus site still shows | DNS still points to Manus; update A/CNAME at registrar |
| Gate explorer offline | Set `VITE_ORCHESTRATEOS_API_URL` variable to your API URL |

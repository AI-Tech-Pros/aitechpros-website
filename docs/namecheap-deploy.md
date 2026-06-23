# Namecheap CI/CD (aitechpros.ai)

Production hosting is **Namecheap Stellar** on cPanel — not Manus.

| Setting | Value |
|---------|-------|
| Server | `server97.web-hosting.com` |
| Server IP | `198.54.116.40` |
| cPanel user | `aitevrpo` |
| SSH/SFTP port | `21098` |
| Docroot | `/home/aitevrpo/public_html/` |

Deploy workflow: `.github/workflows/deploy-website.yml`

## GitHub secrets

Environment: `namecheap-production`

| Secret | Purpose |
|--------|---------|
| `NAMECHEAP_FTP_SERVER` | `server97.web-hosting.com` |
| `NAMECHEAP_FTP_USERNAME` | `aitevrpo` |
| `NAMECHEAP_SSH_PRIVATE_KEY` | Private half of `github-actions-deploy` key |

SSH key setup: [namecheap-ssh-key.md](namecheap-ssh-key.md)

## How deploy works

```
push to main → npm ci → npm run build → dist/public → SFTP (port 21098) → public_html
```

- **Pull requests** — build only
- **Push to `main`** — build + deploy + smoke test
- **Manual** — Actions → Deploy Website → Run workflow

## DNS (Namecheap Advanced DNS)

**Current live DNS** (traffic still serves Manus):

| Host | Type | Current |
|------|------|---------|
| `@` | A | Cloudflare IPs `104.18.26/27.246` |
| `www` | CNAME | `cname.manus.space` |

**Set these for Namecheap hosting:**

| Type | Host | Value | Notes |
|------|------|-------|-------|
| **A Record** | `@` | `198.54.116.40` | Replace apex A records |
| **CNAME Record** | `www` | `aitechpros.ai` | Delete `www` → `cname.manus.space` first |

Optional (later):

| Type | Host | Value |
|------|------|-------|
| A or CNAME | `orchestrateos` | `198.54.116.40` or `aitechpros.ai` |
| CNAME | `api.orchestrateos` | Cloud Run URL |

## Verify deploy before DNS cutover

After a successful GitHub Actions deploy, hit Namecheap directly:

```powershell
curl.exe -sI "http://198.54.116.40/" -H "Host: aitechpros.ai"
# Expect: HTTP/1.1 200 OK, server: LiteSpeed
```

Check `public_html` in cPanel File Manager for `index.html` and `assets/`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Permission denied (publickey)` | cPanel → SSH Access → deauthorize key → re-authorize. Confirm fingerprint `SHA256:U9gANzzZuSjpIcrVr+UQiRT1j8HwO+1woFISz7O3sPQ` |
| Key authorized but still rejected | Delete key in cPanel, re-import from [namecheap-ssh-key.md](namecheap-ssh-key.md), authorize again |
| Old Manus site at https://aitechpros.ai | DNS not updated — apex still on Cloudflare/Manus |
| 404 on `/orchestrateos` | Ensure `.htaccess` is in `public_html` |
| Gate explorer offline | Set `VITE_ORCHESTRATEOS_API_URL` GitHub variable |

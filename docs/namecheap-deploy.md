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

Point the domain at your Namecheap server so visitors reach `public_html`:

| Type | Host | Value | Notes |
|------|------|-------|-------|
| **A Record** | `@` | `198.54.116.40` | Server IP from cPanel → Manage SSH |
| **CNAME Record** | `www` | `aitechpros.ai` | Remove conflicting `www` records first |

Optional (later):

| Type | Host | Value |
|------|------|-------|
| A or CNAME | `orchestrateos` | `198.54.116.40` or `aitechpros.ai` |
| CNAME | `api.orchestrateos` | Cloud Run URL |

Until DNS uses `198.54.116.40`, `https://aitechpros.ai` may show a different origin than Namecheap. Verify deploy with:

```powershell
curl.exe -sI "http://198.54.116.40/" -H "Host: aitechpros.ai"
```

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
| `Permission denied (publickey)` | Import RSA key from [namecheap-ssh-key.md](namecheap-ssh-key.md), authorize. Fingerprint: `SHA256:sWNiQYQU/hxucim9HwxtQb0rpWmAaY3Zq9102OFTPSU` |
| Key authorized but still rejected | Delete all `github-actions-deploy` keys, re-import RSA public key, authorize again |
| `https://aitechpros.ai` shows old site | DNS apex not pointing to `198.54.116.40` — update Namecheap Advanced DNS |
| Empty directory on `198.54.116.40` | Deploy has not succeeded yet — fix SSH key, re-run workflow |
| 404 on `/orchestrateos` | Ensure `.htaccess` is in `public_html` |
| Gate explorer offline | Set `VITE_ORCHESTRATEOS_API_URL` GitHub variable |

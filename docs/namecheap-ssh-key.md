# Authorize GitHub Actions deploy key in cPanel

**Delete** the old `github-actions-deploy` (ed25519) key if present, then import this RSA key.

1. cPanel → **Security** → **SSH Access** → **Manage SSH Keys** → **Import Key**
2. Name: `github-actions-deploy`
3. Paste the **entire** public key line:

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC8K95ENFgLXZ0mJS71g9jz59glS5+iNItulcdKh12AMRIm49RXrDrgRDiPMS+ejHM+nhVC2Sm8r1ohWPyv8f/GipuevqTSeXE4niG5UKEeKoYnblBSuX/zvlO81bdmzNQ+hOoOsJ0uIanZlOXvXYljhyG1FxZGvpptQe9NS/H2e5mZGSBdGLOIaCCdt9ycnoMTjUU2lp+Dt/0oYDGLhLUSL6pcD+jlctZcW9M+6Mfo61tzEwGzDoh17NX+SDEfIMY+DpLBazFUTTDBDUEpYo/NKPCclQ9KGepnGOplnbP/eXur0PZNL5p+ObtwrveCVj0cAlHI374Xk0VqSuif2ADr1jiz5ONqRMG52uXvXZGONJZiwtkuH4N9XL5uYToL7Mv7R6ihPtxjQnrxCFMRiljWua5dfUqNfqlga4m2HScwmdtFBmOyCiFujSiu2hxA8rPqLwdShfOhm9LQpii7kwv+SCRhF7u8rTCiV9g7BgbzwgEb/QD8nn8K7h3xyL+n5ZsLwzMwcqDD26NfVpdFvM4DnkVh/qkVA2ppZgqhwRcOJNa/2z/P310pjimSC6C+tsnTRQjKlKzLFmyyayzzEOarrAflwNhJm6cWBf4ELJs6y92clA7ikkhcZ01HPyh4JgD38Wb95DNXElV/GPNCFRllw4Akf38OTsYmgMRBDpa2aQ== github-actions-aitechpros-rsa
```

4. **Import** → **Manage** → **Authorize**
5. Confirm fingerprint: `SHA256:sWNiQYQU/hxucim9HwxtQb0rpWmAaY3Zq9102OFTPSU`
6. **Enable SSH access** must be ON
7. Re-run **Actions → Deploy Website → Run workflow**

Private key is in GitHub secret `NAMECHEAP_SSH_PRIVATE_KEY`.

## Verify locally

```powershell
ssh -i $env:USERPROFILE\.ssh\aitechpros-deploy-rsa -p 21098 aitevrpo@server97.web-hosting.com "echo ok"
```

Should print `ok`. If not, deauthorize → authorize again in cPanel.

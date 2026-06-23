# One-time: authorize GitHub Actions deploy key in cPanel

1. cPanel → **Security** → **SSH Access** → **Manage SSH Keys**
2. Click **Import Key**
3. Paste this public key (name it `github-actions-deploy`):

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIP+rETSK43ZjNdNNrJcZDnGCxFJU2r7L1uqjX0zOwY+a github-actions-aitechpros-deploy
```

4. Click **Import**, then **Manage** → **Authorize** for that key
5. Confirm fingerprint: `SHA256:U9gANzzZuSjpIcrVr+UQiRT1j8HwO+1woFISz7O3sPQ`
6. Re-run **Actions → Deploy Website → Run workflow**

Private key is stored in GitHub secret `NAMECHEAP_SSH_PRIVATE_KEY`.

## If deploy shows `Permission denied (publickey)`

cPanel may show "Authorized" while the server still rejects the key:

1. **Deauthorize** the key, then **Authorize** again
2. If still failing: **Delete** the key, re-import the public key above, authorize
3. Confirm **Enable SSH access** is ON
4. Re-run the workflow

Local test:

```powershell
ssh -i $env:USERPROFILE\.ssh\aitechpros-deploy -p 21098 aitevrpo@server97.web-hosting.com "echo ok"
```

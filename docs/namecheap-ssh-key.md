# One-time: authorize GitHub Actions deploy key in cPanel

1. cPanel → **Security** → **SSH Access** → **Manage SSH Keys**
2. Click **Import Key**
3. Paste this public key (name it `github-actions-deploy`):

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIP+rETSK43ZjNdNNrJcZDnGCxFJU2r7L1uqjX0zOwY+a github-actions-aitechpros-deploy
```

4. Click **Import**, then **Manage** → **Authorize** for that key
5. Re-run **Actions → Deploy Website → Run workflow**

Private key is stored in GitHub secret `NAMECHEAP_SSH_PRIVATE_KEY`.

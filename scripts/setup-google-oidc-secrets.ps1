# Configure GitHub + Worker secrets for Google SSO on OrchestrateOS.
# Run after creating OAuth client in Google Cloud (AI Tech Pros Inc project).
#
# Usage: .\scripts\setup-google-oidc-secrets.ps1

$ErrorActionPreference = "Stop"

$RedirectUri = "https://orchestrateos.pages.dev/auth/oidc/callback"
$GcpProject = "healthy-matter-453416-t3"

Write-Host ""
Write-Host "OrchestrateOS — Google OIDC secret setup"
Write-Host "========================================"
Write-Host ""
Write-Host "If you have not created the OAuth client yet, open in your browser:"
Write-Host "  Consent screen: https://console.cloud.google.com/auth/overview?project=$GcpProject"
Write-Host "  Create client:  https://console.cloud.google.com/auth/clients/create?project=$GcpProject"
Write-Host ""
Write-Host "OAuth client settings:"
Write-Host "  Type:           Web application"
Write-Host "  Redirect URI:   $RedirectUri"
Write-Host "  JS origin:      https://orchestrateos.pages.dev (recommended)"
Write-Host ""
Write-Host "Consent screen (Testing): add test users (e.g. nevaquit@gmail.com + partner emails)."
Write-Host ""

$clientId = Read-Host "Paste Google OAuth Client ID"
$clientSecret = Read-Host "Paste Google OAuth Client secret" -AsSecureString
$clientSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($clientSecret)
)

if (-not $clientId.Trim() -or -not $clientSecretPlain.Trim()) {
    throw "Client ID and secret are required."
}

Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    $clientId.Trim() | gh secret set OIDC_CLIENT_ID
    $clientSecretPlain.Trim() | gh secret set OIDC_CLIENT_SECRET
    Write-Host ""
    Write-Host "GitHub secrets OIDC_CLIENT_ID and OIDC_CLIENT_SECRET set."
    Write-Host "Triggering Cloudflare Deploy to sync secrets to Worker..."
    gh workflow run "Cloudflare Deploy"
    Write-Host ""
    Write-Host "Done. After deploy (~2 min), verify:"
    Write-Host "  https://orchestrateos-api.nevaquit.workers.dev/api/auth/oidc/config"
    Write-Host "  should return { `"enabled`": true }"
    Write-Host "  https://orchestrateos.pages.dev/login — SSO button visible"
} finally {
    Pop-Location
}

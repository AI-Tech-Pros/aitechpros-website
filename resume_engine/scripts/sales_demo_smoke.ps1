# Pre-demo / CI smoke test for the live OrchestrateOS sales flow.
# Usage: .\resume_engine\scripts\sales_demo_smoke.ps1
param(
    [string]$ApiUrl = "https://orchestrateos-api.nevaquit.workers.dev",
    [string]$SiteUrl = "https://orchestrateos.pages.dev",
    [switch]$SkipPyPI
)

$ErrorActionPreference = "Stop"

function Invoke-Curl([string]$Url) {
    $out = ""
    foreach ($i in 1..3) {
        $prev = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $out = (curl.exe -fsS $Url 2>&1 | Out-String).Trim()
        $code = $LASTEXITCODE
        $ErrorActionPreference = $prev
        if ($code -eq 0) { return $out }
        Start-Sleep -Seconds 2
    }
    throw "curl failed for ${Url}: ${out}"
}

function Assert-Contains([string]$Haystack, [string]$Needle, [string]$Label) {
    if ($Haystack -notmatch [regex]::Escape($Needle)) {
        throw "${Label}: expected content missing: ${Needle}"
    }
    Write-Host "OK  $Label"
}

Write-Host "OrchestrateOS sales demo smoke -> API $ApiUrl"

$health = Invoke-Curl "$ApiUrl/health"
Assert-Contains $health "ok" "GET /health"

$demos = Invoke-Curl "$ApiUrl/demo/runs"
Assert-Contains $demos '"scenario":"partial"' "GET /demo/runs (partial scenario)"
Assert-Contains $demos "d0000002-0000-4000-8000-000000000002" "partial demo run_id"

$partial = Invoke-Curl "$ApiUrl/runs/d0000002-0000-4000-8000-000000000002/resume_blockers"
Assert-Contains $partial '"can_resume":false' "partial run blocked"
Assert-Contains $partial "compensation" "partial compensation gate"

$prod = Invoke-Curl "$ApiUrl/runs/d0000001-0000-4000-8000-000000000001/resume_blockers"
Assert-Contains $prod '"can_resume":false' "prod transient run blocked"
Assert-Contains $prod "prod_resume_ack" "prod acknowledgment gate"

foreach ($path in @("", "/install", "/governance", "/compliance", "/compare")) {
    $ok = $false
    foreach ($i in 1..3) {
        $prev = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $headers = (curl.exe -fsSI "$SiteUrl$path" 2>&1 | Out-String)
        $code = $LASTEXITCODE
        $ErrorActionPreference = $prev
        if ($code -eq 0 -and $headers -match "HTTP/[\d.]+ 200") {
            $ok = $true
            break
        }
        Start-Sleep -Seconds 2
    }
    if (-not $ok) {
        throw "Site ${SiteUrl}${path} did not return 200"
    }
    Write-Host "OK  GET $SiteUrl$path"
}

if (-not $SkipPyPI) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $pypi = (python -m pip index versions resume_engine 2>&1 | Out-String)
    $ErrorActionPreference = $prev
    if ($pypi -notmatch "0\.2\.0") {
        throw "PyPI resume_engine 0.2.0 not found: $pypi"
    }
    Write-Host "OK  PyPI resume_engine 0.2.0"
}

Write-Host ""
Write-Host "Sales demo smoke passed. Open: $SiteUrl/#gates"

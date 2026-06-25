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

function Assert-HttpStatus([string]$Method, [string]$Url, [int]$Expected, [string]$Label, [string]$Body = $null) {
    $args = @("-sS", "-o", "NUL", "-w", "%{http_code}", "-X", $Method, $Url)
    $bodyFile = $null
    if ($Body) {
        $bodyFile = [System.IO.Path]::GetTempFileName()
        [System.IO.File]::WriteAllText($bodyFile, $Body, [System.Text.UTF8Encoding]::new($false))
        $args += @("-H", "Content-Type: application/json", "--data-binary", "@$bodyFile")
    }
    $code = ""
    try {
        foreach ($i in 1..3) {
            $prev = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            $code = (curl.exe @args 2>&1 | Out-String).Trim()
            $ErrorActionPreference = $prev
            if ($code -match "^\d{3}$") { break }
            Start-Sleep -Seconds 2
        }
    } finally {
        if ($bodyFile -and (Test-Path $bodyFile)) { Remove-Item $bodyFile -Force }
    }
    if ([int]$code -ne $Expected) {
        throw "${Label}: expected HTTP ${Expected}, got ${code}"
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

foreach ($path in @("", "/install", "/governance", "/compliance", "/compare", "/login", "/onboarding", "/production")) {
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

# Platform layer (Phase 5a)
Assert-HttpStatus "GET" "$ApiUrl/api/auth/me" 401 "GET /api/auth/me without session -> 401"

$leadEmail = "smoke+$(Get-Date -Format 'yyyyMMddHHmmss')@aitechpros.test"
$leadBody = (@{
    name = "Smoke Test"
    email = $leadEmail
    company = "CI"
    use_case = "sales demo smoke"
} | ConvertTo-Json -Compress)
Assert-HttpStatus "POST" "$ApiUrl/api/leads" 201 "POST /api/leads (test lead)" $leadBody

if (-not $SkipPyPI) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    pip install -e ".[remote,langgraph,crewai]" 2>&1 | Out-Null
    python resume_engine/scripts/framework_smoke.py
    if ($LASTEXITCODE -ne 0) { throw "framework_smoke.py failed" }
    Write-Host "OK  framework quickstarts (langgraph + crewai)"
    $pypi = (python -m pip index versions resume_engine 2>&1 | Out-String)
    $ErrorActionPreference = $prev
    if ($pypi -notmatch "0\.2\.0") {
        throw "PyPI resume_engine 0.2.0 not found: $pypi"
    }
    Write-Host "OK  PyPI resume_engine 0.2.0"
}

Write-Host ""
Write-Host "Sales demo smoke passed. Open: $SiteUrl/#gates"

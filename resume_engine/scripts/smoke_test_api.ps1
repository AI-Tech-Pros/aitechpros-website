# Smoke test OrchestrateOS API (local or remote base URL)
param(
    [string]$BaseUrl = "http://127.0.0.1:8000"
)

$ErrorActionPreference = "Stop"

Write-Host "OrchestrateOS API smoke test -> $BaseUrl"

$health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
Write-Host "health:" ($health | ConvertTo-Json -Compress)

$start = Invoke-RestMethod -Uri "$BaseUrl/start_run" -Method Post `
    -ContentType "application/json" `
    -Body '{"workflow_name":"smoke_test"}'
$runId = $start.run_id
Write-Host "start_run:" ($start | ConvertTo-Json -Compress)

$blockers = Invoke-RestMethod -Uri "$BaseUrl/runs/$runId/resume_blockers" -Method Get
Write-Host "resume_blockers:" ($blockers | ConvertTo-Json -Compress)

$status = Invoke-RestMethod -Uri "$BaseUrl/runs/$runId/status" -Method Get
Write-Host "status:" ($status | ConvertTo-Json -Compress)

Write-Host "Smoke test passed."

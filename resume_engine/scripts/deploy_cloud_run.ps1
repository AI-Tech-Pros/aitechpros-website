# Deploy OrchestrateOS API to Google Cloud Run (requires gcloud CLI + auth)
param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,
    [string]$Region = "us-central1",
    [string]$ServiceName = "orchestrateos-api",
    [string]$Image = "gcr.io/$ProjectId/orchestrateos-api:latest"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

Write-Host "Building image: $Image"
docker build -f (Join-Path $Root "resume_engine/Dockerfile") -t $Image $Root

Write-Host "Pushing to GCR..."
gcloud auth configure-docker --quiet
docker push $Image

Write-Host "Deploying to Cloud Run..."
gcloud run deploy $ServiceName `
    --image $Image `
    --platform managed `
    --region $Region `
    --project $ProjectId `
    --allow-unauthenticated `
    --port 8000 `
    --set-env-vars "LOG_LEVEL=info,CORS_ORIGINS=https://orchestrateos.aitechpros.ai,https://aitechpros.ai"

Write-Host "Done. Map api.orchestrateos.aitechpros.ai to the Cloud Run URL when ready."

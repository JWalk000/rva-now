# Trigger a manual Posh/Eventbrite sync
$ErrorActionPreference = "Stop"
$envFile = Join-Path $PSScriptRoot ".env.sync"

if (-not (Test-Path $envFile)) {
  Write-Host "Missing $envFile - copy from .env.sync.example first." -ForegroundColor Yellow
  exit 1
}

$secret = (Get-Content $envFile | Where-Object { $_ -match '^SYNC_SECRET=' }) -replace '^SYNC_SECRET=', ''
if (-not $secret) {
  Write-Host "SYNC_SECRET not set in .env.sync" -ForegroundColor Yellow
  exit 1
}

$uri = "https://edorsmasowlidwftzqnh.supabase.co/functions/v1/sync-events"
Write-Host "POST $uri"

try {
  $result = Invoke-RestMethod -Uri $uri -Method POST -Headers @{ "x-sync-secret" = $secret } -ContentType "application/json" -Body "{}"
  $result | ConvertTo-Json -Depth 6
  Write-Host ""
  Write-Host "Done. Check sync_runs table in Supabase." -ForegroundColor Green
} catch {
  Write-Host "Sync failed." -ForegroundColor Red
  Write-Host $_.Exception.Message
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  exit 1
}

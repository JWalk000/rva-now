# Generates schedule-sync-twice-daily.sql with your SYNC_SECRET from .env.sync
# Paste the output into Supabase SQL Editor, or pipe to clipboard.

$ErrorActionPreference = "Stop"
$envFile = Join-Path $PSScriptRoot ".env.sync"
if (-not (Test-Path $envFile)) {
  Write-Host "Run setup-ops-secrets.ps1 first (or create .env.sync)." -ForegroundColor Yellow
  exit 1
}

$syncSecret = (Get-Content $envFile | Where-Object { $_ -match '^SYNC_SECRET=' }) -replace '^SYNC_SECRET=', ''
if ([string]::IsNullOrWhiteSpace($syncSecret)) {
  Write-Host "SYNC_SECRET missing in .env.sync" -ForegroundColor Yellow
  exit 1
}

$template = Get-Content (Join-Path $PSScriptRoot "schedule-sync-twice-daily.sql") -Raw
$sql = $template -replace 'YOUR_SYNC_SECRET', $syncSecret
$outPath = Join-Path $PSScriptRoot "schedule-sync-ready.sql"
$sql | Set-Content $outPath -Encoding UTF8

Write-Host "Wrote $outPath"
Write-Host "Open Supabase SQL Editor and run that file."

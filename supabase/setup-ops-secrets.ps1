# Upload sync/admin secrets to Supabase Edge Functions
# Usage (from repo root):
#   1. Copy supabase/.env.sync.example -> supabase/.env.sync
#   2. Fill in SYNC_SECRET, ADMIN_SECRET, POSH_EVENT_URLS
#   3. .\supabase\setup-ops-secrets.ps1

$ErrorActionPreference = "Stop"
$projectRef = "edorsmasowlidwftzqnh"
$envFile = Join-Path $PSScriptRoot ".env.sync"

if (-not (Test-Path $envFile)) {
  Write-Host "Create $envFile from .env.sync.example first." -ForegroundColor Yellow
  exit 1
}

$secrets = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $pair = $_ -split '=', 2
  if ($pair.Length -eq 2) { $secrets[$pair[0].Trim()] = $pair[1].Trim() }
}

if (-not $secrets['SYNC_SECRET'] -or $secrets['SYNC_SECRET'] -match 'generate-a-long') {
  Write-Host "Set a real SYNC_SECRET in .env.sync before running." -ForegroundColor Yellow
  exit 1
}

Write-Host "Setting Supabase secrets for project $projectRef ..."
foreach ($key in $secrets.Keys) {
  $value = $secrets[$key]
  if ([string]::IsNullOrWhiteSpace($value)) { continue }
  npx supabase secrets set "${key}=${value}" --project-ref $projectRef
}

Write-Host "Done. Deploy functions if needed:"
Write-Host "  npx supabase functions deploy sync-events --no-verify-jwt --project-ref $projectRef"

# Run automatable setup steps in sensible order (repo root: .\supabase\run-setup.ps1)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$projectRef = "edorsmasowlidwftzqnh"

Set-Location $root

Write-Host "`n=== 1/5 Sync secrets ===" -ForegroundColor Cyan
& "$PSScriptRoot\setup-ops-secrets.ps1"

Write-Host "`n=== 2/5 Auth redirect URLs ===" -ForegroundColor Cyan
npx supabase config push --project-ref $projectRef --yes

Write-Host "`n=== 3/5 Cron jobs (twice-daily sync) ===" -ForegroundColor Cyan
npx supabase db query --linked -f "$PSScriptRoot\schedule-sync-ready.sql"

Write-Host "`n=== 4/5 Stripe secrets ===" -ForegroundColor Cyan
& "$PSScriptRoot\scripts\set-stripe-secrets.ps1"

Write-Host "`n=== 5/5 Deploy edge functions ===" -ForegroundColor Cyan
$functions = @(
  "sync-events",
  "archive-stale-events",
  "approve-submission",
  "send-digest",
  "create-connect-link",
  "create-ticket-checkout",
  "wallet-pass",
  "stripe-webhook",
  "create-checkout"
)
foreach ($fn in $functions) {
  Write-Host "  deploy $fn ..."
  npx supabase functions deploy $fn --no-verify-jwt --project-ref $projectRef
}

Write-Host "`n=== Manual sync test ===" -ForegroundColor Cyan
& "$PSScriptRoot\test-sync.ps1"

Write-Host "`n=== Setup complete ===" -ForegroundColor Green
Write-Host "Next:"
Write-Host "  1. Open apps/mobile/connect.html and scan QR (Expo Go)"
Write-Host "  2. Add RESEND_API_KEY to supabase/.env.sync if you want ticket/digest email"
Write-Host "  3. Enable Stripe Connect in Stripe Dashboard"
Write-Host "  4. Moderate listings at apps/admin/index.html"

# Deploy Phase 4 ticket + Stripe edge functions
$ErrorActionPreference = "Stop"
$projectRef = "edorsmasowlidwftzqnh"

$functions = @(
  "create-connect-link",
  "create-ticket-checkout",
  "wallet-pass",
  "stripe-webhook",
  "create-checkout"
)

foreach ($fn in $functions) {
  Write-Host "Deploying $fn ..."
  npx supabase functions deploy $fn --no-verify-jwt --project-ref $projectRef
}

Write-Host "Done." -ForegroundColor Green

# Run from repo root after creating supabase/.env.stripe
# Requires: npx supabase login && npx supabase link --project-ref edorsmasowlidwftzqnh

$envFile = Join-Path (Join-Path $PSScriptRoot "..") ".env.stripe"
if (-not (Test-Path $envFile)) {
  Write-Error "Create supabase/.env.stripe from .env.stripe.example first"
  exit 1
}

Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.+)$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim()
    if ($name -and $value -and $value -notmatch 'paste_') {
      Write-Host "Setting $name..."
      npx supabase secrets set "${name}=${value}" --project-ref edorsmasowlidwftzqnh
    } elseif ($value -match 'paste_') {
      Write-Host "Skipping $name (still has placeholder value)"
    }
  }
}

Write-Host "Done. Deploy functions:"
Write-Host "  npx supabase functions deploy create-checkout --no-verify-jwt"
Write-Host "  npx supabase functions deploy stripe-webhook --no-verify-jwt"

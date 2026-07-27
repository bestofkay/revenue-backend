# Starts infra + migrations + seed for local Revenue platform development.
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File scripts/start-dev.ps1
# Then start apps separately (or let the Cursor start-project skill do it):
#   pnpm --filter @revenue/api dev
#   pnpm --filter @revenue/web dev
#   pnpm --filter @revenue/pay dev

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "==> Repo: $Root" -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
  if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env"
    Write-Host "==> Created .env from .env.example" -ForegroundColor Yellow
  } else {
    throw ".env missing and .env.example not found"
  }
}

Write-Host "==> Starting Docker services (mysql redis rabbitmq mailhog)..." -ForegroundColor Cyan
docker compose -f infra/docker/docker-compose.yml up -d mysql redis rabbitmq mailhog

Write-Host "==> Waiting for MySQL health..." -ForegroundColor Cyan
$ready = $false
for ($i = 1; $i -le 40; $i++) {
  try {
    $status = docker inspect --format="{{.State.Health.Status}}" revenue-mysql 2>$null
    if ($status -eq "healthy") {
      $ready = $true
      break
    }
    # Container may still be starting after a port remap recreate
    $running = docker inspect --format="{{.State.Running}}" revenue-mysql 2>$null
    if ($running -eq "true" -and $status -eq "") {
      # no health yet
    }
  } catch {}
  Start-Sleep -Seconds 3
}
if (-not $ready) {
  docker ps -a --filter "name=revenue-mysql" --format "{{.Names}} {{.Status}} {{.Ports}}"
  throw "MySQL did not become healthy in time. Is Docker Desktop running? Compose maps MySQL to host 3316 — DATABASE_URL should use :3316."
}

Write-Host "==> pnpm install..." -ForegroundColor Cyan
pnpm install

Write-Host "==> Building shared packages..." -ForegroundColor Cyan
pnpm --filter @revenue/shared build
pnpm --filter @revenue/config build

Write-Host "==> Prisma generate + migrate deploy + seed..." -ForegroundColor Cyan
# Ensure Prisma (run from packages/database) sees DATABASE_URL
if (-not $env:DATABASE_URL) {
  $dbLine = Get-Content "$Root\.env" | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
  if ($dbLine) {
    $env:DATABASE_URL = ($dbLine -replace '^\s*DATABASE_URL\s*=\s*', '').Trim().Trim('"').Trim("'")
  }
}
# Sync package-local .env for Prisma CLI
@"
DATABASE_URL=$($env:DATABASE_URL)
"@ | Set-Content -Path "$Root\packages\database\.env" -Encoding utf8

pnpm db:generate
pnpm --filter @revenue/database exec prisma migrate deploy
pnpm db:seed

Write-Host ""
Write-Host "Infra + DB ready." -ForegroundColor Green
Write-Host "Start apps with:" -ForegroundColor Green
Write-Host "  pnpm --filter @revenue/api dev"
Write-Host "  pnpm --filter @revenue/web dev"
Write-Host "  pnpm --filter @revenue/pay dev"
Write-Host ""
Write-Host "Admin  http://localhost:3000"
Write-Host "Pay    http://localhost:3001"
Write-Host "API    http://localhost:4000/docs"

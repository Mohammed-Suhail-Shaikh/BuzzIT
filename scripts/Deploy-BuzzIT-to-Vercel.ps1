# BuzzIT — deploy API + web to Vercel (free tier).
# Run in PowerShell:  cd to BuzzIT repo, then:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\scripts\Deploy-BuzzIT-to-Vercel.ps1

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $repoRoot

Write-Host ''
Write-Host '========== BuzzIT -> Vercel ==========' -ForegroundColor Cyan
Write-Host 'This script deploys the API first, then the website.' -ForegroundColor Gray
Write-Host ''

# --- Vercel login (whoami writes to stderr when not logged in; must not throw while EAP is Stop) ---
$npx = 'npx'
$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
& $npx vercel@latest whoami 1>$null 2>$null
$whoamiOk = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEap

if (-not $whoamiOk) {
  Write-Host 'No Vercel login found on this computer. You need a free account: https://vercel.com/signup' -ForegroundColor Yellow
  Write-Host 'Press Enter to sign in with the Vercel CLI. Your browser may open.' -ForegroundColor Yellow
  Read-Host
  $ErrorActionPreference = 'Continue'
  & $npx vercel@latest login
  $ErrorActionPreference = 'Stop'
  if ($LASTEXITCODE -ne 0) {
    throw 'vercel login did not finish successfully. Run: npx vercel@latest login'
  }
}

# --- Secrets (same values you use locally) ---
Write-Host ''
Write-Host 'Google OAuth Client ID, looks like xxx.apps.googleusercontent.com:' -ForegroundColor Green
$googleClientId = Read-Host
if ([string]::IsNullOrWhiteSpace($googleClientId)) {
  throw 'GOOGLE_CLIENT_ID is required.'
}

Write-Host ''
Write-Host 'JWT secret (any random phrase, at least 16 characters). Press Enter to auto-generate one:' -ForegroundColor Green
$jwtSecret = Read-Host
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
  $jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
  Write-Host 'Using generated JWT_SECRET. Save it if you want the same one later.' -ForegroundColor DarkGray
}

if ($jwtSecret.Length -lt 16) {
  throw 'JWT_SECRET must be at least 16 characters.'
}

# --- API ---
Write-Host ''
Write-Host 'Deploying API from the api folder...' -ForegroundColor Cyan
$apiLog = Join-Path $env:TEMP 'buzzit-vercel-api.log'
& $npx vercel@latest --cwd (Join-Path $repoRoot 'api') deploy --prod --yes `
  -e "GOOGLE_CLIENT_ID=$googleClientId" `
  -e "JWT_SECRET=$jwtSecret" `
  -e 'WEB_ORIGIN=*' 2>&1 | Tee-Object -FilePath $apiLog

$apiText = Get-Content -Raw $apiLog
$apiUrl = $null
if ($apiText -match 'https://[a-zA-Z0-9.-]+\.vercel\.app') {
  $apiMatches = [regex]::Matches($apiText, 'https://[a-zA-Z0-9.-]+\.vercel\.app')
  $apiUrl = $apiMatches[$apiMatches.Count - 1].Value.TrimEnd('.')
}

if ([string]::IsNullOrWhiteSpace($apiUrl)) {
  Write-Host ''
  Write-Host 'Could not read the API URL from the log. Open the log file:' -ForegroundColor Yellow
  Write-Host "  $apiLog" -ForegroundColor Yellow
  $apiUrl = Read-Host 'Paste your API production URL with no trailing slash, for example https://buzzit-api.vercel.app'
}

$apiUrl = $apiUrl.TrimEnd('/')
Write-Host ''
Write-Host "API URL: $apiUrl" -ForegroundColor Green

# --- Web ---
Write-Host ''
Write-Host 'Deploying website from the web folder...' -ForegroundColor Cyan
$webLog = Join-Path $env:TEMP 'buzzit-vercel-web.log'
& $npx vercel@latest --cwd (Join-Path $repoRoot 'web') deploy --prod --yes `
  -b "VITE_GOOGLE_CLIENT_ID=$googleClientId" `
  -b "VITE_API_BASE_URL=$apiUrl" 2>&1 | Tee-Object -FilePath $webLog

$webText = Get-Content -Raw $webLog
$webUrl = $null
if ($webText -match 'https://[a-zA-Z0-9.-]+\.vercel\.app') {
  $webMatches = [regex]::Matches($webText, 'https://[a-zA-Z0-9.-]+\.vercel\.app')
  $webUrl = $webMatches[$webMatches.Count - 1].Value.TrimEnd('.')
}

Write-Host ''
Write-Host '========== Done ==========' -ForegroundColor Cyan
if (-not [string]::IsNullOrWhiteSpace($webUrl)) {
  Write-Host "Website: $webUrl" -ForegroundColor Green
}
Write-Host "API:     $apiUrl" -ForegroundColor Green
Write-Host ''
Write-Host 'Last step (Google):' -ForegroundColor Yellow
Write-Host '  In Google Cloud Console, open APIs and Services, then Credentials, then your OAuth client.' -ForegroundColor Gray
Write-Host '  Add your site URL to Authorized JavaScript origins.' -ForegroundColor Gray
if (-not [string]::IsNullOrWhiteSpace($webUrl)) {
  Write-Host "    $webUrl" -ForegroundColor White
}
Write-Host '  Also add http://localhost:5173 if you develop locally.' -ForegroundColor Gray
Write-Host ''

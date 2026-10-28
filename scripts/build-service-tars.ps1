param(
  [string]$OutputDir = ""
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $OutputDir) { $OutputDir = Join-Path $root "deploy" }
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

function New-Stage([string]$name) {
  $stage = Join-Path $env:TEMP "organograma-$name-build"
  if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $stage | Out-Null
  return $stage
}

function Copy-Contents([string]$source, [string]$destination) {
  Get-ChildItem $source -Force | ForEach-Object {
    Copy-Item $_.FullName $destination -Recurse -Force
  }
}

function Remove-IfExists([string]$target) {
  if (Test-Path $target) { Remove-Item $target -Recurse -Force }
}

function Build-Tar([string]$stage, [string]$outputName) {
  $tar = Join-Path $OutputDir $outputName
  if (Test-Path $tar) { Remove-Item $tar -Force }
  Push-Location $stage
  try {
    tar -cf $tar .
  } finally {
    Pop-Location
  }
  $size = [math]::Round((Get-Item $tar).Length / 1MB, 2)
  Write-Output "Criado: $tar ($size MB)"
}

$backendStage = New-Stage "backend"
Copy-Contents (Join-Path $root "backend") $backendStage
Remove-IfExists (Join-Path $backendStage ".env")
Get-ChildItem $backendStage -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue |
  Remove-Item -Recurse -Force
Build-Tar $backendStage "organograma-backend.tar"

$frontendStage = New-Stage "frontend"
Copy-Contents (Join-Path $root "frontend") $frontendStage
@("node_modules", "dist", ".vite", ".env", ".env.local", ".env.development", ".env.production") | ForEach-Object {
  Remove-IfExists (Join-Path $frontendStage $_)
}
Build-Tar $frontendStage "organograma-frontend.tar"

Write-Output ""
Write-Output "Use cada TAR como contexto de build no Portainer (Dockerfile na raiz)."

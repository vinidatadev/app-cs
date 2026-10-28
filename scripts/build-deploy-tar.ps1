param(
  [string]$OutputDir = ""
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $OutputDir) { $OutputDir = Join-Path $root "deploy" }
$stageRoot = Join-Path $env:TEMP "organograma-deploy-stage"
$stage = Join-Path $stageRoot "organograma"

if (Test-Path $stageRoot) { Remove-Item $stageRoot -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$files = @(
  ".env.example",
  ".gitignore",
  "docker-compose.yml",
  "deploy.sh",
  "README.md",
  "COMECE-AQUI.md",
  "DEPLOY-COMPLETO.md",
  "TUTORIAL-IMPLANTACAO.md"
)
foreach ($file in $files) {
  $source = Join-Path $root $file
  if (Test-Path $source) { Copy-Item $source $stage }
}

Copy-Item (Join-Path $root "backend") (Join-Path $stage "backend") -Recurse
@(".env", "__pycache__", ".pytest_cache", ".mypy_cache") | ForEach-Object {
  $target = Join-Path $stage "backend/$_"
  if (Test-Path $target) { Remove-Item $target -Recurse -Force }
}
Get-ChildItem (Join-Path $stage "backend") -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue |
  Remove-Item -Recurse -Force

Copy-Item (Join-Path $root "frontend") (Join-Path $stage "frontend") -Recurse
@("node_modules", "dist", ".vite", ".env", ".env.local", ".env.development", ".env.production") | ForEach-Object {
  $target = Join-Path $stage "frontend/$_"
  if (Test-Path $target) { Remove-Item $target -Recurse -Force }
}

New-Item -ItemType Directory -Force -Path (Join-Path $stage "database") | Out-Null
Copy-Item (Join-Path $root "database/init") (Join-Path $stage "database/init") -Recurse

New-Item -ItemType Directory -Force -Path (Join-Path $stage "docs") | Out-Null
Copy-Item (Join-Path $root "docs/*") (Join-Path $stage "docs") -Recurse
$legacyDocs = Join-Path $stage "docs/_legacy"
if (Test-Path $legacyDocs) { Remove-Item $legacyDocs -Recurse -Force }

Copy-Item (Join-Path $root "scripts") (Join-Path $stage "scripts") -Recurse
New-Item -ItemType Directory -Force -Path (Join-Path $stage "deploy") | Out-Null
Copy-Item (Join-Path $root "deploy/portainer-stack.yml") (Join-Path $stage "deploy") -Force
Copy-Item (Join-Path $root "deploy/build-images.sh") (Join-Path $stage "deploy") -Force

$tar = Join-Path $OutputDir "organograma-deploy.tar"
$tarGz = Join-Path $OutputDir "organograma-deploy.tar.gz"
if (Test-Path $tar) { Remove-Item $tar -Force }
if (Test-Path $tarGz) { Remove-Item $tarGz -Force }

Push-Location $stageRoot
try {
  tar -cf $tar "organograma"
  tar -czf $tarGz "organograma"
} finally {
  Pop-Location
}

$tarSize = [math]::Round((Get-Item $tar).Length / 1MB, 2)
$tarGzSize = [math]::Round((Get-Item $tarGz).Length / 1MB, 2)
Write-Output "Criado: $tar ($tarSize MB)"
Write-Output "Criado: $tarGz ($tarGzSize MB)"
Write-Output "Conteúdo extraído no servidor: ./organograma"

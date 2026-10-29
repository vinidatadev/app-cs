# Script PowerShell para gerar arquivos TAR para deploy no Portainer
# Uso: .\scripts\gerar-tars.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Gerando arquivos TAR para Portainer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está na raiz do projeto
if (-not (Test-Path "organograma\backend")) {
    Write-Host "ERRO: Execute este script na raiz do projeto!" -ForegroundColor Red
    Write-Host "Estrutura esperada: organograma\backend e organograma\frontend" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Criar diretório de output
$outputDir = "organograma\deploy\tars"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Gerar TAR do backend
Write-Host "[1/2] Gerando backend-code.tar.gz..." -ForegroundColor Yellow
tar -czf "$outputDir\backend-code.tar.gz" -C "organograma\backend" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao gerar TAR do backend" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host "✓ Backend TAR criado com sucesso" -ForegroundColor Green

# Gerar TAR do frontend
Write-Host "[2/2] Gerando frontend-code.tar.gz..." -ForegroundColor Yellow
tar -czf "$outputDir\frontend-code.tar.gz" -C "organograma\frontend" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao gerar TAR do frontend" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host "✓ Frontend TAR criado com sucesso" -ForegroundColor Green

# Exibir informações dos arquivos gerados
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Arquivos gerados com sucesso!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Localização: $outputDir" -ForegroundColor White
Get-ChildItem -Path $outputDir -Filter "*.tar.gz" | ForEach-Object {
    $sizeKB = [math]::Round($_.Length / 1KB, 2)
    $sizeMB = [math]::Round($_.Length / 1MB, 2)
    if ($sizeMB -gt 1) {
        Write-Host "  - $($_.Name) ($sizeMB MB)" -ForegroundColor White
    } else {
        Write-Host "  - $($_.Name) ($sizeKB KB)" -ForegroundColor White
    }
}
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Acesse o Portainer" -ForegroundColor White
Write-Host "2. Vá em Images > Build a new image" -ForegroundColor White
Write-Host "3. Faça upload de cada TAR" -ForegroundColor White
Write-Host "4. Nome backend: organograma-backend:latest" -ForegroundColor White
Write-Host "5. Nome frontend: organograma-frontend:latest" -ForegroundColor White
Write-Host ""
Write-Host "Consulte docs\DEPLOY-PORTAINER.md para mais detalhes" -ForegroundColor Cyan
Write-Host ""
Read-Host "Pressione Enter para sair"

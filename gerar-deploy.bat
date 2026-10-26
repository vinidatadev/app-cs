@echo off
echo ========================================
echo Gerando arquivo de deploy para Portainer
echo ========================================
echo.

echo [1/2] Verificando estrutura...
if not exist "frontend\" (
    echo ERRO: Pasta frontend nao encontrada!
    pause
    exit /b 1
)

if not exist "backend\" (
    echo ERRO: Pasta backend nao encontrada!
    pause
    exit /b 1
)

if not exist "database\" (
    echo ERRO: Pasta database nao encontrada!
    pause
    exit /b 1
)

echo Estrutura OK!
echo.

echo [2/2] Criando arquivo TAR...
tar -cf organograma-deploy.tar ^
  docker-compose.yml ^
  .env ^
  frontend ^
  backend ^
  database ^
  README.md ^
  DEPLOY-COMPLETO.md

if errorlevel 1 (
    echo ERRO ao criar TAR!
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCESSO!
echo ========================================
echo.
echo Arquivo criado: organograma-deploy.tar
echo Tamanho:
dir organograma-deploy.tar | findstr organograma-deploy
echo.
echo PROXIMO PASSO:
echo 1. Teste localmente: docker-compose up -d
echo 2. Se funcionar, faca upload do TAR no Portainer
echo 3. Veja instrucoes em: DEPLOY-COMPLETO.md
echo.
pause

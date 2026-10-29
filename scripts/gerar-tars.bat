@echo off
REM Script para gerar arquivos TAR para deploy no Portainer
REM Uso: Execute este script na raiz do projeto

echo ========================================
echo Gerando arquivos TAR para Portainer
echo ========================================
echo.

REM Verificar se está na raiz do projeto
if not exist "organograma\backend" (
    echo ERRO: Execute este script na raiz do projeto!
    echo Estrutura esperada: organograma\backend e organograma\frontend
    pause
    exit /b 1
)

REM Criar diretório de output
if not exist "organograma\deploy\tars" mkdir "organograma\deploy\tars"

REM Gerar TAR do backend
echo [1/2] Gerando backend-code.tar.gz...
tar -czf organograma\deploy\tars\backend-code.tar.gz -C organograma\backend .
if %errorlevel% neq 0 (
    echo ERRO: Falha ao gerar TAR do backend
    pause
    exit /b 1
)
echo ✓ Backend TAR criado com sucesso

REM Gerar TAR do frontend
echo [2/2] Gerando frontend-code.tar.gz...
tar -czf organograma\deploy\tars\frontend-code.tar.gz -C organograma\frontend .
if %errorlevel% neq 0 (
    echo ERRO: Falha ao gerar TAR do frontend
    pause
    exit /b 1
)
echo ✓ Frontend TAR criado com sucesso

echo.
echo ========================================
echo Arquivos gerados com sucesso!
echo ========================================
echo.
echo Localização: organograma\deploy\tars\
echo - backend-code.tar.gz
echo - frontend-code.tar.gz
echo.
echo Próximos passos:
echo 1. Acesse o Portainer
echo 2. Vá em Images ^> Build a new image
echo 3. Faça upload de cada TAR
echo 4. Nome backend: organograma-backend:latest
echo 5. Nome frontend: organograma-frontend:latest
echo.
echo Consulte docs\DEPLOY-PORTAINER.md para mais detalhes
echo.
pause

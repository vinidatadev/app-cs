@echo off
echo ================================
echo Build da Imagem Docker - Organograma
echo ================================
echo.

echo [1/3] Fazendo build da aplicacao...
call npm run build
if errorlevel 1 (
    echo ERRO no build!
    pause
    exit /b 1
)

echo.
echo [2/3] Criando imagem Docker...
docker build -t organograma:latest .
if errorlevel 1 (
    echo ERRO ao criar imagem Docker!
    echo Certifique-se que o Docker Desktop esta rodando.
    pause
    exit /b 1
)

echo.
echo [3/3] Exportando imagem para arquivo .tar...
docker save organograma:latest -o organograma-imagem.tar
if errorlevel 1 (
    echo ERRO ao exportar imagem!
    pause
    exit /b 1
)

echo.
echo ================================
echo SUCESSO!
echo ================================
echo.
echo Arquivo criado: organograma-imagem.tar
echo.
echo PROXIMO PASSO:
echo 1. No Portainer, va em: Images ^> Import
echo 2. Faca upload do arquivo: organograma-imagem.tar
echo 3. Depois va em: Containers ^> Add Container
echo 4. Use a imagem: organograma:latest
echo 5. Mapeie a porta: 3000:80
echo.
pause

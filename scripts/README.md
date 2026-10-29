# Scripts de Deploy

Esta pasta contém scripts auxiliares para facilitar o processo de deploy da aplicação.

## Scripts Disponíveis

### `gerar-tars.bat` (Windows CMD)

Script em Batch para Windows que gera os arquivos TAR necessários para deploy no Portainer.

**Uso:**
```cmd
cd C:\caminho\para\projeto
scripts\gerar-tars.bat
```

### `gerar-tars.ps1` (PowerShell)

Script em PowerShell com saída colorida e informações detalhadas dos arquivos gerados.

**Uso:**
```powershell
cd C:\caminho\para\projeto
.\scripts\gerar-tars.ps1
```

Se encontrar erro de execução no PowerShell, execute antes:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## O que os scripts fazem

1. Verificam se estão sendo executados na raiz do projeto
2. Criam o diretório `organograma/deploy/tars/` se não existir
3. Geram `backend-code.tar.gz` com todo o código do backend
4. Geram `frontend-code.tar.gz` com todo o código do frontend
5. Exibem informações sobre os arquivos gerados

## Arquivos Gerados

Os arquivos TAR são salvos em:
```
organograma/deploy/tars/
├── backend-code.tar.gz
└── frontend-code.tar.gz
```

## Quando Usar

Execute estes scripts sempre que:
- Fizer alterações no código
- Atualizar dependências
- Modificar arquivos de configuração
- Preparar para deploy ou atualização no Portainer

## Próximos Passos

Após gerar os TARs, siga o guia completo em:
`docs/DEPLOY-PORTAINER.md`

Resumo rápido:
1. Acesse o Portainer
2. Vá em **Images** > **Build a new image**
3. Faça upload do `backend-code.tar.gz`
   - Nome: `organograma-backend:latest`
4. Faça upload do `frontend-code.tar.gz`
   - Nome: `organograma-frontend:latest`
5. Deploy ou atualize a stack usando `deploy/portainer-stack.yml`

## Alternativa Manual

Se preferir gerar os TARs manualmente:

```bash
# Backend
tar -czf backend-code.tar.gz -C organograma/backend .

# Frontend
tar -czf frontend-code.tar.gz -C organograma/frontend .
```

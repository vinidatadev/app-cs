# 🧹 Limpeza de Arquivos - O que pode ser deletado

## ⚠️ IMPORTANTE

**Execute esta limpeza APENAS APÓS**:
1. ✅ Testar localmente (`docker-compose up -d`)
2. ✅ Verificar que tudo funciona
3. ✅ Fazer deploy no Portainer com sucesso

---

## 🗑️ Arquivos SEGUROS para deletar

### ZIPs e TARs antigos (sobras de testes):
```
organograma-build.zip
organograma-dist.zip
organograma-portainer.tar
organograma-portainer.zip
organograma.tar
```

**Como deletar**:
```bash
cd organograma
del organograma-*.zip organograma*.tar
```

---

### Documentação antiga (substituída pela nova em `docs/`):
```
DEPLOY_PORTAINER.md          → Agora é: docs/06-DEPLOY-PORTAINER.md
DEPLOY_MANUAL_PORTAINER.md   → Agora é: docs/06-DEPLOY-PORTAINER.md
INSTRUCOES_PORTAINER.txt     → Agora é: DEPLOY-COMPLETO.md
```

**Como deletar**:
```bash
del DEPLOY_PORTAINER.md DEPLOY_MANUAL_PORTAINER.md INSTRUCOES_PORTAINER.txt
```

---

### Scripts antigos:
```
build-imagem.bat             → Não usado mais (usamos docker-compose)
docker-build.sh              → Não usado mais
```

**Como deletar**:
```bash
del build-imagem.bat docker-build.sh
```

---

### Configuração Vercel (não usa mais):
```
vercel.json                  → Não fazemos deploy na Vercel
```

**Como deletar**:
```bash
del vercel.json
```

---

### Pastas que podem ser limpas:
```
dist/                        → Build antigo (agora está em frontend/dist)
node_modules/                → Dependências (agora está em frontend/node_modules)
```

**Como deletar**:
```bash
rmdir /s /q dist
rmdir /s /q node_modules
```

⚠️ **Cuidado**: Se rodar `npm install` na raiz, node_modules volta.  
Sempre rode dentro de `frontend/`:
```bash
cd frontend
npm install
```

---

## ❌ NÃO DELETE (São importantes!)

### Essenciais para funcionamento:
```
✅ .env                      ← Variáveis de ambiente
✅ .env.example              ← Template para novos deploys
✅ docker-compose.yml        ← Orquestração dos serviços
✅ gerar-deploy.bat          ← Script para criar TAR de deploy
✅ .gitignore                ← Git config
```

### Documentação:
```
✅ README.md                 ← Guia principal
✅ COMECE-AQUI.md            ← Quick start
✅ O-QUE-FOI-FEITO.md        ← Resumo das mudanças
✅ DEPLOY-COMPLETO.md        ← Guia de deploy
✅ LIMPEZA-ARQUIVOS.md       ← Este arquivo
✅ docs/                     ← Toda a pasta
```

### Código do projeto:
```
✅ frontend/                 ← Aplicação React
✅ backend/                  ← API Python
✅ database/                 ← Scripts SQL
✅ .git/                     ← Histórico Git
```

---

## 📋 Script Automático de Limpeza

Crie este arquivo `limpar.bat`:

```batch
@echo off
echo ========================================
echo Limpeza de Arquivos Antigos
echo ========================================
echo.

echo ⚠️  AVISO: Isso vai deletar arquivos antigos!
echo.
pause

echo Deletando ZIPs e TARs antigos...
del /q organograma-build.zip 2>nul
del /q organograma-dist.zip 2>nul
del /q organograma-portainer.tar 2>nul
del /q organograma-portainer.zip 2>nul
del /q organograma.tar 2>nul

echo Deletando documentação antiga...
del /q DEPLOY_PORTAINER.md 2>nul
del /q DEPLOY_MANUAL_PORTAINER.md 2>nul
del /q INSTRUCOES_PORTAINER.txt 2>nul

echo Deletando scripts antigos...
del /q build-imagem.bat 2>nul
del /q docker-build.sh 2>nul

echo Deletando config Vercel...
del /q vercel.json 2>nul

echo.
echo ✅ Limpeza concluída!
echo.
echo Arquivos deletados:
echo - ZIPs e TARs de teste
echo - Documentação antiga
echo - Scripts não usados
echo - vercel.json
echo.
echo ✅ Arquivos importantes mantidos:
echo - .env
echo - docker-compose.yml
echo - frontend/, backend/, database/
echo - docs/
echo - README.md e guias
echo.
pause
```

**Para executar**:
```bash
limpar.bat
```

---

## 🔍 Verificação Após Limpeza

Execute para garantir que tudo essencial está lá:

```bash
# Windows
dir /B | findstr /V ".git node_modules dist"

# Deve listar:
# - frontend/
# - backend/
# - database/
# - docs/
# - docker-compose.yml
# - .env
# - README.md
# - etc
```

---

## 📊 Comparação - Antes e Depois

### ANTES da limpeza (~200 arquivos):
```
organograma/
├── organograma-build.zip
├── organograma-dist.zip
├── organograma-portainer.tar
├── organograma-portainer.zip
├── organograma.tar
├── DEPLOY_PORTAINER.md
├── DEPLOY_MANUAL_PORTAINER.md
├── INSTRUCOES_PORTAINER.txt
├── build-imagem.bat
├── docker-build.sh
├── vercel.json
├── dist/
├── node_modules/
└── ... (resto)
```

### DEPOIS da limpeza (~50 arquivos essenciais):
```
organograma/
├── frontend/
├── backend/
├── database/
├── docs/
├── docker-compose.yml
├── .env
├── .env.example
├── gerar-deploy.bat
├── README.md
├── COMECE-AQUI.md
├── O-QUE-FOI-FEITO.md
├── DEPLOY-COMPLETO.md
└── LIMPEZA-ARQUIVOS.md
```

**Mais limpo, organizado e fácil de entender! ✨**

---

## ✅ Checklist Final

Após limpeza, verifique:

- [ ] `docker-compose up -d` funciona
- [ ] Frontend acessível em http://localhost:3000
- [ ] Backend acessível em http://localhost:8000/docs
- [ ] Pasta `frontend/` intacta
- [ ] Pasta `backend/` intacta
- [ ] Pasta `database/` intacta
- [ ] Pasta `docs/` intacta
- [ ] Arquivo `.env` presente
- [ ] Arquivo `docker-compose.yml` presente

Se tudo ✅, a limpeza foi um sucesso!

---

## 💾 Backup (Recomendado)

Antes de deletar, faça um backup:

```bash
# Criar backup de segurança
tar -czf backup-pre-limpeza.tar.gz .

# Se der problema, restaurar:
tar -xzf backup-pre-limpeza.tar.gz
```

---

## 🎯 Resumo

**Delete com segurança**:
- ✅ ZIPs e TARs de teste
- ✅ Documentação antiga (substituída)
- ✅ Scripts não usados
- ✅ vercel.json
- ✅ dist/ e node_modules/ da raiz

**NUNCA delete**:
- ❌ frontend/, backend/, database/
- ❌ docs/
- ❌ .env, docker-compose.yml
- ❌ README.md e guias principais

---

**Dúvidas? Consulte COMECE-AQUI.md ou README.md**

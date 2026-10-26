# 👋 COMECE AQUI

## Oi! Este é o seu guia rápido para começar

---

## 🎯 O que é este projeto?

Sistema de **Organograma Corporativo** completo com:
- Frontend React (interface)
- Backend Python (API)
- Banco PostgreSQL (dados)

Tudo roda em **containers Docker** no servidor da empresa.

---

## ⚡ Quick Start - Testar Agora

```bash
# 1. Entrar na pasta
cd organograma

# 2. Subir tudo
docker-compose up -d

# 3. Aguardar ~2 minutos

# 4. Acessar
# Frontend: http://localhost:3000
# API: http://localhost:8000/docs
```

**Login**: `admin@empresa.com` / `admin123`

---

## 📚 Documentação - O que ler?

### Se você quer:

**"Só testar rapidinho"**  
→ Leia: **README.md** (5 min)

**"Entender o que mudou"**  
→ Leia: **O-QUE-FOI-FEITO.md** (10 min)

**"Fazer deploy no servidor"**  
→ Leia: **DEPLOY-COMPLETO.md** (20 min)

**"Documentação completa"**  
→ Pasta: **docs/** (8 arquivos detalhados)

---

## 📁 Arquivos Importantes

### Para você (desenvolvedor):
```
📄 COMECE-AQUI.md          ← Você está aqui!
📄 README.md               ← Visão geral
📄 O-QUE-FOI-FEITO.md      ← Resumo das mudanças
📄 DEPLOY-COMPLETO.md      ← Como fazer deploy
📁 docs/                   ← Documentação completa
```

### Para o sistema:
```
📄 docker-compose.yml      ← Configuração dos serviços
📄 .env                    ← Variáveis de ambiente
📁 frontend/               ← React
📁 backend/                ← Python/FastAPI
📁 database/               ← Scripts SQL
```

---

## 🗺️ Mapa da Documentação

```
COMECE-AQUI.md (este arquivo)
    │
    ├─→ README.md
    │   └─→ docs/00-LEIA-ME-PRIMEIRO.md
    │       └─→ docs/01-REQUISITOS.md
    │
    ├─→ DEPLOY-COMPLETO.md
    │   └─→ docs/06-DEPLOY-PORTAINER.md
    │
    └─→ O-QUE-FOI-FEITO.md
        └─→ docs/08-RESUMO-ALTERACOES.md
```

---

## 🔧 Preciso de ajuda com...

### "Como fazer deploy no Portainer?"
📄 **DEPLOY-COMPLETO.md** → Seção "Deploy no Portainer"

### "Deu erro ao subir"
📄 **docs/07-TROUBLESHOOTING.md** → Problemas comuns

### "Como funciona a API?"
📄 **docs/04-BACKEND-API.md** → Endpoints
🌐 Ou acesse: http://localhost:8000/docs (API rodando)

### "Estrutura do banco de dados?"
📄 **docs/05-BANCO-DE-DADOS.md** → Tabelas e queries

### "Login com Microsoft não funciona"
📄 **docs/02-CONFIGURACAO-AZURE.md** → Azure AD setup
📄 **docs/07-TROUBLESHOOTING.md** → Seção "Login Microsoft"

---

## ✅ Checklist Rápido

### Antes de testar localmente:
- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Portas 3000, 8000 e 5432 livres

### Antes do deploy no servidor:
- [ ] Testou localmente e funcionou
- [ ] Alterou senhas no `.env`
- [ ] Configurou IPs no `CORS_ORIGINS`
- [ ] Gerou TAR com `gerar-deploy.bat`

### Após deploy:
- [ ] Frontend acessível (porta 3000)
- [ ] Backend respondendo (porta 8000)
- [ ] Consegue fazer login
- [ ] Outras máquinas conseguem acessar

---

## 🎯 Estrutura Simplificada

```
organograma/
│
├── 📁 frontend/          # Interface React
│   └── src/             # Código React
│
├── 📁 backend/           # API Python
│   └── app/             # Código FastAPI
│       ├── api/         # Rotas (auth, usuarios, etc)
│       └── core/        # Banco, segurança, config
│
├── 📁 database/          # Scripts SQL
│   └── init/            # Inicialização do banco
│       ├── 01-setup.sql
│       ├── 02-posicoes.sql
│       └── ...
│
└── 📁 docs/              # Documentação
    ├── 00-LEIA-ME-PRIMEIRO.md
    ├── 01-REQUISITOS.md
    └── ...
```

---

## 💡 Dicas Rápidas

### Comandos úteis:

```bash
# Ver logs
docker-compose logs -f

# Parar tudo
docker-compose down

# Reiniciar um serviço
docker-compose restart backend

# Ver o que está rodando
docker-compose ps

# Entrar no banco
docker exec -it organograma-postgres psql -U postgres organograma
```

### Testar se está funcionando:

```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:8000/health

# Banco
docker exec organograma-postgres psql -U postgres -c "SELECT 1"
```

---

## 🚀 Próximo Passo

### Primeira vez?
1. Leia **README.md** (5 minutos)
2. Execute `docker-compose up -d`
3. Acesse http://localhost:3000
4. Teste o sistema

### Já testou local?
1. Leia **DEPLOY-COMPLETO.md**
2. Configure variáveis no `.env`
3. Gere TAR com `gerar-deploy.bat`
4. Upload no Portainer

### Deu problema?
1. Veja **docs/07-TROUBLESHOOTING.md**
2. Verifique logs: `docker-compose logs`

---

## 📞 Ainda com dúvida?

### Leia na ordem:
1. Este arquivo (você está aqui ✅)
2. **README.md**
3. **O-QUE-FOI-FEITO.md**
4. **DEPLOY-COMPLETO.md**
5. Pasta **docs/** (se precisar de mais detalhes)

---

## ⚡ TL;DR (Muito Rápido)

```bash
cd organograma
docker-compose up -d
# Acesse: http://localhost:3000
# Login: admin@empresa.com / admin123
```

✅ **Funcionou? Ótimo!**  
❌ **Deu erro? Veja docs/07-TROUBLESHOOTING.md**

---

**Boa sorte! 🚀**

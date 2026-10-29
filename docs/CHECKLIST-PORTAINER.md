# Checklist de Deploy no Portainer

Use este checklist para garantir que todos os passos foram executados corretamente.

## Preparação (Local)

- [ ] Código está na versão mais recente
- [ ] Testes locais passando com `docker compose up`
- [ ] Variáveis de ambiente configuradas no `backend/.env`
- [ ] Frontend apontando para os endpoints corretos

## Geração dos TARs

- [ ] Executado script `scripts/gerar-tars.bat` ou `scripts/gerar-tars.ps1`
- [ ] Arquivo `backend-code.tar.gz` gerado em `deploy/tars/`
- [ ] Arquivo `frontend-code.tar.gz` gerado em `deploy/tars/`
- [ ] Tamanho dos arquivos está razoável (não maior que 100MB cada)

## Upload das Imagens no Portainer

### Backend
- [ ] Acessado Portainer > Images > Build a new image
- [ ] Upload do `backend-code.tar.gz`
- [ ] Nome da imagem: `organograma-backend:latest`
- [ ] Build concluído com sucesso
- [ ] Imagem aparece na lista de Images

### Frontend
- [ ] Upload do `frontend-code.tar.gz`
- [ ] Nome da imagem: `organograma-frontend:latest`
- [ ] Build concluído com sucesso
- [ ] Imagem aparece na lista de Images

## Limpeza (se for atualização)

- [ ] Stack antiga removida (se existir)
- [ ] Redes antigas tipo `bridge` removidas
- [ ] Containers órfãos removidos
- [ ] Volumes preservados (se quiser manter dados)

## Deploy da Stack

- [ ] Acessado Portainer > Stacks > Add stack
- [ ] Nome da stack: `organograma`
- [ ] YAML copiado de `deploy/portainer-stack.yml`
- [ ] Verificado que usa rede `app-net` tipo `overlay`
- [ ] Verificado `SEED_ASSETS_ON_START: "false"`
- [ ] Deploy executado com sucesso

## Verificação dos Serviços

### Status Geral
- [ ] Todos os 5 serviços estão "running"
- [ ] Nenhum container em estado de restart contínuo
- [ ] Logs não mostram erros críticos

### Postgres
- [ ] Container `organograma_postgres` running
- [ ] Porta 5432 acessível
- [ ] Volume `postgres_data` criado
- [ ] Logs não mostram erros

### Backend
- [ ] Container `organograma_backend` running
- [ ] Porta 8000 acessível
- [ ] Logs mostram "Application startup complete"
- [ ] Não há tentativas de conexão ao MinIO

### PostgREST
- [ ] Container `organograma_postgrest` running
- [ ] Porta 3001 acessível
- [ ] Logs mostram "Listening on port 3000"

### Frontend
- [ ] Container `organograma_frontend` running
- [ ] Porta 3000 acessível
- [ ] Nginx iniciado corretamente

### MinIO
- [ ] Container `organograma_minio` running
- [ ] Portas 9100 e 9101 acessíveis
- [ ] Volume `minio_data` criado

## Inicialização do Banco de Dados

- [ ] Conectado ao container postgres
- [ ] Script `01-schema.sql` executado
- [ ] Script `02-seed.sql` executado
- [ ] Script `99-grants.sql` executado
- [ ] Tabelas criadas: `user`, `posicao`, `app_auth`, etc.
- [ ] Usuário `authenticator` criado com permissões corretas

## Testes Funcionais

### Health Check
- [ ] `curl http://IP:8000/health` retorna status ok
- [ ] Database: true
- [ ] Storage: false (esperado)

### PostgREST
- [ ] `curl http://IP:3001/` retorna informações da API
- [ ] Endpoints acessíveis

### Frontend
- [ ] Página carrega em `http://IP:3000`
- [ ] Sem erros no console do navegador
- [ ] Assets carregando corretamente

### Login
- [ ] Página de login acessível
- [ ] Login com admin/admin123 funciona
- [ ] JWT gerado corretamente
- [ ] Redirecionamento após login funciona

### Funcionalidades
- [ ] Listagem de usuários funciona
- [ ] Organograma carrega
- [ ] Criação/edição de dados funciona
- [ ] PostgREST respondendo às queries

## Rede

- [ ] Rede `app-net` criada como overlay
- [ ] Rede tem `attachable: true`
- [ ] Todos os 5 serviços conectados à `app-net`
- [ ] Serviços conseguem se comunicar entre si pelos nomes

## Segurança

- [ ] Senhas padrão foram alteradas (`POSTGRES_PASSWORD`)
- [ ] `SECRET_KEY` tem pelo menos 32 caracteres
- [ ] `ADMIN_PASSWORD` foi alterado
- [ ] Credenciais do MinIO foram alteradas
- [ ] CORS configurado apenas para origens necessárias

## Documentação

- [ ] IP/hostname de acesso documentado
- [ ] Portas documentadas para a equipe
- [ ] Credenciais armazenadas de forma segura
- [ ] Procedimento de backup documentado

## Backup

- [ ] Backup inicial do banco criado
- [ ] Volumes identificados para backup regular
- [ ] Procedimento de restauração testado

## Performance

- [ ] Tempo de resposta da API aceitável (< 1s)
- [ ] Frontend carrega em tempo razoável (< 3s)
- [ ] Queries do banco otimizadas
- [ ] Sem gargalos de memória ou CPU

## Monitoramento

- [ ] Logs sendo monitorados
- [ ] Alertas configurados (se aplicável)
- [ ] Health checks configurados
- [ ] Espaço em disco monitorado

## Problemas Comuns - Verificação

- [ ] Não há erro de "network cannot be used with services"
- [ ] Não há tentativas de conexão ao MinIO no backend
- [ ] Não há erro "Failed to resolve 'postgres'"
- [ ] Não há erro de autenticação do banco
- [ ] Não há erro de CORS

---

## Próximos Passos Após Deploy

1. Treinar equipe no uso da aplicação
2. Configurar backup automatizado
3. Documentar procedimentos operacionais
4. Configurar monitoramento contínuo
5. Planejar estratégia de atualização

---

## Em Caso de Problemas

1. Verificar logs de todos os containers
2. Consultar `docs/DEPLOY-PORTAINER.md` seção "Solução de Problemas"
3. Verificar conectividade de rede entre containers
4. Validar variáveis de ambiente
5. Confirmar que imagens foram construídas corretamente

---

**Data do Deploy:** ___/___/______

**Responsável:** _______________________

**IP de Acesso:** _______________________

**Observações:**
_____________________________________________
_____________________________________________
_____________________________________________

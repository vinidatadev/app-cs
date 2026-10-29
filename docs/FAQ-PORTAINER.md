# FAQ - Deploy no Portainer

Perguntas frequentes sobre o processo de deploy da aplicação Organograma no Portainer.

## Geral

### O que é Portainer?
Portainer é uma interface gráfica (web UI) para gerenciar ambientes Docker, incluindo Docker Swarm. Facilita o deploy, monitoramento e gerenciamento de containers sem usar linha de comando.

### Por que usar Docker Swarm?
Docker Swarm é uma ferramenta de orquestração nativa do Docker que permite:
- Escalonamento de serviços
- Redes overlay para comunicação entre containers
- Alta disponibilidade
- Rolling updates

### Posso usar Docker Compose no lugar de Swarm?
Sim, mas o Portainer usa Docker Swarm por padrão para "Stacks". A diferença principal é o tipo de rede (overlay vs bridge).

---

## Preparação e TARs

### Por que preciso gerar arquivos TAR?
O Portainer precisa de todos os arquivos do projeto empacotados para construir as imagens Docker. O TAR funciona como um "zip" que contém todo o código e o Dockerfile.

### Qual a diferença entre .tar e .tar.gz?
- `.tar` : Arquivo empacotado (agrupa arquivos)
- `.tar.gz` : Arquivo empacotado + comprimido (menor tamanho)

Use `.tar.gz` para economizar banda e tempo de upload.

### Preciso gerar novos TARs toda vez que atualizar o código?
Sim. Sempre que modificar qualquer arquivo do backend ou frontend, você precisa gerar novos TARs e rebuild as imagens no Portainer.

### O arquivo .env é incluído no TAR?
Sim, mas ATENÇÃO: não inclua senhas de produção no .env que vai para o TAR. Use as variáveis de ambiente da stack do Portainer para valores sensíveis.

### Os node_modules são incluídos no TAR do frontend?
Não devem ser. O .gitignore normalmente já exclui, mas você pode adicionar `--exclude=node_modules` no comando tar se necessário.

### Qual o tamanho esperado dos TARs?
- Backend: 10-50 MB (dependendo do número de bibliotecas Python)
- Frontend: 50-150 MB (dependendo das dependências Node.js)

---

## Imagens Docker

### Qual a diferença entre TAR e imagem Docker?
- **TAR**: Código fonte + Dockerfile (entrada)
- **Imagem**: Aplicação empacotada pronta para executar (saída do build)

O Portainer usa o TAR para construir a imagem.

### Preciso dar o nome exato organograma-backend:latest?
Não, mas se mudar o nome, você também precisa atualizar o nome no arquivo `portainer-stack.yml` na seção `image:`.

### O que é a tag :latest?
É uma etiqueta que indica "versão mais recente". Você pode usar outras tags como `:v1.0`, `:dev`, `:prod` para versionar as imagens.

### Como faço versionamento de imagens?
```bash
# Build com tag específica
organograma-backend:v1.0
organograma-backend:v1.1
organograma-backend:v2.0

# No stack YAML
image: organograma-backend:v1.0
```

### Posso ter múltiplas versões da imagem?
Sim! Você pode ter:
- `organograma-backend:v1.0`
- `organograma-backend:v2.0`
- `organograma-backend:latest`

E alternar entre elas mudando a tag no stack YAML.

---

## Stack e Deploy

### O que é uma Stack no Portainer?
Uma Stack é um conjunto de serviços relacionados definidos em um arquivo YAML (similar ao docker-compose.yml). No nosso caso, a stack "organograma" contém 5 serviços: postgres, minio, postgrest, backend e frontend.

### Qual a diferença entre Stack e Service?
- **Stack**: Grupo de serviços (exemplo: stack "organograma")
- **Service**: Um componente individual (exemplo: serviço "backend")

### Posso ter múltiplas stacks rodando?
Sim! Você pode ter várias stacks independentes. Por exemplo:
- Stack "organograma-dev"
- Stack "organograma-prod"
- Stack "outro-projeto"

### Como atualizar apenas um serviço da stack?
No Portainer, você pode:
1. Rebuild apenas a imagem desse serviço
2. Update a stack (Portainer detecta mudanças)
3. Ou usar `docker service update nome_servico`

### O que acontece com os dados quando atualizo a stack?
Os volumes (postgres_data, minio_data) são **preservados** por padrão. Os dados só são perdidos se você deletar os volumes explicitamente.

---

## Redes

### O que é uma rede overlay?
É um tipo de rede virtual que permite containers em diferentes hosts Docker se comunicarem. No Docker Swarm, é o tipo padrão para stacks.

### Por que não posso usar bridge network?
Bridge networks são para uso local (single-host). Docker Swarm requer overlay networks para comunicação entre nós do cluster.

### O que significa attachable: true?
Permite que containers standalone (não parte do swarm) também se conectem a essa rede. Útil para debug e ferramentas auxiliares.

### Como os containers se comunicam?
Pelo nome do serviço. Exemplo:
- Frontend acessa backend via `http://backend:8000`
- Backend acessa postgres via `postgres:5432`

O Docker Swarm resolve esses nomes automaticamente.

### Preciso configurar DNS?
Não! O Docker Swarm tem DNS embutido. Os nomes dos serviços funcionam como hostnames automaticamente.

---

## Banco de Dados

### Como acesso o PostgreSQL para executar os scripts?
1. Portainer > Containers > organograma_postgres
2. Clique em "Exec Console"
3. Execute: `psql -U postgres -d organograma`

### Os scripts SQL precisam ser executados toda vez?
Não! Apenas na primeira vez. Os dados ficam no volume `postgres_data` e persistem entre restarts.

### E se eu deletar a stack?
Se você não deletar o volume `postgres_data`, os dados continuam lá. Na próxima stack, os dados retornam.

### Como fazer backup do banco?
```bash
docker exec organograma_postgres \
  pg_dump -U postgres organograma > backup.sql
```

### Como restaurar um backup?
```bash
docker exec -i organograma_postgres \
  psql -U postgres organograma < backup.sql
```

---

## MinIO e Storage

### Por que o backend tenta conectar ao MinIO?
Por padrão, o código tentava inicializar buckets do MinIO no startup. Isso foi corrigido para pular quando `SEED_ASSETS_ON_START=false`.

### Posso remover o MinIO da stack?
Sim! Se não usar upload de arquivos, você pode comentar ou remover o serviço minio do YAML da stack.

### Como acessar o console do MinIO?
Abra `http://SEU-IP:9101` e faça login com as credenciais definidas (minioadmin / minioadmin123 por padrão).

### O MinIO é obrigatório?
Não. É usado apenas para armazenamento de arquivos (upload de imagens, anexos). Se não usa essa funcionalidade, pode desabilitar.

---

## Variáveis de Ambiente

### Onde configuro as variáveis de ambiente?
Há duas opções:
1. No arquivo `portainer-stack.yml` na seção `environment:` de cada serviço
2. No Portainer Web UI ao editar a stack (seção "Environment variables")

### Qual a diferença entre ${VAR:-default} e ${VAR}?
- `${VAR:-default}` : Usa "default" se VAR não estiver definida
- `${VAR}` : Obrigatória, erro se não existir

### Como passar senhas de forma segura?
Use Docker Secrets (mais avançado) ou defina as variáveis direto no Portainer UI, não no código Git.

### Preciso reiniciar após mudar variáveis?
Sim. O serviço precisa ser recriado para ler as novas variáveis:
- Portainer: Update stack
- CLI: `docker service update --force nome_servico`

---

## Portas e Acesso

### Por que as portas internas são diferentes das externas?
- **Interna**: Porta que o container escuta (definida no código)
- **Externa**: Porta mapeada no host (pode ser diferente para evitar conflitos)

Exemplo: Frontend escuta em 80 internamente, mas é acessível em 3000 externamente.

### Como mudar a porta externa?
No stack YAML:
```yaml
ports:
  - "NOVA_PORTA:PORTA_INTERNA"
```

Exemplo: mudar frontend para porta 8080:
```yaml
ports:
  - "8080:80"
```

### Posso usar portas diferentes em dev e prod?
Sim! Apenas mude o mapeamento de portas no stack YAML. As portas internas ficam iguais.

### Como saber qual IP usar?
Use o IP da máquina onde o Portainer está instalado. Para descobrir:
```bash
# Linux/Mac
hostname -I

# Windows
ipconfig
```

---

## Problemas Comuns

### Erro: "network cannot be used with services"
**Causa**: Tentando usar rede tipo bridge no Swarm.
**Solução**: Mudar para `driver: overlay` no YAML.

### Erro: "Failed to resolve 'postgres'"
**Causa**: Containers não estão na mesma rede.
**Solução**: Verificar que todos os serviços têm `networks: - app-net`.

### Backend reiniciando constantemente
**Causa**: Provavelmente erro ao conectar ao banco ou MinIO.
**Solução**: 
1. Ver logs: Portainer > Containers > backend > Logs
2. Verificar `SEED_ASSETS_ON_START: "false"`
3. Verificar `DATABASE_URL` correta

### Imagem não encontrada
**Causa**: Nome da imagem no stack não corresponde ao nome no Images.
**Solução**: Verificar que os nomes são exatamente iguais (case-sensitive).

### Frontend mostra erro 502
**Causa**: Backend não está respondendo.
**Solução**:
1. Verificar se backend está running
2. Ver logs do backend
3. Testar: `curl http://IP:8000/health`

---

## Performance e Recursos

### Quanto de RAM é necessário?
Mínimo recomendado:
- Postgres: 512MB
- Backend: 256MB
- Frontend: 256MB
- PostgREST: 256MB
- MinIO: 512MB
**Total**: ~2GB + overhead do sistema

### Como limitar recursos de um serviço?
No stack YAML:
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
      reservations:
        memory: 256M
```

### Como escalar um serviço?
```yaml
backend:
  deploy:
    replicas: 3  # 3 instâncias do backend
```

Ou via CLI:
```bash
docker service scale organograma_backend=3
```

### Quantas réplicas posso ter?
Depende dos recursos. Serviços stateless (backend, frontend) podem ter múltiplas réplicas. Postgres deve ter apenas 1 réplica (sem cluster).

---

## Segurança

### As senhas padrão são seguras?
NÃO! Sempre mude:
- `POSTGRES_PASSWORD`
- `ADMIN_PASSWORD`
- `MINIO_SECRET_KEY`
- `SECRET_KEY`

### Como gerar um SECRET_KEY seguro?
```bash
# Linux/Mac
openssl rand -hex 32

# PowerShell
-join ((48..57) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### O .env deve ir para o Git?
NÃO! Adicione ao `.gitignore`. Use `.env.example` com valores fake como template.

### Como proteger os endpoints?
- Use HTTPS (certificado SSL/TLS)
- Configure firewall para bloquear portas desnecessárias
- Use autenticação JWT (já implementada)
- Configure CORS adequadamente

---

## Backup e Recuperação

### O que preciso fazer backup?
1. Banco de dados (volume postgres_data ou dump SQL)
2. Arquivos MinIO (volume minio_data)
3. Código fonte (Git)
4. Stack YAML

### Com que frequência devo fazer backup?
Depende da criticidade:
- Dados críticos: Diário ou contínuo
- Dados moderados: Semanal
- Desenvolvimento: Não necessário

### Como testar a recuperação?
1. Crie um ambiente de teste
2. Restaure o backup nele
3. Verifique se tudo funciona
4. Documente o processo

---

## Atualização e Manutenção

### Como atualizo a aplicação?
1. Gerar novos TARs com código atualizado
2. Rebuild imagens no Portainer
3. Update da stack

### Há downtime durante atualização?
Por padrão, sim (alguns segundos). Para zero-downtime, configure rolling updates:
```yaml
deploy:
  update_config:
    parallelism: 1
    delay: 10s
```

### Como reverter uma atualização?
1. Se tem imagens antigas: Alterar tag no stack
2. Se não tem: Rebuild com código anterior

### Como atualizar o PostgreSQL?
CUIDADO! Requer planejamento:
1. Backup completo do banco
2. Testar migração em ambiente de teste
3. Seguir guia oficial de upgrade do PostgreSQL

---

## Monitoramento

### Como ver logs de um serviço?
Portainer > Services > (selecionar serviço) > Logs

Ou via CLI:
```bash
docker service logs organograma_backend -f
```

### Como configurar alertas?
Portainer Business tem alertas nativos. Para versão Community, use ferramentas externas como:
- Prometheus + Grafana
- Uptime Kuma
- Custom scripts

### Como monitorar uso de recursos?
Portainer mostra uso de CPU/RAM. Para monitoramento avançado, integre com Prometheus.

---

## Desenvolvimento vs Produção

### Devo usar a mesma configuração em dev e prod?
Não. Diferenças comuns:
- **Dev**: Senhas simples, debug ativado, CORS aberto
- **Prod**: Senhas fortes, debug desativado, CORS restrito, HTTPS

### Como gerenciar múltiplos ambientes?
Crie stacks separadas:
- `organograma-dev.yml`
- `organograma-staging.yml`
- `organograma-prod.yml`

### Posso rodar dev e prod no mesmo Portainer?
Sim, mas use stacks com nomes diferentes e portas diferentes para evitar conflitos.

---

## Ajuda Adicional

### Onde encontro mais informações?
- [Guia Completo de Deploy](DEPLOY-PORTAINER.md)
- [Checklist de Deploy](CHECKLIST-PORTAINER.md)
- [Resumo Rápido](RESUMO-DEPLOY.md)
- [Fluxo Visual](FLUXO-DEPLOY.md)

### Como reportar problemas?
1. Coletar logs de todos os serviços
2. Anotar mensagens de erro exatas
3. Documentar passos para reproduzir
4. Consultar seção "Solução de Problemas" no guia

### Há suporte comercial disponível?
Este é um projeto open-source. Para suporte empresarial, considere:
- Consultoria Docker/Portainer
- Contratar desenvolvedor especializado
- Portainer Business Edition (suporte oficial)

---

**Última atualização:** 29/10/2026

**Não encontrou sua pergunta?** Consulte os outros documentos ou adicione sua pergunta a este FAQ.

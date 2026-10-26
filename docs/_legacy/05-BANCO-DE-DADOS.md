# 🗄️ Estrutura do Banco de Dados

## Conexão

```
Host: localhost (ou IP do servidor)
Porta: 5432
Database: organograma
User: postgres
Password: (definida no .env)
```

## Diagrama ER (Entidade-Relacionamento)

```
┌──────────────┐       ┌──────────────┐
│  usuarios    │       │  posicoes    │
├──────────────┤       ├──────────────┤
│ id (PK)      │───┐   │ id (PK)      │
│ nome         │   └──▶│ posicao_pai  │
│ email        │       │ titulo       │
│ cargo        │       │ nivel        │
│ posicao_id   │◀──────┤ ordem        │
│ avatar_url   │       └──────────────┘
│ created_at   │
└──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐
│ atribuicoes  │
├──────────────┤
│ id (PK)      │
│ usuario_id   │
│ titulo       │
│ descricao    │
│ prioridade   │
│ status       │
└──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐
│ indicadores  │
├──────────────┤
│ id (PK)      │
│ usuario_id   │
│ nome         │
│ tipo         │
│ valor_atual  │
│ valor_meta   │
└──────────────┘
```

---

## Tabelas Detalhadas

### 📋 `usuarios`

Armazena dados dos usuários da empresa.

```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    cargo VARCHAR(255),
    posicao_id INTEGER REFERENCES posicoes(id),
    avatar_url TEXT,
    microsoft_id VARCHAR(255) UNIQUE,  -- ID do Azure AD
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP  -- Soft delete
);
```

**Índices**:
- `idx_usuarios_email` - Busca rápida por email
- `idx_usuarios_posicao` - Join com posições

**Constraints**:
- Email deve ser único
- Microsoft ID único (para login)

---

### 🏢 `posicoes`

Define a estrutura hierárquica do organograma.

```sql
CREATE TABLE posicoes (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    posicao_pai_id INTEGER REFERENCES posicoes(id),
    nivel INTEGER NOT NULL,  -- 1=CEO, 2=Gerente, 3=Coordenador...
    ordem INTEGER,  -- Ordem de exibição no mesmo nível
    descricao TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Hierarquia**:
- `posicao_pai_id` = NULL indica raiz (CEO/Presidente)
- Auto-referência permite árvore infinita

**Exemplo**:
```
CEO (id=1, pai=NULL, nivel=1)
  └─ CTO (id=2, pai=1, nivel=2)
      └─ Dev Lead (id=3, pai=2, nivel=3)
          └─ Dev Junior (id=4, pai=3, nivel=4)
```

---

### ✅ `atribuicoes`

Responsabilidades e tarefas dos usuários.

```sql
CREATE TABLE atribuicoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    prioridade VARCHAR(20) CHECK (prioridade IN ('baixa', 'media', 'alta')),
    status VARCHAR(20) CHECK (status IN ('pendente', 'em_progresso', 'concluida')),
    data_inicio DATE,
    data_fim DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Prioridades**:
- `baixa` - Pode esperar
- `media` - Normal
- `alta` - Urgente

**Status**:
- `pendente` - Não iniciada
- `em_progresso` - Em andamento
- `concluida` - Finalizada

---

### 📊 `indicadores`

KPIs e métricas de performance.

```sql
CREATE TABLE indicadores (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),  -- 'performance', 'qualidade', 'produtividade'
    valor_atual DECIMAL(10,2),
    valor_meta DECIMAL(10,2),
    unidade VARCHAR(20),  -- '%', 'pontos', 'horas'
    periodo VARCHAR(20),  -- 'diario', 'semanal', 'mensal'
    data_referencia DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Tipos comuns**:
- `performance` - Desempenho geral
- `qualidade` - Taxa de erros, bugs
- `produtividade` - Tasks concluídas, velocidade

**Exemplo**:
```sql
INSERT INTO indicadores VALUES (
    1, -- ID
    5, -- usuario_id
    'Taxa de Conclusão',
    'performance',
    85.5, -- valor_atual
    90.0, -- valor_meta
    '%',
    'mensal',
    '2026-10-01'
);
```

---

### 📚 `cursos`

Treinamentos e capacitações.

```sql
CREATE TABLE cursos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    link_url TEXT,
    categoria VARCHAR(100),
    duracao_horas INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE usuarios_cursos (
    usuario_id INTEGER REFERENCES usuarios(id),
    curso_id INTEGER REFERENCES cursos(id),
    status VARCHAR(20) CHECK (status IN ('inscrito', 'em_andamento', 'concluido')),
    data_inicio DATE,
    data_conclusao DATE,
    PRIMARY KEY (usuario_id, curso_id)
);
```

---

## Views Úteis

### `v_organograma_completo`

Visão hierárquica com usuários.

```sql
CREATE VIEW v_organograma_completo AS
SELECT 
    p.id,
    p.titulo,
    p.nivel,
    p.posicao_pai_id,
    COUNT(u.id) as total_usuarios,
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', u.id,
            'nome', u.nome,
            'email', u.email
        )
    ) as usuarios
FROM posicoes p
LEFT JOIN usuarios u ON u.posicao_id = p.id
WHERE u.deleted_at IS NULL
GROUP BY p.id;
```

---

### `v_indicadores_resumo`

Resumo de indicadores por usuário.

```sql
CREATE VIEW v_indicadores_resumo AS
SELECT 
    u.id as usuario_id,
    u.nome,
    COUNT(i.id) as total_indicadores,
    AVG((i.valor_atual / i.valor_meta) * 100) as media_atingimento
FROM usuarios u
LEFT JOIN indicadores i ON i.usuario_id = u.id
GROUP BY u.id, u.nome;
```

---

## Migrações

Arquivos em ordem de execução (pasta `database/init/`):

1. `01-setup.sql` - Extensões e configurações
2. `02-posicao.sql` - Tabela posições
3. `03-atribuicoes.sql` - Tabela atribuições
4. `04-indicadores.sql` - Tabela indicadores
5. `05-auth.sql` - Tabela usuários e autenticação

## Backup e Restore

### Backup
```bash
docker exec organograma-postgres pg_dump -U postgres organograma > backup.sql
```

### Restore
```bash
docker exec -i organograma-postgres psql -U postgres organograma < backup.sql
```

## Queries Úteis

### Ver hierarquia completa
```sql
WITH RECURSIVE hierarquia AS (
    SELECT id, titulo, posicao_pai_id, 1 as nivel
    FROM posicoes
    WHERE posicao_pai_id IS NULL
    
    UNION ALL
    
    SELECT p.id, p.titulo, p.posicao_pai_id, h.nivel + 1
    FROM posicoes p
    INNER JOIN hierarquia h ON p.posicao_pai_id = h.id
)
SELECT * FROM hierarquia ORDER BY nivel, titulo;
```

### Usuários sem atribuições
```sql
SELECT u.nome, u.email
FROM usuarios u
LEFT JOIN atribuicoes a ON a.usuario_id = u.id
WHERE a.id IS NULL AND u.deleted_at IS NULL;
```

### Top performers (indicadores)
```sql
SELECT 
    u.nome,
    AVG((i.valor_atual / i.valor_meta) * 100) as percentual_meta
FROM usuarios u
INNER JOIN indicadores i ON i.usuario_id = u.id
GROUP BY u.id, u.nome
HAVING AVG((i.valor_atual / i.valor_meta) * 100) >= 90
ORDER BY percentual_meta DESC;
```

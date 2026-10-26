-- Tabela de usuários

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    cargo VARCHAR(255),
    posicao_id INTEGER REFERENCES posicoes(id) ON DELETE SET NULL,
    avatar_url TEXT,
    microsoft_id VARCHAR(255) UNIQUE,
    senha_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

-- Índices
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_posicao ON usuarios(posicao_id);
CREATE INDEX idx_usuarios_microsoft ON usuarios(microsoft_id);

-- Trigger para updated_at
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Usuário admin inicial (senha: admin123)
-- Hash bcrypt de "admin123"
INSERT INTO usuarios (nome, email, cargo, posicao_id, senha_hash) VALUES
    ('Administrador', 'admin@empresa.com', 'Administrador', 1, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lWgJL0jVGvDe')
ON CONFLICT (email) DO NOTHING;

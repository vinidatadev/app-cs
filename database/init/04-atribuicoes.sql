-- Tabela de atribuições/responsabilidades

CREATE TABLE IF NOT EXISTS atribuicoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    prioridade VARCHAR(20) CHECK (prioridade IN ('baixa', 'media', 'alta')) DEFAULT 'media',
    status VARCHAR(20) CHECK (status IN ('pendente', 'em_progresso', 'concluida', 'cancelada')) DEFAULT 'pendente',
    data_inicio DATE,
    data_fim DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_atribuicoes_usuario ON atribuicoes(usuario_id);
CREATE INDEX idx_atribuicoes_status ON atribuicoes(status);
CREATE INDEX idx_atribuicoes_prioridade ON atribuicoes(prioridade);

-- Trigger para updated_at
CREATE TRIGGER update_atribuicoes_updated_at 
    BEFORE UPDATE ON atribuicoes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

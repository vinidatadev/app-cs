-- Tabela de posições hierárquicas (organograma)

CREATE TABLE IF NOT EXISTS posicoes (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    posicao_pai_id INTEGER REFERENCES posicoes(id) ON DELETE SET NULL,
    nivel INTEGER NOT NULL DEFAULT 1,
    ordem INTEGER DEFAULT 0,
    descricao TEXT,
    pos_x FLOAT DEFAULT 0,
    pos_y FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_posicoes_pai ON posicoes(posicao_pai_id);
CREATE INDEX idx_posicoes_nivel ON posicoes(nivel);

-- Trigger para updated_at
CREATE TRIGGER update_posicoes_updated_at 
    BEFORE UPDATE ON posicoes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais (exemplo)
INSERT INTO posicoes (id, titulo, posicao_pai_id, nivel, ordem) VALUES
    (1, 'CEO', NULL, 1, 1),
    (2, 'CTO', 1, 2, 1),
    (3, 'CFO', 1, 2, 2),
    (4, 'COO', 1, 2, 3),
    (5, 'Gerente de TI', 2, 3, 1),
    (6, 'Coordenador de Dev', 5, 4, 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval('posicoes_id_seq', (SELECT MAX(id) FROM posicoes));

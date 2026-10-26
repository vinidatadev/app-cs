-- Tabela de indicadores/KPIs

CREATE TABLE IF NOT EXISTS indicadores (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    valor_atual DECIMAL(10,2) DEFAULT 0,
    valor_meta DECIMAL(10,2) DEFAULT 100,
    unidade VARCHAR(20) DEFAULT '%',
    periodo VARCHAR(20),
    data_referencia DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_indicadores_usuario ON indicadores(usuario_id);
CREATE INDEX idx_indicadores_tipo ON indicadores(tipo);
CREATE INDEX idx_indicadores_data ON indicadores(data_referencia);

-- Trigger para updated_at
CREATE TRIGGER update_indicadores_updated_at 
    BEFORE UPDATE ON indicadores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

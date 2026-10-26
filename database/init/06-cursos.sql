-- Tabela de cursos/treinamentos

CREATE TABLE IF NOT EXISTS cursos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    link_url TEXT,
    categoria VARCHAR(100),
    duracao_horas INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Relacionamento muitos-para-muitos: usuários <-> cursos
CREATE TABLE IF NOT EXISTS usuarios_cursos (
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    curso_id INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('inscrito', 'em_andamento', 'concluido', 'cancelado')) DEFAULT 'inscrito',
    data_inicio DATE,
    data_conclusao DATE,
    progresso INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (usuario_id, curso_id)
);

-- Índices
CREATE INDEX idx_usuarios_cursos_usuario ON usuarios_cursos(usuario_id);
CREATE INDEX idx_usuarios_cursos_curso ON usuarios_cursos(curso_id);

-- Views úteis

-- View: Organograma completo com usuários
CREATE OR REPLACE VIEW v_organograma_completo AS
SELECT 
    p.id as posicao_id,
    p.titulo as posicao_titulo,
    p.nivel,
    p.posicao_pai_id,
    p.pos_x,
    p.pos_y,
    COUNT(u.id) as total_usuarios,
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', u.id,
            'nome', u.nome,
            'email', u.email,
            'cargo', u.cargo,
            'avatar_url', u.avatar_url
        ) ORDER BY u.nome
    ) FILTER (WHERE u.id IS NOT NULL) as usuarios
FROM posicoes p
LEFT JOIN usuarios u ON u.posicao_id = p.id AND u.deleted_at IS NULL
GROUP BY p.id, p.titulo, p.nivel, p.posicao_pai_id, p.pos_x, p.pos_y
ORDER BY p.nivel, p.ordem;

-- View: Resumo de indicadores por usuário
CREATE OR REPLACE VIEW v_indicadores_resumo AS
SELECT 
    u.id as usuario_id,
    u.nome,
    COUNT(i.id) as total_indicadores,
    ROUND(AVG((i.valor_atual / NULLIF(i.valor_meta, 0)) * 100), 2) as media_atingimento
FROM usuarios u
LEFT JOIN indicadores i ON i.usuario_id = u.id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.nome;

-- View: Atribuições pendentes
CREATE OR REPLACE VIEW v_atribuicoes_pendentes AS
SELECT 
    u.nome as usuario_nome,
    u.email,
    a.titulo as atribuicao_titulo,
    a.prioridade,
    a.data_inicio,
    a.data_fim,
    CASE 
        WHEN a.data_fim < CURRENT_DATE THEN 'atrasada'
        WHEN a.data_fim < CURRENT_DATE + INTERVAL '3 days' THEN 'urgente'
        ELSE 'normal'
    END as situacao
FROM atribuicoes a
INNER JOIN usuarios u ON u.id = a.usuario_id
WHERE a.status IN ('pendente', 'em_progresso')
AND u.deleted_at IS NULL
ORDER BY a.prioridade DESC, a.data_fim ASC;

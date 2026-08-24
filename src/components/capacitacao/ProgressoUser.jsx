import { useState } from 'react'

const STATUS_CONFIG = {
  pendente:  { label: 'Pendente',  color: '#475569', bg: '#47556922', next: 'iniciado',  nextLabel: 'Iniciar' },
  iniciado:  { label: 'Iniciado',  color: '#f97316', bg: '#f9731622', next: 'concluido', nextLabel: '✓ Concluir' },
  concluido: { label: 'Concluído', color: '#22c55e', bg: '#22c55e22', next: 'pendente',  nextLabel: 'Resetar' },
}

export default function ProgressoUser({ user, cursos, progressos, onSetStatus, onRemoveCurso, onAddCurso, onClose }) {
  const [atribuindo, setAtribuindo] = useState(false)
  const [busca, setBusca] = useState('')

  // Só cursos que têm linha em user_curso para este user
  const cursosAtribuidos = cursos.filter(c => progressos.find(p => p.id_curso === c.id))
  const cursosNaoAtribuidos = cursos.filter(c => !progressos.find(p => p.id_curso === c.id))

  const statusMap = {}
  progressos.forEach(p => { statusMap[p.id_curso] = p.status })

  // Agrupa por categoria — só os atribuídos
  const porCategoria = {}
  cursosAtribuidos.forEach(c => {
    const cat = c.categoria || 'Geral'
    if (!porCategoria[cat]) porCategoria[cat] = []
    porCategoria[cat].push(c)
  })

  const total = cursosAtribuidos.length
  const concluidos = cursosAtribuidos.filter(c => statusMap[c.id] === 'concluido').length
  const pct = total > 0 ? Math.round((concluidos / total) * 100) : 0

  const initials = (user.nome_usuario || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  const cursosFiltrados = cursosNaoAtribuidos.filter(c =>
    !busca || c.curso?.toLowerCase().includes(busca.toLowerCase()) || (c.categoria || '').toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{
      background: '#161622', border: '1px solid #2d2d44', borderRadius: 20,
      position: 'sticky', top: 90, maxHeight: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #2d2d44', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#6366f122', border: '2px solid #6366f144', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {user.foto ? <img src={user.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14, fontWeight: 700, color: '#6366f1' }}>{initials}</span>}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{user.nome_usuario}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{user.cargo || '—'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {onAddCurso && (
              <button onClick={() => setAtribuindo(v => !v)} style={{
                background: atribuindo ? '#6366f133' : '#6366f118',
                border: '1px solid #6366f155', color: '#6366f1',
                borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}>
                {atribuindo ? '✕ Fechar' : '+ Atribuir'}
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
        </div>

        {/* Barra de progresso */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 8, background: '#2d2d44', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#22c55e' : 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: 8, transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: pct === 100 ? '#22c55e' : '#6366f1', minWidth: 44 }}>{pct}%</span>
        </div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
          {concluidos} de {total} cursos concluídos
        </div>
      </div>

      {/* Painel de atribuição */}
      {atribuindo && (
        <div style={{ borderBottom: '1px solid #2d2d44', padding: '12px 20px', flexShrink: 0 }}>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="🔍 Buscar curso para atribuir..."
            style={{ width: '100%', background: '#0f0f17', border: '1px solid #2d2d44', borderRadius: 8, padding: '7px 12px', color: '#e2e8f0', fontSize: 12, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
          />
          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {cursosFiltrados.length === 0 && (
              <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '8px 0' }}>
                {cursosNaoAtribuidos.length === 0 ? 'Todos os cursos já atribuídos' : 'Nenhum resultado'}
              </p>
            )}
            {cursosFiltrados.map(c => (
              <button key={c.id} onClick={() => { onAddCurso(c.id); setBusca('') }} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#0f0f17', border: '1px solid #2d2d44', borderRadius: 8,
                padding: '7px 12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f155'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#2d2d44'}
              >
                <span style={{ fontSize: 12, color: '#e2e8f0', textAlign: 'left' }}>{c.curso}</span>
                <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, marginLeft: 8, flexShrink: 0 }}>+ atribuir</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de cursos atribuídos */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '12px 20px 20px' }}>
        {total === 0 && (
          <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', marginTop: 24, fontStyle: 'italic' }}>
            Nenhum curso atribuído ainda.{onAddCurso ? ' Use "+ Atribuir" para adicionar.' : ''}
          </p>
        )}
        {Object.entries(porCategoria).map(([cat, cursosGrupo]) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingTop: 8, borderTop: '1px solid #2d2d4444' }}>
              {cat}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {cursosGrupo.map(curso => {
                const status = statusMap[curso.id] || 'pendente'
                const cfg = STATUS_CONFIG[status]
                return (
                  <div key={curso.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: '#0f0f17', border: '1px solid #2d2d44' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: status === 'concluido' ? '#64748b' : '#e2e8f0', textDecoration: status === 'concluido' ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {curso.curso}
                      </div>
                      {curso.carga_horaria && <div style={{ fontSize: 10, color: '#475569' }}>⏱ {curso.carga_horaria}</div>}
                    </div>
                    <StatusBtn status={status} cfg={cfg} onClick={onSetStatus ? () => onSetStatus(curso.id, cfg.next) : null} />
                    {onRemoveCurso && (
                      <button onClick={() => onRemoveCurso(curso.id)} title="Remover curso" style={{
                        background: 'none', border: 'none', color: '#475569', cursor: 'pointer',
                        fontSize: 14, padding: '0 2px', lineHeight: 1, flexShrink: 0,
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fca5a5'}
                        onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                      >✕</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBtn({ status, cfg, onClick }) {
  const [hovered, setHovered] = useState(false)
  const disabled = !onClick
  return (
    <button
      onClick={onClick || undefined}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        background: hovered ? `${cfg.color}33` : cfg.bg,
        border: `1px solid ${cfg.color}55`,
        color: cfg.color, borderRadius: 20, padding: '3px 10px',
        fontSize: 10, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', transition: 'all 0.15s',
        minWidth: 72, textAlign: 'center', opacity: disabled ? 0.7 : 1,
      }}
    >
      {hovered && !disabled ? cfg.nextLabel : cfg.label}
    </button>
  )
}

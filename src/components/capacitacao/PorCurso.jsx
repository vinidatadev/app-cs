import { useState } from 'react'

const STATUS_CONFIG = {
  pendente:  { label: 'Pendente',  color: '#475569' },
  iniciado:  { label: 'Iniciado',  color: '#f97316' },
  concluido: { label: 'Concluído', color: '#22c55e' },
}

const NIVEL_COLOR = {
  'Assistente - Junior': '#3b82f6',
  'Pleno - Senior': '#a855f7',
  'Pleno': '#a855f7',
  'Senior': '#ec4899',
}

export default function PorCurso({ users, cursos, progressos, onSetStatus }) {
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas')
  const [expandido, setExpandido] = useState(null)

  const categorias = ['Todas', ...new Set(cursos.map(c => c.categoria || 'Geral'))]

  const filtrados = cursos.filter(c => {
    const q = busca.toLowerCase()
    const matchBusca = !busca || c.curso?.toLowerCase().includes(q) || c.descricao?.toLowerCase().includes(q)
    const matchCat = categoriaFiltro === 'Todas' || (c.categoria || 'Geral') === categoriaFiltro
    return matchBusca && matchCat
  })

  function getStatusCurso(cursoId) {
    const entries = progressos.filter(p => p.id_curso === cursoId)
    return {
      concluido: entries.filter(p => p.status === 'concluido').length,
      iniciado:  entries.filter(p => p.status === 'iniciado').length,
      pendente:  entries.filter(p => p.status === 'pendente').length,
      total:     entries.length, // só quem tem o curso atribuído
    }
  }

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="🔍  Buscar curso..."
          style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {categorias.map(cat => (
            <button key={cat} onClick={() => setCategoriaFiltro(cat)} style={{
              background: categoriaFiltro === cat ? '#6366f1' : '#161622',
              border: `1px solid ${categoriaFiltro === cat ? '#6366f1' : '#2d2d44'}`,
              color: categoriaFiltro === cat ? '#fff' : '#64748b',
              borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
            }}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Grid de cursos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {filtrados.map(curso => {
          const stats = getStatusCurso(curso.id)
          const pct = stats.total > 0 ? Math.round((stats.concluido / stats.total) * 100) : 0
          const isOpen = expandido === curso.id

          return (
            <div key={curso.id} style={{
              background: '#161622', border: `1px solid ${isOpen ? '#6366f155' : '#2d2d44'}`,
              borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.15s',
            }}>
              {/* Card header */}
              <button onClick={() => setExpandido(isOpen ? null : curso.id)}
                style={{ width: '100%', background: 'none', border: 'none', padding: '16px 18px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', lineHeight: 1.3, marginBottom: 4 }}>{curso.curso}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {curso.categoria && <Tag label={curso.categoria} color="#6366f1" />}
                      {curso.nivel && <Tag label={curso.nivel} color={NIVEL_COLOR[curso.nivel] || '#64748b'} />}
                      {curso.carga_horaria && <Tag label={`⏱ ${curso.carga_horaria}`} color="#475569" />}
                    </div>
                  </div>
                  <span style={{ color: pct === 100 ? '#22c55e' : '#6366f1', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{pct}%</span>
                </div>

                {/* Barra de progresso */}
                <div style={{ height: 6, background: '#2d2d44', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#22c55e' : 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: 6, transition: 'width 0.4s' }} />
                </div>

                {/* Contadores */}
                <div style={{ display: 'flex', gap: 14 }}>
                  {[['✓', stats.concluido, '#22c55e'], ['▶', stats.iniciado, '#f97316'], ['○', stats.pendente, '#475569']].map(([icon, n, color]) => (
                    <span key={icon} style={{ fontSize: 11, color, fontWeight: 600 }}>{icon} {n}</span>
                  ))}
                </div>
              </button>

              {/* Expandido: só pessoas com o curso atribuído */}
              {isOpen && (
                <div style={{ borderTop: '1px solid #2d2d44', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {progressos.filter(p => p.id_curso === curso.id).length === 0 && (
                    <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>
                      Nenhum colaborador com este curso atribuído
                    </p>
                  )}
                  {users
                    .filter(u => progressos.find(p => p.id_user === u.id && p.id_curso === curso.id))
                    .map(u => {
                      const prog = progressos.find(p => p.id_user === u.id && p.id_curso === curso.id)
                      const status = prog?.status || 'pendente'
                      const cfg = STATUS_CONFIG[status]
                      const nextStatus = status === 'pendente' ? 'iniciado' : status === 'iniciado' ? 'concluido' : 'pendente'
                      return (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366f122', border: '1px solid #6366f133', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                            {u.foto ? <img src={u.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 9, fontWeight: 700, color: '#6366f1' }}>{(u.nome_usuario || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}</span>}
                          </div>
                          <span style={{ flex: 1, fontSize: 12, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nome_usuario}</span>
                          <button
                            onClick={onSetStatus ? () => onSetStatus(u.id, curso.id, nextStatus) : undefined}
                            disabled={!onSetStatus}
                            style={{
                              background: `${cfg.color}22`, border: `1px solid ${cfg.color}55`, color: cfg.color,
                              borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700,
                              cursor: onSetStatus ? 'pointer' : 'default',
                              fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                              opacity: onSetStatus ? 1 : 0.7,
                            }}>
                            {cfg.label}
                          </button>
                        </div>
                      )
                    })
                  }
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Tag({ label, color }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}18`, border: `1px solid ${color}33`, borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

const inputStyle = { background: '#161622', border: '1px solid #2d2d44', borderRadius: 10, padding: '9px 14px', color: '#e2e8f0', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }

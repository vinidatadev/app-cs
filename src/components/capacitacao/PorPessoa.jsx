import { useState } from 'react'
import ProgressoUser from './ProgressoUser'

export default function PorPessoa({ users, cursos, progressos, onSetStatus, onAddCurso, onRemoveCurso }) {
  const [selecionado, setSelecionado] = useState(null)
  const [busca, setBusca] = useState('')

  const filtrados = users.filter(u =>
    (u.nome_usuario || '').toLowerCase().includes(busca.toLowerCase()) ||
    (u.cargo || '').toLowerCase().includes(busca.toLowerCase())
  )

  function getStats(userId) {
    const userP = progressos.filter(p => p.id_user === userId)
    const concluidos = userP.filter(p => p.status === 'concluido').length
    const iniciados = userP.filter(p => p.status === 'iniciado').length
    const total = userP.length  // só conta cursos atribuídos
    return { concluidos, iniciados, total, pct: total > 0 ? Math.round((concluidos / total) * 100) : 0 }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selecionado ? '340px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>

      {/* Lista de pessoas */}
      <div>
        <input
          value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="🔍  Buscar colaborador..."
          style={{ ...inputStyle, marginBottom: 14 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtrados.map(u => {
            const stats = getStats(u.id)
            const selected = selecionado?.id === u.id
            return (
              <button key={u.id} onClick={() => setSelecionado(selected ? null : u)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: selected ? '#6366f115' : '#161622',
                  border: `1px solid ${selected ? '#6366f155' : '#2d2d44'}`,
                  borderRadius: 14, padding: '12px 16px', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <Avatar user={u} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nome_usuario}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{u.cargo || '—'}</div>
                  {/* barra de progresso */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: '#2d2d44', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${stats.pct}%`, height: '100%', background: stats.pct === 100 ? '#22c55e' : '#6366f1', borderRadius: 4, transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: 11, color: stats.pct === 100 ? '#22c55e' : '#6366f1', fontWeight: 700, minWidth: 32 }}>{stats.pct}%</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <StatusPill label={`✓ ${stats.concluidos}`} color="#22c55e" />
                    <StatusPill label={`▶ ${stats.iniciados}`} color="#f97316" />
                    <StatusPill label={`${stats.total - stats.concluidos - stats.iniciados} pendentes`} color="#475569" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Painel lateral de cursos da pessoa */}
      {selecionado && (
        <ProgressoUser
          user={selecionado}
          cursos={cursos}
          progressos={progressos.filter(p => p.id_user === selecionado.id)}
          onSetStatus={onSetStatus ? (id_curso, status) => onSetStatus(selecionado.id, id_curso, status) : null}
          onAddCurso={onAddCurso ? (id_curso) => onAddCurso(selecionado.id, id_curso) : null}
          onRemoveCurso={onRemoveCurso ? (id_curso) => onRemoveCurso(selecionado.id, id_curso) : null}
          onClose={() => setSelecionado(null)}
        />
      )}
    </div>
  )
}

function Avatar({ user, size = 36 }) {
  const initials = (user.nome_usuario || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#6366f122', border: '2px solid #6366f133', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
      {user.foto ? <img src={user.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: size * 0.33, fontWeight: 700, color: '#6366f1' }}>{initials}</span>}
    </div>
  )
}

function StatusPill({ label, color }) {
  return <span style={{ fontSize: 10, color, fontWeight: 600 }}>{label}</span>
}

const inputStyle = { width: '100%', background: '#161622', border: '1px solid #2d2d44', borderRadius: 10, padding: '10px 14px', color: '#e2e8f0', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }

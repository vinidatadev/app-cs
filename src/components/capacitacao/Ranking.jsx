export default function Ranking({ users, cursos, progressos }) {
  // Calcula stats por pessoa
  const ranking = users
    .map(u => {
      const userP = progressos.filter(p => p.id_user === u.id)
      const atribuidos = userP.length
      const concluidos = userP.filter(p => p.status === 'concluido').length
      const iniciados  = userP.filter(p => p.status === 'iniciado').length
      const pct = atribuidos > 0 ? Math.round((concluidos / atribuidos) * 100) : 0
      return { ...u, atribuidos, concluidos, iniciados, pct }
    })
    .filter(u => u.atribuidos > 0)           // só quem tem pelo menos 1 curso
    .sort((a, b) => b.concluidos - a.concluidos || b.pct - a.pct || a.nome_usuario?.localeCompare(b.nome_usuario))

  // Stats gerais
  const totalConcluidos  = progressos.filter(p => p.status === 'concluido').length
  const totalAtribuidos  = progressos.length
  const pctGeral = totalAtribuidos > 0 ? Math.round((totalConcluidos / totalAtribuidos) * 100) : 0

  const medalhas = ['🥇', '🥈', '🥉']

  return (
    <div>
      {/* KPIs no topo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
        <Kpi label="Conclusões totais" value={totalConcluidos} color="#22c55e" icon="✓" />
        <Kpi label="Cursos atribuídos" value={totalAtribuidos} color="#6366f1" icon="📚" />
        <Kpi label="Taxa geral" value={`${pctGeral}%`} color="#a855f7" icon="📊" />
        <Kpi label="Colaboradores ativos" value={ranking.length} color="#f97316" icon="👤" />
      </div>

      {ranking.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text5)', padding: 64 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <p>Nenhum curso atribuído ainda para gerar o ranking.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px 100px 80px', gap: 12, padding: '6px 20px' }}>
            {['#', 'Colaborador', 'Concluídos', 'Iniciados', 'Atribuídos', '%'].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text5)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
            ))}
          </div>

          {ranking.map((u, i) => (
            <RankingRow key={u.id} user={u} pos={i + 1} medalha={medalhas[i] || null} />
          ))}
        </div>
      )}
    </div>
  )
}

function RankingRow({ user, pos, medalha }) {
  const isTop3 = pos <= 3
  const borderColor = pos === 1 ? '#f59e0b' : pos === 2 ? '#94a3b8' : pos === 3 ? '#cd7c3a' : 'var(--border)'
  const initials = (user.nome_usuario || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px 100px 80px',
      gap: 12, alignItems: 'center',
      background: isTop3 ? `${borderColor}08` : 'var(--bg2)',
      border: `1px solid ${isTop3 ? borderColor + '55' : 'var(--border)'}`,
      borderRadius: 14, padding: '14px 20px',
      transition: 'all 0.15s',
    }}>
      {/* Posição */}
      <div style={{ fontWeight: 800, fontSize: 18, textAlign: 'center' }}>
        {medalha || <span style={{ fontSize: 14, color: 'var(--text5)', fontWeight: 700 }}>{pos}</span>}
      </div>

      {/* Pessoa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: '#6366f122', border: `2px solid ${isTop3 ? borderColor + '88' : '#6366f133'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          {user.foto
            ? <img src={user.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>{initials}</span>
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.nome_usuario}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text4)' }}>{user.cargo || '—'}</div>
        </div>
      </div>

      {/* Concluídos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#22c55e' }}>{user.concluidos}</span>
        <span style={{ fontSize: 11, color: 'var(--text5)' }}>cursos</span>
      </div>

      {/* Iniciados */}
      <span style={{ fontSize: 14, fontWeight: 700, color: '#f97316' }}>{user.iniciados}</span>

      {/* Atribuídos */}
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text4)' }}>{user.atribuidos}</span>

      {/* % */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: user.pct === 100 ? '#22c55e' : '#6366f1' }}>
          {user.pct}%
        </span>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', width: 48 }}>
          <div style={{
            width: `${user.pct}%`, height: '100%',
            background: user.pct === 100 ? '#22c55e' : 'linear-gradient(90deg,#6366f1,#a855f7)',
            borderRadius: 4, transition: 'width 0.5s',
          }} />
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, color, icon }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: `1px solid ${color}33`,
      borderRadius: 16, padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text5)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      </div>
      <span style={{ fontSize: 32, fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</span>
    </div>
  )
}

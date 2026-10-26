export default function Toolbar({ onAutoLayout, onSaveLayout, onAtribuicoes, onMembros, visao, onToggleVisao, loading, saving, canEdit }) {
  const isHierarquia = visao === 'hierarquia'

  return (
    <div style={{
      position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10, display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: 40,
      padding: '8px 20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.02em' }}>
        🏢 Organograma
      </span>

      <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

      {/* Toggle visão */}
      <div style={{
        display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 30, padding: 3, gap: 2,
      }}>
        <button onClick={() => !isHierarquia && onToggleVisao()} style={{
          ...toggleBtn,
          background: isHierarquia ? '#6366f1' : 'transparent',
          color: isHierarquia ? '#fff' : '#64748b',
        }}>
          🌿 Hierarquia
        </button>
        <button onClick={() => isHierarquia && onToggleVisao()} style={{
          ...toggleBtn,
          background: !isHierarquia ? '#6366f1' : 'transparent',
          color: !isHierarquia ? '#fff' : '#64748b',
        }}>
          🗂 Células
        </button>
      </div>

      <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

      {isHierarquia && canEdit && <>
        <button onClick={onAutoLayout} disabled={loading} style={btnStyle('#a855f7')}>
          ⚡ Auto Layout
        </button>
        <button onClick={onSaveLayout} disabled={saving || loading} style={btnStyle('#3b82f6')}>
          {saving ? '...' : '💾 Salvar'}
        </button>
      </>}

      {canEdit && (
        <button onClick={onMembros} style={btnStyle('#22c55e')}>
          👥 Membros
        </button>
      )}

      {canEdit && (
        <button onClick={onAtribuicoes} style={btnStyle('#f97316')}>
          🏷 Atribuições
        </button>
      )}

      {/* Badge visualizador */}
      {!canEdit && (
        <span style={{
          fontSize: 11, color: 'var(--text5)', fontWeight: 600,
          background: '#475569' + '18', border: '1px solid #47556933',
          borderRadius: 20, padding: '4px 12px',
        }}>
          👁 Visualizador
        </span>
      )}
    </div>
  )
}

const toggleBtn = {
  border: 'none', borderRadius: 24, padding: '5px 14px',
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
}

function btnStyle(color) {
  return {
    background: `${color}22`, border: `1px solid ${color}55`, color,
    borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  }
}

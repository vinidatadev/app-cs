import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const FLOWCHECK_URL = import.meta.env.VITE_FLOWCHECK_URL || 'http://localhost:5174'

export default function Navbar() {
  const { user, perm, isAdmin, logout } = useAuth()
  const { theme, toggle } = useTheme()

  const initials = (user?.nome_usuario || '?')
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 52,
      background: '#13131f', borderBottom: '1px solid #2d2d44',
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 8,
      zIndex: 1000, boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
    }}>
      <span style={{ fontWeight: 800, fontSize: 15, color: '#e2e8f0', marginRight: 16, letterSpacing: '-0.02em' }}>
        🏢 Painel
      </span>

      {perm.canView('links') && (
        <NavLink to="/links" style={navLinkStyle}>Links</NavLink>
      )}
      {perm.canView('transacoes') && (
        <NavLink to="/transacoes" style={navLinkStyle}>Transações</NavLink>
      )}

      {/* FlowCheck — link externo */}
      <a
        href={FLOWCHECK_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#64748b',
          background: 'transparent',
          border: '1px solid transparent',
          borderRadius: 20,
          padding: '5px 16px',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
          fontFamily: 'Inter, sans-serif',
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.background = '#a78bfa18'; e.currentTarget.style.borderColor = '#a78bfa44' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
      >
        FlowCheck ↗
      </a>

      {perm.canView('capacitacao') && (
        <NavLink to="/capacitacao" style={navLinkStyle}>Capacitação</NavLink>
      )}
      {perm.canView('organograma') && (
        <NavLink to="/organograma" style={navLinkStyle}>Organograma</NavLink>
      )}
      {isAdmin && (
        <NavLink to="/admin" style={navLinkStyle}>⚙ Admin</NavLink>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Info do usuário + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: '#312e81', border: '2px solid #6366f133',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {user?.foto
            ? <img src={user.foto} alt={user.nome_usuario} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 11 }}>{initials}</span>
          }
        </div>

        <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.nome_usuario || user?.cargo || ''}
        </span>

        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 8, padding: '4px 10px',
            color: 'var(--text4)', fontSize: 14,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text4)' }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <button
          onClick={logout}
          title="Sair"
          style={{
            background: 'none', border: '1px solid #2d2d44',
            borderRadius: 8, padding: '4px 10px',
            color: '#475569', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef444444'; e.currentTarget.style.color = '#fca5a5' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d2d44'; e.currentTarget.style.color = '#475569' }}
        >
          Sair
        </button>
      </div>
    </nav>
  )
}

function navLinkStyle({ isActive }) {
  return {
    color: isActive ? '#6366f1' : '#64748b',
    background: isActive ? '#6366f118' : 'transparent',
    border: `1px solid ${isActive ? '#6366f144' : 'transparent'}`,
    borderRadius: 20,
    padding: '5px 16px',
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.15s',
  }
}

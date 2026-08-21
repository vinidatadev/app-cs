import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * modulo: 'organograma' | 'transacoes' | 'capacitacao' | 'links'
 * requireEdit: se true, exige permissão de editor (não bloqueia a rota, só passa a info)
 *              o bloqueio de rota sempre é pelo canView
 */
export default function ProtectedRoute({ children, modulo }) {
  const { user, perm, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f0f17',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#6366f1', fontSize: 15, fontWeight: 600,
      }}>
        Carregando...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (modulo && !perm.canView(modulo)) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f0f17',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 44 }}>🔒</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Acesso restrito</p>
        <p style={{ fontSize: 13, color: '#475569' }}>
          Você não tem permissão para acessar esta área.
        </p>
        <a href="/organograma" style={{
          marginTop: 8, color: '#6366f1', fontSize: 13,
          fontWeight: 600, textDecoration: 'none',
        }}>
          ← Voltar ao início
        </a>
      </div>
    )
  }

  return children
}

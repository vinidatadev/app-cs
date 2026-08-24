import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('E-mail ou senha incorretos.')
      setLoading(false)
    } else {
      // Login ok — navega para o organograma
      // O AuthContext vai carregar os dados do usuário via onAuthStateChange
      navigate('/organograma', { replace: true })
    }
  }

  return (
    <div className="page" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="card" style={{
        borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 400,
        boxShadow: '0 24px 64px var(--shadow)',
      }}>
        {/* Logo / título */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏢</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text2)', letterSpacing: '-0.02em' }}>
            Painel CS
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text4)', marginTop: 6 }}>
            Entre com sua conta corporativa
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={loading}
              className="t-input"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="t-input"
              style={inputStyle}
            />
          </div>

          {erro && (
            <div style={{
              background: '#ef444418', border: '1px solid #ef444444',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 13, color: '#fca5a5', textAlign: 'center',
            }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !senha}
            style={{
              marginTop: 8,
              background: loading ? '#312e81' : '#6366f1',
              border: 'none', borderRadius: 12,
              padding: '13px', fontSize: 15, fontWeight: 700,
              color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'background 0.15s',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text4)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
}

const inputStyle = {
  width: '100%', borderRadius: 10, padding: '11px 14px',
  fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none',
  boxSizing: 'border-box',
}

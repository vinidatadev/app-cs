import { useState } from 'react'

// Usar mesma lógica do apiClient para obter API_URL
const ORIGIN = typeof window !== 'undefined' ? window.location.origin : ''
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const API_URL = API_BASE.startsWith('http') ? API_BASE : `${ORIGIN}${API_BASE}`

export default function CreateUserModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    nome_usuario: '',
    cargo: '',
    setor: '',
    nivel: 1,
    username: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      // Pegar token da sessão salva
      const sessionData = localStorage.getItem('organograma.session.v1')
      const session = sessionData ? JSON.parse(sessionData) : null
      const token = session?.access_token
      
      if (!token) {
        throw new Error('Você precisa estar autenticado')
      }
      
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Erro ao criar usuário')
      }

      alert('Usuário criado com sucesso!')
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      alert('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg2)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 500,
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text2)', marginBottom: 20 }}>
          ➕ Novo Usuário
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nome Completo" value={form.nome_usuario} onChange={v => setForm({...form, nome_usuario: v})} required />
          <Input label="Cargo" value={form.cargo} onChange={v => setForm({...form, cargo: v})} required />
          <Input label="Setor" value={form.setor} onChange={v => setForm({...form, setor: v})} />
          
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text4)', display: 'block', marginBottom: 6 }}>
              Nível
            </label>
            <select
              value={form.nivel}
              onChange={e => setForm({...form, nivel: parseInt(e.target.value)})}
              style={{
                width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 12px', color: 'var(--text)',
                fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none',
              }}
            >
              <option value="1">1 - Usuário Comum</option>
              <option value="2">2 - Administrador</option>
            </select>
          </div>

          <Input 
            label="Username (login)" 
            value={form.username} 
            onChange={v => setForm({...form, username: v.toLowerCase().replace(/[^a-z0-9._-]/g, '')})} 
            required 
            placeholder="joao.silva"
          />
          <Input label="Email" type="email" value={form.email} onChange={v => setForm({...form, email: v})} required />
          <Input label="Senha" type="password" value={form.password} onChange={v => setForm({...form, password: v})} required minLength={6} />

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, background: '#6366f1', border: 'none', color: 'white',
                borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              {loading ? 'Criando...' : 'Criar Usuário'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text4)',
                borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', required = false, minLength, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text4)', display: 'block', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        style={{
          width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 12px', color: 'var(--text)',
          fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

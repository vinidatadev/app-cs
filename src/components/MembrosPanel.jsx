import { useState } from 'react'
import { supabase } from '../supabase'

const nivelOpcoes = [
  { value: 1, label: 'Diretor' },
  { value: 2, label: 'Gerente' },
  { value: 3, label: 'Coordenador' },
  { value: 4, label: 'Analista' },
  { value: 5, label: 'Assistente' },
]

export default function MembrosPanel({ users, relations, onClose, onRefresh }) {
  const [busca, setBusca] = useState('')
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState({ nome_usuario: '', cargo: '', foto: '', nivel: 4 })
  const [saving, setSaving] = useState(false)

  const idsNoOrganograma = new Set(relations.map(r => r.id_user))
  relations.forEach(r => { if (r.id_manager) idsNoOrganograma.add(r.id_manager) })

  const filtrados = users.filter(u =>
    (u.nome_usuario || '').toLowerCase().includes(busca.toLowerCase()) ||
    (u.cargo || '').toLowerCase().includes(busca.toLowerCase())
  )

  async function adicionarAoOrganograma(userId) {
    await supabase.from('organograma').insert({ id_user: userId, id_manager: null })
    onRefresh()
  }

  async function criarUser() {
    if (!form.nome_usuario.trim()) return
    setSaving(true)
    const { data: newUser, error } = await supabase
      .from('user')
      .insert({ nome_usuario: form.nome_usuario, cargo: form.cargo, foto: form.foto || null, nivel: form.nivel })
      .select().single()

    if (!error && newUser) {
      setForm({ nome_usuario: '', cargo: '', foto: '', nivel: 4 })
      setCriando(false)
      onRefresh()
    }
    setSaving(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: '#1e1e2e', border: '1px solid #2d2d44', borderRadius: 20,
        width: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px 0' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>👥 Membros</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 22 }}>✕</button>
        </div>

        <div style={{ padding: '16px 28px', display: 'flex', gap: 8 }}>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou cargo..."
            style={inputStyle}
          />
          <button onClick={() => setCriando(v => !v)} style={btnStyle('#22c55e')}>
            + Novo
          </button>
        </div>

        {/* Formulário de criação */}
        {criando && (
          <div style={{ margin: '0 28px 16px', background: '#0f0f17', border: '1px solid #2d2d44', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={sectionLabel}>Novo membro</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={form.nome_usuario} onChange={e => set('nome_usuario', e.target.value)}
                placeholder="Nome *" style={{ ...inputStyle, flex: 1 }} />
              <input value={form.cargo} onChange={e => set('cargo', e.target.value)}
                placeholder="Cargo" style={{ ...inputStyle, flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={form.foto} onChange={e => set('foto', e.target.value)}
                placeholder="URL da foto" style={{ ...inputStyle, flex: 1 }} />
              <select value={form.nivel} onChange={e => set('nivel', Number(e.target.value))} style={{ ...inputStyle, flex: 0, minWidth: 130 }}>
                {nivelOpcoes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <button onClick={criarUser} disabled={saving || !form.nome_usuario.trim()} style={btnStyle('#6366f1')}>
              {saving ? 'Salvando...' : 'Criar membro'}
            </button>
          </div>
        )}

        {/* Lista */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Fora do organograma */}
          {filtrados.filter(u => !idsNoOrganograma.has(u.id)).length > 0 && (
            <>
              <p style={{ ...sectionLabel, marginBottom: 6 }}>Fora do organograma</p>
              {filtrados.filter(u => !idsNoOrganograma.has(u.id)).map(u => (
                <UserRow key={u.id} user={u} inOrganograma={false} onAdd={() => adicionarAoOrganograma(u.id)} />
              ))}
            </>
          )}

          {/* No organograma */}
          {filtrados.filter(u => idsNoOrganograma.has(u.id)).length > 0 && (
            <>
              <p style={{ ...sectionLabel, marginTop: 12, marginBottom: 6 }}>No organograma</p>
              {filtrados.filter(u => idsNoOrganograma.has(u.id)).map(u => (
                <UserRow key={u.id} user={u} inOrganograma={true} />
              ))}
            </>
          )}

          {filtrados.length === 0 && (
            <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', marginTop: 24 }}>Nenhum membro encontrado</p>
          )}
        </div>
      </div>
    </div>
  )
}

function UserRow({ user, inOrganograma, onAdd }) {
  const initials = (user.nome_usuario || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: '#0f0f17', border: `1px solid ${inOrganograma ? '#2d2d44' : '#2d2d44'}`,
      borderRadius: 12, padding: '10px 14px',
    }}>
      {/* Avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: '#312e81', border: '2px solid #6366f133',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {user.foto
          ? <img src={user.foto} alt={user.nome_usuario} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 13 }}>{initials}</span>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user.nome_usuario || `ID ${user.id}`}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{user.cargo || '—'}</div>
      </div>

      {/* Status / ação */}
      {inOrganograma ? (
        <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, background: '#22c55e18', border: '1px solid #22c55e33', borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>
          ✓ no organograma
        </span>
      ) : (
        <button onClick={onAdd} style={{
          fontSize: 12, color: '#6366f1', fontWeight: 600,
          background: '#6366f118', border: '1px solid #6366f133',
          borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
        }}>
          + incluir
        </button>
      )}
    </div>
  )
}

const inputStyle = { background: '#0f0f17', border: '1px solid #2d2d44', borderRadius: 10, padding: '9px 12px', color: '#e2e8f0', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', width: '100%' }
const btnStyle = (color) => ({ background: `${color}22`, border: `1px solid ${color}44`, color, borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' })
const sectionLabel = { fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }

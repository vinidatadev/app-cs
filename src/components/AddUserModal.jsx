import { useState } from 'react'

const nivelOpcoes = [
  { value: 1, label: 'Nível 1 — Diretor' },
  { value: 2, label: 'Nível 2 — Gerente' },
  { value: 3, label: 'Nível 3 — Coordenador' },
  { value: 4, label: 'Nível 4 — Analista' },
  { value: 5, label: 'Nível 5 — Assistente' },
]

export default function AddUserModal({ users, onClose, onSave }) {
  const [form, setForm] = useState({ nome_usuario: '', cargo: '', foto: '', nivel: 1, id_manager: '' })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.nome_usuario.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: '#1e1e2e', border: '1px solid #2d2d44', borderRadius: 20,
        padding: 32, width: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: '#f1f5f9' }}>
          Novo Membro
        </h2>

        {[
          { label: 'Nome', key: 'nome_usuario', placeholder: 'Ex: João Silva' },
          { label: 'Cargo', key: 'cargo', placeholder: 'Ex: Desenvolvedor Sênior' },
          { label: 'URL da Foto', key: 'foto', placeholder: 'https://...' },
        ].map(({ label, key, placeholder }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{label}</label>
            <input
              value={form[key]}
              onChange={e => set(key, e.target.value)}
              placeholder={placeholder}
              style={inputStyle}
            />
          </div>
        ))}

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Nível</label>
          <select value={form.nivel} onChange={e => set('nivel', Number(e.target.value))} style={inputStyle}>
            {nivelOpcoes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Reporta para</label>
          <select value={form.id_manager} onChange={e => set('id_manager', e.target.value)} style={inputStyle}>
            <option value="">— Nenhum (topo) —</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.nome_usuario || `ID ${u.id}`}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnStyle('#94a3b8')}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={btnStyle('#6366f1')}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }
const inputStyle = { width: '100%', background: '#0f0f17', border: '1px solid #2d2d44', borderRadius: 10, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none' }
const btnStyle = (color) => ({ background: `${color}22`, border: `1px solid ${color}55`, color, borderRadius: 20, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' })

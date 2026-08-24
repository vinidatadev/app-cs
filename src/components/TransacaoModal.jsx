import { useState } from 'react'

export default function TransacaoModal({ onClose, onSave }) {
  const [form, setForm] = useState({ transacao: '', modulo: '', descricao: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.transacao.trim() || !form.modulo.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20,
        width: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', padding: 32,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text2)' }}>Nova Transação</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Transação *</label>
            <input value={form.transacao} onChange={e => set('transacao', e.target.value)}
              placeholder="Ex: COMPRA_PRODUTO" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Módulo *</label>
            <input value={form.modulo} onChange={e => set('modulo', e.target.value)}
              placeholder="Ex: Financeiro" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)}
              placeholder="Breve descrição da transação..." rows={3}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={onClose} style={btnStyle('#64748b')}>Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.transacao.trim() || !form.modulo.trim()} style={btnStyle('#6366f1')}>
            {saving ? 'Salvando...' : 'Criar e abrir'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }
const inputStyle = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }
const btnStyle = (color) => ({ background: `${color}22`, border: `1px solid ${color}55`, color, borderRadius: 20, padding: '8px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' })

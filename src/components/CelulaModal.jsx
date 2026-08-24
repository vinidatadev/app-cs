import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const CORES = [
  '#6366f1', '#3b82f6', '#22c55e', '#a855f7', '#f97316',
  '#ec4899', '#14b8a6', '#eab308', '#ef4444', '#06b6d4',
]

export default function CelulaModal({ celula, users, onClose, onSave }) {
  const editing = !!celula
  const [form, setForm] = useState({
    nome: celula?.nome || '',
    cor: celula?.cor || CORES[0],
    descricao: celula?.descricao || '',
  })
  const [membros, setMembros] = useState([]) // ids dos users já vinculados
  const [busca, setBusca] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing) return
    supabase.from('celula_user').select('id_user').eq('id_celula', celula.id).then(({ data }) => {
      setMembros((data || []).map(r => r.id_user))
    })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.nome.trim()) return
    setSaving(true)
    await onSave({ ...form, id: celula?.id, membros })
    setSaving(false)
    onClose()
  }

  async function toggleMembro(userId) {
    if (!editing) {
      setMembros(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId])
      return
    }
    if (membros.includes(userId)) {
      await supabase.from('celula_user').delete().eq('id_celula', celula.id).eq('id_user', userId)
      setMembros(prev => prev.filter(id => id !== userId))
    } else {
      await supabase.from('celula_user').insert({ id_celula: celula.id, id_user: userId })
      setMembros(prev => [...prev, userId])
    }
  }

  const filtrados = users.filter(u =>
    (u.nome_usuario || '').toLowerCase().includes(busca.toLowerCase()) ||
    (u.cargo || '').toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div style={{
        background: '#1e1e2e', border: '1px solid #2d2d44', borderRadius: 20,
        width: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px 16px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
            {editing ? '✎ Editar Célula' : '+ Nova Célula'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 22 }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Nome */}
          <div>
            <label style={labelStyle}>Nome da célula</label>
            <input value={form.nome} onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Célula de Dados" style={inputStyle} />
          </div>

          {/* Cor */}
          <div>
            <label style={labelStyle}>Cor</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CORES.map(c => (
                <button key={c} onClick={() => set('cor', c)} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, border: 'none',
                  cursor: 'pointer', outline: form.cor === c ? '3px solid #fff' : 'none', outlineOffset: 2,
                }} />
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label style={labelStyle}>Papéis e responsabilidades</label>
            <textarea
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              placeholder="Descreva as responsabilidades desta célula..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          {/* Membros */}
          <div>
            <label style={labelStyle}>Membros ({membros.length} selecionados)</label>
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar pessoa..." style={{ ...inputStyle, marginBottom: 8 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {filtrados.map(u => {
                const ativo = membros.includes(u.id)
                return (
                  <button key={u.id} onClick={() => toggleMembro(u.id)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: ativo ? `${form.cor}18` : '#0f0f17',
                    border: `1px solid ${ativo ? form.cor + '66' : 'var(--border)'}`,
                    borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{u.nome_usuario || `ID ${u.id}`}</span>
                      {u.cargo && <span style={{ fontSize: 11, color: '#64748b' }}>{u.cargo}</span>}
                    </div>
                    <span style={{ fontSize: 13, color: ativo ? form.cor : '#475569' }}>{ativo ? '✓' : '+'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 28px 24px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnStyle('#64748b')}>Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.nome.trim()} style={btnStyle(form.cor)}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }
const inputStyle = { width: '100%', background: '#0f0f17', border: '1px solid #2d2d44', borderRadius: 10, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }
const btnStyle = (color) => ({ background: `${color}22`, border: `1px solid ${color}55`, color, borderRadius: 20, padding: '8px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' })

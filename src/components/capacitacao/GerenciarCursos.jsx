import { useState } from 'react'
import { supabase } from '../../supabase'

const CATEGORIAS = [
  'Melhoria Contínua e Processos',
  'Customer Experience',
  'Operações',
  'Comportamental',
  'Produtividade',
  'Tecnologia e Ferramentas',
  'Inteligência Artificial',
  'Gestão e Liderança',
  'Compliance',
  'Geral',
]

// Sugestões rápidas (não obrigatórias)
const NIVEL_SUGESTOES = ['Assistente', 'Junior', 'Pleno', 'Senior', 'Todos']

const EMPTY = { curso: '', descricao: '', conteudo: '', carga_horaria: '', categoria: '', nivel: '', ativo: true }

export default function GerenciarCursos({ cursos, onRefresh }) {
  const [busca, setBusca] = useState('')
  const [catFiltro, setCatFiltro] = useState('Todas')
  const [modal, setModal] = useState(null) // null | { mode: 'criar' | 'editar', curso? }
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const filtrados = cursos.filter(c => {
    const q = busca.toLowerCase()
    const matchBusca = !busca || c.curso?.toLowerCase().includes(q) || c.categoria?.toLowerCase().includes(q)
    const matchCat = catFiltro === 'Todas' || c.categoria === catFiltro
    return matchBusca && matchCat
  })

  const categorias = ['Todas', ...new Set(cursos.map(c => c.categoria || 'Geral'))]

  function abrirCriar() {
    setForm(EMPTY)
    setModal({ mode: 'criar' })
  }

  function abrirEditar(curso) {
    setForm({ ...EMPTY, ...curso })
    setModal({ mode: 'editar', curso })
  }

  async function handleSave() {
    if (!form.curso.trim()) return
    setSaving(true)
    if (modal.mode === 'criar') {
      await supabase.from('curso').insert({
        curso: form.curso, descricao: form.descricao, conteudo: form.conteudo,
        carga_horaria: form.carga_horaria, categoria: form.categoria,
        nivel: form.nivel, ativo: form.ativo,
      })
    } else {
      await supabase.from('curso').update({
        curso: form.curso, descricao: form.descricao, conteudo: form.conteudo,
        carga_horaria: form.carga_horaria, categoria: form.categoria,
        nivel: form.nivel, ativo: form.ativo,
      }).eq('id', modal.curso.id)
    }
    setSaving(false)
    setModal(null)
    onRefresh()
  }

  async function handleDelete(id) {
    await supabase.from('curso').delete().eq('id', id)
    setConfirmDelete(null)
    onRefresh()
  }

  async function toggleAtivo(curso) {
    await supabase.from('curso').update({ ativo: !curso.ativo }).eq('id', curso.id)
    onRefresh()
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="🔍  Buscar curso..."
          style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        <button onClick={abrirCriar} style={{
          background: '#6366f1', border: 'none', color: '#fff',
          borderRadius: 20, padding: '9px 20px', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
        }}>+ Novo Curso</button>
      </div>

      {/* Filtro categorias */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 }}>
        {categorias.map(cat => (
          <button key={cat} onClick={() => setCatFiltro(cat)} style={{
            background: catFiltro === cat ? '#6366f1' : '#161622',
            border: `1px solid ${catFiltro === cat ? '#6366f1' : '#2d2d44'}`,
            color: catFiltro === cat ? '#fff' : '#64748b',
            borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
          }}>{cat}</button>
        ))}
      </div>

      {/* Contador */}
      <p style={{ fontSize: 12, color: '#475569', marginBottom: 14 }}>
        {filtrados.length} curso{filtrados.length !== 1 ? 's' : ''} · {cursos.filter(c => c.ativo).length} ativos
      </p>

      {/* Tabela */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 100px', gap: 12, padding: '6px 16px' }}>
          {['Curso', 'Categoria', 'Nível', 'Carga', ''].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
          ))}
        </div>

        {filtrados.map(curso => (
          <div key={curso.id} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 100px',
            gap: 12, padding: '12px 16px', alignItems: 'center',
            background: curso.ativo ? '#161622' : '#0f0f17',
            border: `1px solid ${curso.ativo ? '#2d2d44' : '#1a1a2e'}`,
            borderRadius: 12, opacity: curso.ativo ? 1 : 0.5,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {curso.curso}
              </div>
              {curso.descricao && (
                <div style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                  {curso.descricao}
                </div>
              )}
            </div>
            <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {curso.categoria || '—'}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {curso.nivel
                ? curso.nivel.split(',').map(t => t.trim()).filter(Boolean).map(tag => {
                    const COLORS = ['#6366f1','#3b82f6','#a855f7','#22c55e','#f97316','#ec4899','#14b8a6']
                    const c = COLORS[Math.abs(tag.split('').reduce((a,ch) => a + ch.charCodeAt(0), 0)) % COLORS.length]
                    return <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: c, background: `${c}18`, border: `1px solid ${c}33`, borderRadius: 20, padding: '1px 7px', whiteSpace: 'nowrap' }}>{tag}</span>
                  })
                : <span style={{ fontSize: 11, color: '#475569' }}>—</span>
              }
            </div>
            <span style={{ fontSize: 11, color: '#475569' }}>{curso.carga_horaria || '—'}</span>

            {/* Ações */}
            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              <button onClick={() => toggleAtivo(curso)} title={curso.ativo ? 'Desativar' : 'Ativar'} style={iconBtn(curso.ativo ? '#f97316' : '#22c55e')}>
                {curso.ativo ? '⏸' : '▶'}
              </button>
              <button onClick={() => abrirEditar(curso)} title="Editar" style={iconBtn('#6366f1')}>✎</button>
              <button onClick={() => setConfirmDelete(curso)} title="Excluir" style={iconBtn('#ef4444')}>✕</button>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div style={{ textAlign: 'center', color: '#475569', padding: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
            <p>{busca ? 'Nenhum curso encontrado' : 'Nenhum curso cadastrado'}</p>
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: '#1e1e2e', border: '1px solid #2d2d44', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 28px 16px', borderBottom: '1px solid #2d2d44', flexShrink: 0 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>
                {modal.mode === 'criar' ? '+ Novo Curso' : '✎ Editar Curso'}
              </h2>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Nome do curso *">
                <input value={form.curso} onChange={e => set('curso', e.target.value)}
                  placeholder="Ex: Excel Avançado" style={inputStyle} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Categoria">
                  <select value={form.categoria} onChange={e => set('categoria', e.target.value)} style={inputStyle}>
                    <option value="">Selecionar...</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Nível">
                  <NivelTagInput
                    value={form.nivel}
                    onChange={v => set('nivel', v)}
                  />
                </Field>
              </div>

              <Field label="Carga horária">
                <input value={form.carga_horaria} onChange={e => set('carga_horaria', e.target.value)}
                  placeholder="Ex: 00:30:00" style={inputStyle} />
              </Field>

              <Field label="Descrição">
                <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)}
                  placeholder="Breve descrição do curso..." rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
              </Field>

              <Field label="Conteúdo programático">
                <textarea value={form.conteudo} onChange={e => set('conteudo', e.target.value)}
                  placeholder="• Tópico 1&#10;• Tópico 2&#10;• Tópico 3" rows={5}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
              </Field>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => set('ativo', !form.ativo)} style={{
                  width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: form.ativo ? '#6366f1' : '#2d2d44', position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{ position: 'absolute', top: 3, left: form.ativo ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
                <span style={{ fontSize: 13, color: form.ativo ? '#22c55e' : '#64748b', fontWeight: 600 }}>
                  {form.ativo ? 'Curso ativo' : 'Curso inativo'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '16px 28px 24px', borderTop: '1px solid #2d2d44', flexShrink: 0 }}>
              <button onClick={() => setModal(null)} style={btnStyle('#64748b')}>Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.curso.trim()} style={btnStyle('#6366f1')}>
                {saving ? 'Salvando...' : modal.mode === 'criar' ? 'Criar curso' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#1e1e2e', border: '1px solid #2d2d44', borderRadius: 20, padding: 32, maxWidth: 400, width: '100%', margin: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Excluir curso?</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
              "<strong style={{ color: '#e2e8f0' }}>{confirmDelete.curso}</strong>" será removido permanentemente, incluindo todo o progresso dos colaboradores.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={btnStyle('#64748b')}>Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete.id)} style={btnStyle('#ef4444')}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NivelTagInput({ value, onChange }) {
  const tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : []
  const [input, setInput] = useState('')

  function addTag(tag) {
    const t = tag.trim()
    if (!t || tags.includes(t)) { setInput(''); return }
    onChange([...tags, t].join(', '))
    setInput('')
  }

  function removeTag(tag) {
    onChange(tags.filter(t => t !== tag).join(', '))
  }

  function handleKey(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1])
    }
  }

  const COLORS = ['#6366f1', '#3b82f6', '#a855f7', '#22c55e', '#f97316', '#ec4899', '#14b8a6']
  const colorFor = (tag) => COLORS[Math.abs(tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % COLORS.length]

  return (
    <div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
        background: '#0f0f17', border: '1px solid #2d2d44', borderRadius: 10,
        padding: '7px 10px', minHeight: 42,
      }}>
        {tags.map(tag => (
          <span key={tag} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: `${colorFor(tag)}22`, border: `1px solid ${colorFor(tag)}55`,
            color: colorFor(tag), borderRadius: 20, padding: '2px 10px',
            fontSize: 12, fontWeight: 600,
          }}>
            {tag}
            <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1, opacity: 0.7 }}>✕</button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => input && addTag(input)}
          placeholder={tags.length === 0 ? 'Digite e pressione Enter...' : ''}
          style={{ background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 13, fontFamily: 'Inter, sans-serif', flex: 1, minWidth: 80 }}
        />
      </div>
      {/* Sugestões rápidas */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
        {NIVEL_SUGESTOES.filter(s => !tags.includes(s)).map(s => (
          <button key={s} onClick={() => addTag(s)} style={{
            background: 'transparent', border: '1px dashed #2d2d44', color: '#475569',
            borderRadius: 20, padding: '2px 10px', fontSize: 11, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}>+ {s}</button>
        ))}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = { width: '100%', background: '#0f0f17', border: '1px solid #2d2d44', borderRadius: 10, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }
const btnStyle = (color) => ({ background: `${color}22`, border: `1px solid ${color}55`, color, borderRadius: 20, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' })
const iconBtn = (color) => ({ background: `${color}18`, border: `1px solid ${color}33`, color, borderRadius: 8, width: 28, height: 28, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' })

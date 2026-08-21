import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'

export default function TransacaoDetalhe({ transacao: transacaoInicial, users = [], onClose, onDelete, canEdit = false }) {
  const [transacao, setTransacao] = useState(transacaoInicial)
  const [editandoDesc, setEditandoDesc] = useState(false)
  const [draftDesc, setDraftDesc] = useState(transacaoInicial.descricao || '')
  const [editandoFocal, setEditandoFocal] = useState(false)
  const [buscaFocal, setBuscaFocal] = useState('')
  const [detalhes, setDetalhes] = useState([])
  const [uploading, setUploading] = useState(false)
  const [novoTexto, setNovoTexto] = useState('')
  const [addingText, setAddingText] = useState(false)
  const fileRef = useRef()

  const pontoFocal = transacao.ponto_focal || null

  async function fetchDetalhes() {
    const { data } = await supabase.from('transacao_detalhe').select('*')
      .eq('id_transacao', transacao.id).order('ordem', { ascending: true })
    setDetalhes(data || [])
  }

  useEffect(() => { fetchDetalhes() }, [transacao.id])

  async function saveDesc() {
    const { data } = await supabase.from('transacao')
      .update({ descricao: draftDesc })
      .eq('id', transacao.id)
      .select('*, ponto_focal:id_ponto_focal(id, nome_usuario, cargo, foto)').single()
    if (data) setTransacao(data)
    setEditandoDesc(false)
  }

  async function savePontoFocal(userId) {
    const { data } = await supabase.from('transacao')
      .update({ id_ponto_focal: userId || null })
      .eq('id', transacao.id)
      .select('*, ponto_focal:id_ponto_focal(id, nome_usuario, cargo, foto)').single()
    if (data) setTransacao(data)
    setEditandoFocal(false)
    setBuscaFocal('')
  }

  async function addTexto() {
    if (!novoTexto.trim()) return
    await supabase.from('transacao_detalhe').insert({
      id_transacao: transacao.id, tipo: 'texto', conteudo: novoTexto.trim(), ordem: detalhes.length,
    })
    setNovoTexto(''); setAddingText(false); fetchDetalhes()
  }

  async function uploadImagem(file) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${transacao.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('transacoes').upload(path, file)
    if (!error) {
      const { data: urlData } = supabase.storage.from('transacoes').getPublicUrl(path)
      await supabase.from('transacao_detalhe').insert({
        id_transacao: transacao.id, tipo: 'imagem', conteudo: urlData.publicUrl, ordem: detalhes.length,
      })
      fetchDetalhes()
    }
    setUploading(false)
  }

  async function deleteDetalhe(id) {
    await supabase.from('transacao_detalhe').delete().eq('id', id)
    fetchDetalhes()
  }

  async function saveDetalheTexto(id, conteudo) {
    await supabase.from('transacao_detalhe').update({ conteudo }).eq('id', id)
    fetchDetalhes()
  }

  async function moveDetalhe(index, dir) {
    const next = [...detalhes]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    await Promise.all(next.map((d, i) => supabase.from('transacao_detalhe').update({ ordem: i }).eq('id', d.id)))
    fetchDetalhes()
  }

  const initials = (name) => (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      zIndex: 100, overflowY: 'auto', padding: '48px 16px',
    }}>
      <div style={{
        background: '#1a1a2e', border: '1px solid #2d2d44', borderRadius: 24,
        width: '100%', maxWidth: 800, boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
      }}>

        {/* ── HEADER ── */}
        <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid #2d2d44' }}>

          {/* Linha 1: badge módulo + botões */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#6366f1',
              background: '#6366f115', border: '1px solid #6366f133',
              borderRadius: 20, padding: '4px 14px', textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              {transacao.modulo}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {canEdit && onDelete && (
                <button onClick={onDelete} style={{
                  background: '#7f1d1d20', border: '1px solid #ef444430', color: '#fca5a5',
                  borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}>🗑 Excluir</button>
              )}
              <button onClick={onClose} style={{
                background: '#ffffff10', border: '1px solid #ffffff15', color: '#94a3b8',
                borderRadius: '50%', width: 32, height: 32, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
          </div>

          {/* Linha 2: título + ponto focal lado a lado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 24, alignItems: 'start' }}>

            {/* Esquerda */}
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: 12, lineHeight: 1.2 }}>
                {transacao.transacao}
              </h2>

              {/* Descrição inline editável */}
              {canEdit && editandoDesc ? (
                <div style={{ background: '#0f0f17', border: '1px solid #6366f155', borderRadius: 12, padding: 14 }}>
                  <textarea
                    value={draftDesc}
                    onChange={e => setDraftDesc(e.target.value)}
                    autoFocus rows={3}
                    style={{
                      width: '100%', background: 'transparent', border: 'none', outline: 'none',
                      color: '#e2e8f0', fontSize: 14, fontFamily: 'Inter, sans-serif',
                      resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditandoDesc(false)} style={smallBtn('#64748b')}>Cancelar</button>
                    <button onClick={saveDesc} style={smallBtn('#6366f1')}>Salvar</button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={canEdit ? () => { setEditandoDesc(true); setDraftDesc(transacao.descricao || '') } : undefined}
                  style={{
                    fontSize: 14, color: transacao.descricao ? '#94a3b8' : '#334155',
                    lineHeight: 1.7, cursor: canEdit ? 'pointer' : 'default', borderRadius: 10,
                    padding: '8px 10px', margin: '-8px -10px',
                    border: '1px solid transparent', transition: 'all 0.15s',
                  }}
                  onMouseEnter={canEdit ? e => { e.currentTarget.style.borderColor = '#2d2d44'; e.currentTarget.style.background = '#0f0f17' } : undefined}
                  onMouseLeave={canEdit ? e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent' } : undefined}
                >
                  {transacao.descricao
                    ? transacao.descricao
                    : canEdit
                      ? <span style={{ fontStyle: 'italic', color: '#334155' }}>Clique para adicionar descrição...</span>
                      : <span style={{ fontStyle: 'italic', color: '#334155' }}>Sem descrição</span>
                  }
                </div>
              )}
            </div>

            {/* Direita: ponto focal */}
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
                Ponto focal
              </span>

              {editandoFocal ? (                <div style={{ background: '#0f0f17', border: '1px solid #2d2d44', borderRadius: 14, overflow: 'hidden' }}>
                  <input
                    value={buscaFocal}
                    onChange={e => setBuscaFocal(e.target.value)}
                    placeholder="Buscar..."
                    autoFocus
                    style={{
                      width: '100%', background: 'transparent', border: 'none', outline: 'none',
                      padding: '9px 12px', color: '#e2e8f0', fontSize: 13,
                      fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                      borderBottom: '1px solid #2d2d44',
                    }}
                  />
                  <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                    {pontoFocal && (
                      <button onClick={() => savePontoFocal(null)} style={focalOpt(false)}>
                        <span style={{ fontSize: 14 }}>✕</span>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>Remover</span>
                      </button>
                    )}
                    {users.filter(u => !buscaFocal || (u.nome_usuario || '').toLowerCase().includes(buscaFocal.toLowerCase())).map(u => (
                      <button key={u.id} onClick={() => savePontoFocal(u.id)} style={focalOpt(pontoFocal?.id === u.id)}>
                        <Avatar user={u} size={24} />
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nome_usuario}</div>
                          {u.cargo && <div style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.cargo}</div>}
                        </div>
                        {pontoFocal?.id === u.id && <span style={{ marginLeft: 'auto', color: '#6366f1', fontSize: 12, flexShrink: 0 }}>✓</span>}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setEditandoFocal(false); setBuscaFocal('') }} style={{ width: '100%', background: 'none', border: 'none', borderTop: '1px solid #2d2d44', color: '#64748b', padding: '7px', cursor: 'pointer', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                    Cancelar
                  </button>
                </div>

              ) : pontoFocal ? (
                <div
                  onClick={canEdit ? () => setEditandoFocal(true) : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#0f0f17', border: '1px solid #2d2d44', borderRadius: 14,
                    padding: '10px 12px', cursor: canEdit ? 'pointer' : 'default', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={canEdit ? e => e.currentTarget.style.borderColor = '#6366f155' : undefined}
                  onMouseLeave={canEdit ? e => e.currentTarget.style.borderColor = '#2d2d44' : undefined}
                >
                  <Avatar user={pontoFocal} size={40} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pontoFocal.nome_usuario}</div>
                    {pontoFocal.cargo && <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pontoFocal.cargo}</div>}
                  </div>
                </div>
              ) : (
                canEdit ? (
                <button
                  onClick={() => setEditandoFocal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    background: '#0f0f17', border: '1px dashed #2d2d44', borderRadius: 14,
                    padding: '10px 12px', color: '#475569', fontSize: 12,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f155'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#2d2d44'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1e1e2e', border: '1px dashed #3d3d55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👤</div>
                  <span>Definir ponto focal</span>
                </button>
                ) : (
                  <div style={{ fontSize: 13, color: '#475569', fontStyle: 'italic' }}>Não definido</div>
                )
              )}
            </div>
          </div>
        </div>

        {/* ── DETALHAMENTO ── */}
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {detalhes.length === 0 && !addingText && (
            <p style={{ color: '#475569', fontSize: 13, fontStyle: 'italic' }}>Nenhum detalhe ainda. Adicione textos ou imagens abaixo.</p>
          )}

          {detalhes.map((d, i) => (
            <DetalheBlock key={d.id} detalhe={d} index={i} total={detalhes.length}
              canEdit={canEdit}
              onDelete={() => deleteDetalhe(d.id)}
              onMove={(dir) => moveDetalhe(i, dir)}
              onSaveTexto={(c) => saveDetalheTexto(d.id, c)}
            />
          ))}

          {addingText && (
            <div style={{ background: '#0f0f17', border: '1px solid #6366f133', borderRadius: 14, padding: 16 }}>
              <textarea
                value={novoTexto} onChange={e => setNovoTexto(e.target.value)}
                placeholder="Digite o texto..." autoFocus rows={4}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 14, fontFamily: 'Inter, sans-serif', resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => { setAddingText(false); setNovoTexto('') }} style={smallBtn('#64748b')}>Cancelar</button>
                <button onClick={addTexto} disabled={!novoTexto.trim()} style={smallBtn('#6366f1')}>Salvar</button>
              </div>
            </div>
          )}
        </div>

        {/* ── AÇÕES ── */}
        {canEdit && (
        <div style={{ padding: '16px 32px 28px', borderTop: '1px solid #2d2d44', display: 'flex', gap: 10 }}>
          {!addingText && <button onClick={() => setAddingText(true)} style={smallBtn('#6366f1')}>+ Texto</button>}
          <button onClick={() => fileRef.current.click()} disabled={uploading} style={smallBtn('#22c55e')}>
            {uploading ? 'Enviando...' : '📎 Imagem'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) uploadImagem(e.target.files[0]); e.target.value = '' }} />
        </div>
        )}
      </div>
    </div>
  )
}

function Avatar({ user, size = 36 }) {
  const initials = (user.nome_usuario || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#6366f122', border: '2px solid #6366f144', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
      {user.foto
        ? <img src={user.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.32, fontWeight: 700, color: '#6366f1' }}>{initials}</span>
      }
    </div>
  )
}

function DetalheBlock({ detalhe, index, total, onDelete, onMove, onSaveTexto, canEdit = false }) {
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(detalhe.conteudo)

  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', background: '#0f0f17', border: `1px solid ${editing ? '#6366f155' : '#2d2d44'}`, borderRadius: 14, overflow: 'hidden' }}
    >
      {detalhe.tipo === 'texto' ? (
        canEdit && editing ? (
          <div style={{ padding: 14 }}>
            <textarea value={draft} onChange={e => setDraft(e.target.value)} autoFocus rows={4}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 14, fontFamily: 'Inter, sans-serif', resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setEditing(false); setDraft(detalhe.conteudo) }} style={smallBtn('#64748b')}>Cancelar</button>
              <button onClick={() => { if (draft.trim()) onSaveTexto(draft.trim()); setEditing(false) }} style={smallBtn('#6366f1')}>Salvar</button>
            </div>
          </div>
        ) : (
          <p onClick={canEdit ? () => setEditing(true) : undefined}
            style={{ padding: '14px 18px', fontSize: 14, color: '#cbd5e1', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', cursor: canEdit ? 'text' : 'default' }}>
            {detalhe.conteudo}
          </p>
        )
      ) : (
        <img src={detalhe.conteudo} alt="detalhe" style={{ width: '100%', display: 'block', maxHeight: 480, objectFit: 'contain', background: '#0a0a12' }} />
      )}

      {canEdit && hovered && !editing && (
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
          {detalhe.tipo === 'texto' && <button onClick={() => setEditing(true)} style={ctrlBtn}>✎</button>}
          {index > 0 && <button onClick={() => onMove(-1)} style={ctrlBtn}>↑</button>}
          {index < total - 1 && <button onClick={() => onMove(1)} style={ctrlBtn}>↓</button>}
          <button onClick={onDelete} style={{ ...ctrlBtn, color: '#fca5a5', background: '#7f1d1d99' }}>✕</button>
        </div>
      )}
    </div>
  )
}

const smallBtn = (color) => ({ background: `${color}22`, border: `1px solid ${color}55`, color, borderRadius: 20, padding: '7px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' })
const ctrlBtn = { background: '#1e1e2ecc', border: '1px solid #2d2d44', color: '#94a3b8', borderRadius: 8, padding: '3px 8px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const focalOpt = (selected) => ({ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', background: selected ? '#6366f115' : 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', borderBottom: '1px solid #2d2d44' })

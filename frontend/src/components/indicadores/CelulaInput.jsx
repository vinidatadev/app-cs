import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'
import { formatNumeroBR } from '../../utils/numeros'

const MESES_LABEL = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']

function nomeDe(users, id) {
  return users?.find(u => u.id_user === id)?.nome_usuario || id || 'Usuário'
}

function iniciais(nome) {
  const partes = String(nome || '?').trim().split(/\s+/)
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase() || '?'
}

function corAvatar(nome) {
  const cores = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444']
  let h = 0
  for (let i = 0; i < String(nome || '').length; i++) h = (h * 31 + String(nome).charCodeAt(i)) % 997
  return cores[h % cores.length]
}

export default function CelulaInput({
  indicador, valorRow, localValue, onLocalChange, users, canEdit, ano, mes,
  comentariosIniciais, hoverComentarios,
}) {
  const { user } = useAuth()
  const [showComment, setShowComment] = useState(false)
  const [comentarios, setComentarios] = useState([])
  const [hasLoadedComments, setHasLoadedComments] = useState(false)
  const [novoComentario, setNovoComentario] = useState('')
  const [uploadingImg, setUploadingImg] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hoverBox, setHoverBox] = useState(null)
  const fileRef = useRef()
  const cellRef = useRef()

  useEffect(() => {
    setComentarios([])
    setHasLoadedComments(false)
  }, [valorRow?.id])

  useEffect(() => {
    if (showComment && valorRow?.id && !hasLoadedComments) {
      supabase.from('ind_comentario')
        .select('*').eq('id_valor', valorRow.id)
        .order('criado_em', { ascending: true })
        .then(({ data }) => { setComentarios(data || []); setHasLoadedComments(true) })
    }
  }, [showComment, valorRow?.id, hasLoadedComments])

  const listaComentarios = hasLoadedComments ? comentarios : (comentariosIniciais || [])
  const totalComentarios = listaComentarios.length

  function formatDisplay(v) {
    return formatNumeroBR(v, { percentual: indicador.tipo === 'percentual' })
  }

  const savedVal = valorRow?.valor ?? null
  const displayVal = localValue !== undefined
    ? localValue
    : (focused ? String(savedVal ?? '') : formatDisplay(savedVal))
  const isDirty = localValue !== undefined && String(localValue) !== String(savedVal ?? '')

  async function reloadComentarios(vId) {
    const { data } = await supabase.from('ind_comentario')
      .select('*').eq('id_valor', vId).order('criado_em', { ascending: true })
    setComentarios(data || [])
    setHasLoadedComments(true)
  }

  async function sendComment(imagemUrl = null) {
    if (!novoComentario.trim() && !imagemUrl) return
    const vId = valorRow?.id
    if (!vId) return
    await supabase.from('ind_comentario').insert({
      id_valor: vId,
      texto: novoComentario.trim() || 'Imagem anexada',
      autor_id: user.id_user,
      imagem_url: imagemUrl || null,
    })
    setNovoComentario('')
    await reloadComentarios(vId)
  }

  async function handleImageUpload(file) {
    if (!file) return
    setUploadingImg(true)
    const ext = file.name.split('.').pop()
    const path = `indicadores/comentarios/${valorRow?.id || 'sem-id'}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('task-attachments').upload(path, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('task-attachments').getPublicUrl(data.path)
      await sendComment(urlData.publicUrl)
    }
    setUploadingImg(false)
  }

  function abrirHover() {
    if (!hoverComentarios || totalComentarios === 0 || !cellRef.current) return
    const r = cellRef.current.getBoundingClientRect()
    const largura = 300
    const acima = r.top > 240
    setHoverBox({
      left: Math.min(Math.max(r.left + r.width / 2, largura / 2 + 8), window.innerWidth - largura / 2 - 8),
      top: acima ? r.top - 8 : r.bottom + 8,
      acima,
      largura,
    })
  }

  return (
    <td
      ref={cellRef}
      style={{
        padding: 0, textAlign: 'right', position: 'relative', minWidth: 72,
        borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
      }}
      onMouseEnter={abrirHover}
      onMouseLeave={() => setHoverBox(null)}
    >
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          readOnly={!canEdit}
          value={displayVal}
          onChange={e => canEdit && onLocalChange(e.target.value)}
          placeholder="--"
          style={{
            width: '100%', background: isDirty ? '#6366f110' : 'transparent',
            border: 'none', borderLeft: isDirty ? '2px solid #6366f1' : '2px solid transparent',
            padding: '5px 22px 5px 6px', color: isDirty ? '#a5b4fc' : (displayVal ? 'var(--text)' : 'var(--text5)'),
            fontSize: 12, textAlign: 'right', outline: 'none',
            fontFamily: 'Inter, sans-serif', cursor: canEdit ? 'text' : 'default',
            transition: 'background 0.1s',
          }}
          onFocus={e => { setFocused(true); if (canEdit) e.currentTarget.style.background = 'var(--bg3)' }}
          onBlur={e => { setFocused(false); e.currentTarget.style.background = isDirty ? '#6366f110' : 'transparent' }}
        />

        <button
          onClick={() => setShowComment(true)}
          title={totalComentarios > 0 ? `${totalComentarios} comentário(s)` : 'Adicionar comentário'}
          style={{
            position: 'absolute', top: 2, right: 2,
            background: totalComentarios > 0 ? '#f59e0b' : 'transparent',
            border: totalComentarios > 0 ? 'none' : '1px solid var(--border)',
            cursor: 'pointer',
            fontSize: 9, fontWeight: 800, lineHeight: 1, padding: totalComentarios > 0 ? '2px 4px' : '1px 3px',
            borderRadius: 99, color: totalComentarios > 0 ? '#111827' : 'var(--text5)',
            fontFamily: 'Inter, sans-serif',
            opacity: totalComentarios > 0 ? 1 : 0.55,
            transition: 'opacity 0.15s, color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.borderColor = '#6366f1' }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = totalComentarios > 0 ? 1 : 0.55
            e.currentTarget.style.color = totalComentarios > 0 ? '#111827' : 'var(--text5)'
            e.currentTarget.style.borderColor = totalComentarios > 0 ? 'transparent' : 'var(--border)'
          }}
        >{totalComentarios > 0 ? totalComentarios : '+'}</button>
      </div>

      {/* Tooltip de comentários no hover */}
      {hoverBox && (
        <div style={{
          position: 'fixed',
          left: hoverBox.left,
          top: hoverBox.top,
          transform: hoverBox.acima ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          width: hoverBox.largura,
          maxHeight: 280,
          overflow: 'hidden',
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
          zIndex: 4000,
          pointerEvents: 'none',
          padding: 12,
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text4)', marginBottom: 8, letterSpacing: '0.04em' }}>
            COMENTÁRIOS ({totalComentarios})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {listaComentarios.slice(-3).map(c => (
              <div key={c.id} style={{
                background: 'var(--bg3)', borderRadius: 8, padding: '7px 9px',
                borderLeft: `3px solid ${corAvatar(nomeDe(users, c.autor_id))}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: corAvatar(nomeDe(users, c.autor_id)) }}>
                    {nomeDe(users, c.autor_id)}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text5)', flexShrink: 0 }}>
                    {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.45, wordBreak: 'break-word' }}>
                  {c.texto}
                </div>
                {c.imagem_url && (
                  <img src={c.imagem_url} alt="anexo" style={{ marginTop: 5, maxWidth: '100%', maxHeight: 70, borderRadius: 6, objectFit: 'cover' }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text5)', marginTop: 7, textAlign: 'right' }}>
            Clique no valor para abrir
          </div>
        </div>
      )}

      {/* Modal de comentários */}
      {showComment && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
        }} onClick={e => e.target === e.currentTarget && setShowComment(false)}>
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16,
            width: 440, maxWidth: '94vw', maxHeight: '82vh', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          }}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
              background: 'var(--bg3)',
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>{indicador.nome}</div>
                <div style={{ fontSize: 11, color: 'var(--text5)', marginTop: 2 }}>
                  {MESES_LABEL[mes - 1]}/{ano}
                  {' - '}valor {formatDisplay(savedVal) || 'não informado'}
                  {totalComentarios > 0 ? ` - ${totalComentarios} comentário(s)` : ''}
                </div>
              </div>
              <button onClick={() => setShowComment(false)} style={{ background: 'none', border: 'none', color: 'var(--text4)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>x</button>
            </div>

            {!valorRow?.id && (
              <p style={{ margin: 12, fontSize: 12, color: '#f59e0b', background: '#f59e0b10', borderRadius: 8, padding: '8px 12px' }}>
                Salve os valores primeiro para poder comentar nesta célula.
              </p>
            )}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
              {listaComentarios.length === 0 && valorRow?.id && (
                <p style={{ color: 'var(--text5)', fontSize: 12, textAlign: 'center', padding: 24 }}>
                  Nenhum comentário ainda.
                </p>
              )}
              {listaComentarios.map(c => {
                const autor = nomeDe(users, c.autor_id)
                const cor = corAvatar(autor)
                return (
                  <div key={c.id} style={{
                    display: 'flex', gap: 9, alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: `${cor}22`, color: cor, border: `1px solid ${cor}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800,
                    }}>{iniciais(autor)}</div>
                    <div style={{
                      flex: 1, background: 'var(--bg3)', borderRadius: 10,
                      border: '1px solid var(--border)', padding: '9px 11px',
                      borderTopLeftRadius: 3,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: cor }}>{autor}</span>
                        <span style={{ fontSize: 9, color: 'var(--text5)' }}>
                          {new Date(c.criado_em).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {c.texto}
                      </p>
                      {c.imagem_url && (
                        <img src={c.imagem_url} alt="anexo" style={{ marginTop: 8, maxWidth: '100%', maxHeight: 220, borderRadius: 8, border: '1px solid var(--border)', objectFit: 'contain' }} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {canEdit && valorRow?.id && (
              <div style={{ borderTop: '1px solid var(--border)', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg3)' }}>
                <textarea
                  value={novoComentario}
                  onChange={e => setNovoComentario(e.target.value)}
                  placeholder="Escreva um comentário..."
                  rows={2}
                  style={{
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 9,
                    padding: '9px 11px', color: 'var(--text)', fontSize: 12,
                    fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingImg}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text4)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                  >
                    {uploadingImg ? 'Enviando...' : 'Anexar imagem'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => handleImageUpload(e.target.files[0])} />
                  <button
                    onClick={() => sendComment()}
                    disabled={!novoComentario.trim()}
                    style={{
                      flex: 2, padding: '8px 16px', borderRadius: 8,
                      background: novoComentario.trim() ? '#6366f1' : 'var(--border)', border: 'none', color: '#fff',
                      fontSize: 12, fontWeight: 700, cursor: novoComentario.trim() ? 'pointer' : 'default',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >Enviar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </td>
  )
}

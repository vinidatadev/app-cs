import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

const MESES_LABEL = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']

export default function CelulaInput({ indicador, valorRow, localValue, onLocalChange, users, canEdit, ano, mes }) {
  const { user } = useAuth()
  const [showComment, setShowComment] = useState(false)
  const [comentarios, setComentarios] = useState([])
  const [hasLoadedComments, setHasLoadedComments] = useState(false)
  const [novoComentario, setNovoComentario] = useState('')
  const [uploadingImg, setUploadingImg] = useState(false)
  const fileRef = useRef()

  // Carrega comentários quando abre o modal (só uma vez por valorRow)
  useEffect(() => {
    if (showComment && valorRow?.id && !hasLoadedComments) {
      supabase.from('ind_comentario')
        .select('*').eq('id_valor', valorRow.id)
        .order('criado_em', { ascending: true })
        .then(({ data }) => { setComentarios(data || []); setHasLoadedComments(true) })
    }
  }, [showComment])

  function formatDisplay(v) {
    if (v === null || v === undefined || v === '') return ''
    const num = parseFloat(String(v).replace(',', '.'))
    if (isNaN(num)) return v
    if (indicador.tipo === 'percentual') return `${num.toFixed(0)}%`
    return num.toLocaleString('pt-BR')
  }

  // Valor a exibir: prefere o local (em edição), cai no salvo no banco
  const savedVal = valorRow?.valor ?? null
  const displayVal = localValue !== undefined ? localValue : (savedVal !== null ? String(savedVal) : '')
  const isDirty = localValue !== undefined && String(localValue) !== String(savedVal ?? '')

  function nomeAutor(autorId) {
    return users?.find(u => u.id_user === autorId)?.nome_usuario || autorId
  }

  async function reloadComentarios(vId) {
    const { data } = await supabase.from('ind_comentario')
      .select('*').eq('id_valor', vId).order('criado_em', { ascending: true })
    setComentarios(data || [])
  }

  async function sendComment(imagemUrl = null) {
    if (!novoComentario.trim() && !imagemUrl) return
    let vId = valorRow?.id
    if (!vId) return // sem valor salvo, comentário só depois de salvar
    await supabase.from('ind_comentario').insert({
      id_valor: vId,
      texto: novoComentario.trim() || '📎 Imagem anexada',
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

  const hasComments = comentarios.length > 0 || (valorRow?.id && !hasLoadedComments)

  return (
    <td style={{
      padding: 0, textAlign: 'right', position: 'relative', minWidth: 72,
      borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          readOnly={!canEdit}
          value={displayVal}
          onChange={e => canEdit && onLocalChange(e.target.value)}
          placeholder="—"
          style={{
            width: '100%', background: isDirty ? '#6366f110' : 'transparent',
            border: 'none', borderLeft: isDirty ? '2px solid #6366f1' : '2px solid transparent',
            padding: '5px 22px 5px 6px', color: isDirty ? '#a5b4fc' : (displayVal ? 'var(--text)' : 'var(--text5)'),
            fontSize: 12, textAlign: 'right', outline: 'none',
            fontFamily: 'Inter, sans-serif', cursor: canEdit ? 'text' : 'default',
            transition: 'background 0.1s',
          }}
          onFocus={e => canEdit && (e.currentTarget.style.background = 'var(--bg3)')}
          onBlur={e => (e.currentTarget.style.background = isDirty ? '#6366f110' : 'transparent')}
        />

        {/* Indicador de comentário */}
        <button
          onClick={() => setShowComment(true)}
          title={comentarios.length > 0 ? `${comentarios.length} comentário(s)` : 'Comentar'}
          style={{
            position: 'absolute', top: 3, right: 3,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 7, lineHeight: 1, padding: 0,
            color: valorRow?.id ? '#f59e0b' : 'transparent',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#6366f1')}
          onMouseLeave={e => (e.currentTarget.style.color = valorRow?.id ? '#f59e0b' : 'transparent')}
        >●</button>
      </div>

      {/* Modal comentários */}
      {showComment && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
        }} onClick={e => e.target === e.currentTarget && setShowComment(false)}>
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14,
            padding: 20, width: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text2)' }}>
                💬 {indicador.nome} — {MESES_LABEL[mes - 1]}/{ano}
              </span>
              <button onClick={() => setShowComment(false)} style={{ background: 'none', border: 'none', color: 'var(--text4)', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>

            {!valorRow?.id && (
              <p style={{ fontSize: 12, color: '#f59e0b', background: '#f59e0b10', borderRadius: 8, padding: '8px 12px' }}>
                Salve os valores primeiro para poder comentar nesta célula.
              </p>
            )}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280 }}>
              {comentarios.length === 0 && valorRow?.id && (
                <p style={{ color: 'var(--text5)', fontSize: 12, textAlign: 'center', padding: 20 }}>Nenhum comentário ainda.</p>
              )}
              {comentarios.map(c => (
                <div key={c.id} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1' }}>{nomeAutor(c.autor_id)}</span>
                    <span style={{ fontSize: 10, color: 'var(--text5)' }}>{new Date(c.criado_em).toLocaleString('pt-BR')}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{c.texto}</p>
                  {c.imagem_url && (
                    <img src={c.imagem_url} alt="anexo" style={{ marginTop: 8, maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
                  )}
                </div>
              ))}
            </div>

            {canEdit && valorRow?.id && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  value={novoComentario}
                  onChange={e => setNovoComentario(e.target.value)}
                  placeholder="Escreva um comentário..."
                  rows={2}
                  style={{
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
                    padding: '8px 10px', color: 'var(--text)', fontSize: 12,
                    fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingImg}
                    style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text4)', fontSize: 12, cursor: 'pointer' }}
                  >
                    {uploadingImg ? 'Enviando...' : '📎 Imagem'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => handleImageUpload(e.target.files[0])} />
                  <button
                    onClick={() => sendComment()}
                    disabled={!novoComentario.trim()}
                    style={{
                      flex: 2, padding: '7px 16px', borderRadius: 8,
                      background: '#6366f1', border: 'none', color: '#fff',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
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

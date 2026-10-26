import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']
const STATUS_CONFIG = {
  aberta:    { label: 'Aberta',      color: '#6366f1' },
  andamento: { label: 'Em andamento',color: '#f59e0b' },
  concluida: { label: 'Concluída',   color: '#22c55e' },
  cancelada: { label: 'Cancelada',   color: '#ef4444' },
}

export default function TarefaModal({ tarefa, grupo, onClose, onSave, users, canEdit }) {
  const { user } = useAuth()
  const [comentarios, setComentarios] = useState([])
  const [anexos, setAnexos] = useState([])
  const [novoComentario, setNovoComentario] = useState('')
  const [status, setStatus] = useState(tarefa.status)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  useEffect(() => { fetchDetalhes() }, [tarefa.id])

  async function fetchDetalhes() {
    const [{ data: coms }, { data: anx }] = await Promise.all([
      supabase.from('ind_tarefa_comentario').select('*').eq('id_tarefa', tarefa.id).order('criado_em'),
      supabase.from('ind_tarefa_anexo').select('*').eq('id_tarefa', tarefa.id).order('criado_em'),
    ])
    setComentarios(coms || [])
    setAnexos(anx || [])
  }

  async function salvarStatus(novoStatus) {
    setStatus(novoStatus)
    await supabase.from('ind_tarefa').update({
      status: novoStatus, atualizado_em: new Date().toISOString(),
    }).eq('id', tarefa.id)
    onSave()
  }

  async function enviarComentario(imagemUrl = null) {
    if (!novoComentario.trim() && !imagemUrl) return
    await supabase.from('ind_tarefa_comentario').insert({
      id_tarefa: tarefa.id,
      texto: novoComentario.trim() || '📎 Arquivo anexado',
      autor_id: user.id_user,
    })
    setNovoComentario('')
    await fetchDetalhes()
  }

  async function uploadAnexo(file) {
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const ext = file.name.split('.').pop()
    const path = `indicadores/tarefas/${tarefa.id}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('task-attachments').upload(path, file, { upsert: true })
    if (error) return
    const { data: urlData } = supabase.storage.from('task-attachments').getPublicUrl(data.path)
    await supabase.from('ind_tarefa_anexo').insert({
      id_tarefa: tarefa.id, nome: file.name,
      url: urlData.publicUrl, tipo: isImage ? 'imagem' : 'arquivo',
    })
    await enviarComentario(urlData.publicUrl)
  }

  function nomeUser(id) {
    return users?.find(u => u.id_user === id)?.nome_usuario || id || '—'
  }

  const sc = STATUS_CONFIG[status]

  // Vinculo da tarefa
  const vinculoTexto = [
    tarefa.ind_subgrupo?.nome,
    tarefa.ind_indicador?.nome,
    tarefa.mes_ref ? MESES[tarefa.mes_ref - 1] : null,
    tarefa.ano_ref,
  ].filter(Boolean).join(' › ')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text2)', marginBottom: 4 }}>{tarefa.titulo}</div>
            {vinculoTexto && (
              <div style={{ fontSize: 11, color: 'var(--text5)' }}>📍 {grupo?.nome} {vinculoTexto && `› ${vinculoTexto}`}</div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text4)', fontSize: 18, cursor: 'pointer', marginLeft: 12 }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* Detalhes */}
          <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, borderBottom: '1px solid var(--border)' }}>
            <Info label="Responsável" value={nomeUser(tarefa.responsavel_id)} />
            <Info label="Criado por" value={nomeUser(tarefa.criado_por)} />
            <Info label="Início" value={tarefa.data_inicio ? new Date(tarefa.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '—'} />
            <Info label="Prazo" value={tarefa.data_fim ? new Date(tarefa.data_fim + 'T00:00:00').toLocaleDateString('pt-BR') : '—'} />
            {tarefa.descricao && (
              <div style={{ gridColumn: '1/-1' }}>
                <Info label="Descrição" value={tarefa.descricao} />
              </div>
            )}
          </div>

          {/* Status */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text5)', marginRight: 4 }}>Status:</span>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <button key={k} onClick={() => canEdit && salvarStatus(k)} style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: status === k ? `${v.color}22` : 'transparent',
                color: status === k ? v.color : 'var(--text5)',
                border: `1px solid ${status === k ? v.color + '55' : 'var(--border)'}`,
                cursor: canEdit ? 'pointer' : 'default',
              }}>{v.label}</button>
            ))}
          </div>

          {/* Anexos */}
          {anexos.length > 0 && (
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {anexos.map(a => (
                <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  {a.tipo === 'imagem' ? (
                    <img src={a.url} alt={a.nome} style={{ height: 60, borderRadius: 6, border: '1px solid var(--border)', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ padding: '5px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text3)' }}>
                      📄 {a.nome}
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}

          {/* Comentários */}
          <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comentarios.length === 0 && <p style={{ fontSize: 12, color: 'var(--text5)' }}>Nenhum comentário ainda.</p>}
            {comentarios.map(c => (
              <div key={c.id} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1' }}>{nomeUser(c.autor_id)}</span>
                  <span style={{ fontSize: 10, color: 'var(--text5)' }}>{new Date(c.criado_em).toLocaleString('pt-BR')}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{c.texto}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Input novo comentário */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <textarea
            value={novoComentario}
            onChange={e => setNovoComentario(e.target.value)}
            placeholder="Comentário ou registro de conclusão..."
            rows={2}
            style={{
              flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
              padding: '7px 10px', color: 'var(--text)', fontSize: 12,
              fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => fileRef.current?.click()} style={btnSm}>📎</button>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => uploadAnexo(e.target.files[0])} />
            <button onClick={() => enviarComentario()} disabled={!novoComentario.trim()} style={{ ...btnSm, background: '#6366f1', color: '#fff', border: 'none' }}>➤</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text5)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text)' }}>{value}</div>
    </div>
  )
}

const btnSm = {
  padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg3)', color: 'var(--text3)', fontSize: 12, cursor: 'pointer',
}

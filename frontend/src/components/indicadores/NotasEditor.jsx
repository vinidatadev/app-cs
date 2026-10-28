import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import { api } from '../../apiClient'
import { useAuth } from '../../context/AuthContext'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function NotasEditor({ referencia, idGrupo, idSubgrupo, canEdit, users }) {
  const { user } = useAuth()
  const [notas, setNotas] = useState([])
  const [notaAtiva, setNotaAtiva] = useState(null)
  const [notasAntigas, setNotasAntigas] = useState([])
  const [visualizando, setVisualizando] = useState(null)
  const [confirmandoNova, setConfirmandoNova] = useState(false)
  const [criandoNova, setCriandoNova] = useState(false)
  const [tituloAtivo, setTituloAtivo] = useState('')
  const [titulo, setTitulo] = useState('')
  const [mesRef, setMesRef] = useState('')
  const [anoRef, setAnoRef] = useState(new Date().getFullYear())
  const [anexos, setAnexos] = useState([])
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const fileRef = useRef()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image,
    ],
    content: '',
    editable: false,
  })

  useEffect(() => { fetchNotas() }, [referencia, idGrupo, idSubgrupo])

  useEffect(() => {
    if (!editor) return
    if (notaAtiva) {
      editor.commands.setContent(notaAtiva.conteudo_html || '')
      editor.setEditable(canEdit && notaAtiva.status === 'ativa')
    } else {
      editor.commands.setContent('')
      editor.setEditable(false)
    }
  }, [notaAtiva, editor, canEdit])

  function nomeAutor(autorId) {
    if (!autorId) return ''
    return users?.find(u => u.id_user === autorId)?.nome_usuario || autorId
  }

  function escopo(q) {
    let query = q.eq('referencia', referencia)
    if (idGrupo) query = query.eq('id_grupo', idGrupo)
    if (idSubgrupo) query = query.eq('id_subgrupo', idSubgrupo)
    return query
  }

  async function fetchNotas() {
    const { data, error } = await escopo(
      api.from('ind_nota').select('*, ind_nota_anexo(*)')
    ).order('criado_em', { ascending: false })

    if (error) {
      setErro(error.message)
      return
    }

    const lista = data || []
    setNotas(lista)

    // A nota atual é a mais recente ainda marcada como ativa
    const ativa = lista.find(n => n.status === 'ativa') || null
    setNotaAtiva(ativa)
    setNotasAntigas(lista.filter(n => !ativa || n.id !== ativa.id))
    setTituloAtivo(ativa?.titulo || '')
    setAnexos(ativa?.ind_nota_anexo || [])
  }

  async function salvarNota() {
    if (!notaAtiva || !editor) return
    setSaving(true)
    setErro('')
    const html = editor.getHTML()
    const { error } = await api.from('ind_nota').update({
      conteudo_html: html,
      titulo: tituloAtivo || notaAtiva.titulo,
      atualizado_em: new Date().toISOString(),
    }).eq('id', notaAtiva.id)
    setSaving(false)
    if (error) {
      setErro(error.message)
      return
    }
    await fetchNotas()
  }

  async function arquivarAtivas() {
    // Arquiva todas as notas ainda ativas do mesmo escopo
    for (const n of notas.filter(x => x.status === 'ativa')) {
      const { error } = await api.from('ind_nota')
        .update({ status: 'arquivada', atualizado_em: new Date().toISOString() })
        .eq('id', n.id)
      if (error) return error.message
    }
    return null
  }

  async function criarNovaNota() {
    setErro('')
    const erroArquivo = await arquivarAtivas()
    if (erroArquivo) {
      setErro(erroArquivo)
      return
    }

    const { error } = await api.from('ind_nota').insert({
      referencia,
      id_grupo: idGrupo || null,
      id_subgrupo: idSubgrupo || null,
      titulo: titulo || `Nota ${new Date().toLocaleDateString('pt-BR')}`,
      conteudo_html: '',
      mes_ref: mesRef ? parseInt(mesRef) : null,
      ano_ref: anoRef || new Date().getFullYear(),
      status: 'ativa',
      autor_id: user.id_user,
    })

    if (error) {
      setErro(error.message)
      return
    }

    setConfirmandoNova(false)
    setCriandoNova(false)
    setTitulo('')
    setMesRef('')
    await fetchNotas()
  }

  async function uploadAnexo(file) {
    if (!file || !notaAtiva) return
    setErro('')
    const isImage = file.type.startsWith('image/')
    const ext = file.name.split('.').pop()
    const path = `indicadores/notas/${notaAtiva.id}/${Date.now()}.${ext}`
    const { data, error } = await api.storage.from('task-attachments').upload(path, file, { upsert: true })
    if (error) {
      setErro(error.message)
      return
    }
    const { data: urlData } = api.storage.from('task-attachments').getPublicUrl(data.path)
    const { error: erroAnexo } = await api.from('ind_nota_anexo').insert({
      id_nota: notaAtiva.id, nome: file.name,
      url: urlData.publicUrl, tipo: isImage ? 'imagem' : 'arquivo',
    })
    if (erroAnexo) {
      setErro(erroAnexo.message)
      return
    }
    await fetchNotas()
  }

  function abrirNovaNota() {
    setErro('')
    if (notaAtiva) setConfirmandoNova(true)
    else setCriandoNova(true)
  }

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text2)' }}>Anotações</span>
        {canEdit && !criandoNova && !confirmandoNova && (
          <button onClick={abrirNovaNota} style={btnSm}>+ Nova nota</button>
        )}
      </div>

      {erro && (
        <div style={{ padding: '8px 16px', background: '#ef444422', color: '#ef4444', fontSize: 11, borderBottom: '1px solid var(--border)' }}>
          {erro}
        </div>
      )}

      {/* Confirmação de finalização da nota atual */}
      {confirmandoNova && (
        <div style={{ padding: '12px 16px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>
            Finalizar a nota atual?
          </div>
          <div style={{ fontSize: 11, color: 'var(--text5)', marginBottom: 10 }}>
            {notaAtiva.titulo ? `"${notaAtiva.titulo}" ` : 'A nota atual '}
            será arquivada e ficará disponível apenas para consulta no histórico. Depois disso você poderá criar a nova nota.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setConfirmandoNova(false); setCriandoNova(true) }} style={{ ...btnSm, background: '#6366f1', color: '#fff', border: 'none' }}>
              Finalizar e criar nova
            </button>
            <button onClick={() => setConfirmandoNova(false)} style={btnSm}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Formulário de nova nota */}
      {criandoNova && (
        <div style={{ padding: '12px 16px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={labelSm}>Título</label>
              <input value={titulo} onChange={e => setTitulo(e.target.value)} style={inputSm} placeholder="Título da nota" />
            </div>
            <div>
              <label style={labelSm}>Mês ref.</label>
              <select value={mesRef} onChange={e => setMesRef(e.target.value)} style={inputSm}>
                <option value="">--</option>
                {MESES_LABEL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSm}>Ano</label>
              <input type="number" value={anoRef} onChange={e => setAnoRef(e.target.value)} style={{ ...inputSm, width: 70 }} />
            </div>
            <button onClick={criarNovaNota} style={{ ...btnSm, background: '#6366f1', color: '#fff', border: 'none' }}>Criar</button>
            <button onClick={() => { setCriandoNova(false); setTitulo('') }} style={btnSm}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Nota ativa */}
      {notaAtiva ? (
        <>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {canEdit ? (
              <input
                value={tituloAtivo}
                onChange={e => setTituloAtivo(e.target.value)}
                placeholder="Título da nota"
                style={{ ...inputSm, fontWeight: 600, fontSize: 13, flex: 1, minWidth: 120 }}
              />
            ) : (
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)' }}>{notaAtiva.titulo}</span>
            )}
            <span style={{ fontSize: 10, color: '#6366f1', background: '#6366f122', borderRadius: 4, padding: '1px 6px' }}>atual</span>
            <span style={{ fontSize: 10, color: 'var(--text5)' }}>criada por {nomeAutor(notaAtiva.autor_id)}</span>
            {notaAtiva.mes_ref && (
              <span style={{ fontSize: 11, color: 'var(--text5)' }}>
                {MESES_LABEL[notaAtiva.mes_ref - 1]}/{notaAtiva.ano_ref}
              </span>
            )}
          </div>
          {canEdit && <Toolbar editor={editor} />}
          <div style={{ padding: '12px 16px', minHeight: 120 }}>
            <EditorContent editor={editor} />
          </div>

          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)' }}>
            {anexos.length > 0 && <AnexosList anexos={anexos} />}
            {canEdit && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => fileRef.current?.click()} style={btnSm}>Anexar</button>
                <input ref={fileRef} type="file" style={{ display: 'none' }}
                  onChange={e => uploadAnexo(e.target.files[0])} />
                <button onClick={salvarNota} disabled={saving} style={{ ...btnSm, background: '#6366f1', color: '#fff', border: 'none' }}>
                  {saving ? 'Salvando...' : 'Salvar nota'}
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text5)', fontSize: 13 }}>
          {canEdit ? 'Nenhuma nota ativa. Crie uma nova nota acima.' : 'Nenhuma nota disponível.'}
        </div>
      )}

      {/* Histórico de notas antigas (somente leitura) */}
      {notasAntigas.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', background: 'var(--bg3)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', marginBottom: 8 }}>
            Notas anteriores ({notasAntigas.length}) - somente leitura
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notasAntigas.map(n => (
              <button
                key={n.id}
                onClick={() => setVisualizando(n)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg2)', cursor: 'pointer', textAlign: 'left', gap: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text3)' }}>{n.titulo || 'Sem título'}</div>
                  <div style={{ fontSize: 10, color: 'var(--text5)', marginTop: 2 }}>
                    {n.mes_ref ? MESES_LABEL[n.mes_ref - 1] + '/' : ''}{n.ano_ref || ''}
                    {' - '}{new Date(n.criado_em).toLocaleDateString('pt-BR')}
                    {n.autor_id ? ` - por ${nomeAutor(n.autor_id)}` : ''}
                    {n.status === 'arquivada' ? ' - arquivada' : ''}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#6366f1', flexShrink: 0 }}>Ver</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visualizar nota antiga */}
      {visualizando && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
        }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, width: '90%', maxWidth: 640, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text2)', fontSize: 14 }}>{visualizando.titulo || 'Sem título'}</div>
                <div style={{ fontSize: 11, color: 'var(--text5)' }}>
                  {visualizando.mes_ref ? MESES_LABEL[visualizando.mes_ref - 1] + '/' : ''}{visualizando.ano_ref || ''}
                  {' - '}{new Date(visualizando.criado_em).toLocaleDateString('pt-BR')}
                  {' '}<span style={{ background: '#47556933', borderRadius: 4, padding: '1px 6px' }}>somente leitura</span>
                  {visualizando.autor_id ? ` - criada por ${nomeAutor(visualizando.autor_id)}` : ''}
                </div>
              </div>
              <button onClick={() => setVisualizando(null)} style={{ background: 'none', border: 'none', color: 'var(--text4)', fontSize: 18, cursor: 'pointer' }}>x</button>
            </div>
            <div className="tiptap-view" dangerouslySetInnerHTML={{ __html: visualizando.conteudo_html || '<p style="color:var(--text5)">Nota vazia.</p>' }} />
            {visualizando.ind_nota_anexo?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text5)', marginBottom: 6 }}>Anexos:</div>
                <AnexosList anexos={visualizando.ind_nota_anexo} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Toolbar({ editor }) {
  if (!editor) return null
  const btn = (action, label, active) => (
    <button
      key={label}
      onMouseDown={e => { e.preventDefault(); action() }}
      style={{
        padding: '3px 8px', borderRadius: 4, border: 'none', fontSize: 12,
        background: active ? '#6366f122' : 'transparent', color: active ? '#6366f1' : 'var(--text4)',
        cursor: 'pointer', fontWeight: 600,
      }}
      title={label}
    >{label}</button>
  )
  return (
    <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 2, flexWrap: 'wrap', background: 'var(--bg3)' }}>
      {btn(() => editor.chain().focus().toggleBold().run(), 'B', editor.isActive('bold'))}
      {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'))}
      {btn(() => editor.chain().focus().toggleUnderline().run(), 'U', editor.isActive('underline'))}
      {btn(() => editor.chain().focus().toggleStrike().run(), 'S', editor.isActive('strike'))}
      <span style={{ width: 1, background: 'var(--border)', margin: '2px 4px' }} />
      {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
      {btn(() => editor.chain().focus().toggleBulletList().run(), 'Lista', editor.isActive('bulletList'))}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. Lista', editor.isActive('orderedList'))}
      <span style={{ width: 1, background: 'var(--border)', margin: '2px 4px' }} />
      {btn(() => editor.chain().focus().setTextAlign('left').run(), 'Esq.', editor.isActive({ textAlign: 'left' }))}
      {btn(() => editor.chain().focus().setTextAlign('center').run(), 'Centro', editor.isActive({ textAlign: 'center' }))}
      {btn(() => editor.chain().focus().setTextAlign('right').run(), 'Dir.', editor.isActive({ textAlign: 'right' }))}
    </div>
  )
}

function AnexosList({ anexos }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {anexos.map(a => (
        <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          {a.tipo === 'imagem' ? (
            <img src={a.url} alt={a.nome} style={{ height: 64, borderRadius: 6, border: '1px solid var(--border)', objectFit: 'cover' }} />
          ) : (
            <div style={{ padding: '6px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text3)' }}>
              {a.nome}
            </div>
          )}
        </a>
      ))}
    </div>
  )
}

const btnSm = {
  padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg3)', color: 'var(--text3)', fontSize: 11, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
}
const labelSm = { display: 'block', fontSize: 10, color: 'var(--text5)', marginBottom: 3 }
const inputSm = {
  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
  padding: '5px 8px', color: 'var(--text)', fontSize: 12,
  fontFamily: 'Inter, sans-serif', outline: 'none',
}

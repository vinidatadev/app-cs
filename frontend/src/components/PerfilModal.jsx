import { useState, useRef } from 'react'
import { api } from '../apiClient'
import { useAuth } from '../context/AuthContext'

export default function PerfilModal({ onClose }) {
  const { user, refreshUser } = useAuth()
  const [nome, setNome] = useState(user?.nome_usuario || '')
  const [preview, setPreview] = useState(user?.foto || null)
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const inputRef = useRef()

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setErro('Selecione uma imagem válida.'); return }
    if (f.size > 5 * 1024 * 1024) { setErro('Imagem deve ter no máximo 5MB.'); return }
    setErro('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSave() {
    if (!nome.trim()) { setErro('Nome não pode ficar vazio.'); return }
    setSaving(true)
    setErro('')

    try {
      let fotoUrl = user?.foto || null

      if (file) {
        const ext = file.name.split('.').pop()
        const path = `perfil/${user.id_user}.${ext}`

        const { error: upErr } = await api.storage
          .from('imagens')
          .upload(path, file, { upsert: true, contentType: file.type })

        if (upErr) throw upErr

        const { data: { publicUrl } } = api.storage
          .from('imagens')
          .getPublicUrl(path)

        // Adiciona cache-buster pra forçar reload da imagem
        fotoUrl = `${publicUrl}?t=${Date.now()}`
      }

      const { error: dbErr } = await api
        .from('user')
        .update({ nome_usuario: nome.trim(), foto: fotoUrl })
        .eq('id_user', user.id_user)

      if (dbErr) throw dbErr

      await refreshUser()
      onClose()
    } catch (e) {
      setErro(e.message || 'Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const initials = (user?.nome_usuario || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text2)' }}>Meu Perfil</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Avatar + upload */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div
              onClick={() => inputRef.current?.click()}
              title="Clique para trocar a foto"
              style={{
                width: 90, height: 90, borderRadius: '50%',
                background: '#6366f122', border: '3px solid #6366f144',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', cursor: 'pointer', position: 'relative',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#6366f144'}
            >
              {preview
                ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 28, fontWeight: 700, color: '#6366f1' }}>{initials}</span>
              }
              {/* Overlay */}
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.15s', borderRadius: '50%',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <span style={{ fontSize: 20 }}>📷</span>
              </div>
            </div>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <span style={{ fontSize: 11, color: 'var(--text5)' }}>Clique na foto para alterar · máx. 5MB</span>
          </div>

          {/* Nome */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Nome
            </label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Seu nome"
              style={{
                width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 12px', color: 'var(--text)',
                fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Cargo (só leitura) */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Cargo
            </label>
            <div style={{ fontSize: 13, color: 'var(--text4)', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
              {user?.cargo || '—'}
            </div>
          </div>

          {erro && (
            <div style={{ background: '#ef444418', border: '1px solid #ef444444', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: '#fca5a5' }}>
              {erro}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '0 24px 24px' }}>
          <button onClick={onClose} style={btnStyle('#64748b')}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={btnStyle('#6366f1')}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const btnStyle = (color) => ({
  background: `${color}22`, border: `1px solid ${color}55`, color,
  borderRadius: 20, padding: '9px 22px', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
})

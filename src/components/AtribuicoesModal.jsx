import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const CORES = [
  '#6366f1', '#3b82f6', '#22c55e', '#a855f7', '#f97316',
  '#ec4899', '#14b8a6', '#eab308', '#ef4444', '#06b6d4',
]

export default function AtribuicoesModal({ users, atribuicoes: initialAtrib, onClose }) {
  const [atribuicoes, setAtribuicoes] = useState(initialAtrib)
  const [userAtrib, setUserAtrib] = useState({}) // { id_user: [{ id, nome, cor }, ...] }
  const [novaAtrib, setNovaAtrib] = useState({ nome: '', cor: CORES[0] })
  const [busca, setBusca] = useState('')
  const [userSelecionado, setUserSelecionado] = useState(null)
  const [atribBusca, setAtribBusca] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('user_atribuicao').select('*, atribuicao(*)')
      const map = {}
      ;(data || []).forEach(ua => {
        if (!map[ua.id_user]) map[ua.id_user] = []
        if (ua.atribuicao) map[ua.id_user].push(ua.atribuicao)
      })
      setUserAtrib(map)
    }
    load()
  }, [])

  async function criarAtribuicao() {
    if (!novaAtrib.nome.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('atribuicao')
      .insert({ nome: novaAtrib.nome.trim(), cor: novaAtrib.cor })
      .select().single()
    if (!error && data) {
      setAtribuicoes(prev => [...prev, data])
      setNovaAtrib({ nome: '', cor: CORES[0] })
    }
    setSaving(false)
  }

  async function deletarAtribuicao(id) {
    await supabase.from('atribuicao').delete().eq('id', id)
    setAtribuicoes(prev => prev.filter(a => a.id !== id))
    // remove do map local também
    setUserAtrib(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(uid => {
        next[uid] = next[uid].filter(a => a.id !== id)
      })
      return next
    })
  }

  async function addAtribuicaoUser(atrib) {
    if (!userSelecionado) return
    const jatem = (userAtrib[userSelecionado.id] || []).find(a => a.id === atrib.id)
    if (jatem) return
    await supabase.from('user_atribuicao').insert({ id_user: userSelecionado.id, id_atribuicao: atrib.id })
    setUserAtrib(prev => ({
      ...prev,
      [userSelecionado.id]: [...(prev[userSelecionado.id] || []), atrib],
    }))
    setAtribBusca('')
  }

  async function removerAtribuicaoUser(id_user, id_atribuicao) {
    await supabase.from('user_atribuicao').delete().eq('id_user', id_user).eq('id_atribuicao', id_atribuicao)
    setUserAtrib(prev => ({
      ...prev,
      [id_user]: (prev[id_user] || []).filter(a => a.id !== id_atribuicao),
    }))
  }

  const usersFiltrados = users.filter(u =>
    (u.nome_usuario || '').toLowerCase().includes(busca.toLowerCase())
  )

  const atribDisponiveis = atribuicoes.filter(a =>
    a.nome.toLowerCase().includes(atribBusca.toLowerCase()) &&
    !(userAtrib[userSelecionado?.id] || []).find(x => x.id === a.id)
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: '#1e1e2e', border: '1px solid #2d2d44', borderRadius: 20,
        width: 640, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px 16px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>🏷 Atribuições</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 22 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 0 }}>

          {/* Coluna esquerda — gerenciar atribuições */}
          <div style={{ width: 220, borderRight: '1px solid #2d2d44', padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={sectionLabel}>Atribuições</p>

            {/* Criar nova */}
            <input
              value={novaAtrib.nome}
              onChange={e => setNovaAtrib(p => ({ ...p, nome: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && criarAtribuicao()}
              placeholder="Nova atribuição..."
              style={{ ...inputStyle, fontSize: 13 }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {CORES.map(c => (
                <button key={c} onClick={() => setNovaAtrib(p => ({ ...p, cor: c }))} style={{
                  width: 18, height: 18, borderRadius: '50%', background: c, border: 'none',
                  cursor: 'pointer', outline: novaAtrib.cor === c ? '2px solid #fff' : 'none', outlineOffset: 1,
                }} />
              ))}
            </div>
            <button onClick={criarAtribuicao} disabled={saving || !novaAtrib.nome.trim()} style={btnStyle('#6366f1')}>
              + Criar
            </button>

            {/* Lista existente */}
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {atribuicoes.map(a => (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: `${a.cor}18`, border: `1px solid ${a.cor}44`,
                  borderRadius: 10, padding: '5px 10px',
                }}>
                  <span style={{ color: a.cor, fontSize: 12, fontWeight: 600 }}>{a.nome}</span>
                  <button onClick={() => deletarAtribuicao(a.id)} style={{
                    background: 'none', border: 'none', color: `${a.cor}88`, cursor: 'pointer', fontSize: 13, padding: 0,
                  }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna direita — atribuir por pessoa */}
          <div style={{ flex: 1, padding: '0 24px 24px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <p style={sectionLabel}>Por pessoa</p>

            {/* Busca de pessoa */}
            <input
              value={busca}
              onChange={e => { setBusca(e.target.value); setUserSelecionado(null) }}
              placeholder="Buscar pessoa..."
              style={{ ...inputStyle, marginBottom: 8 }}
            />

            {/* Lista de pessoas */}
            <div style={{ maxHeight: 160, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {usersFiltrados.map(u => (
                <button key={u.id} onClick={() => { setUserSelecionado(u); setBusca(u.nome_usuario || '') }}
                  style={{
                    background: userSelecionado?.id === u.id ? '#6366f122' : 'transparent',
                    border: `1px solid ${userSelecionado?.id === u.id ? '#6366f1' : '#2d2d44'}`,
                    borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                  <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{u.nome_usuario || `ID ${u.id}`}</span>
                  <span style={{ color: '#475569', fontSize: 11 }}>{u.cargo || ''}</span>
                </button>
              ))}
            </div>

            {/* Área de atribuições da pessoa selecionada */}
            {userSelecionado && (
              <>
                <p style={{ ...sectionLabel, marginBottom: 8 }}>
                  Atribuições de <span style={{ color: '#e2e8f0' }}>{userSelecionado.nome_usuario}</span>
                </p>

                {/* Tags atuais */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 30, marginBottom: 12 }}>
                  {(userAtrib[userSelecionado.id] || []).length === 0 && (
                    <span style={{ color: '#475569', fontSize: 12 }}>Nenhuma atribuição</span>
                  )}
                  {(userAtrib[userSelecionado.id] || []).map(a => (
                    <span key={a.id} style={{
                      background: `${a.cor}22`, border: `1px solid ${a.cor}66`,
                      color: a.cor, fontSize: 12, fontWeight: 600,
                      padding: '3px 10px', borderRadius: 20,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {a.nome}
                      <button onClick={() => removerAtribuicaoUser(userSelecionado.id, a.id)} style={{
                        background: 'none', border: 'none', color: `${a.cor}99`,
                        cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1,
                      }}>✕</button>
                    </span>
                  ))}
                </div>

                {/* Busca para adicionar */}
                <div style={{ position: 'relative' }}>
                  <input
                    value={atribBusca}
                    onChange={e => setAtribBusca(e.target.value)}
                    placeholder="Adicionar atribuição..."
                    style={{ ...inputStyle, width: '100%' }}
                  />
                  {atribBusca && atribDisponiveis.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                      background: '#161622', border: '1px solid #2d2d44', borderRadius: 10,
                      zIndex: 10, overflow: 'hidden',
                    }}>
                      {atribDisponiveis.map(a => (
                        <button key={a.id} onClick={() => addAtribuicaoUser(a)} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', padding: '9px 14px', background: 'none',
                          border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                          borderBottom: '1px solid #2d2d44',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = '#2d2d44'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: a.cor, flexShrink: 0 }} />
                          <span style={{ color: '#e2e8f0', fontSize: 13 }}>{a.nome}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const sectionLabel = { fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, marginTop: 8 }
const inputStyle = { background: '#0f0f17', border: '1px solid #2d2d44', borderRadius: 10, padding: '9px 12px', color: '#e2e8f0', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', width: '100%' }
const btnStyle = (color) => ({ background: `${color}22`, border: `1px solid ${color}55`, color, borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', width: '100%' })

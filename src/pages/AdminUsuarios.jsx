import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const PERMISSAO_OPTS = ['none', 'viewer', 'editor']

const MOD_LABELS = {
  organograma: 'Organograma',
  transacoes:  'Transações',
  capacitacao: 'Capacitação',
}

export default function AdminUsuarios() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [permissoes, setPermissoes] = useState({}) // { id_user: { organograma, transacoes, capacitacao, links } }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null) // id_user sendo salvo
  const [busca, setBusca] = useState('')

  async function fetchData() {
    setLoading(true)
    const [{ data: usersData }, { data: permData }] = await Promise.all([
      supabase.from('user').select('id, id_user, nome_usuario, cargo, foto, nivel').order('nome_usuario'),
      supabase.from('user_permissoes').select('*'),
    ])

    const permMap = {}
    ;(permData || []).forEach(p => { permMap[p.id_user] = p })
    setUsers(usersData || [])
    setPermissoes(permMap)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  function getPerm(id_user) {
    return permissoes[id_user] || { organograma: 'none', transacoes: 'none', capacitacao: 'none', links: false }
  }

  function setPermLocal(id_user, campo, valor) {
    setPermissoes(prev => ({
      ...prev,
      [id_user]: { ...getPerm(id_user), [campo]: valor },
    }))
  }

  async function salvarPerm(id_user) {
    if (!id_user) return
    setSaving(id_user)
    const perm = getPerm(id_user)
    await supabase.from('user_permissoes').upsert({
      id_user,
      organograma: perm.organograma,
      transacoes:  perm.transacoes,
      capacitacao: perm.capacitacao,
      links:       perm.links,
    }, { onConflict: 'id_user' })
    setSaving(null)
  }

  const filtrados = users.filter(u =>
    !busca ||
    (u.nome_usuario || '').toLowerCase().includes(busca.toLowerCase()) ||
    (u.cargo || '').toLowerCase().includes(busca.toLowerCase())
  )

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f17', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 44 }}>🔒</div>
        <p style={{ color: '#f1f5f9', fontWeight: 700 }}>Acesso restrito a administradores</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f17' }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px 64px' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            ⚙ Administração de Usuários
          </h1>
          <p style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
            Gerencie permissões de acesso por módulo. Usuários com nível 2 têm acesso total automaticamente.
          </p>
        </div>

        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="🔍 Buscar por nome ou cargo..."
          style={{
            width: '100%', background: '#1e1e2e', border: '1px solid #2d2d44',
            borderRadius: 12, padding: '11px 16px', color: '#e2e8f0',
            fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none',
            boxSizing: 'border-box', marginBottom: 20,
          }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', color: '#6366f1', padding: 64 }}>Carregando...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Cabeçalho */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 80px 80px', gap: 12, padding: '6px 20px' }}>
              {['Usuário', 'Organograma', 'Transações', 'Capacitação', 'Links', ''].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>

            {filtrados.map(u => {
              const isNivel2 = u.nivel === 2
              const perm = getPerm(u.id_user)
              const isSaving = saving === u.id_user

              return (
                <div key={u.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 80px 80px',
                  gap: 12, alignItems: 'center',
                  background: '#161622', border: `1px solid ${isNivel2 ? '#6366f133' : '#2d2d44'}`,
                  borderRadius: 14, padding: '14px 20px',
                }}>

                  {/* Info do usuário */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avatar user={u} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.nome_usuario || `ID ${u.id}`}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{u.cargo || '—'}</div>
                    </div>
                    {isNivel2 && (
                      <span style={{ fontSize: 10, color: '#6366f1', background: '#6366f118', border: '1px solid #6366f133', borderRadius: 20, padding: '2px 8px', fontWeight: 700, flexShrink: 0 }}>
                        admin
                      </span>
                    )}
                  </div>

                  {/* Organograma */}
                  <PermSelect
                    value={isNivel2 ? 'editor' : perm.organograma}
                    disabled={isNivel2 || !u.id_user}
                    onChange={v => setPermLocal(u.id_user, 'organograma', v)}
                  />

                  {/* Transações */}
                  <PermSelect
                    value={isNivel2 ? 'editor' : perm.transacoes}
                    disabled={isNivel2 || !u.id_user}
                    onChange={v => setPermLocal(u.id_user, 'transacoes', v)}
                  />

                  {/* Capacitação */}
                  <PermSelect
                    value={isNivel2 ? 'editor' : perm.capacitacao}
                    disabled={isNivel2 || !u.id_user}
                    onChange={v => setPermLocal(u.id_user, 'capacitacao', v)}
                  />

                  {/* Links (toggle) */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => !isNivel2 && u.id_user && setPermLocal(u.id_user, 'links', !perm.links)}
                      disabled={isNivel2 || !u.id_user}
                      style={{
                        width: 36, height: 20, borderRadius: 10,
                        background: (isNivel2 || perm.links) ? '#6366f1' : '#2d2d44',
                        border: 'none', cursor: isNivel2 || !u.id_user ? 'default' : 'pointer',
                        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 3, left: (isNivel2 || perm.links) ? 19 : 3,
                        width: 14, height: 14, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s',
                      }} />
                    </button>
                  </div>

                  {/* Salvar */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {!isNivel2 && u.id_user ? (
                      <button
                        onClick={() => salvarPerm(u.id_user)}
                        disabled={isSaving}
                        style={{
                          background: '#6366f122', border: '1px solid #6366f155', color: '#6366f1',
                          borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700,
                          cursor: isSaving ? 'not-allowed' : 'pointer',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {isSaving ? '...' : 'Salvar'}
                      </button>
                    ) : !u.id_user ? (
                      <span style={{ fontSize: 10, color: '#475569' }} title="Usuário sem login vinculado">sem auth</span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function PermSelect({ value, disabled, onChange }) {
  const colors = { none: '#475569', viewer: '#3b82f6', editor: '#22c55e' }
  const color = colors[value] || '#475569'

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      style={{
        background: disabled ? '#0f0f17' : `${color}15`,
        border: `1px solid ${disabled ? '#2d2d44' : color + '55'}`,
        borderRadius: 8, padding: '5px 8px',
        color: disabled ? '#475569' : color,
        fontSize: 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'Inter, sans-serif', outline: 'none', width: '100%',
      }}
    >
      {PERMISSAO_OPTS.map(o => (
        <option key={o} value={o} style={{ background: '#1e1e2e', color: '#e2e8f0' }}>
          {o === 'none' ? '— nenhum' : o === 'viewer' ? '👁 viewer' : '✏ editor'}
        </option>
      ))}
    </select>
  )
}

function Avatar({ user }) {
  const initials = (user.nome_usuario || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: '#312e81', border: '2px solid #6366f133',
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      {user.foto
        ? <img src={user.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 12 }}>{initials}</span>
      }
    </div>
  )
}

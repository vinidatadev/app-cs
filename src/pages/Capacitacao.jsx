import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import CapacitacaoPorPessoa from '../components/capacitacao/PorPessoa'
import CapacitacaoPorCurso from '../components/capacitacao/PorCurso'
import GerenciarCursos from '../components/capacitacao/GerenciarCursos'
import Ranking from '../components/capacitacao/Ranking'

export default function Capacitacao() {
  const { perm } = useAuth()
  const canEdit = perm.canEdit('capacitacao')

  const [tab, setTab] = useState('pessoa')
  const [users, setUsers] = useState([])
  const [cursos, setCursos] = useState([])
  const [progressos, setProgressos] = useState([])
  const [setores, setSetores] = useState([])
  const [setorFiltro, setSetorFiltro] = useState('Customer Service')
  const [loading, setLoading] = useState(true)

  async function fetchAll() {
    setLoading(true)
    const [{ data: u }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('user').select('id, nome_usuario, cargo, foto, setor').order('nome_usuario'),
      supabase.from('curso').select('*').eq('ativo', true).order('categoria').order('curso'),
      supabase.from('user_curso').select('*'),
    ])
    const allUsers = u || []
    // extrai setores únicos pra montar o filtro
    const uniqueSetores = ['Todos', ...new Set(allUsers.map(u => u.setor).filter(Boolean))]
    setSetores(uniqueSetores)
    setUsers(allUsers)
    setCursos(c || [])
    setProgressos(p || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const usersFiltrados = setorFiltro === 'Todos'
    ? users
    : users.filter(u => u.setor === setorFiltro)

  async function setStatus(id_user, id_curso, status) {
    await supabase.from('user_curso').upsert({ id_user, id_curso, status }, { onConflict: 'id_user,id_curso' })
    setProgressos(prev => {
      const exists = prev.find(p => p.id_user === id_user && p.id_curso === id_curso)
      if (exists) return prev.map(p => p.id_user === id_user && p.id_curso === id_curso ? { ...p, status } : p)
      return [...prev, { id_user, id_curso, status }]
    })
  }

  async function addCurso(id_user, id_curso) {
    await supabase.from('user_curso').upsert({ id_user, id_curso, status: 'pendente' }, { onConflict: 'id_user,id_curso' })
    setProgressos(prev => {
      if (prev.find(p => p.id_user === id_user && p.id_curso === id_curso)) return prev
      return [...prev, { id_user, id_curso, status: 'pendente' }]
    })
  }

  async function removeCurso(id_user, id_curso) {
    await supabase.from('user_curso').delete().eq('id_user', id_user).eq('id_curso', id_curso)
    setProgressos(prev => prev.filter(p => !(p.id_user === id_user && p.id_curso === id_curso)))
  }

  return (
    <div className="page">
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 48px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text2)', letterSpacing: '-0.03em' }}>Capacitação</h1>
            <p style={{ fontSize: 13, color: 'var(--text5)', marginTop: 4 }}>
              {cursos.length} cursos · {usersFiltrados.length} colaboradores
              {setorFiltro !== 'Todos' && <span style={{ color: '#6366f1', fontWeight: 600 }}> · {setorFiltro}</span>}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Botão Trilhar */}
            <a
              href="https://trilhar.edusense.app/#/"
              target="_blank"
              rel="noopener noreferrer"
              title="Acessar plataforma Trilhar"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#ffffff', border: '1px solid #e2e8f0',
                borderRadius: 20, padding: '7px 16px', textDecoration: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f155'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <img
                src="https://trilhar.edusense.app/api/login-theme-v1/images/img.logoicon.png"
                alt="Trilhar"
                style={{ height: 22, width: 'auto', objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none' }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', fontFamily: 'Inter, sans-serif' }}>Trilhar</span>
            </a>

            {/* Filtro de setor */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>Setor:</span>
            {setores.map(s => (
              <button key={s} onClick={() => setSetorFiltro(s)} style={{
                background: setorFiltro === s ? '#6366f1' : 'var(--bg2)',
                border: `1px solid ${setorFiltro === s ? '#6366f1' : 'var(--border)'}`,
                color: setorFiltro === s ? '#fff' : 'var(--text4)',
                borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
              }}>{s}</button>
            ))}
          </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 30, padding: 4, width: 'fit-content', marginBottom: 32 }}>
          {[
            ['pessoa', '👤 Por Pessoa'],
            ['curso', '📚 Por Curso'],
            ['ranking', '🏆 Ranking'],
            ...(canEdit ? [['gerenciar', '⚙ Cursos']] : []),
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: tab === key ? '#6366f1' : 'transparent',
              color: tab === key ? '#fff' : '#64748b',
              border: 'none', borderRadius: 24, padding: '8px 22px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#6366f1', padding: 64, fontSize: 15 }}>Carregando...</div>
        ) : tab === 'pessoa' ? (
          <CapacitacaoPorPessoa
            users={usersFiltrados} cursos={cursos} progressos={progressos}
            onSetStatus={canEdit ? setStatus : null}
            onAddCurso={canEdit ? addCurso : null}
            onRemoveCurso={canEdit ? removeCurso : null}
          />
        ) : tab === 'curso' ? (
          <CapacitacaoPorCurso users={usersFiltrados} cursos={cursos} progressos={progressos} onSetStatus={canEdit ? setStatus : null} />
        ) : tab === 'ranking' ? (
          <Ranking users={usersFiltrados} cursos={cursos} progressos={progressos} />
        ) : canEdit ? (
          <GerenciarCursos cursos={cursos} onRefresh={fetchAll} />
        ) : null}
      </div>
    </div>
  )
}

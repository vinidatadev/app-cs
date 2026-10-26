import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import GrupoAdmin from '../components/indicadores/GrupoAdmin'
import RelatorioBiModal from '../components/indicadores/RelatorioBiModal'
import { useIndicadores } from '../hooks/useIndicadores'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'

export default function Indicadores() {
  const { isAdmin, user } = useAuth()
  const navigate = useNavigate()
  const { grupos, loading, refresh } = useIndicadores()
  const [modalGrupo, setModalGrupo] = useState(null) // null | 'novo' | grupo obj
  const [showBi, setShowBi] = useState(false)
  const [users, setUsers] = useState([])
  const [usersLoaded, setUsersLoaded] = useState(false)

  async function abrirModal(grupo = null) {
    if (!usersLoaded) {
      const { data } = await supabase.from('user').select('id_user, nome_usuario, foto, cargo').order('nome_usuario')
      setUsers(data || [])
      setUsersLoaded(true)
    }
    setModalGrupo(grupo || 'novo')
  }

  async function deletarGrupo(id) {
    if (!confirm('Excluir este grupo e todos os dados vinculados?')) return
    await supabase.from('ind_grupo').delete().eq('id', id)
    refresh()
  }

  return (
    <div className="page" style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '80px 24px 64px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text2)', letterSpacing: '-0.02em' }}>
              📊 Indicadores da Área
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text5)', marginTop: 4 }}>
              Selecione um grupo para visualizar e editar os indicadores.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setShowBi(true)} style={btnBi}>Abrir BI</button>
            {isAdmin && (
              <button onClick={() => abrirModal()} style={btnPrimary}>+ Novo grupo</button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#6366f1', fontSize: 15, fontWeight: 600 }}>Carregando...</div>
        ) : grupos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64, color: 'var(--text5)', fontSize: 14 }}>
            Nenhum grupo cadastrado ainda.
            {isAdmin && <span style={{ color: '#6366f1', cursor: 'pointer', marginLeft: 6 }} onClick={() => abrirModal()}>Criar o primeiro grupo →</span>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {grupos.map(g => (
              <div
                key={g.id}
                style={{
                  background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16,
                  padding: '20px', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s',
                  position: 'relative',
                }}
                onClick={() => navigate(`/indicadores/${g.id}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f155'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text2)', marginBottom: 6 }}>{g.nome}</div>
                {g.descricao && <div style={{ fontSize: 12, color: 'var(--text5)', marginBottom: 12 }}>{g.descricao}</div>}
                <div style={{ fontSize: 11, color: 'var(--text5)', display: 'flex', gap: 10 }}>
                  <span>📁 {g.ind_subgrupo?.length || 0} subgrupo(s)</span>
                  <span>📊 {g.ind_subgrupo?.reduce((acc, s) => acc + (s.ind_indicador?.length || 0), 0)} indicadores</span>
                </div>

                {isAdmin && (
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => abrirModal(g)} style={btnIcon} title="Editar">✏</button>
                    <button onClick={() => deletarGrupo(g.id)} style={{ ...btnIcon, color: '#ef4444' }} title="Excluir">🗑</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalGrupo && (
        <GrupoAdmin
          grupo={modalGrupo === 'novo' ? null : modalGrupo}
          users={users}
          onClose={() => setModalGrupo(null)}
          onSave={refresh}
        />
      )}

      {showBi && <RelatorioBiModal onClose={() => setShowBi(false)} />}
    </div>
  )
}

const btnPrimary = {
  background: '#6366f1', border: 'none', color: '#fff', borderRadius: 10,
  padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
}
const btnBi = {
  background: 'var(--bg2)', border: '1px solid #6366f155', color: '#6366f1', borderRadius: 10,
  padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
}
const btnIcon = {
  background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8,
  padding: '4px 8px', fontSize: 12, cursor: 'pointer', color: 'var(--text4)',
}

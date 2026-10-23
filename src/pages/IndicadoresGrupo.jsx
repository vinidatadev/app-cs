import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import TabelaSubgrupo from '../components/indicadores/TabelaSubgrupo'
import GraficoSubgrupo from '../components/indicadores/GraficoSubgrupo'
import NotasEditor from '../components/indicadores/NotasEditor'
import TarefasPanel from '../components/indicadores/TarefasPanel'
import GrupoAdmin from '../components/indicadores/GrupoAdmin'
import { useGrupoData } from '../hooks/useIndicadores'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'

const ANO_ATUAL = new Date().getFullYear()
const ANOS = Array.from({ length: 5 }, (_, i) => ANO_ATUAL - 2 + i)

export default function IndicadoresGrupo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [ano, setAno] = useState(ANO_ATUAL)
  const [subgrupoAtivo, setSubgrupoAtivo] = useState(null)
  const [secao, setSecao] = useState('indicadores') // 'indicadores' | 'tarefas'
  const [editandoGrupo, setEditandoGrupo] = useState(false)
  const [usersGlobal, setUsersGlobal] = useState([])

  const { grupo, valores, users, loading, refresh } = useGrupoData(Number(id), ano)

  useEffect(() => {
    supabase.from('user').select('id_user, nome_usuario, foto, cargo').order('nome_usuario')
      .then(({ data }) => setUsersGlobal(data || []))
  }, [])

  // Define subgrupo ativo inicial
  useEffect(() => {
    if (grupo?.ind_subgrupo?.length && !subgrupoAtivo) {
      setSubgrupoAtivo(grupo.ind_subgrupo[0].id)
    }
  }, [grupo])

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Navbar />
        <div style={{ color: '#6366f1', fontSize: 15, fontWeight: 600 }}>Carregando...</div>
      </div>
    )
  }

  if (!grupo) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Navbar />
        <div style={{ color: 'var(--text5)' }}>Grupo não encontrado.</div>
      </div>
    )
  }

  const subgrupos = grupo.ind_subgrupo || []
  const subAtivo = subgrupos.find(s => s.id === subgrupoAtivo) || subgrupos[0]

  const isResponsavel = subAtivo?.responsavel_id === user?.id_user
  const canEdit = isAdmin || isResponsavel

  // Todos os indicadores do grupo para o painel de tarefas
  const todosIndicadores = subgrupos.flatMap(s => s.ind_indicador || [])

  const secoes = [
    { key: 'indicadores', label: '📋 Indicadores' },
    { key: 'tarefas',     label: '✅ Tarefas' },
  ]

  return (
    <div className="page" style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px 80px' }}>

        {/* Breadcrumb + Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <button onClick={() => navigate('/indicadores')} style={{ background: 'none', border: 'none', color: 'var(--text5)', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 6 }}>
              ← Indicadores
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text2)', letterSpacing: '-0.02em' }}>
              {grupo.nome}
              {grupo.descricao && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text5)', marginLeft: 10 }}>{grupo.descricao}</span>}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Seletor de ano */}
            <select value={ano} onChange={e => setAno(Number(e.target.value))} style={selectStyle}>
              {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            {isAdmin && (
              <button onClick={() => setEditandoGrupo(true)} style={btnSecondary}>✏ Editar grupo</button>
            )}
          </div>
        </div>

        {/* Tabs de subgrupos */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {subgrupos.map(s => (
            <button
              key={s.id}
              onClick={() => setSubgrupoAtivo(s.id)}
              style={{
                padding: '6px 18px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: subgrupoAtivo === s.id ? '#6366f1' : 'var(--bg2)',
                color: subgrupoAtivo === s.id ? '#fff' : 'var(--text3)',
                border: `1px solid ${subgrupoAtivo === s.id ? '#6366f1' : 'var(--border)'}`,
                transition: 'all 0.15s',
              }}
            >
              {s.nome}
              {s.responsavel_id && usersGlobal.length > 0 && (
                <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.7 }}>
                  — {usersGlobal.find(u => u.id_user === s.responsavel_id)?.nome_usuario?.split(' ')[0] || ''}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tabs de seção */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {secoes.map(sc => (
            <button
              key={sc.key}
              onClick={() => setSecao(sc.key)}
              style={{
                padding: '8px 16px', borderRadius: '8px 8px 0 0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: secao === sc.key ? 'var(--bg2)' : 'transparent',
                color: secao === sc.key ? '#6366f1' : 'var(--text4)',
                border: secao === sc.key ? '1px solid var(--border)' : '1px solid transparent',
                borderBottom: secao === sc.key ? '1px solid var(--bg2)' : '1px solid transparent',
                marginBottom: secao === sc.key ? -1 : 0,
                transition: 'all 0.15s',
              }}
            >{sc.label}</button>
          ))}
        </div>

        {/* Conteúdo da seção */}
        {secao === 'indicadores' && subAtivo && (
          <>
            <TabelaSubgrupo
              subgrupo={subAtivo}
              valores={valores}
              ano={ano}
              onUpdate={refresh}
              users={usersGlobal}
              canEdit={canEdit}
            />
            <GraficoSubgrupo
              subgrupo={subAtivo}
              valores={valores}
              ano={ano}
            />
            <div style={{ marginTop: 24 }}>
              <NotasEditor
                referencia="subgrupo"
                idGrupo={grupo.id}
                idSubgrupo={subAtivo.id}
                canEdit={canEdit}
              />
            </div>
          </>
        )}

        {secao === 'tarefas' && (
          <TarefasPanel
            grupo={grupo}
            subgrupos={subgrupos}
            indicadores={todosIndicadores}
            users={usersGlobal}
            canEdit={canEdit}
          />
        )}
      </div>

      {editandoGrupo && (
        <GrupoAdmin
          grupo={grupo}
          users={usersGlobal}
          onClose={() => setEditandoGrupo(false)}
          onSave={() => { refresh(); setEditandoGrupo(false) }}
        />
      )}
    </div>
  )
}

const selectStyle = {
  background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8,
  padding: '7px 12px', color: 'var(--text)', fontSize: 13, cursor: 'pointer',
  fontFamily: 'Inter, sans-serif', outline: 'none',
}
const btnSecondary = {
  background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text3)',
  borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
}

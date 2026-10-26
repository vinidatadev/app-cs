import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import TransacaoModal from '../components/TransacaoModal'
import TransacaoDetalhe from '../components/TransacaoDetalhe'

export default function Transacoes() {
  const { perm } = useAuth()
  const canEdit = perm.canEdit('transacoes')

  const [transacoes, setTransacoes] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [criando, setCriando] = useState(false)
  const [selecionada, setSelecionada] = useState(null)

  async function fetchTransacoes() {
    setLoading(true)
    const [{ data: tData }, { data: uData }] = await Promise.all([
      supabase.from('transacao').select('*, ponto_focal:id_ponto_focal(id, nome_usuario, cargo, foto)').order('created_at', { ascending: false }),
      supabase.from('user').select('id, nome_usuario, cargo, foto'),
    ])
    setTransacoes(tData || [])
    setUsers(uData || [])
    setLoading(false)
  }

  useEffect(() => { fetchTransacoes() }, [])

  const filtradas = transacoes.filter(t => {
    const q = busca.toLowerCase()
    return (
      t.transacao?.toLowerCase().includes(q) ||
      t.modulo?.toLowerCase().includes(q) ||
      t.descricao?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="page">
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px 48px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text2)', letterSpacing: '-0.02em' }}>
              Transações
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text5)', marginTop: 4 }}>
              {transacoes.length} transação{transacoes.length !== 1 ? 'ões' : ''} cadastrada{transacoes.length !== 1 ? 's' : ''}
            </p>
          </div>
          {canEdit && (
            <button onClick={() => setCriando(true)} style={{
              background: '#6366f1', border: 'none', color: '#fff',
              borderRadius: 20, padding: '10px 22px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            }}>
              + Nova Transação
            </button>
          )}
        </div>

        {/* Busca */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text5)' }}>🔍</span>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por transação, módulo ou descrição..."
            style={{
              width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 16px 12px 42px',
              color: 'var(--text)', fontSize: 14, fontFamily: 'Inter, sans-serif',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {busca && (
            <button onClick={() => setBusca('')} style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text5)', cursor: 'pointer', fontSize: 16,
            }}>✕</button>
          )}
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6366f1', padding: 48, fontSize: 15 }}>Carregando...</div>
        ) : filtradas.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text5)', padding: 64 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p>{busca ? 'Nenhuma transação encontrada' : 'Nenhuma transação cadastrada ainda'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Header da tabela */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto',
              padding: '8px 20px', gap: 16,
            }}>
              {['Transação', 'Módulo', 'Descrição', ''].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>

            {filtradas.map(t => (
              <TransacaoRow
                key={t.id}
                transacao={t}
                busca={busca}
                onClick={() => setSelecionada(t)}
              />
            ))}
          </div>
        )}
      </div>

      {criando && canEdit && (
        <TransacaoModal
          onClose={() => setCriando(false)}
          onSave={async (form) => {
            const { data } = await supabase.from('transacao').insert(form).select().single()
            setCriando(false)
            fetchTransacoes()
            if (data) setSelecionada(data)
          }}
        />
      )}

      {selecionada && (
        <TransacaoDetalhe
          transacao={selecionada}
          users={users}
          canEdit={canEdit}
          onClose={() => { setSelecionada(null); fetchTransacoes() }}
          onDelete={canEdit ? async () => {
            await supabase.from('transacao').delete().eq('id', selecionada.id)
            setSelecionada(null)
            fetchTransacoes()
          } : null}
        />
      )}
    </div>
  )
}

function highlight(text, busca) {
  if (!busca || !text) return text || '—'
  const parts = text.split(new RegExp(`(${busca})`, 'gi'))
  return parts.map((p, i) =>
    p.toLowerCase() === busca.toLowerCase()
      ? <mark key={i} style={{ background: '#6366f144', color: '#a5b4fc', borderRadius: 3, padding: '0 2px' }}>{p}</mark>
      : p
  )
}

function TransacaoRow({ transacao: t, busca, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto',
        background: hovered ? 'var(--bg3)' : 'var(--bg2)',
        border: `1px solid ${hovered ? '#6366f144' : 'var(--border)'}`,
        borderRadius: 14, padding: '14px 20px', gap: 16,
        cursor: 'pointer', alignItems: 'center',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>
        {highlight(t.transacao, busca)}
      </span>
      <span style={{
        fontSize: 12, fontWeight: 600, color: '#6366f1',
        background: '#6366f118', border: '1px solid #6366f133',
        borderRadius: 20, padding: '3px 10px', justifySelf: 'start',
        whiteSpace: 'nowrap',
      }}>
        {highlight(t.modulo, busca)}
      </span>
      <span style={{ fontSize: 13, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {highlight(t.descricao, busca)}
      </span>
      <span style={{ color: 'var(--text5)', fontSize: 13 }}>→</span>
    </div>
  )
}

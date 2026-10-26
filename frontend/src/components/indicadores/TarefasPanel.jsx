import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'
import TarefaModal from './TarefaModal'

const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']
const STATUS_CONFIG = {
  aberta:    { label: 'Aberta',      color: '#6366f1', bg: '#6366f115' },
  andamento: { label: 'Em andamento',color: '#f59e0b', bg: '#f59e0b15' },
  concluida: { label: 'Concluída',   color: '#22c55e', bg: '#22c55e15' },
  cancelada: { label: 'Cancelada',   color: '#ef4444', bg: '#ef444415' },
}

export default function TarefasPanel({ grupo, subgrupos, indicadores, users, canEdit }) {
  const { user } = useAuth()
  const [tarefas, setTarefas] = useState([])
  const [tarefaAberta, setTarefaAberta] = useState(null)
  const [criando, setCriando] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [filtroResp, setFiltroResp] = useState('')
  const [form, setForm] = useState({
    titulo: '', descricao: '', responsavel_id: '', id_subgrupo: '',
    id_indicador: '', mes_ref: '', ano_ref: new Date().getFullYear(),
    data_inicio: '', data_fim: '',
  })

  useEffect(() => { fetchTarefas() }, [grupo?.id])

  async function fetchTarefas() {
    if (!grupo?.id) return
    const { data } = await supabase
      .from('ind_tarefa')
      .select('*, ind_subgrupo(nome), ind_indicador(nome)')
      .eq('id_grupo', grupo.id)
      .order('criado_em', { ascending: false })
    setTarefas(data || [])
  }

  const indDoSub = form.id_subgrupo
    ? (subgrupos?.find(s => String(s.id) === String(form.id_subgrupo))?.ind_indicador || [])
    : (indicadores || [])

  async function criarTarefa() {
    if (!form.titulo.trim()) return
    await supabase.from('ind_tarefa').insert({
      titulo: form.titulo,
      descricao: form.descricao || null,
      id_grupo: grupo.id,
      id_subgrupo: form.id_subgrupo || null,
      id_indicador: form.id_indicador || null,
      mes_ref: form.mes_ref || null,
      ano_ref: form.ano_ref || null,
      responsavel_id: form.responsavel_id || null,
      criado_por: user.id_user,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
    })
    setCriando(false)
    setForm({ titulo: '', descricao: '', responsavel_id: '', id_subgrupo: '', id_indicador: '', mes_ref: '', ano_ref: new Date().getFullYear(), data_inicio: '', data_fim: '' })
    fetchTarefas()
  }

  const tarefasFiltradas = tarefas.filter(t => {
    if (filtroStatus !== 'todas' && t.status !== filtroStatus) return false
    if (filtroResp && t.responsavel_id !== filtroResp) return false
    return true
  })

  const prazoVencido = (t) => {
    if (!t.data_fim || t.status === 'concluida' || t.status === 'cancelada') return false
    return new Date(t.data_fim) < new Date()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text2)' }}>✅ Tarefas</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={selectSm}>
            <option value="todas">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filtroResp} onChange={e => setFiltroResp(e.target.value)} style={selectSm}>
            <option value="">Todos os responsáveis</option>
            {users.map(u => <option key={u.id_user} value={u.id_user}>{u.nome_usuario}</option>)}
          </select>
          {canEdit && (
            <button onClick={() => setCriando(true)} style={btnPrimary}>+ Nova tarefa</button>
          )}
        </div>
      </div>

      {/* Form criação */}
      {criando && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>Nova Tarefa</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelSm}>Título *</label>
              <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} style={inputSm} placeholder="Título da tarefa" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelSm}>Descrição</label>
              <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} style={{ ...inputSm, resize: 'none' }} rows={2} placeholder="Opcional" />
            </div>
            <div>
              <label style={labelSm}>Responsável</label>
              <select value={form.responsavel_id} onChange={e => setForm(f => ({ ...f, responsavel_id: e.target.value }))} style={inputSm}>
                <option value="">— Sem responsável</option>
                {users.map(u => <option key={u.id_user} value={u.id_user}>{u.nome_usuario}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSm}>Subgrupo</label>
              <select value={form.id_subgrupo} onChange={e => setForm(f => ({ ...f, id_subgrupo: e.target.value, id_indicador: '' }))} style={inputSm}>
                <option value="">— Grupo todo</option>
                {subgrupos?.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSm}>Indicador</label>
              <select value={form.id_indicador} onChange={e => setForm(f => ({ ...f, id_indicador: e.target.value }))} style={inputSm}>
                <option value="">— Todos</option>
                {indDoSub.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSm}>Mês ref.</label>
              <select value={form.mes_ref} onChange={e => setForm(f => ({ ...f, mes_ref: e.target.value }))} style={inputSm}>
                <option value="">—</option>
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSm}>Ano ref.</label>
              <input type="number" value={form.ano_ref} onChange={e => setForm(f => ({ ...f, ano_ref: e.target.value }))} style={inputSm} />
            </div>
            <div>
              <label style={labelSm}>Data início</label>
              <input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} style={inputSm} />
            </div>
            <div>
              <label style={labelSm}>Prazo</label>
              <input type="date" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} style={inputSm} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setCriando(false)} style={btnSecondary}>Cancelar</button>
            <button onClick={criarTarefa} disabled={!form.titulo.trim()} style={btnPrimary}>Criar</button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tarefasFiltradas.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text5)', fontSize: 13 }}>Nenhuma tarefa encontrada.</div>
        )}
        {tarefasFiltradas.map(t => {
          const sc = STATUS_CONFIG[t.status]
          const vencida = prazoVencido(t)
          const resp = users.find(u => u.id_user === t.responsavel_id)

          return (
            <div
              key={t.id}
              onClick={() => setTarefaAberta(t)}
              style={{
                background: 'var(--bg2)', border: `1px solid ${vencida ? '#ef444433' : 'var(--border)'}`,
                borderRadius: 12, padding: '12px 16px', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f144')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = vencida ? '#ef444433' : 'var(--border)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
                    {vencida && <span title="Prazo vencido" style={{ color: '#ef4444', marginRight: 4 }}>⚠</span>}
                    {t.titulo}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text5)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {t.ind_subgrupo?.nome && <span>📁 {t.ind_subgrupo.nome}</span>}
                    {t.ind_indicador?.nome && <span>📊 {t.ind_indicador.nome}</span>}
                    {t.mes_ref && <span>📅 {MESES[t.mes_ref - 1]}/{t.ano_ref}</span>}
                    {resp && <span>👤 {resp.nome_usuario}</span>}
                    {t.data_fim && <span style={{ color: vencida ? '#ef4444' : 'var(--text5)' }}>⏰ {new Date(t.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                  background: sc.bg, color: sc.color, border: `1px solid ${sc.color}33`,
                }}>{sc.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {tarefaAberta && (
        <TarefaModal
          tarefa={tarefaAberta}
          grupo={grupo}
          users={users}
          canEdit={canEdit}
          onClose={() => setTarefaAberta(null)}
          onSave={() => { fetchTarefas(); setTarefaAberta(null) }}
        />
      )}
    </div>
  )
}

const selectSm = {
  background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8,
  padding: '5px 8px', color: 'var(--text3)', fontSize: 11, cursor: 'pointer',
  fontFamily: 'Inter, sans-serif', outline: 'none',
}
const labelSm = { display: 'block', fontSize: 10, color: 'var(--text5)', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase' }
const inputSm = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
  padding: '7px 10px', color: 'var(--text)', fontSize: 12,
  fontFamily: 'Inter, sans-serif', outline: 'none',
}
const btnPrimary = {
  background: '#6366f1', border: 'none', color: '#fff', borderRadius: 8,
  padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
}
const btnSecondary = {
  background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text3)',
  borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
}

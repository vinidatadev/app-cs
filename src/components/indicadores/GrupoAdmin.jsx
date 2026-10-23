import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

const CORES = ['#6366f1','#3b82f6','#22c55e','#f97316','#ec4899','#14b8a6','#f59e0b','#ef4444']
const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']

export default function GrupoAdmin({ grupo, users, onClose, onSave }) {
  const [nome, setNome] = useState(grupo?.nome || '')
  const [descricao, setDescricao] = useState(grupo?.descricao || '')
  const [subgrupos, setSubgrupos] = useState([])
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState(0) // índice do subgrupo ativo

  useEffect(() => {
    if (grupo?.ind_subgrupo) {
      setSubgrupos(grupo.ind_subgrupo.map(s => ({
        ...s,
        ind_indicador: s.ind_indicador || [],
        _dirty: false,
      })))
    }
  }, [grupo])

  function addSubgrupo() {
    setSubgrupos(prev => [...prev, {
      id: null, nome: '', responsavel_id: '', ordem: prev.length,
      ind_indicador: [], _new: true,
    }])
    setTab(subgrupos.length)
  }

  function updateSubgrupo(idx, field, val) {
    setSubgrupos(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val, _dirty: true } : s))
  }

  function addIndicador(sIdx) {
    setSubgrupos(prev => prev.map((s, i) => {
      if (i !== sIdx) return s
      return {
        ...s, _dirty: true,
        ind_indicador: [...s.ind_indicador, {
          id: null, nome: '', tipo: 'numero',
          tipo_grafico: null, cor_grafico: CORES[s.ind_indicador.length % CORES.length],
          painel_grafico: 1,
          ordem: s.ind_indicador.length, _new: true,
        }],
      }
    }))
  }

  function updateIndicador(sIdx, iIdx, field, val) {
    setSubgrupos(prev => prev.map((s, i) => {
      if (i !== sIdx) return s
      return {
        ...s, _dirty: true,
        ind_indicador: s.ind_indicador.map((ind, j) =>
          j === iIdx ? { ...ind, [field]: val } : ind
        ),
      }
    }))
  }

  function removeIndicador(sIdx, iIdx) {
    setSubgrupos(prev => prev.map((s, i) => {
      if (i !== sIdx) return s
      return { ...s, _dirty: true, ind_indicador: s.ind_indicador.filter((_, j) => j !== iIdx) }
    }))
  }

  async function handleSave() {
    if (!nome.trim()) return
    setSaving(true)
    try {
      let gId = grupo?.id
      if (!gId) {
        const { data } = await supabase.from('ind_grupo')
          .insert({ nome: nome.trim(), descricao, ordem: 0 }).select().single()
        gId = data.id
      } else {
        await supabase.from('ind_grupo').update({ nome: nome.trim(), descricao }).eq('id', gId)
      }

      for (let si = 0; si < subgrupos.length; si++) {
        const s = subgrupos[si]
        let sId = s.id
        if (!sId) {
          const { data } = await supabase.from('ind_subgrupo')
            .insert({ id_grupo: gId, nome: s.nome, responsavel_id: s.responsavel_id || null, ordem: si })
            .select().single()
          sId = data.id
        } else if (s._dirty) {
          await supabase.from('ind_subgrupo')
            .update({ nome: s.nome, responsavel_id: s.responsavel_id || null, ordem: si })
            .eq('id', sId)
        }

        // Deletar indicadores removidos (que tinham id mas não estão mais)
        const idsAtuais = s.ind_indicador.filter(i => i.id).map(i => i.id)
        if (sId && !s._new) {
          const { data: existentes } = await supabase.from('ind_indicador')
            .select('id').eq('id_subgrupo', sId)
          const paraRemover = (existentes || []).filter(e => !idsAtuais.includes(e.id))
          for (const r of paraRemover) {
            await supabase.from('ind_indicador').delete().eq('id', r.id)
          }
        }

        for (let ii = 0; ii < s.ind_indicador.length; ii++) {
          const ind = s.ind_indicador[ii]
          if (!ind.id) {
            await supabase.from('ind_indicador').insert({
              id_subgrupo: sId, nome: ind.nome, tipo: ind.tipo,
              tipo_grafico: ind.tipo_grafico || null,
              cor_grafico: ind.cor_grafico || null,
              painel_grafico: Number(ind.painel_grafico) || 1, ordem: ii,
            })
          } else {
            await supabase.from('ind_indicador').update({
              nome: ind.nome, tipo: ind.tipo,
              tipo_grafico: ind.tipo_grafico || null,
              cor_grafico: ind.cor_grafico || null,
              painel_grafico: Number(ind.painel_grafico) || 1, ordem: ii,
            }).eq('id', ind.id)
          }
        }
      }

      onSave()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const s = subgrupos[tab]

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text2)' }}>
            {grupo ? 'Editar Grupo' : 'Novo Grupo'}
          </h2>
          <button onClick={onClose} style={btnClose}>✕</button>
        </div>

        {/* Dados do grupo */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Nome do grupo</label>
            <input value={nome} onChange={e => setNome(e.target.value)} style={inputStyle} placeholder="ex: NORDESTE" />
          </div>
          <div style={{ flex: 3 }}>
            <label style={labelStyle}>Descrição (opcional)</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)} style={inputStyle} placeholder="Descrição breve" />
          </div>
        </div>

        {/* Tabs de subgrupos */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {subgrupos.map((s, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: tab === i ? '#6366f1' : 'var(--bg3)',
              color: tab === i ? '#fff' : 'var(--text3)',
              border: `1px solid ${tab === i ? '#6366f1' : 'var(--border)'}`,
            }}>
              {s.nome || `Subgrupo ${i + 1}`}
            </button>
          ))}
          <button onClick={addSubgrupo} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: 'transparent', color: '#6366f1', border: '1px dashed #6366f1',
          }}>+ Subgrupo</button>
        </div>

        {s && (
          <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>Nome do subgrupo</label>
                <input value={s.nome} onChange={e => updateSubgrupo(tab, 'nome', e.target.value)}
                  style={inputStyle} placeholder="ex: AC" />
              </div>
              <div style={{ flex: 3 }}>
                <label style={labelStyle}>Responsável</label>
                <select value={s.responsavel_id || ''} onChange={e => updateSubgrupo(tab, 'responsavel_id', e.target.value)} style={inputStyle}>
                  <option value="">— Sem responsável</option>
                  {users.map(u => (
                    <option key={u.id_user} value={u.id_user}>{u.nome_usuario}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Indicadores */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Indicadores
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {s.ind_indicador.map((ind, ii) => (
                <div key={ii} style={{ display: 'grid', gridTemplateColumns: '2fr 92px 88px 92px 36px 24px', gap: 6, alignItems: 'center' }}>
                  <input value={ind.nome} onChange={e => updateIndicador(tab, ii, 'nome', e.target.value)}
                    style={{ ...inputStyle, fontSize: 12 }} placeholder="Nome do indicador" />
                  <select value={ind.tipo} onChange={e => updateIndicador(tab, ii, 'tipo', e.target.value)} style={{ ...inputStyle, fontSize: 12 }}>
                    <option value="numero">Número</option>
                    <option value="percentual">Percentual</option>
                  </select>
                  <select value={ind.tipo_grafico || ''} onChange={e => updateIndicador(tab, ii, 'tipo_grafico', e.target.value || null)} style={{ ...inputStyle, fontSize: 12 }}>
                    <option value="">Sem gráfico</option>
                    <option value="barra">Barra</option>
                    <option value="linha">Linha</option>
                  </select>
                  <select
                    value={ind.painel_grafico || 1}
                    onChange={e => updateIndicador(tab, ii, 'painel_grafico', Number(e.target.value))}
                    style={{ ...inputStyle, fontSize: 12 }}
                    title="Gráfico em que o indicador aparece"
                  >
                    <option value={1}>Gráfico 1</option>
                    <option value={2}>Gráfico 2</option>
                  </select>
                  <input type="color" value={ind.cor_grafico || '#6366f1'}
                    onChange={e => updateIndicador(tab, ii, 'cor_grafico', e.target.value)}
                    style={{ width: 36, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none' }} />
                  <button onClick={() => removeIndicador(tab, ii)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>x</button>
                </div>
              ))}
              <button onClick={() => addIndicador(tab)} style={{
                alignSelf: 'flex-start', marginTop: 4,
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: 'transparent', color: '#6366f1', border: '1px dashed #6366f1',
              }}>+ Indicador</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={handleSave} disabled={saving || !nome.trim()} style={btnPrimary}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
}
const modal = {
  background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16,
  padding: 24, width: '100%', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto',
}
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }
const inputStyle = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '7px 10px', color: 'var(--text)', fontSize: 13,
  fontFamily: 'Inter, sans-serif', outline: 'none',
}
const btnClose = { background: 'none', border: 'none', color: 'var(--text4)', fontSize: 18, cursor: 'pointer' }
const btnPrimary = {
  background: '#6366f1', border: 'none', color: '#fff', borderRadius: 8,
  padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
}
const btnSecondary = {
  background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text3)',
  borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
}

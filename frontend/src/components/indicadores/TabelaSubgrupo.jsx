import { useState } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'
import CelulaInput from './CelulaInput'
import { parseNumeroBR } from '../../utils/numeros'

const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']

export default function TabelaSubgrupo({ subgrupo, valores, ano, onUpdate, users, comentarios, canEdit }) {
  const { user } = useAuth()
  const indicadores = subgrupo.ind_indicador || []

  // Estado local: { [indId_mes]: string }
  const [localEdits, setLocalEdits] = useState({})
  const [saving, setSaving] = useState(false)
  const [hoverComentarios, setHoverComentarios] = useState(() => {
    try { return localStorage.getItem('ind_hover_comentarios') !== '0' } catch { return true }
  })

  function toggleHoverComentarios() {
    setHoverComentarios(prev => {
      const novo = !prev
      try { localStorage.setItem('ind_hover_comentarios', novo ? '1' : '0') } catch { /* ignore */ }
      return novo
    })
  }

  const hasDirty = Object.keys(localEdits).length > 0

  function handleLocalChange(indId, mes, val) {
    setLocalEdits(prev => ({ ...prev, [`${indId}_${mes}`]: val }))
  }

  function getLocal(indId, mes) {
    const key = `${indId}_${mes}`
    return key in localEdits ? localEdits[key] : undefined
  }

  async function handleSave() {
    if (!hasDirty) return
    setSaving(true)
    const erros = []
    try {
      const promises = Object.entries(localEdits).map(async ([key, rawVal]) => {
        const [indId, mes] = key.split('_').map(Number)
        const existingRow = valores[indId]?.[mes]
        const texto = String(rawVal ?? '').trim()

        // Célula apagada: remove o valor salvo (e comentários, via cascade)
        if (texto === '') {
          if (existingRow?.id) {
            const { error } = await supabase.from('ind_valor').delete().eq('id', existingRow.id)
            if (error) erros.push(error.message)
          }
          return
        }

        const num = parseNumeroBR(texto)
        if (isNaN(num)) {
          erros.push(`Valor inválido em ${indicadores.find(i => i.id === indId)?.nome || 'indicador'} (${mes}): "${texto}"`)
          return
        }

        if (existingRow?.id) {
          const { error } = await supabase.from('ind_valor').update({
            valor: num,
            atualizado_em: new Date().toISOString(),
            atualizado_por: user.id_user,
          }).eq('id', existingRow.id)
          if (error) erros.push(error.message)
        } else {
          const { error } = await supabase.from('ind_valor').insert({
            id_indicador: indId, ano, mes,
            valor: num, atualizado_por: user.id_user,
          })
          if (error) erros.push(error.message)
        }
      })

      await Promise.all(promises)

      if (erros.length > 0) {
        alert('Algumas células não foram salvas:\n\n' + erros.join('\n'))
        onUpdate()
        return
      }

      setLocalEdits({})
      onUpdate()
    } finally {
      setSaving(false)
    }
  }

  function handleDiscard() {
    setLocalEdits({})
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Barra de ações e preferência de comentários */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
        marginBottom: 8, minHeight: 32, flexWrap: 'wrap',
      }}>
        <button
          onClick={toggleHoverComentarios}
          title="Ao ativar, o comentário aparece ao passar o mouse sobre o valor"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
            color: hoverComentarios ? 'var(--text2)' : 'var(--text5)',
            fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif',
          }}
        >
          <span style={{
            width: 30, height: 16, borderRadius: 99, position: 'relative',
            background: hoverComentarios ? '#6366f1' : 'var(--border)',
            transition: 'background 0.15s', flexShrink: 0,
          }}>
            <span style={{
              position: 'absolute', top: 2, left: hoverComentarios ? 16 : 2,
              width: 12, height: 12, borderRadius: '50%', background: '#fff',
              transition: 'left 0.15s',
            }} />
          </span>
          Comentários ao passar o mouse
        </button>

        {canEdit && hasDirty && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#f59e0b' }}>
              ● {Object.keys(localEdits).length} alteração(ões) não salva(s)
            </span>
            <button onClick={handleDiscard} style={btnDiscard}>Descartar</button>
            <button onClick={handleSave} disabled={saving} style={btnSave}>
              {saving ? 'Salvando...' : '💾 Salvar'}
            </button>
          </div>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={thHeader} colSpan={13}>
                <span style={{ color: '#6366f1' }}>CARTEIRA</span> {subgrupo.nome}
              </th>
            </tr>
            <tr>
              <th style={{ ...thCell, textAlign: 'left', width: 180, background: 'var(--bg4)', color: 'var(--text4)' }}>
                Indicador
              </th>
              {MESES.map(m => (
                <th key={m} style={{ ...thCell, background: 'var(--bg4)', color: 'var(--text5)', fontSize: 11 }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {indicadores.length === 0 && (
              <tr>
                <td colSpan={13} style={{ padding: '12px 16px', color: 'var(--text5)', fontSize: 12, textAlign: 'center' }}>
                  Nenhum indicador configurado
                </td>
              </tr>
            )}
            {indicadores.map((ind, idx) => {
              const indValores = valores[ind.id] || {}
              return (
                <tr key={ind.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--bg3)' }}>
                  <td style={{
                    padding: '5px 10px', fontSize: 12, fontWeight: 600,
                    color: 'var(--text3)', borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                  }}>
                    {ind.nome}
                    {ind.tipo === 'percentual' && (
                      <span style={{ fontSize: 9, color: 'var(--text5)', marginLeft: 4 }}>%</span>
                    )}
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => (
                    <CelulaInput
                      key={mes}
                      indicador={ind}
                      valorRow={indValores[mes] || null}
                      localValue={getLocal(ind.id, mes)}
                      onLocalChange={(val) => handleLocalChange(ind.id, mes, val)}
                      ano={ano}
                      mes={mes}
                      users={users}
                      canEdit={canEdit}
                      comentariosIniciais={indValores[mes]?.id ? comentarios?.[indValores[mes].id] : undefined}
                      hoverComentarios={hoverComentarios}
                    />
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const thCell = {
  padding: '6px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700,
  borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
}
const thHeader = {
  padding: '8px 10px', textAlign: 'left', fontSize: 12, fontWeight: 800,
  background: 'var(--bg4)', color: 'var(--text2)',
  borderBottom: '1px solid var(--border)', letterSpacing: '0.02em',
}
const btnSave = {
  background: '#6366f1', border: 'none', color: '#fff', borderRadius: 8,
  padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
}
const btnDiscard = {
  background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text4)',
  borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
}

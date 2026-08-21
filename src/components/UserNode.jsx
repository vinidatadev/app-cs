import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'

const nivelColors = {
  1: { bg: '#312e81', border: '#6366f1' },
  2: { bg: '#1e3a5f', border: '#3b82f6' },
  3: { bg: '#14532d', border: '#22c55e' },
  4: { bg: '#4a1d96', border: '#a855f7' },
  5: { bg: '#7c2d12', border: '#f97316' },
}

export default function UserNode({ data, selected }) {
  const [hovered, setHovered] = useState(false)
  const colors = nivelColors[data.nivel] || nivelColors[1]
  const initials = (data.nome_usuario || '?')
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  const atribuicoes = data.atribuicoes || []

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: colors.bg,
        border: `2px solid ${selected ? '#fff' : colors.border}`,
        borderRadius: 24,
        padding: '22px 24px 18px',
        minWidth: 260,
        maxWidth: 320,
        boxShadow: selected
          ? `0 0 0 4px ${colors.border}55, 0 12px 40px rgba(0,0,0,0.6)`
          : `0 6px 28px rgba(0,0,0,0.45)`,
        cursor: 'grab',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top}
        style={{ background: colors.border, border: 'none', width: 14, height: 14 }} />

      {/* Botão remover */}
      {hovered && data.onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); data.onRemove(data.id) }}
          style={{
            position: 'absolute', top: -13, left: 14,
            background: '#7f1d1d', border: '1px solid #ef444466',
            color: '#fca5a5', borderRadius: 20, padding: '3px 12px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', zIndex: 10,
          }}
        >
          ✕ remover
        </button>
      )}

      {/* Badge cargo */}
      {data.cargo && (
        <div style={{
          position: 'absolute', top: -13, right: 14,
          background: colors.border, color: '#fff',
          fontSize: 12, fontWeight: 700, padding: '3px 12px',
          borderRadius: 20, letterSpacing: '0.04em', textTransform: 'uppercase',
          maxWidth: 'calc(100% - 28px)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {data.cargo}
        </div>
      )}

      {/* Avatar + nome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 68, height: 68, borderRadius: '50%',
          background: `${colors.border}33`, border: `3px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {data.foto
            ? <img src={data.foto} alt={data.nome_usuario} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ color: colors.border, fontWeight: 800, fontSize: 22 }}>{initials}</span>
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.nome_usuario || 'Sem nome'}
          </div>
        </div>
      </div>

      {/* Tags de atribuição */}
      {atribuicoes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {atribuicoes.map(a => (
            <span key={a.id} style={{
              background: `${a.cor}22`, border: `1px solid ${a.cor}66`,
              color: a.cor, fontSize: 13, fontWeight: 600,
              padding: '5px 14px', borderRadius: 20, whiteSpace: 'nowrap',
            }}>
              {a.nome}
            </span>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom}
        style={{ background: colors.border, border: 'none', width: 14, height: 14 }} />
    </div>
  )
}

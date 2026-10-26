import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'

export default function CelulaNode({ data }) {
  const [hovered, setHovered] = useState(false)
  const { celula, members } = data

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: `${celula.cor}0f`,
        border: `2px solid ${celula.cor}55`,
        borderRadius: 24,
        padding: '0 0 20px 0',
        minWidth: 300,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top}
        style={{ background: celula.cor, border: 'none', width: 12, height: 12 }} />
      <Handle type="source" position={Position.Bottom}
        style={{ background: celula.cor, border: 'none', width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} id="right"
        style={{ background: celula.cor, border: 'none', width: 12, height: 12 }} />
      <Handle type="target" position={Position.Left} id="left"
        style={{ background: celula.cor, border: 'none', width: 12, height: 12 }} />
      {/* Header da célula */}
      <div style={{
        background: `${celula.cor}22`,
        borderBottom: `1px solid ${celula.cor}33`,
        borderRadius: '22px 22px 0 0',
        padding: '14px 20px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: celula.cor, flexShrink: 0,
            boxShadow: `0 0 8px ${celula.cor}`,
          }} />
          <span style={{ fontWeight: 800, fontSize: 16, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
            {celula.nome}
          </span>
          <span style={{
            fontSize: 11, color: celula.cor, fontWeight: 600,
            background: `${celula.cor}22`, border: `1px solid ${celula.cor}44`,
            borderRadius: 20, padding: '2px 8px',
          }}>
            {members.length} {members.length === 1 ? 'membro' : 'membros'}
          </span>
        </div>

        {hovered && data.onEdit && (
          <button
            onClick={e => { e.stopPropagation(); data.onEdit(celula) }}
            style={{
              background: `${celula.cor}22`, border: `1px solid ${celula.cor}44`,
              color: celula.cor, borderRadius: 20, padding: '3px 12px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ✎ editar
          </button>
        )}
      </div>

      {/* Descrição / responsabilidades */}
      {celula.descricao && (
        <div style={{
          margin: '12px 20px 4px',
          padding: '10px 14px',
          background: '#0f0f1788',
          border: `1px solid ${celula.cor}22`,
          borderRadius: 12,
          fontSize: 12,
          color: '#94a3b8',
          lineHeight: 1.6,
        }}>
          {celula.descricao}
        </div>
      )}

      {/* Cards dos membros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '14px 20px 0' }}>
        {members.map(m => <MemberChip key={m.id} user={m} cor={celula.cor} />)}
        {members.length === 0 && (
          <span style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>Nenhum membro</span>
        )}
      </div>
    </div>
  )
}

function MemberChip({ user, cor }) {
  const initials = (user.nome_usuario || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: '#1e1e2e', border: `1px solid ${cor}33`,
      borderRadius: 40, padding: '6px 14px 6px 6px',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: `${cor}22`, border: `2px solid ${cor}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0,
      }}>
        {user.foto
          ? <img src={user.foto} alt={user.nome_usuario} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: cor, fontWeight: 700, fontSize: 11 }}>{initials}</span>
        }
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap' }}>
          {user.nome_usuario || `ID ${user.id}`}
        </div>
        {user.cargo && (
          <div style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap' }}>{user.cargo}</div>
        )}
      </div>
    </div>
  )
}

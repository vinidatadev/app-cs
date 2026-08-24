import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow, Background, BackgroundVariant, Controls,
  useNodesState, useEdgesState, addEdge,
} from '@xyflow/react'
import { supabase } from '../supabase'
import CelulaNode from './CelulaNode'
import CelulaModal from './CelulaModal'

const nodeTypes = { celulaNode: CelulaNode }

export default function CelulaView({ users, canEdit = false }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [celulas, setCelulas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editando, setEditando] = useState(null)
  const [criando, setCriando] = useState(false)
  const saveTimer = useRef(null)

  async function fetchCelulas() {
    setLoading(true)
    const [
      { data: celulaData },
      { data: celulaUsers },
      { data: relacoes },
    ] = await Promise.all([
      supabase.from('celula').select('*'),
      supabase.from('celula_user').select('*'),
      supabase.from('celula_relacao').select('*'),
    ])

    const c = celulaData || []
    const cu = celulaUsers || []
    const rel = relacoes || []
    setCelulas(c)

    const membersByCelula = {}
    cu.forEach(row => {
      if (!membersByCelula[row.id_celula]) membersByCelula[row.id_celula] = []
      const user = users.find(u => u.id === row.id_user)
      if (user) membersByCelula[row.id_celula].push(user)
    })

    // Usa posição salva ou grid automático
    const COLS = 3, X_GAP = 420, Y_GAP = 340
    const newNodes = c.map((celula, i) => {
      const hasSaved = celula.pos_x != null && celula.pos_y != null && (celula.pos_x !== 0 || celula.pos_y !== 0)
      return {
        id: `celula-${celula.id}`,
        type: 'celulaNode',
        position: hasSaved
          ? { x: celula.pos_x, y: celula.pos_y }
          : { x: (i % COLS) * X_GAP + 60, y: Math.floor(i / COLS) * Y_GAP + 60 },
        data: {
          celula,
          members: membersByCelula[celula.id] || [],
          onEdit: canEdit ? (c) => setEditando(c) : null,
        },
      }
    })

    const newEdges = rel.map(r => ({
      id: `rel-${r.id_origem}-${r.id_destino}`,
      source: `celula-${r.id_origem}`,
      target: `celula-${r.id_destino}`,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    }))

    setNodes(newNodes)
    setEdges(newEdges)
    setLoading(false)
  }

  useEffect(() => { fetchCelulas() }, [users])

  // Salva posição ao soltar o nó (debounce) — só editor
  const handleNodesChange = useCallback((changes) => {
    if (!canEdit) return
    onNodesChange(changes)
    const moved = changes.filter(c => c.type === 'position' && c.dragging === false)
    if (!moved.length) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await Promise.all(moved.map(c => {
        const celulaId = Number(c.id.replace('celula-', ''))
        return supabase.from('celula').update({ pos_x: c.position.x, pos_y: c.position.y }).eq('id', celulaId)
      }))
    }, 600)
  }, [onNodesChange, canEdit])

  // Deleta edge — só editor
  const onEdgesDelete = useCallback(async (deletedEdges) => {
    if (!canEdit) return
    await Promise.all(deletedEdges.map(edge => {
      const origemId = Number(edge.source.replace('celula-', ''))
      const destinoId = Number(edge.target.replace('celula-', ''))
      return supabase.from('celula_relacao').delete().eq('id_origem', origemId).eq('id_destino', destinoId)
    }))
  }, [canEdit])

  // Conectar duas células — só editor
  const onConnect = useCallback(async (params) => {
    if (!canEdit) return
    const origemId = Number(params.source.replace('celula-', ''))
    const destinoId = Number(params.target.replace('celula-', ''))
    const { error } = await supabase.from('celula_relacao').insert({ id_origem: origemId, id_destino: destinoId })
    if (!error) {
      setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }, eds))
    }
  }, [setEdges, canEdit])

  async function handleSaveCelula({ id, nome, cor, descricao, membros }) {
    if (id) {
      await supabase.from('celula').update({ nome, cor, descricao }).eq('id', id)
    } else {
      const { data: nova } = await supabase.from('celula').insert({ nome, cor, descricao }).select().single()
      if (nova && membros?.length) {
        await Promise.all(membros.map(uid =>
          supabase.from('celula_user').insert({ id_celula: nova.id, id_user: uid })
        ))
      }
    }
    setEditando(null)
    setCriando(false)
    fetchCelulas()
  }

  async function handleSaveLayout() {
    setSaving(true)
    await Promise.all(
      nodes.map(n => {
        const celulaId = Number(n.id.replace('celula-', ''))
        return supabase.from('celula').update({ pos_x: n.position.x, pos_y: n.position.y }).eq('id', celulaId)
      })
    )
    setSaving(false)
  }

  return (
    <div style={{ position: 'absolute', top: 52, left: 0, right: 0, bottom: 0 }}>

      {/* Botões flutuantes — só editor */}
      {canEdit && (
        <div style={{ position: 'absolute', bottom: 32, right: 32, zIndex: 10, display: 'flex', gap: 10 }}>
          <button onClick={handleSaveLayout} disabled={saving} style={{
            background: '#1e1e2e', border: '1px solid #3b82f655', color: '#3b82f6',
            borderRadius: 40, padding: '10px 20px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}>
            {saving ? '...' : '💾 Salvar Layout'}
          </button>
          <button onClick={() => setCriando(true)} style={{
            background: '#6366f1', border: 'none', color: '#fff',
            borderRadius: 40, padding: '10px 22px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
          }}>
            + Nova Célula
          </button>
        </div>
      )}

      {loading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15,15,23,0.8)', zIndex: 50, fontSize: 16, color: '#6366f1', fontWeight: 600,
        }}>
          Carregando células...
        </div>
      )}

      {!loading && celulas.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 5, background: '#0f0f17',
        }}>
          <div style={{ fontSize: 48 }}>🗂</div>
          <p style={{ color: '#475569', fontSize: 16 }}>Nenhuma célula criada ainda</p>
          {canEdit && (
            <button onClick={() => setCriando(true)} style={{
              background: '#6366f122', border: '1px solid #6366f155', color: '#6366f1',
              borderRadius: 20, padding: '10px 24px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}>
              + Criar primeira célula
            </button>
          )}
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={canEdit ? handleNodesChange : undefined}
        onEdgesChange={canEdit ? onEdgesChange : undefined}
        onEdgesDelete={canEdit ? onEdgesDelete : undefined}
        onConnect={canEdit ? onConnect : undefined}
        nodesDraggable={canEdit}
        nodesConnectable={canEdit}
        elementsSelectable={canEdit}
        deleteKeyCode={canEdit ? ['Backspace', 'Delete'] : null}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.15}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#2d2d44" />
        <Controls />
      </ReactFlow>

      {(criando || editando) && (
        <CelulaModal
          celula={editando}
          users={users}
          onClose={() => { setEditando(null); setCriando(false) }}
          onSave={handleSaveCelula}
        />
      )}
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { supabase } from './supabase'
import { useAuth } from './context/AuthContext'
import UserNode from './components/UserNode'
import Toolbar from './components/Toolbar'
import AddUserModal from './components/AddUserModal'
import AtribuicoesModal from './components/AtribuicoesModal'
import MembrosPanel from './components/MembrosPanel'
import CelulaView from './components/CelulaView'
import Navbar from './components/Navbar'

const nodeTypes = { userNode: UserNode }

function calcLayout(users, relations) {
  const managerMap = {}
  relations.forEach(r => {
    if (!managerMap[r.id_manager]) managerMap[r.id_manager] = []
    managerMap[r.id_manager].push(r.id_user)
  })

  const managedIds = new Set(relations.map(r => r.id_user))
  const roots = users.filter(u => !managedIds.has(u.id))

  const positioned = {}
  const levelCount = {}

  function place(userId, depth) {
    if (positioned[userId]) return
    levelCount[depth] = (levelCount[depth] || 0) + 1
    positioned[userId] = { depth, idx: levelCount[depth] }
    ;(managerMap[userId] || []).forEach(childId => place(childId, depth + 1))
  }

  roots.forEach(u => place(u.id, 0))
  users.forEach(u => { if (!positioned[u.id]) place(u.id, 0) })

  const X_GAP = 240, Y_GAP = 180

  return users.map(u => {
    const pos = positioned[u.id] || { depth: 0, idx: 1 }
    const totalAtDepth = levelCount[pos.depth] || 1
    const xOffset = ((pos.idx - 1) - (totalAtDepth - 1) / 2) * X_GAP
    return {
      id: String(u.id),
      type: 'userNode',
      position: { x: 400 + xOffset, y: 80 + pos.depth * Y_GAP },
      data: { ...u },
    }
  })
}

export default function App() {
  const { perm } = useAuth()
  const canEdit = perm.canEdit('organograma')

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [users, setUsers] = useState([])
  const [relations, setRelations] = useState([])
  const [atribuicoes, setAtribuicoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showAtribuicoes, setShowAtribuicoes] = useState(false)
  const [showMembros, setShowMembros] = useState(false)
  const [visao, setVisao] = useState('hierarquia') // 'hierarquia' | 'celulas'

  // Monta os nodes com callbacks injetados
  function buildNodes(u, r, positions, atribByUser) {
    return positions.map(n => ({
      ...n,
      data: {
        ...n.data,
        atribuicoes: atribByUser[n.data.id] || [],
        onRemove: canEdit ? handleRemove : null,
      },
    }))
  }

  async function fetchData(forceLayout = false) {
    setLoading(true)
    try {
      const [
        { data: usersData, error: usersError },
        { data: relData, error: relError },
        { data: atribData },
        { data: userAtribData },
      ] = await Promise.all([
        supabase.from('user').select('*'),
        supabase.from('organograma').select('*'),
        supabase.from('atribuicao').select('*'),
        supabase.from('user_atribuicao').select('*, atribuicao(*)'),
      ])

      if (usersError) console.error('Erro users:', usersError)
      if (relError) console.error('Erro organograma:', relError)

      const allUsers = usersData || []
      const r = relData || []
      const allAtrib = atribData || []
      const userAtrib = userAtribData || []

      // Só mostra quem tem entrada na tabela organograma
      const idsNoOrganograma = new Set(r.map(row => row.id_user))
      r.forEach(row => { if (row.id_manager) idsNoOrganograma.add(row.id_manager) })
      const u = allUsers.filter(user => idsNoOrganograma.has(user.id))

      setUsers(allUsers)
      setRelations(r)
      setAtribuicoes(allAtrib)

      const atribByUser = {}
      userAtrib.forEach(ua => {
        if (!atribByUser[ua.id_user]) atribByUser[ua.id_user] = []
        if (ua.atribuicao) atribByUser[ua.id_user].push(ua.atribuicao)
      })

      let baseNodes

      if (forceLayout) {
        // Auto layout: ignora posições salvas, recalcula tudo
        baseNodes = calcLayout(u, r)
      } else {
        // Carrega posições salvas; usa auto layout só pra quem não tem posição
        const savedPositions = {}
        r.forEach(row => {
          if (row.pos_x != null && row.pos_y != null && (row.pos_x !== 0 || row.pos_y !== 0)) {
            savedPositions[row.id_user] = { x: row.pos_x, y: row.pos_y }
          }
        })

        const hasSaved = Object.keys(savedPositions).length > 0

        if (hasSaved) {
          baseNodes = u.map(user => ({
            id: String(user.id),
            type: 'userNode',
            position: savedPositions[user.id] || { x: 400, y: 80 },
            data: { ...user },
          }))
        } else {
          baseNodes = calcLayout(u, r)
        }
      }

      const newNodes = buildNodes(u, r, baseNodes, atribByUser)

      const newEdges = r
        .filter(rel => rel.id_manager != null)
        .map(rel => ({
          id: `e-${rel.id_manager}-${rel.id_user}`,
          source: String(rel.id_manager),
          target: String(rel.id_user),
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        }))

      setNodes(newNodes)
      setEdges(newEdges)
    } catch (err) {
      console.error('fetchData falhou:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Salva as posições atuais dos nodes no banco (chamado pelo botão)
  async function handleSaveLayout() {
    setSaving(true)
    try {
      await Promise.all(
        nodes.map(n =>
          supabase.from('organograma')
            .update({ pos_x: n.position.x, pos_y: n.position.y })
            .eq('id_user', Number(n.id))
        )
      )
    } catch (err) {
      console.error('Erro ao salvar layout:', err)
    } finally {
      setSaving(false)
    }
  }

  const onConnect = useCallback(async (params) => {
    if (!canEdit) return
    const { error } = await supabase.from('organograma').insert({
      id_user: Number(params.target),
      id_manager: Number(params.source),
    })
    if (!error) {
      setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }, eds))
    }
  }, [setEdges, canEdit])

  async function handleRemove(userId) {
    await supabase.from('organograma').delete().eq('id_user', userId)
    await fetchData()
  }

  async function handleAddUser(form) {
    const { data: newUser, error } = await supabase
      .from('user')
      .insert({ nome_usuario: form.nome_usuario, cargo: form.cargo, foto: form.foto || null, nivel: form.nivel })
      .select()
      .single()

    if (error || !newUser) return

    if (form.id_manager) {
      await supabase.from('organograma').insert({
        id_user: newUser.id,
        id_manager: Number(form.id_manager),
      })
    }

    await fetchData()
  }

  return (
    <div className="page-canvas" style={{ position: 'relative' }}>
      <Navbar />
      <Toolbar
        onAutoLayout={() => fetchData(true)}
        onSaveLayout={handleSaveLayout}
        onAtribuicoes={() => setShowAtribuicoes(true)}
        onMembros={() => setShowMembros(true)}
        visao={visao}
        onToggleVisao={() => setVisao(v => v === 'hierarquia' ? 'celulas' : 'hierarquia')}
        loading={loading}
        saving={saving}
        canEdit={canEdit}
      />

      {visao === 'celulas' ? (
        <CelulaView users={users} canEdit={canEdit} />
      ) : (
        <>
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(15,15,23,0.8)', zIndex: 50, fontSize: 16, color: '#6366f1', fontWeight: 600,
            }}>
              Carregando organograma...
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={canEdit ? onNodesChange : undefined}
            onEdgesChange={canEdit ? onEdgesChange : undefined}
            onConnect={canEdit ? onConnect : undefined}
            nodeTypes={nodeTypes}
            nodesDraggable={canEdit}
            nodesConnectable={canEdit}
            elementsSelectable={canEdit}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#2d2d44" />
            <Controls />
            <MiniMap
              nodeColor={n => {
                const colors = { 1: '#6366f1', 2: '#3b82f6', 3: '#22c55e', 4: '#a855f7', 5: '#f97316' }
                return colors[n.data?.nivel] || '#6366f1'
              }}
              maskColor="rgba(15,15,23,0.7)"
            />
          </ReactFlow>
        </>
      )}

      {showAtribuicoes && (
        <AtribuicoesModal
          users={users}
          atribuicoes={atribuicoes}
          onClose={() => { setShowAtribuicoes(false); fetchData() }}
        />
      )}

      {showMembros && (
        <MembrosPanel
          users={users}
          relations={relations}
          onClose={() => setShowMembros(false)}
          onRefresh={() => fetchData()}
        />
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useIndicadores() {
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGrupos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ind_grupo')
      .select(`*, ind_subgrupo(*, ind_indicador(*))`)
      .order('ordem')
    setGrupos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchGrupos() }, [fetchGrupos])

  return { grupos, loading, refresh: fetchGrupos }
}

export function useGrupoData(grupoId, ano) {
  const [grupo, setGrupo] = useState(null)
  const [valores, setValores] = useState({}) // { id_indicador: { mes: valor_row } }
  const [comentarios, setComentarios] = useState({}) // { id_valor: [comentarios] }
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTudo = useCallback(async () => {
    if (!grupoId || !ano) return
    setLoading(true)

    const [{ data: grupoData }, { data: usersData }] = await Promise.all([
      supabase
        .from('ind_grupo')
        .select(`*, ind_subgrupo(*, ind_indicador(*))`)
        .eq('id', grupoId)
        .single(),
      supabase.from('user').select('id_user, nome_usuario, foto, cargo'),
    ])

    setGrupo(grupoData)
    setUsers(usersData || [])

    if (!grupoData) { setLoading(false); return }

    // Coletar todos os ids de indicadores desse grupo
    const indIds = grupoData.ind_subgrupo?.flatMap(s =>
      (s.ind_indicador || []).map(i => i.id)
    ) || []

    if (indIds.length === 0) { setLoading(false); return }

    const { data: valoresData } = await supabase
      .from('ind_valor')
      .select('*')
      .in('id_indicador', indIds)
      .eq('ano', ano)

    // Montar mapa { id_indicador: { mes: row } }
    const vMap = {}
    ;(valoresData || []).forEach(v => {
      if (!vMap[v.id_indicador]) vMap[v.id_indicador] = {}
      vMap[v.id_indicador][v.mes] = v
    })
    setValores(vMap)

    // Buscar comentários de todos os valores
    const valorIds = (valoresData || []).map(v => v.id)
    if (valorIds.length > 0) {
      const { data: comsData } = await supabase
        .from('ind_comentario')
        .select('*')
        .in('id_valor', valorIds)
        .order('criado_em', { ascending: true })

      const cMap = {}
      ;(comsData || []).forEach(c => {
        if (!cMap[c.id_valor]) cMap[c.id_valor] = []
        cMap[c.id_valor].push(c)
      })
      setComentarios(cMap)
    }

    setLoading(false)
  }, [grupoId, ano])

  useEffect(() => { fetchTudo() }, [fetchTudo])

  return { grupo, valores, comentarios, users, loading, refresh: fetchTudo }
}

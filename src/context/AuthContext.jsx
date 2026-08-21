import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // dados da tabela public.user
  const [permissoes, setPermissoes] = useState(null) // dados de user_permissoes
  const [loading, setLoading] = useState(true)

  async function fetchUserData(authUser) {
    if (!authUser) {
      setUser(null)
      setPermissoes(null)
      return
    }

    const [{ data: userData }, { data: permData }] = await Promise.all([
      supabase.from('user').select('*').eq('id_user', authUser.id).single(),
      supabase.from('user_permissoes').select('*').eq('id_user', authUser.id).maybeSingle(),
    ])

    setUser(userData || null)
    setPermissoes(permData || null)
  }

  useEffect(() => {
    let mounted = true

    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted) {
        await fetchUserData(session?.user ?? null)
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) fetchUserData(session?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setPermissoes(null)
  }

  const isAdmin = user?.nivel === 2

  // Helpers de permissão
  // nivel 2 = admin: tem tudo, ignora user_permissoes
  const perm = {
    organograma: isAdmin ? 'editor' : (permissoes?.organograma ?? 'none'),
    transacoes:  isAdmin ? 'editor' : (permissoes?.transacoes  ?? 'none'),
    capacitacao: isAdmin ? 'editor' : (permissoes?.capacitacao ?? 'none'),
    links:       isAdmin ? true     : (permissoes?.links       ?? false),

    canView: (modulo) => {
      if (isAdmin) return true
      const v = permissoes?.[modulo]
      if (modulo === 'links') return v === true
      return v === 'viewer' || v === 'editor'
    },
    canEdit: (modulo) => {
      if (isAdmin) return true
      return permissoes?.[modulo] === 'editor'
    },
  }

  return (
    <AuthContext.Provider value={{ user, permissoes, perm, isAdmin, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { fetchProfile, type UserProfile } from '../lib/auth'

interface AuthCtx {
  user:    User | null
  profile: UserProfile | null
  loading: boolean
  signIn:  (usuario: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function resolveProfile(u: User | null) {
    if (!u) { setProfile(null); return }
    const p = await fetchProfile(u.id)
    if (p) p.usuario = (u.email ?? '').replace('@rapidash.bo', '')
    setProfile(p)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      resolveProfile(u).finally(() => setLoading(false))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      resolveProfile(u)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(usuario: string, password: string) {
    // Acepta email completo (si trae @) o usuario interno (le agrega el dominio).
    const input = usuario.trim().toLowerCase()
    const email = input.includes('@') ? input : `${input}@rapidash.bo`
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

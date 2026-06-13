import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
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
  // Id del usuario para el que ya resolvimos perfil; evita recargar (y volver a
  // mostrar el splash) en eventos donde la identidad no cambia, p.ej. el refresco
  // periódico del token.
  const resolvedFor = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    let active = true

    async function sync(u: User | null) {
      setUser(u)
      const id = u?.id ?? null
      if (resolvedFor.current === id) return
      resolvedFor.current = id

      // Mientras el perfil esté cargando mostramos el splash, no la pantalla de
      // error: el perfil aún es null porque no terminó la carga, no porque falte.
      setLoading(true)
      let p: UserProfile | null = null
      if (u) {
        p = await fetchProfile(u.id)
        if (p) p.usuario = (u.email ?? '').replace('@rapidash.bo', '')
      }
      if (!active) return
      setProfile(p)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      sync(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      sync(session?.user ?? null)
    })

    return () => { active = false; subscription.unsubscribe() }
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

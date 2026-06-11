import { supabase, supabaseAdmin } from './supabase'

export type Rol = 'admin' | 'supervisor_zona' | 'repartidor' | 'cliente'

export interface UserProfile {
  id:       string
  nombre:   string
  apellido: string
  rol:      Rol
  zona_id:  string | null
  usuario:  string   // login username (email without @rapidash.bo)
}

export interface FullUser extends UserProfile {
  email:   string
  activo:  boolean
  created: string
}

export interface NewUserInput {
  usuario:  string
  nombre:   string
  apellido: string
  password: string
  rol:      Rol
  zona_id:  string | null
}

// ─── Profile fetch (used by auth context) ─────────────────────────────────────

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, rol, zona_id')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  const d = data as any
  return {
    id:       d.id,
    nombre:   d.nombre   ?? '',
    apellido: d.apellido ?? '',
    rol:      d.rol      as Rol,
    zona_id:  d.zona_id  ?? null,
    usuario:  '',   // filled by auth context from auth.user.email
  }
}

// ─── Admin operations (require supabaseAdmin with service_role key) ───────────

export async function fetchAllUsers(): Promise<FullUser[]> {
  if (!supabaseAdmin) throw new Error('Service role key no configurada. Agrega VITE_SUPABASE_SERVICE_ROLE_KEY en .env.local')

  const [authRes, profilesRes] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers(),
    supabaseAdmin.from('profiles').select('id, nombre, apellido, rol, zona_id'),
  ])
  if (authRes.error) throw new Error(authRes.error.message)

  const profileMap = new Map<string, any>()
  for (const p of (profilesRes.data ?? [])) profileMap.set((p as any).id, p)

  return (authRes.data?.users ?? [])
    .filter(u => u.email?.endsWith('@rapidash.bo'))
    .map(u => {
      const p = profileMap.get(u.id)
      const banDate = u.banned_until ? new Date(u.banned_until) : null
      return {
        id:       u.id,
        email:    u.email ?? '',
        usuario:  (u.email ?? '').replace('@rapidash.bo', ''),
        nombre:   (p as any)?.nombre   ?? '—',
        apellido: (p as any)?.apellido ?? '—',
        rol:      ((p as any)?.rol     ?? 'cliente') as Rol,
        zona_id:  (p as any)?.zona_id  ?? null,
        activo:   !banDate || banDate <= new Date(),
        created:  u.created_at ?? '',
      }
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export async function createUser(input: NewUserInput): Promise<FullUser> {
  if (!supabaseAdmin) throw new Error('Service role key no configurada')

  const email = `${input.usuario.trim().toLowerCase()}@rapidash.bo`

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password:      input.password,
    email_confirm: true,
  })
  if (authError) throw new Error(authError.message)

  const userId = authData.user.id

  const { error: pErr } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: userId, nombre: input.nombre, apellido: input.apellido, rol: input.rol, zona_id: input.zona_id || null },
             { onConflict: 'id' })
  if (pErr) throw new Error(pErr.message)

  return {
    id: userId, email, usuario: input.usuario.trim().toLowerCase(),
    nombre: input.nombre, apellido: input.apellido,
    rol: input.rol, zona_id: input.zona_id, activo: true,
    created: new Date().toISOString(),
  }
}

export async function toggleUserActivo(userId: string, activo: boolean): Promise<void> {
  if (!supabaseAdmin) throw new Error('Service role key no configurada')
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: activo ? 'none' : '876000h',
  })
  if (error) throw new Error(error.message)
}

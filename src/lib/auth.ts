import { supabase } from './supabase'

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
  email:    string
  activo:   boolean
  created:  string
  invited?: boolean   // usuario invitado por email, aún sin primer login
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

// Las operaciones de admin (listar/crear/invitar/cambiar rol/activar usuarios)
// viven en src/lib/adminApi.ts y pasan por la Netlify Function admin-users,
// que es la única que usa la service role key (en el servidor).

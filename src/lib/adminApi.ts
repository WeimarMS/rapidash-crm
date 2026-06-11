// ============================================================
// adminApi — cliente de la Netlify Function admin-users
// ============================================================
// Reemplaza el uso de la service role key en el navegador. Todas las
// operaciones de gestión de usuarios pasan por /.netlify/functions/
// admin-users, que valida el token y exige rol admin en el servidor.

import { supabase } from './supabase'
import type { FullUser, NewUserInput, Rol } from './auth'

const FN_URL = '/.netlify/functions/admin-users'

async function callAdmin<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Sesión no válida. Volvé a iniciar sesión.')

  const res = await fetch(FN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ action, ...payload }),
  })

  let body: { error?: string } & Record<string, unknown> = {}
  try { body = await res.json() } catch { /* respuesta sin cuerpo */ }
  if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`)
  return body as T
}

// ─── Operaciones ──────────────────────────────────────────────────────────────

export interface InviteUserInput {
  email:    string
  nombre:   string
  apellido: string
  rol:      Rol
  zona_id:  string | null
}

export async function fetchAllUsers(): Promise<FullUser[]> {
  const { users } = await callAdmin<{ users: FullUser[] }>('list')
  return users
}

export async function createUser(input: NewUserInput): Promise<FullUser> {
  const { user } = await callAdmin<{ user: FullUser }>('create', { ...input })
  return user
}

export async function inviteUser(input: InviteUserInput): Promise<FullUser> {
  const { user } = await callAdmin<{ user: FullUser }>('invite', { ...input })
  return user
}

export async function updateUserRole(userId: string, rol: Rol, zona_id: string | null): Promise<void> {
  await callAdmin('update-role', { userId, rol, zona_id })
}

export async function toggleUserActivo(userId: string, activo: boolean): Promise<void> {
  await callAdmin('toggle-active', { userId, activo })
}

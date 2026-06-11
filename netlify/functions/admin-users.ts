// ============================================================
// RapiDash CRM — Netlify Function: admin-users
// ============================================================
// Gestión de usuarios con la SERVICE ROLE KEY, que vive SOLO en el
// servidor (env var SUPABASE_SERVICE_ROLE_KEY, sin prefijo VITE_, así
// nunca entra al bundle del frontend).
//
// Toda petición exige un Bearer token (la sesión del usuario logueado).
// La Function valida ese token, confirma que el perfil sea rol 'admin'
// y recién entonces ejecuta la acción con privilegios de service_role.
//
// Acciones (campo "action" del body JSON):
//   list          → lista todos los usuarios + su perfil
//   create        → crea usuario (email + password + perfil)
//   invite        → invita por email (Supabase manda el correo)
//   update-role   → cambia rol y zona de un usuario
//   toggle-active → activa / desactiva (ban) un usuario
//
// Env vars requeridas (Netlify → Site settings → Environment variables):
//   SUPABASE_URL                = https://<ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   = service_role key (secreta)
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Rol = 'admin' | 'supervisor_zona' | 'repartidor' | 'cliente'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

// Cliente con service_role: bypassa RLS. Reutilizado entre invocaciones.
let _admin: SupabaseClient | null = null
function adminClient(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(SUPABASE_URL as string, SERVICE_KEY as string, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _admin
}

// ─── Helpers de respuesta ─────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const ROLES: Rol[] = ['admin', 'supervisor_zona', 'repartidor', 'cliente']
const SYNTHETIC_DOMAIN = '@rapidash.bo'

// ─── Autorización: exige un admin autenticado ─────────────────────────────────

async function requireAdmin(req: Request): Promise<{ ok: true } | { ok: false; res: Response }> {
  const auth  = req.headers.get('authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { ok: false, res: json({ error: 'No autenticado' }, 401) }

  const admin = adminClient()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return { ok: false, res: json({ error: 'Token inválido o expirado' }, 401) }

  const { data: profile, error: pErr } = await admin
    .from('profiles').select('rol').eq('id', user.id).single()
  if (pErr || (profile as { rol?: Rol } | null)?.rol !== 'admin') {
    return { ok: false, res: json({ error: 'Acceso denegado: se requiere rol admin' }, 403) }
  }
  return { ok: true }
}

// ─── Acciones ─────────────────────────────────────────────────────────────────

function emailToUsuario(email: string): string {
  return email.endsWith(SYNTHETIC_DOMAIN) ? email.slice(0, -SYNTHETIC_DOMAIN.length) : email
}

async function listUsers() {
  const admin = adminClient()
  const [authRes, profilesRes] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('profiles').select('id, nombre, apellido, rol, zona_id'),
  ])
  if (authRes.error) throw new Error(authRes.error.message)

  const profileMap = new Map<string, Record<string, unknown>>()
  for (const p of profilesRes.data ?? []) profileMap.set((p as { id: string }).id, p as Record<string, unknown>)

  const users = (authRes.data?.users ?? []).map(u => {
    const p = profileMap.get(u.id) ?? {}
    const banUntil = (u as { banned_until?: string }).banned_until
    const banDate  = banUntil ? new Date(banUntil) : null
    return {
      id:       u.id,
      email:    u.email ?? '',
      usuario:  emailToUsuario(u.email ?? ''),
      nombre:   (p.nombre   as string) ?? '—',
      apellido: (p.apellido as string) ?? '—',
      rol:      ((p.rol     as Rol)    ?? 'cliente') as Rol,
      zona_id:  (p.zona_id  as string | null) ?? null,
      activo:   !banDate || banDate <= new Date(),
      created:  u.created_at ?? '',
      invited:  !u.last_sign_in_at && !u.email_confirmed_at,
    }
  }).sort((a, b) => a.nombre.localeCompare(b.nombre))

  return json({ users })
}

async function createUser(body: Record<string, unknown>) {
  const usuario  = String(body.usuario ?? '').trim().toLowerCase()
  const nombre   = String(body.nombre ?? '').trim()
  const apellido = String(body.apellido ?? '').trim()
  const password = String(body.password ?? '')
  const rol      = body.rol as Rol
  const zona_id  = (body.zona_id as string | null) || null

  if (!usuario || !nombre || !apellido || !password) return json({ error: 'Faltan campos obligatorios' }, 400)
  if (password.length < 8)      return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400)
  if (!ROLES.includes(rol))     return json({ error: 'Rol inválido' }, 400)

  const email = usuario.includes('@') ? usuario : `${usuario}${SYNTHETIC_DOMAIN}`
  const admin = adminClient()

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { nombre, rol },
  })
  if (authErr) return json({ error: authErr.message }, 400)

  const userId = authData.user.id
  const { error: pErr } = await admin.from('profiles')
    .upsert({ id: userId, email, nombre, apellido, rol, zona_id }, { onConflict: 'id' })
  if (pErr) return json({ error: pErr.message }, 400)

  return json({
    user: {
      id: userId, email, usuario: emailToUsuario(email),
      nombre, apellido, rol, zona_id, activo: true,
      created: new Date().toISOString(), invited: false,
    },
  })
}

async function inviteUser(body: Record<string, unknown>) {
  const email    = String(body.email ?? '').trim().toLowerCase()
  const nombre   = String(body.nombre ?? '').trim()
  const apellido = String(body.apellido ?? '').trim()
  const rol      = body.rol as Rol
  const zona_id  = (body.zona_id as string | null) || null

  if (!email || !email.includes('@')) return json({ error: 'Email inválido' }, 400)
  if (!nombre || !apellido)           return json({ error: 'Nombre y apellido son obligatorios' }, 400)
  if (!ROLES.includes(rol))           return json({ error: 'Rol inválido' }, 400)

  const admin = adminClient()
  const redirectTo = process.env.SITE_INVITE_REDIRECT || undefined

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nombre, rol },
    redirectTo,
  })
  if (error) return json({ error: error.message }, 400)

  // El trigger handle_new_user crea el profile con rol/nombre desde metadata,
  // pero no apellido ni zona_id → los completamos acá.
  const userId = data.user.id
  const { error: pErr } = await admin.from('profiles')
    .upsert({ id: userId, email, nombre, apellido, rol, zona_id }, { onConflict: 'id' })
  if (pErr) return json({ error: pErr.message }, 400)

  return json({
    user: {
      id: userId, email, usuario: emailToUsuario(email),
      nombre, apellido, rol, zona_id, activo: true,
      created: data.user.created_at ?? new Date().toISOString(), invited: true,
    },
  })
}

async function updateRole(body: Record<string, unknown>) {
  const userId  = String(body.userId ?? '')
  const rol     = body.rol as Rol
  const zona_id = (body.zona_id as string | null) || null
  if (!userId)              return json({ error: 'Falta userId' }, 400)
  if (!ROLES.includes(rol)) return json({ error: 'Rol inválido' }, 400)

  const admin = adminClient()
  // service_role saltea el trigger anti-escalada; el cambio es legítimo.
  const { error } = await admin.from('profiles')
    .update({ rol, zona_id }).eq('id', userId)
  if (error) return json({ error: error.message }, 400)

  // Mantener la metadata de auth en sync (no crítico, pero prolijo).
  await admin.auth.admin.updateUserById(userId, { user_metadata: { rol } })

  return json({ ok: true, userId, rol, zona_id })
}

async function toggleActive(body: Record<string, unknown>) {
  const userId = String(body.userId ?? '')
  const activo = Boolean(body.activo)
  if (!userId) return json({ error: 'Falta userId' }, 400)

  const admin = adminClient()
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: activo ? 'none' : '876000h',
  })
  if (error) return json({ error: error.message }, 400)
  return json({ ok: true, userId, activo })
}

// ─── Entrypoint ────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json({ error: 'Servidor mal configurado: faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY' }, 500)
  }

  const gate = await requireAdmin(req)
  if (!gate.ok) return gate.res

  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return json({ error: 'Body JSON inválido' }, 400)
  }

  try {
    switch (body.action) {
      case 'list':          return await listUsers()
      case 'create':        return await createUser(body)
      case 'invite':        return await inviteUser(body)
      case 'update-role':   return await updateRole(body)
      case 'toggle-active': return await toggleActive(body)
      default:              return json({ error: `Acción desconocida: ${String(body.action)}` }, 400)
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error interno' }, 500)
  }
}

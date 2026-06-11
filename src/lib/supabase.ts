import { createClient } from '@supabase/supabase-js'

const url     = import.meta.env.VITE_SUPABASE_URL      as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, anonKey)

// Admin client — bypasses RLS. Only for user management (FASE 4).
// Requires VITE_SUPABASE_SERVICE_ROLE_KEY in .env.local
const srvKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined
export const supabaseAdmin = srvKey
  ? createClient(url, srvKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null

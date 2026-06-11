import { createClient } from '@supabase/supabase-js'

const url     = import.meta.env.VITE_SUPABASE_URL      as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, anonKey)

// La gestión de usuarios (service role key) ya NO vive en el navegador:
// pasa por la Netlify Function admin-users. Ver src/lib/adminApi.ts.

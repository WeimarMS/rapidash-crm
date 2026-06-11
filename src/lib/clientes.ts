import { supabase } from './supabase'

export type TipoCliente = 'farmacia' | 'clinica' | 'centro_salud' | 'consultorio'

export interface Cliente {
  id: string
  nombre: string
  tipo: TipoCliente
  zona_id: string
  zona_nombre: string
  zona_color: string
  direccion: string
  telefono: string | null
  email: string | null
  contacto_nombre: string | null
  nit: string | null
  credito_limite: number | null
  activo: boolean
  created_at: string
}

export async function toggleClienteActivo(id: string, activo: boolean): Promise<void> {
  const { error } = await supabase.from('clientes').update({ activo }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre, tipo, zona_id, direccion, telefono, email, contacto_nombre, nit, credito_limite, activo, created_at, zonas(nombre, color)')
    .order('nombre', { ascending: true })

  if (error) throw new Error(error.message)

  return ((data ?? []) as any[]).map(c => {
    const zona = Array.isArray(c.zonas) ? c.zonas[0] : c.zonas
    return {
      id:              c.id,
      nombre:          c.nombre,
      tipo:            c.tipo as TipoCliente,
      zona_id:         c.zona_id,
      zona_nombre:     zona?.nombre ?? '—',
      zona_color:      zona?.color  ?? '#94a3b8',
      direccion:       c.direccion,
      telefono:        c.telefono,
      email:           c.email,
      contacto_nombre: c.contacto_nombre,
      nit:             c.nit,
      credito_limite:  c.credito_limite,
      activo:          c.activo ?? true,
      created_at:      c.created_at,
    }
  })
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

export async function fetchZonasSimple(): Promise<{ id: string; nombre: string; color: string }[]> {
  const { data, error } = await supabase.from('zonas').select('id, nombre, color').order('nombre')
  if (error) throw new Error(error.message)
  return (data ?? []) as { id: string; nombre: string; color: string }[]
}

export interface NewClienteInput {
  nombre:          string
  tipo:            TipoCliente
  zona_id:         string
  direccion:       string
  telefono:        string
  email:           string
  contacto_nombre: string
  credito_limite:  number | null
}

export async function createCliente(input: NewClienteInput): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre:          input.nombre,
      tipo:            input.tipo,
      zona_id:         input.zona_id,
      direccion:       input.direccion,
      telefono:        input.telefono        || null,
      email:           input.email           || null,
      contacto_nombre: input.contacto_nombre || null,
      credito_limite:  input.credito_limite,
      activo:          true,
    })
    .select('id, nombre, tipo, zona_id, direccion, telefono, email, contacto_nombre, nit, credito_limite, activo, created_at, zonas(nombre, color)')
    .single()

  if (error) throw new Error(error.message)

  const c    = data as any
  const zona = Array.isArray(c.zonas) ? c.zonas[0] : c.zonas
  return {
    id:              c.id,
    nombre:          c.nombre,
    tipo:            c.tipo            as TipoCliente,
    zona_id:         c.zona_id,
    zona_nombre:     zona?.nombre      ?? '—',
    zona_color:      zona?.color       ?? '#94a3b8',
    direccion:       c.direccion,
    telefono:        c.telefono,
    email:           c.email,
    contacto_nombre: c.contacto_nombre,
    nit:             c.nit,
    credito_limite:  c.credito_limite,
    activo:          c.activo          ?? true,
    created_at:      c.created_at,
  }
}

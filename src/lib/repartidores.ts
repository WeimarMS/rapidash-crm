import { supabase } from './supabase'

// Fila plana de la query de métricas de pedidos por repartidor
interface PedidoMetricRow {
  repartidor_id: string
  estado:        string
}

// Forma del JOIN que devuelve Supabase para repartidores con zona y vehículo
interface RepartidorJoinRow {
  id:          string
  nombre:      string
  apellido:    string
  ci:          string
  telefono:    string | null
  activo:      boolean | null
  zona_id:     string
  vehiculo_id: string | null
  zonas:     { nombre: string; color: string } | { nombre: string; color: string }[] | null
  vehiculos: { placa: string; tipo: string }   | { placa: string; tipo: string }[]   | null
}

export interface Repartidor {
  id: string
  nombre: string
  apellido: string
  ci: string
  telefono: string | null
  zona_id: string
  zona_nombre: string
  zona_color: string
  vehiculo_id: string
  vehiculo_placa: string
  vehiculo_tipo: string
  activo: boolean
  pedidos_total: number
  pedidos_entregados: number
  tasa_entrega: number
}

export async function toggleRepartidorActivo(id: string, activo: boolean): Promise<void> {
  const { error } = await supabase.from('repartidores').update({ activo }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchRepartidores(): Promise<Repartidor[]> {
  const [repsRes, pedidosRes] = await Promise.all([
    supabase
      .from('repartidores')
      .select('id, nombre, apellido, ci, telefono, activo, zona_id, vehiculo_id, zonas(nombre, color), vehiculos(placa, tipo)')
      .order('nombre'),
    supabase
      .from('pedidos')
      .select('repartidor_id, estado')
      .not('repartidor_id', 'is', null),
  ])

  if (repsRes.error) throw new Error(repsRes.error.message)

  const metricsMap = new Map<string, { total: number; entregados: number }>()
  for (const p of (pedidosRes.data ?? []) as PedidoMetricRow[]) {
    if (!p.repartidor_id) continue
    const m = metricsMap.get(p.repartidor_id) ?? { total: 0, entregados: 0 }
    m.total++
    if (p.estado === 'entregado') m.entregados++
    metricsMap.set(p.repartidor_id, m)
  }

  return ((repsRes.data ?? []) as RepartidorJoinRow[]).map(r => {
    const zona = Array.isArray(r.zonas) ? r.zonas[0] : r.zonas
    const veh  = Array.isArray(r.vehiculos) ? r.vehiculos[0] : r.vehiculos
    const m    = metricsMap.get(r.id) ?? { total: 0, entregados: 0 }
    return {
      id:                 r.id,
      nombre:             r.nombre,
      apellido:           r.apellido,
      ci:                 r.ci,
      telefono:           r.telefono,
      zona_id:            r.zona_id,
      zona_nombre:        zona?.nombre ?? '—',
      zona_color:         zona?.color  ?? '#94a3b8',
      vehiculo_id:        r.vehiculo_id ?? '',
      vehiculo_placa:     veh?.placa   ?? '—',
      vehiculo_tipo:      veh?.tipo    ?? '—',
      activo:             r.activo ?? true,
      pedidos_total:      m.total,
      pedidos_entregados: m.entregados,
      tasa_entrega:       m.total ? Math.round((m.entregados / m.total) * 100) : 0,
    }
  })
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

export interface RepartidorFormOptions {
  zonas:     { id: string; nombre: string; color: string }[]
  vehiculos: { id: string; placa: string; tipo: string }[]
}

export async function fetchRepartidorFormOptions(): Promise<RepartidorFormOptions> {
  const [zonasRes, vehiculosRes] = await Promise.all([
    supabase.from('zonas').select('id, nombre, color').order('nombre'),
    supabase.from('vehiculos').select('id, placa, tipo').order('placa'),
  ])
  if (zonasRes.error) throw new Error(zonasRes.error.message)
  return {
    zonas:     (zonasRes.data     ?? []) as { id: string; nombre: string; color: string }[],
    vehiculos: (vehiculosRes.data ?? []) as { id: string; placa: string; tipo: string }[],
  }
}

export interface NewRepartidorInput {
  nombre:      string
  apellido:    string
  ci:          string
  telefono:    string
  zona_id:     string
  vehiculo_id: string
}

export async function createRepartidor(input: NewRepartidorInput): Promise<Repartidor> {
  const { data, error } = await supabase
    .from('repartidores')
    .insert({
      nombre:      input.nombre,
      apellido:    input.apellido,
      ci:          input.ci,
      telefono:    input.telefono || null,
      zona_id:     input.zona_id,
      vehiculo_id: input.vehiculo_id,
      activo:      true,
    })
    .select('id, nombre, apellido, ci, telefono, activo, zona_id, vehiculo_id, zonas(nombre, color), vehiculos(placa, tipo)')
    .single()

  if (error) throw new Error(error.message)

  const r    = data as RepartidorJoinRow
  const zona = Array.isArray(r.zonas)    ? r.zonas[0]    : r.zonas
  const veh  = Array.isArray(r.vehiculos) ? r.vehiculos[0] : r.vehiculos
  return {
    id:                 r.id,
    nombre:             r.nombre,
    apellido:           r.apellido,
    ci:                 r.ci,
    telefono:           r.telefono,
    zona_id:            r.zona_id,
    zona_nombre:        zona?.nombre ?? '—',
    zona_color:         zona?.color  ?? '#94a3b8',
    vehiculo_id:        r.vehiculo_id ?? '',
    vehiculo_placa:     veh?.placa   ?? '—',
    vehiculo_tipo:      veh?.tipo    ?? '—',
    activo:             r.activo     ?? true,
    pedidos_total:      0,
    pedidos_entregados: 0,
    tasa_entrega:       0,
  }
}

// ─── Update Repartidor ────────────────────────────────────────────────────────

export interface UpdateRepartidorInput {
  telefono:    string
  zona_id:     string
  vehiculo_id: string
}

export async function updateRepartidor(id: string, input: UpdateRepartidorInput): Promise<Repartidor> {
  const { data, error } = await supabase
    .from('repartidores')
    .update({
      telefono:    input.telefono || null,
      zona_id:     input.zona_id,
      vehiculo_id: input.vehiculo_id,
    })
    .eq('id', id)
    .select('id, nombre, apellido, ci, telefono, activo, zona_id, vehiculo_id, zonas(nombre, color), vehiculos(placa, tipo)')
    .single()

  if (error) throw new Error(error.message)

  const r    = data as RepartidorJoinRow
  const zona = Array.isArray(r.zonas)    ? r.zonas[0]    : r.zonas
  const veh  = Array.isArray(r.vehiculos) ? r.vehiculos[0] : r.vehiculos
  return {
    id:                 r.id,
    nombre:             r.nombre,
    apellido:           r.apellido,
    ci:                 r.ci,
    telefono:           r.telefono,
    zona_id:            r.zona_id,
    zona_nombre:        zona?.nombre ?? '—',
    zona_color:         zona?.color  ?? '#94a3b8',
    vehiculo_id:        r.vehiculo_id ?? '',
    vehiculo_placa:     veh?.placa   ?? '—',
    vehiculo_tipo:      veh?.tipo    ?? '—',
    activo:             r.activo     ?? true,
    pedidos_total:      0,
    pedidos_entregados: 0,
    tasa_entrega:       0,
  }
}

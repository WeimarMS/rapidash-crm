import { supabase } from './supabase'

export interface ZonaDetalle {
  id: string
  nombre: string
  color: string
  descripcion: string | null
  activa: boolean
  supervisor_nombre: string | null
  total_clientes: number
  total_pedidos: number
  pedidos_entregados: number
  ingresos_total: number
  repartidores_activos: number
}

export async function fetchZonas(): Promise<ZonaDetalle[]> {
  const [zonasRes, supRes, clientesRes, pedidosRes, repsRes] = await Promise.all([
    supabase.from('zonas').select('id, nombre, color, descripcion, activa').order('nombre'),
    supabase.from('profiles').select('zona_id, nombre, apellido').eq('rol', 'supervisor_zona'),
    supabase.from('clientes').select('zona_id'),
    supabase.from('pedidos').select('zona_id, total, estado'),
    supabase.from('repartidores').select('zona_id, activo').eq('activo', true),
  ])

  if (zonasRes.error) throw new Error(zonasRes.error.message)

  const supMap        = new Map<string, string>()
  const clienteMap    = new Map<string, number>()
  const pedidoMap     = new Map<string, number>()
  const entregadosMap = new Map<string, number>()
  const ingresosMap   = new Map<string, number>()
  const repMap        = new Map<string, number>()

  for (const s of (supRes.data ?? []) as any[])
    supMap.set(s.zona_id, `${s.nombre} ${s.apellido}`)

  for (const c of (clientesRes.data ?? []) as any[])
    clienteMap.set(c.zona_id, (clienteMap.get(c.zona_id) ?? 0) + 1)

  for (const p of (pedidosRes.data ?? []) as any[]) {
    pedidoMap.set(p.zona_id, (pedidoMap.get(p.zona_id) ?? 0) + 1)
    if (p.estado === 'entregado') {
      entregadosMap.set(p.zona_id, (entregadosMap.get(p.zona_id) ?? 0) + 1)
      ingresosMap.set(p.zona_id, (ingresosMap.get(p.zona_id) ?? 0) + (p.total ?? 0))
    }
  }

  for (const r of (repsRes.data ?? []) as any[])
    repMap.set(r.zona_id, (repMap.get(r.zona_id) ?? 0) + 1)

  return ((zonasRes.data ?? []) as any[]).map(z => ({
    id:                   z.id,
    nombre:               z.nombre,
    color:                z.color,
    descripcion:          z.descripcion,
    activa:               z.activa,
    supervisor_nombre:    supMap.get(z.id)        ?? null,
    total_clientes:       clienteMap.get(z.id)    ?? 0,
    total_pedidos:        pedidoMap.get(z.id)     ?? 0,
    pedidos_entregados:   entregadosMap.get(z.id) ?? 0,
    ingresos_total:       ingresosMap.get(z.id)   ?? 0,
    repartidores_activos: repMap.get(z.id)        ?? 0,
  }))
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

export interface NewZonaInput {
  nombre:      string
  color:       string
  descripcion: string
}

export async function createZona(input: NewZonaInput): Promise<ZonaDetalle> {
  const { data, error } = await supabase
    .from('zonas')
    .insert({
      nombre:      input.nombre,
      color:       input.color,
      descripcion: input.descripcion || null,
      activa:      true,
    })
    .select('id, nombre, color, descripcion, activa')
    .single()

  if (error) throw new Error(error.message)

  const z = data as any
  return {
    id:                   z.id,
    nombre:               z.nombre,
    color:                z.color,
    descripcion:          z.descripcion,
    activa:               z.activa ?? true,
    supervisor_nombre:    null,
    total_clientes:       0,
    total_pedidos:        0,
    pedidos_entregados:   0,
    ingresos_total:       0,
    repartidores_activos: 0,
  }
}

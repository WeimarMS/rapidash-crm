import { supabase } from './supabase'

export interface ClienteMapData {
  id:             string
  nombre:         string
  tipo:           string
  latitud:        number
  longitud:       number
  direccion:      string
  telefono:       string
  zona_nombre:    string
  zona_color:     string
  total_pedidos:  number
  total_ingresos: number
  ultimo_pedido:  string | null
}

export async function fetchClientesMapData(): Promise<ClienteMapData[]> {
  const [clientesRes, pedidosRes] = await Promise.all([
    supabase
      .from('clientes')
      .select('id, nombre, tipo, latitud, longitud, direccion, telefono, zonas(nombre, color)')
      .not('latitud', 'is', null)
      .not('longitud', 'is', null),
    supabase
      .from('pedidos')
      .select('cliente_id, total, estado, fecha_pedido'),
  ])

  if (clientesRes.error) throw new Error(clientesRes.error.message)

  const statsMap = new Map<string, { pedidos: number; ingresos: number; ultimo: string | null }>()
  for (const p of ((pedidosRes.data ?? []) as any[])) {
    if (!p.cliente_id) continue
    const m = statsMap.get(p.cliente_id) ?? { pedidos: 0, ingresos: 0, ultimo: null }
    m.pedidos++
    if (p.estado === 'entregado') m.ingresos += p.total ?? 0
    if (!m.ultimo || p.fecha_pedido > m.ultimo) m.ultimo = p.fecha_pedido
    statsMap.set(p.cliente_id, m)
  }

  return ((clientesRes.data ?? []) as any[]).map(c => {
    const zona  = Array.isArray(c.zonas) ? c.zonas[0] : c.zonas
    const stats = statsMap.get(c.id) ?? { pedidos: 0, ingresos: 0, ultimo: null }
    return {
      id:             c.id,
      nombre:         c.nombre         ?? '—',
      tipo:           c.tipo           ?? 'otro',
      latitud:        Number(c.latitud),
      longitud:       Number(c.longitud),
      direccion:      c.direccion      ?? '—',
      telefono:       c.telefono       ?? '—',
      zona_nombre:    zona?.nombre     ?? '—',
      zona_color:     zona?.color      ?? '#94a3b8',
      total_pedidos:  stats.pedidos,
      total_ingresos: Math.round(stats.ingresos),
      ultimo_pedido:  stats.ultimo,
    }
  })
}

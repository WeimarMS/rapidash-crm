import { supabase } from './supabase'

export type EstadoPedido =
  | 'pendiente' | 'confirmado' | 'en_ruta'
  | 'entregado' | 'fallido'   | 'cancelado'

export interface RawDashPedido {
  id:             string
  codigo:         string
  estado:         EstadoPedido
  total:          number
  zona_id:        string
  zona_nombre:    string
  zona_color:     string
  cliente_nombre: string
  fecha_pedido:   string
}

export interface ZonaBase  { id: string; nombre: string; color: string }
export interface EstadoItem { estado: EstadoPedido; count: number; pct: number }
export interface ZonaItem   { zona_id: string; zona: string; pedidos: number; color: string }
export interface UltimoPedido {
  id: string; codigo: string; cliente: string
  zona: string; estado: EstadoPedido; total: number; fecha: string
}

export interface DashboardRaw {
  pedidos: RawDashPedido[]
  zonas:   ZonaBase[]
}

export async function fetchDashboardRaw(): Promise<DashboardRaw> {
  const [pedidosRes, zonasRes] = await Promise.all([
    supabase
      .from('pedidos')
      .select('id, codigo, estado, total, zona_id, fecha_pedido, clientes(nombre), zonas(nombre, color)')
      .order('fecha_pedido', { ascending: false }),
    supabase
      .from('zonas')
      .select('id, nombre, color')
      .order('nombre'),
  ])

  if (pedidosRes.error) throw new Error(pedidosRes.error.message)

  const seen = new Set<string>()
  const pedidos: RawDashPedido[] = ((pedidosRes.data ?? []) as any[])
    .filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true })
    .map(p => {
      const cli = Array.isArray(p.clientes) ? p.clientes[0] : p.clientes
      const zon = Array.isArray(p.zonas)    ? p.zonas[0]    : p.zonas
      return {
        id:             p.id,
        codigo:         p.codigo,
        estado:         p.estado as EstadoPedido,
        total:          p.total ?? 0,
        zona_id:        p.zona_id  ?? '',
        zona_nombre:    zon?.nombre ?? '—',
        zona_color:     zon?.color  ?? '#94a3b8',
        cliente_nombre: cli?.nombre ?? '—',
        fecha_pedido:   p.fecha_pedido ?? '',
      }
    })

  return {
    pedidos,
    zonas: (zonasRes.data ?? []) as ZonaBase[],
  }
}

// ─── Pure aggregation helpers (used in Dashboard) ─────────────────────────────

const ESTADO_ORDER: EstadoPedido[] = [
  'entregado', 'en_ruta', 'confirmado', 'pendiente', 'fallido', 'cancelado',
]

export function computeEstadoBreakdown(pedidos: RawDashPedido[]): EstadoItem[] {
  const map = new Map<EstadoPedido, number>()
  for (const p of pedidos) map.set(p.estado, (map.get(p.estado) ?? 0) + 1)
  const total = pedidos.length
  return ESTADO_ORDER
    .filter(e => map.has(e))
    .map(e => ({
      estado: e,
      count:  map.get(e)!,
      pct:    total ? Math.round((map.get(e)! / total) * 100) : 0,
    }))
}

export function computeZonaData(pedidos: RawDashPedido[], zonas: ZonaBase[]): ZonaItem[] {
  const map = new Map<string, number>()
  for (const p of pedidos) map.set(p.zona_id, (map.get(p.zona_id) ?? 0) + 1)
  return zonas.map(z => ({
    zona_id: z.id,
    zona:    z.nombre,
    pedidos: map.get(z.id) ?? 0,
    color:   z.color,
  }))
}

export function computeKPIs(pedidos: RawDashPedido[]) {
  const total      = pedidos.length
  const entregados = pedidos.filter(p => p.estado === 'entregado')
  return {
    totalPedidos:    total,
    totalEntregados: entregados.length,
    ingresosTotal:   entregados.reduce((s, p) => s + p.total, 0),
    tasaEntrega:     total ? Math.round((entregados.length / total) * 100) : 0,
  }
}

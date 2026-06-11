import { supabase } from './supabase'

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// ─── Raw interfaces ───────────────────────────────────────────────────────────

export interface RawPedido {
  id:             string
  estado:         string
  total:          number
  fecha_pedido:   string
  zona_id:        string
  cliente_nombre: string
  mes_label:      string   // "Ene"
}

export interface RawItem {
  pedido_id:       string
  producto_nombre: string
  cantidad:        number
}

export interface RawZona {
  id:     string
  nombre: string
  color:  string
}

export interface AnalyticsRaw {
  pedidos: RawPedido[]
  items:   RawItem[]
  zonas:   RawZona[]
}

// ─── Aggregation output interfaces ───────────────────────────────────────────

export interface MesData  { mes: string; pedidos: number; ingresos: number }
export interface TopItem  { nombre: string; valor: number }
export interface ZonaComp { nombre: string; color: string; pedidos: number; entregados: number; ingresos: number }

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchAnalyticsRaw(): Promise<AnalyticsRaw> {
  const [pedidosRes, itemsRes, zonasRes] = await Promise.all([
    supabase
      .from('pedidos')
      .select('id, estado, total, fecha_pedido, zona_id, cliente_id, clientes(nombre)'),
    supabase
      .from('pedido_items')
      .select('pedido_id, cantidad, productos(nombre)'),
    supabase
      .from('zonas')
      .select('id, nombre, color'),
  ])

  const pedidos: RawPedido[] = ((pedidosRes.data ?? []) as any[]).map(p => {
    const cli = Array.isArray(p.clientes) ? p.clientes[0] : p.clientes
    const d   = p.fecha_pedido ? new Date(p.fecha_pedido) : null
    return {
      id:             p.id,
      estado:         p.estado ?? '',
      total:          p.total  ?? 0,
      fecha_pedido:   p.fecha_pedido ?? '',
      zona_id:        p.zona_id ?? '',
      cliente_nombre: cli?.nombre ?? p.cliente_id ?? 'Desconocido',
      mes_label:      d ? MESES_ES[d.getMonth()] : '—',
    }
  })

  const items: RawItem[] = ((itemsRes.data ?? []) as any[])
    .filter(item => item.pedido_id)
    .map(item => {
      const prod = Array.isArray(item.productos) ? item.productos[0] : item.productos
      return {
        pedido_id:       item.pedido_id,
        producto_nombre: prod?.nombre ?? 'Desconocido',
        cantidad:        item.cantidad ?? 0,
      }
    })

  return {
    pedidos,
    items,
    zonas: (zonasRes.data ?? []) as RawZona[],
  }
}

// ─── Pure aggregation functions ───────────────────────────────────────────────

export function computePorMes(pedidos: RawPedido[]): MesData[] {
  // Group by full date-derived order key to sort correctly
  const keyMap = new Map<string, string>()   // mes_label → sortable key (YYYY-MM)
  const mesMap = new Map<string, { pedidos: number; ingresos: number }>()

  for (const p of pedidos) {
    if (!p.fecha_pedido || p.mes_label === '—') continue
    const d   = new Date(p.fecha_pedido)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    keyMap.set(p.mes_label, key)
    const m = mesMap.get(key) ?? { pedidos: 0, ingresos: 0 }
    m.pedidos++
    if (p.estado === 'entregado') m.ingresos += p.total
    mesMap.set(key, m)
  }

  return Array.from(mesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const [, mm] = key.split('-')
      return { mes: MESES_ES[parseInt(mm) - 1], pedidos: v.pedidos, ingresos: Math.round(v.ingresos) }
    })
}

export function computeTopProductos(items: RawItem[], pedidoIds: Set<string> | null): TopItem[] {
  const prodMap = new Map<string, number>()
  for (const item of items) {
    if (pedidoIds !== null && !pedidoIds.has(item.pedido_id)) continue
    prodMap.set(item.producto_nombre, (prodMap.get(item.producto_nombre) ?? 0) + item.cantidad)
  }
  return Array.from(prodMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([nombre, valor]) => ({ nombre, valor }))
}

export function computeTopClientes(pedidos: RawPedido[]): TopItem[] {
  const map = new Map<string, number>()
  for (const p of pedidos) map.set(p.cliente_nombre, (map.get(p.cliente_nombre) ?? 0) + 1)
  return Array.from(map.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([nombre, valor]) => ({ nombre, valor }))
}

export function computePorZona(pedidos: RawPedido[], zonas: RawZona[]): ZonaComp[] {
  const lookup = Object.fromEntries(zonas.map(z => [z.id, z]))
  const map    = new Map<string, { pedidos: number; entregados: number; ingresos: number }>()
  for (const p of pedidos) {
    if (!p.zona_id) continue
    const m = map.get(p.zona_id) ?? { pedidos: 0, entregados: 0, ingresos: 0 }
    m.pedidos++
    if (p.estado === 'entregado') { m.entregados++; m.ingresos += p.total }
    map.set(p.zona_id, m)
  }
  return Array.from(map.entries())
    .map(([id, v]) => ({
      nombre:     lookup[id]?.nombre ?? id,
      color:      lookup[id]?.color  ?? '#94a3b8',
      pedidos:    v.pedidos,
      entregados: v.entregados,
      ingresos:   Math.round(v.ingresos),
    }))
    .sort((a, b) => b.pedidos - a.pedidos)
}

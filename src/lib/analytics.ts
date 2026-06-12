import { supabase } from './supabase'

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// ─── Raw interfaces ───────────────────────────────────────────────────────────

export interface RawPedido {
  id:                string
  estado:            string
  total:             number
  fecha_pedido:      string
  zona_id:           string
  cliente_nombre:    string
  mes_label:         string   // "Ene"
  mes_key:           string   // "2025-01"
  repartidor_id:     string
  repartidor_nombre: string
}

export interface RawItem {
  pedido_id:         string
  producto_nombre:   string
  producto_categoria: string
  cantidad:          number
  precio_unitario:   number
}

export interface RawZona {
  id:     string
  nombre: string
  color:  string
}

export interface RawRepartidor {
  id:     string
  nombre: string
}

export interface AnalyticsRaw {
  pedidos:      RawPedido[]
  items:        RawItem[]
  zonas:        RawZona[]
  repartidores: RawRepartidor[]
}

// ─── Aggregation output interfaces ───────────────────────────────────────────

export interface MesData        { mes: string; mesKey: string; pedidos: number; ingresos: number }
export interface TopItem        { nombre: string; valor: number }
export interface ZonaComp       { nombre: string; color: string; pedidos: number; entregados: number; ingresos: number }
export interface EstadoData     { estado: string; valor: number; color: string }
export interface RepartidorPerf { nombre: string; pedidos: number; entregados: number; tasa: number }

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchAnalyticsRaw(): Promise<AnalyticsRaw> {
  const [pedidosRes, itemsRes, zonasRes, repRes] = await Promise.all([
    supabase
      .from('pedidos')
      .select('id, estado, total, fecha_pedido, zona_id, cliente_id, repartidor_id, clientes(nombre), repartidores(nombre, apellido)'),
    supabase
      .from('pedido_items')
      .select('pedido_id, cantidad, precio_unitario, productos(nombre, categoria)'),
    supabase
      .from('zonas')
      .select('id, nombre, color'),
    supabase
      .from('repartidores')
      .select('id, nombre, apellido')
      .eq('activo', true),
  ])

  const pedidos: RawPedido[] = ((pedidosRes.data ?? []) as any[]).map(p => {
    const cli = Array.isArray(p.clientes) ? p.clientes[0] : p.clientes
    const rep = Array.isArray(p.repartidores) ? p.repartidores[0] : p.repartidores
    const d   = p.fecha_pedido ? new Date(p.fecha_pedido) : null
    const mesKey = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : '—'
    return {
      id:                p.id,
      estado:            p.estado ?? '',
      total:             p.total  ?? 0,
      fecha_pedido:      p.fecha_pedido ?? '',
      zona_id:           p.zona_id ?? '',
      cliente_nombre:    cli?.nombre ?? p.cliente_id ?? 'Desconocido',
      mes_label:         d ? MESES_ES[d.getMonth()] : '—',
      mes_key:           mesKey,
      repartidor_id:     p.repartidor_id ?? '',
      repartidor_nombre: rep ? `${rep.nombre} ${rep.apellido}` : 'Sin asignar',
    }
  })

  const items: RawItem[] = ((itemsRes.data ?? []) as any[])
    .filter(item => item.pedido_id)
    .map(item => {
      const prod = Array.isArray(item.productos) ? item.productos[0] : item.productos
      return {
        pedido_id:          item.pedido_id,
        producto_nombre:    prod?.nombre    ?? 'Desconocido',
        producto_categoria: prod?.categoria ?? 'otro',
        cantidad:           item.cantidad        ?? 0,
        precio_unitario:    item.precio_unitario ?? 0,
      }
    })

  const repartidores: RawRepartidor[] = ((repRes.data ?? []) as any[]).map(r => ({
    id:     r.id,
    nombre: `${r.nombre} ${r.apellido}`,
  }))

  return {
    pedidos,
    items,
    zonas:        (zonasRes.data ?? []) as RawZona[],
    repartidores,
  }
}

// ─── Pure aggregation functions ───────────────────────────────────────────────

export function computePorMes(pedidos: RawPedido[]): MesData[] {
  const mesMap = new Map<string, { pedidos: number; ingresos: number }>()

  for (const p of pedidos) {
    if (!p.fecha_pedido || p.mes_key === '—') continue
    const m = mesMap.get(p.mes_key) ?? { pedidos: 0, ingresos: 0 }
    m.pedidos++
    if (p.estado === 'entregado') m.ingresos += p.total
    mesMap.set(p.mes_key, m)
  }

  return Array.from(mesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const [, mm] = key.split('-')
      return { mes: MESES_ES[parseInt(mm) - 1], mesKey: key, pedidos: v.pedidos, ingresos: Math.round(v.ingresos) }
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
    .slice(0, 8)
    .map(([nombre, valor]) => ({ nombre, valor }))
}

export function computeTopProductosByIngresos(items: RawItem[], pedidoIds: Set<string> | null): TopItem[] {
  const prodMap = new Map<string, number>()
  for (const item of items) {
    if (pedidoIds !== null && !pedidoIds.has(item.pedido_id)) continue
    const ingreso = item.cantidad * item.precio_unitario
    prodMap.set(item.producto_nombre, (prodMap.get(item.producto_nombre) ?? 0) + ingreso)
  }
  return Array.from(prodMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([nombre, valor]) => ({ nombre, valor: Math.round(valor) }))
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

export function computePorEstado(pedidos: RawPedido[]): EstadoData[] {
  const ESTADO_META: Record<string, { label: string; color: string }> = {
    entregado:  { label: 'Entregado',  color: '#22c55e' },
    en_ruta:    { label: 'En ruta',    color: '#3b82f6' },
    confirmado: { label: 'Confirmado', color: '#a78bfa' },
    pendiente:  { label: 'Pendiente',  color: '#94a3b8' },
    fallido:    { label: 'Fallido',    color: '#ef4444' },
    cancelado:  { label: 'Cancelado',  color: '#f97316' },
  }
  const map = new Map<string, number>()
  for (const p of pedidos) map.set(p.estado, (map.get(p.estado) ?? 0) + 1)
  return Array.from(map.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([estado, valor]) => ({
      estado: ESTADO_META[estado]?.label ?? estado,
      valor,
      color:  ESTADO_META[estado]?.color ?? '#94a3b8',
    }))
}

export function computeRepartidorPerf(pedidos: RawPedido[]): RepartidorPerf[] {
  const map = new Map<string, { pedidos: number; entregados: number }>()
  for (const p of pedidos) {
    if (!p.repartidor_id) continue
    const key = p.repartidor_nombre
    const m = map.get(key) ?? { pedidos: 0, entregados: 0 }
    m.pedidos++
    if (p.estado === 'entregado') m.entregados++
    map.set(key, m)
  }
  return Array.from(map.entries())
    .map(([nombre, v]) => ({
      nombre:     nombre.replace(' Sin asignar', ''),
      pedidos:    v.pedidos,
      entregados: v.entregados,
      tasa:       v.pedidos > 0 ? Math.round((v.entregados / v.pedidos) * 100) : 0,
    }))
    .sort((a, b) => b.entregados - a.entregados)
}

// Returns all unique month keys present in the pedidos, sorted
export function getMonthRange(pedidos: RawPedido[]): string[] {
  const keys = new Set<string>()
  for (const p of pedidos) if (p.mes_key && p.mes_key !== '—') keys.add(p.mes_key)
  return Array.from(keys).sort()
}

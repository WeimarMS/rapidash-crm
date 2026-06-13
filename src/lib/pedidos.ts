import { supabase } from './supabase'

export type EstadoPedido =
  | 'pendiente' | 'confirmado' | 'en_ruta'
  | 'entregado' | 'fallido'   | 'cancelado'

export interface PedidoItem {
  id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  producto_nombre: string
}

export interface Pedido {
  id: string
  codigo: string
  cliente_nombre: string
  zona_id: string
  zona_nombre: string
  zona_color: string
  estado: EstadoPedido
  total: number
  notas: string | null
  fecha_pedido: string
  fecha_entrega_estimada: string | null
  fecha_entrega_real: string | null
}

export async function fetchPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select('id, codigo, estado, total, notas, fecha_pedido, fecha_entrega_estimada, fecha_entrega_real, zona_id, clientes(nombre), zonas(nombre, color)')
    .order('fecha_pedido', { ascending: false })

  if (error) throw new Error(error.message)

  const seen = new Set<string>()
  return ((data ?? []) as any[])
    .filter(p => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
    .map(p => {
      const cliente = Array.isArray(p.clientes) ? p.clientes[0] : p.clientes
      const zona    = Array.isArray(p.zonas)    ? p.zonas[0]    : p.zonas
      return {
        id:                     p.id,
        codigo:                 p.codigo,
        cliente_nombre:         cliente?.nombre ?? '—',
        zona_id:                p.zona_id,
        zona_nombre:            zona?.nombre    ?? '—',
        zona_color:             zona?.color     ?? '#94a3b8',
        estado:                 p.estado as EstadoPedido,
        total:                  p.total ?? 0,
        notas:                  p.notas,
        fecha_pedido:           p.fecha_pedido,
        fecha_entrega_estimada: p.fecha_entrega_estimada,
        fecha_entrega_real:     p.fecha_entrega_real,
      }
    })
}

export async function updatePedidoEstado(id: string, estado: EstadoPedido): Promise<void> {
  const { error } = await supabase.from('pedidos').update({ estado }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchPedidosSelector(): Promise<{ id: string; codigo: string }[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select('id, codigo')
    .order('fecha_pedido', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as { id: string; codigo: string }[]
}

export async function fetchPedidoItems(pedidoId: string): Promise<PedidoItem[]> {
  const { data, error } = await supabase
    .from('pedido_items')
    .select('id, cantidad, precio_unitario, subtotal, productos(nombre)')
    .eq('pedido_id', pedidoId)

  if (error) throw new Error(error.message)

  return ((data ?? []) as any[]).map(item => {
    const prod = Array.isArray(item.productos) ? item.productos[0] : item.productos
    return {
      id:              item.id,
      cantidad:        item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal:        item.subtotal,
      producto_nombre: prod?.nombre ?? '—',
    }
  })
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

export interface PedidoFormOptions {
  clientes:     { id: string; nombre: string; zona_id: string }[]
  repartidores: { id: string; nombre: string; apellido: string; zona_id: string | null }[]
  zonas:        { id: string; nombre: string; color: string }[]
}

export async function fetchPedidoFormOptions(): Promise<PedidoFormOptions> {
  const [clientesRes, repartidoresRes, zonasRes] = await Promise.all([
    supabase.from('clientes').select('id, nombre, zona_id').eq('activo', true).order('nombre'),
    supabase.from('repartidores').select('id, nombre, apellido, zona_id').eq('activo', true).order('nombre'),
    supabase.from('zonas').select('id, nombre, color').order('nombre'),
  ])
  if (clientesRes.error) throw new Error(clientesRes.error.message)
  return {
    clientes:     (clientesRes.data     ?? []) as { id: string; nombre: string; zona_id: string }[],
    repartidores: (repartidoresRes.data ?? []) as { id: string; nombre: string; apellido: string; zona_id: string | null }[],
    zonas:        (zonasRes.data        ?? []) as { id: string; nombre: string; color: string }[],
  }
}

export interface NewPedidoInput {
  cliente_id:             string
  repartidor_id:          string | null
  zona_id:                string
  fecha_entrega_estimada: string
  notas:                  string
}

export async function createPedido(input: NewPedidoInput): Promise<Pedido> {
  const year = new Date().getFullYear()
  const { data: lastData } = await supabase
    .from('pedidos')
    .select('codigo')
    .ilike('codigo', `RD-${year}-%`)
    .order('codigo', { ascending: false })
    .limit(1)

  let nextNum = 1
  if (lastData && lastData.length > 0) {
    const match = (lastData[0] as any).codigo?.match(/(\d+)$/)
    if (match) nextNum = parseInt(match[1]) + 1
  }
  const codigo = `RD-${year}-${String(nextNum).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('pedidos')
    .insert({
      codigo,
      cliente_id:             input.cliente_id,
      repartidor_id:          input.repartidor_id || null,
      zona_id:                input.zona_id,
      fecha_entrega_estimada: input.fecha_entrega_estimada || null,
      notas:                  input.notas || null,
      estado:                 'pendiente',
      total:                  0,
    })
    .select('id, codigo, estado, total, notas, fecha_pedido, fecha_entrega_estimada, fecha_entrega_real, zona_id, clientes(nombre), zonas(nombre, color)')
    .single()

  if (error) throw new Error(error.message)

  const p       = data as any
  const cliente = Array.isArray(p.clientes) ? p.clientes[0] : p.clientes
  const zona    = Array.isArray(p.zonas)    ? p.zonas[0]    : p.zonas
  return {
    id:                     p.id,
    codigo:                 p.codigo,
    cliente_nombre:         cliente?.nombre ?? '—',
    zona_id:                p.zona_id,
    zona_nombre:            zona?.nombre    ?? '—',
    zona_color:             zona?.color     ?? '#94a3b8',
    estado:                 p.estado        as EstadoPedido,
    total:                  p.total         ?? 0,
    notas:                  p.notas,
    fecha_pedido:           p.fecha_pedido,
    fecha_entrega_estimada: p.fecha_entrega_estimada,
    fecha_entrega_real:     p.fecha_entrega_real,
  }
}

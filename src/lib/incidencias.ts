import { supabase } from './supabase'

export interface Incidencia {
  id: string
  tipo: string
  descripcion: string
  estado: string
  resolucion: string | null
  pedido_codigo: string | null
  repartidor_nombre: string | null
  created_at: string
}

export async function createIncidencia(data: {
  pedido_id: string
  tipo: string
  descripcion: string
}): Promise<void> {
  const { error } = await supabase.from('incidencias').insert({
    pedido_id:   data.pedido_id,
    tipo:        data.tipo,
    descripcion: data.descripcion,
    estado:      'abierta',
  })
  if (error) throw new Error(error.message)
}

export async function fetchIncidencias(): Promise<Incidencia[]> {
  const { data, error } = await supabase
    .from('incidencias')
    .select('id, tipo, descripcion, estado, resolucion, created_at, pedido_id, repartidor_id, pedidos(codigo), repartidores(nombre, apellido)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return ((data ?? []) as any[]).map(i => {
    const pedido = Array.isArray(i.pedidos)      ? i.pedidos[0]      : i.pedidos
    const rep    = Array.isArray(i.repartidores) ? i.repartidores[0] : i.repartidores
    return {
      id:                 i.id,
      tipo:               i.tipo ?? '—',
      descripcion:        i.descripcion ?? '—',
      estado:             i.estado ?? 'pendiente',
      resolucion:         i.resolucion,
      pedido_codigo:      pedido?.codigo ?? null,
      repartidor_nombre:  rep ? `${rep.nombre} ${rep.apellido}` : null,
      created_at:         i.created_at,
    }
  })
}

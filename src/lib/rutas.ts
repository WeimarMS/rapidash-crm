import { supabase } from './supabase'

export type EstadoRuta = 'planificada' | 'en_curso' | 'completada'

export interface Ruta {
  id: string
  codigo: string
  fecha: string
  zona_id: string
  zona_nombre: string
  zona_color: string
  repartidor_id: string | null
  repartidor_nombre: string
  estado: EstadoRuta
  hora_inicio: string | null
  hora_fin: string | null
  km_estimado: number | null
  notas: string | null
  total_pedidos: number
  pedidos_entregados: number
}

export interface RutaOption {
  zonas: { id: string; nombre: string; color: string }[]
  repartidores: { id: string; nombre: string; apellido: string }[]
}

export async function fetchRutaOptions(): Promise<RutaOption> {
  const [zonasRes, repsRes] = await Promise.all([
    supabase.from('zonas').select('id, nombre, color').order('nombre'),
    supabase.from('repartidores').select('id, nombre, apellido').eq('activo', true).order('nombre'),
  ])
  return {
    zonas:        (zonasRes.data ?? []) as RutaOption['zonas'],
    repartidores: (repsRes.data  ?? []) as RutaOption['repartidores'],
  }
}

export async function createRuta(data: {
  fecha: string
  zona_id: string
  repartidor_id: string | null
  km_estimado: number | null
}): Promise<Ruta> {
  const year   = new Date().getFullYear()
  const prefix = `RUTA-${year}-`

  const { data: existing } = await supabase
    .from('rutas')
    .select('codigo')
    .like('codigo', `${prefix}%`)
    .order('codigo', { ascending: false })
    .limit(1)

  const lastNum  = existing?.[0]?.codigo
    ? parseInt((existing[0].codigo as string).replace(prefix, ''), 10)
    : 0
  const nextNum  = (isNaN(lastNum) ? 0 : lastNum) + 1
  const codigo   = `${prefix}${String(nextNum).padStart(3, '0')}`

  const { data: inserted, error } = await supabase
    .from('rutas')
    .insert({
      codigo,
      fecha:         data.fecha,
      zona_id:       data.zona_id,
      repartidor_id: data.repartidor_id ?? null,
      km_estimado:   data.km_estimado   ?? null,
      estado:        'planificada',
    })
    .select('id, codigo, fecha, estado, hora_inicio, hora_fin, km_estimado, notas, zona_id, repartidor_id, zonas(nombre, color), repartidores(nombre, apellido)')
    .single()

  if (error) throw new Error(error.message)

  const zona = Array.isArray((inserted as any).zonas) ? (inserted as any).zonas[0] : (inserted as any).zonas
  const rep  = Array.isArray((inserted as any).repartidores) ? (inserted as any).repartidores[0] : (inserted as any).repartidores

  return {
    id:                 (inserted as any).id,
    codigo:             (inserted as any).codigo,
    fecha:              (inserted as any).fecha,
    zona_id:            (inserted as any).zona_id,
    zona_nombre:        zona?.nombre ?? '—',
    zona_color:         zona?.color  ?? '#94a3b8',
    repartidor_id:      (inserted as any).repartidor_id,
    repartidor_nombre:  rep ? `${rep.nombre} ${rep.apellido}` : '—',
    estado:             'planificada',
    hora_inicio:        null,
    hora_fin:           null,
    km_estimado:        (inserted as any).km_estimado ?? null,
    notas:              null,
    total_pedidos:      0,
    pedidos_entregados: 0,
  }
}

export async function fetchRutas(): Promise<Ruta[]> {
  const [rutasRes, pedidosRes] = await Promise.all([
    supabase
      .from('rutas')
      .select('id, codigo, fecha, estado, hora_inicio, hora_fin, km_estimado, notas, zona_id, repartidor_id, zonas(nombre, color), repartidores(nombre, apellido)')
      .order('fecha', { ascending: false }),
    supabase
      .from('pedidos')
      .select('ruta_id, estado')
      .not('ruta_id', 'is', null),
  ])

  if (rutasRes.error) throw new Error(rutasRes.error.message)

  const rutaMap = new Map<string, { total: number; entregados: number }>()
  for (const p of (pedidosRes.data ?? []) as any[]) {
    if (!p.ruta_id) continue
    const m = rutaMap.get(p.ruta_id) ?? { total: 0, entregados: 0 }
    m.total++
    if (p.estado === 'entregado') m.entregados++
    rutaMap.set(p.ruta_id, m)
  }

  return ((rutasRes.data ?? []) as any[]).map(r => {
    const zona = Array.isArray(r.zonas)        ? r.zonas[0]        : r.zonas
    const rep  = Array.isArray(r.repartidores) ? r.repartidores[0] : r.repartidores
    const m    = rutaMap.get(r.id) ?? { total: 0, entregados: 0 }
    return {
      id:                 r.id,
      codigo:             r.codigo,
      fecha:              r.fecha,
      zona_id:            r.zona_id,
      zona_nombre:        zona?.nombre ?? '—',
      zona_color:         zona?.color  ?? '#94a3b8',
      repartidor_id:      r.repartidor_id,
      repartidor_nombre:  rep ? `${rep.nombre} ${rep.apellido}` : '—',
      estado:             (r.estado ?? 'planificada') as EstadoRuta,
      hora_inicio:        r.hora_inicio,
      hora_fin:           r.hora_fin,
      km_estimado:        r.km_estimado ?? null,
      notas:              r.notas,
      total_pedidos:      m.total,
      pedidos_entregados: m.entregados,
    }
  })
}

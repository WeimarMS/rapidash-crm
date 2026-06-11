import { supabase } from './supabase'

export type CategoriaProducto = 'analgesico' | 'antibiotico' | 'insumo' | 'vacuna' | 'vitamina'

export interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  categoria: CategoriaProducto
  unidad: string
  precio_unitario: number
  stock_actual: number
  stock_minimo: number
  activo: boolean
  stock_bajo: boolean
  cadena_frio: boolean
}

export async function fetchProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, descripcion, categoria, unidad, precio_unitario, stock_actual, stock_minimo, activo')
    .order('nombre')

  if (error) throw new Error(error.message)

  return ((data ?? []) as any[]).map(p => ({
    id:              p.id,
    nombre:          p.nombre,
    descripcion:     p.descripcion,
    categoria:       p.categoria as CategoriaProducto,
    unidad:          p.unidad,
    precio_unitario: p.precio_unitario,
    stock_actual:    p.stock_actual ?? 0,
    stock_minimo:    p.stock_minimo ?? 0,
    activo:          p.activo ?? true,
    stock_bajo:      (p.stock_actual ?? 0) <= (p.stock_minimo ?? 0),
    cadena_frio:     p.categoria === 'vacuna',
  }))
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

export interface NewProductoInput {
  nombre:          string
  descripcion:     string
  categoria:       CategoriaProducto
  unidad:          string
  precio_unitario: number
  stock_actual:    number
  stock_minimo:    number
}

export async function createProducto(input: NewProductoInput): Promise<Producto> {
  const { data, error } = await supabase
    .from('productos')
    .insert({
      nombre:          input.nombre,
      descripcion:     input.descripcion || null,
      categoria:       input.categoria,
      unidad:          input.unidad,
      precio_unitario: input.precio_unitario,
      stock_actual:    input.stock_actual,
      stock_minimo:    input.stock_minimo,
      activo:          true,
    })
    .select('id, nombre, descripcion, categoria, unidad, precio_unitario, stock_actual, stock_minimo, activo')
    .single()

  if (error) throw new Error(error.message)

  const p = data as any
  return {
    id:              p.id,
    nombre:          p.nombre,
    descripcion:     p.descripcion,
    categoria:       p.categoria       as CategoriaProducto,
    unidad:          p.unidad,
    precio_unitario: p.precio_unitario,
    stock_actual:    p.stock_actual    ?? 0,
    stock_minimo:    p.stock_minimo    ?? 0,
    activo:          p.activo          ?? true,
    stock_bajo:      (p.stock_actual ?? 0) <= (p.stock_minimo ?? 0),
    cadena_frio:     p.categoria === 'vacuna',
  }
}

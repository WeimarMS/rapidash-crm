import { useEffect, useMemo, useState } from 'react'
import { fetchPedidos, fetchPedidoItems, updatePedidoEstado, fetchPedidoFormOptions, createPedido, type Pedido, type EstadoPedido, type PedidoItem, type PedidoFormOptions } from '../lib/pedidos'
import { useAuth } from '../contexts/AuthContext'
import { isReadOnly } from '../lib/permissions'

// ─── Config ───────────────────────────────────────────────────────────────────

const ESTADO_CFG: Record<EstadoPedido, { label: string; bg: string; text: string; dot: string }> = {
  pendiente:  { label: 'Pendiente',  bg: 'bg-slate-100',   text: 'text-slate-500',   dot: '#94a3b8' },
  confirmado: { label: 'Confirmado', bg: 'bg-amber-50',    text: 'text-amber-700',   dot: '#d97706' },
  en_ruta:    { label: 'En ruta',    bg: 'bg-blue-50',     text: 'text-blue-700',    dot: '#2563eb' },
  entregado:  { label: 'Entregado',  bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: '#16a34a' },
  fallido:    { label: 'Fallido',    bg: 'bg-rose-50',     text: 'text-rose-700',    dot: '#dc2626' },
  cancelado:  { label: 'Cancelado',  bg: 'bg-slate-100',   text: 'text-slate-500',   dot: '#94a3b8' },
}

const ESTADOS: EstadoPedido[] = ['pendiente', 'confirmado', 'en_ruta', 'entregado', 'fallido', 'cancelado']

const fmtBs = (n: number) =>
  `Bs. ${new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2 }).format(n)}`

const fmtFecha = (iso: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const fmtFechaLarga = (iso: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const cfg = ESTADO_CFG[estado] ?? ESTADO_CFG.pendiente
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`bg-slate-200 rounded-lg animate-pulse ${className}`} style={style} />
}

function FilterPill({
  active, onClick, color, children,
}: {
  active: boolean; onClick: () => void; color?: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
        active
          ? 'text-white border-transparent shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
      }`}
      style={active ? { background: color ?? '#1e40af', borderColor: color ?? '#1e40af' } : {}}
    >
      {color && !active && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />}
      {children}
    </button>
  )
}

// ─── Cambiar Estado Modal ─────────────────────────────────────────────────────

function CambiarEstadoModal({ pedido, onClose, onSuccess }: {
  pedido: Pedido
  onClose: () => void
  onSuccess: (newEstado: EstadoPedido) => void
}) {
  const [nuevoEstado, setNuevoEstado] = useState<EstadoPedido>(pedido.estado)
  const [saving, setSaving]           = useState(false)
  const [err, setErr]                 = useState<string | null>(null)

  const handleConfirmar = async () => {
    if (nuevoEstado === pedido.estado) { onClose(); return }
    setErr(null)
    setSaving(true)
    try {
      await updatePedidoEstado(pedido.id, nuevoEstado)
      onSuccess(nuevoEstado)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 w-[calc(100vw-2rem)] max-w-sm p-6 space-y-5"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'fadeSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Cambiar estado</p>
          <p className="font-data text-base font-bold text-blue-700">{pedido.codigo}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nuevo estado</label>
          <select
            value={nuevoEstado}
            onChange={e => setNuevoEstado(e.target.value as EstadoPedido)}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
          >
            {ESTADOS.map(e => (
              <option key={e} value={e}>{ESTADO_CFG[e].label}</option>
            ))}
          </select>
        </div>

        {err && (
          <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">{err}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: nuevoEstado === pedido.estado ? '#94a3b8' : ESTADO_CFG[nuevoEstado].dot }}
          >
            {saving && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            )}
            {saving ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Pedido Detail Drawer ─────────────────────────────────────────────────────

function PedidoDrawer({ pedido, onClose, onEstadoChanged }: {
  pedido: Pedido
  onClose: () => void
  onEstadoChanged: (newEstado: EstadoPedido) => void
}) {
  const [items, setItems]               = useState<PedidoItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [showEstadoModal, setShowEstadoModal] = useState(false)
  const { profile } = useAuth()
  const readOnly = isReadOnly(profile?.rol)

  useEffect(() => {
    fetchPedidoItems(pedido.id)
      .then(data => { setItems(data); setLoadingItems(false) })
      .catch(() => setLoadingItems(false))
  }, [pedido.id])

  const cfg = ESTADO_CFG[pedido.estado] ?? ESTADO_CFG.pendiente

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-30 backdrop-blur-[1px]" onClick={onClose} />
      <aside
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[460px] bg-white z-40 shadow-2xl flex flex-col"
        style={{ animation: 'slideInRight 0.28s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Detalle del pedido</p>
            <p className="font-data text-lg font-bold text-blue-700">{pedido.codigo}</p>
            <div className="flex items-center gap-2 mt-2">
              <EstadoBadge estado={pedido.estado} />
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: pedido.zona_color }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: pedido.zona_color }} />
                {pedido.zona_nombre}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          <SummaryCell label="Total" value={fmtBs(pedido.total)} accent />
          <SummaryCell label="Pedido" value={fmtFecha(pedido.fecha_pedido)} />
          <SummaryCell label="Entrega estimada" value={fmtFecha(pedido.fecha_entrega_estimada)} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Cliente */}
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
            <p className="font-semibold text-slate-800">{pedido.cliente_nombre}</p>
          </div>

          {/* Items */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Productos ({loadingItems ? '…' : items.length})
            </p>

            {loadingItems ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-400">Sin items registrados</p>
            ) : (
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Cant.</th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">P. Unit.</th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 text-sm font-medium text-slate-700 max-w-40 truncate">{item.producto_nombre}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-500 text-right">{item.cantidad}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-500 text-right">
                          {new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2 }).format(item.precio_unitario)}
                        </td>
                        <td className="px-4 py-2.5 text-sm font-semibold text-slate-800 text-right">
                          {new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2 }).format(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total</td>
                      <td className="px-4 py-3 text-sm font-extrabold text-slate-900 text-right">{fmtBs(pedido.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Fechas y notas */}
          {(pedido.fecha_entrega_real || pedido.notas) && (
            <div className="px-6 py-4 border-t border-slate-100 space-y-3">
              {pedido.fecha_entrega_real && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entregado el</p>
                  <p className="text-sm font-semibold text-emerald-700">{fmtFechaLarga(pedido.fecha_entrega_real)}</p>
                </div>
              )}
              {pedido.notas && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notas</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{pedido.notas}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer (oculto para el rol demo) */}
        {!readOnly && (
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
            <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              Editar pedido
            </button>
            <button
              onClick={() => setShowEstadoModal(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: cfg.dot }}
            >
              Cambiar estado
            </button>
          </div>
        )}
      </aside>

      {showEstadoModal && (
        <CambiarEstadoModal
          pedido={pedido}
          onClose={() => setShowEstadoModal(false)}
          onSuccess={(newEstado) => {
            onEstadoChanged(newEstado)
            setShowEstadoModal(false)
          }}
        />
      )}
    </>
  )
}

function SummaryCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="px-4 py-3 text-center">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${accent ? 'text-slate-900' : 'text-slate-600'}`}>{value}</p>
    </div>
  )
}

// ─── Nuevo Pedido Modal ───────────────────────────────────────────────────────

const INP = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all'
const LBL = 'block text-xs font-semibold text-slate-500 mb-1'
const Spinner = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

function NuevoPedidoModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: (p: Pedido) => void
}) {
  const [opts, setOpts]       = useState<PedidoFormOptions | null>(null)
  const [optsErr, setOptsErr] = useState<string | null>(null)
  const [form, setForm]       = useState({
    cliente_id: '', repartidor_id: '', zona_id: '',
    fecha_entrega_estimada: '', notas: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  useEffect(() => {
    fetchPedidoFormOptions().then(setOpts).catch(e => setOptsErr(e.message))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  // Al elegir cliente: autocompletar su zona y resetear repartidor
  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clienteId = e.target.value
    const zonaId = opts?.clientes.find(c => c.id === clienteId)?.zona_id ?? ''
    setForm(prev => ({ ...prev, cliente_id: clienteId, zona_id: zonaId, repartidor_id: '' }))
  }

  // Repartidores activos de la zona del cliente (todos si aún no hay cliente)
  const repartidoresZona = opts
    ? (form.zona_id ? opts.repartidores.filter(r => r.zona_id === form.zona_id) : opts.repartidores)
    : []

  const handleSubmit = async () => {
    if (!form.cliente_id || !form.zona_id) { setErr('Cliente y zona son obligatorios'); return }
    setErr(null); setSaving(true)
    try {
      const pedido = await createPedido({
        cliente_id: form.cliente_id, repartidor_id: form.repartidor_id || null,
        zona_id: form.zona_id, fecha_entrega_estimada: form.fecha_entrega_estimada,
        notas: form.notas,
      })
      onSuccess(pedido)
    } catch (e: any) { setErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 w-[calc(100vw-2rem)] max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'fadeSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Pedidos</p>
            <h2 className="text-lg font-extrabold text-slate-900">Nuevo pedido</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {optsErr && <p className="mb-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{optsErr}</p>}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Cliente *</label>
              <select value={form.cliente_id} onChange={handleClienteChange} className={INP}>
                <option value="">— Seleccionar —</option>
                {opts?.clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>
                Zona *
                <span className="font-normal text-slate-400"> · se asigna del cliente</span>
              </label>
              <select
                value={form.zona_id}
                disabled
                className={`${INP} disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed`}
              >
                <option value="">{form.cliente_id ? '—' : '— Elegí un cliente —'}</option>
                {opts?.zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LBL}>
                Repartidor
                {form.zona_id && (
                  <span className="font-normal text-slate-400"> · de la zona</span>
                )}
              </label>
              <select value={form.repartidor_id} onChange={set('repartidor_id')} className={INP}>
                <option value="">— Sin asignar —</option>
                {repartidoresZona.map(r => <option key={r.id} value={r.id}>{r.nombre} {r.apellido}</option>)}
              </select>
              {form.zona_id && repartidoresZona.length === 0 && (
                <p className="mt-1 text-[11px] text-amber-600">Sin repartidores activos en esta zona</p>
              )}
            </div>
            <div>
              <label className={LBL}>Fecha entrega estimada</label>
              <input type="date" value={form.fecha_entrega_estimada} onChange={set('fecha_entrega_estimada')} className={INP} />
            </div>
          </div>
          <div>
            <label className={LBL}>Observaciones</label>
            <textarea value={form.notas} onChange={set('notas')} rows={2}
              placeholder="Instrucciones especiales, referencias de entrega…"
              className={`${INP} resize-none`} />
          </div>
        </div>
        {err && <p className="mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving || !opts}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#1e40af' }}>
            {saving && <Spinner />}
            {saving ? 'Guardando…' : 'Crear pedido'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Pedidos() {
  const [pedidos, setPedidos]       = useState<Pedido[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoPedido | 'todos'>('todos')
  const [zonaFilter, setZonaFilter] = useState<string>('todas')
  const [selected, setSelected]     = useState<Pedido | null>(null)
  const [toast, setToast]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showNuevo, setShowNuevo]   = useState(false)
  const { profile } = useAuth()
  const readOnly = isReadOnly(profile?.rol)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const handleNuevoPedido = (p: Pedido) => {
    setPedidos(prev => [p, ...prev])
    showToast('success', `Pedido ${p.codigo} creado correctamente`)
    setShowNuevo(false)
  }

  useEffect(() => {
    fetchPedidos()
      .then(data => { setPedidos(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const handleEstadoChanged = (newEstado: EstadoPedido) => {
    if (!selected) return
    const updated = { ...selected, estado: newEstado }
    setPedidos(prev => prev.map(p => p.id === selected.id ? updated : p))
    setSelected(updated)
    showToast('success', `Estado cambiado a "${ESTADO_CFG[newEstado].label}"`)
  }

  const zonas = useMemo(() => {
    const map = new Map<string, { nombre: string; color: string }>()
    pedidos.forEach(p => map.set(p.zona_id, { nombre: p.zona_nombre, color: p.zona_color }))
    return Array.from(map.entries()).map(([id, z]) => ({ id, ...z }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [pedidos])

  const filtered = useMemo(() => pedidos.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || p.codigo.toLowerCase().includes(q)
      || p.cliente_nombre.toLowerCase().includes(q)
    const matchEstado = estadoFilter === 'todos' || p.estado === estadoFilter
    const matchZona   = zonaFilter   === 'todas' || p.zona_id === zonaFilter
    return matchSearch && matchEstado && matchZona
  }), [pedidos, search, estadoFilter, zonaFilter])

  const stats = useMemo(() => {
    const total      = filtered.length
    const entregados = filtered.filter(p => p.estado === 'entregado')
    const fallidos   = filtered.filter(p => p.estado === 'fallido').length
    const ingresos   = entregados.reduce((s, p) => s + p.total, 0)
    const tasa       = total ? Math.round((entregados.length / total) * 100) : 0
    return { total, entregados: entregados.length, fallidos, ingresos, tasa }
  }, [filtered])

  const hoy = new Date().toLocaleDateString('es-BO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Active estados that actually exist in data
  const estadosEnDatos = useMemo(() =>
    ESTADOS.filter(e => pedidos.some(p => p.estado === e)),
  [pedidos])

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .font-data { font-family: 'DM Mono', monospace; }
      `}</style>

      {/* Header */}
      <header className="sticky top-14 lg:top-0 z-10 bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>Pedidos</h1>
          <p className="text-xs text-slate-400 capitalize mt-0.5">{hoy}</p>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowNuevo(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#1e40af' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Nuevo pedido
          </button>
        )}
      </header>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-7xl w-full mx-auto">

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)
          ) : (
            <>
              <StatCard label="Total pedidos"  value={stats.total}                color="#1e40af" />
              <StatCard label="Entregados"      value={stats.entregados}           color="#15803d" />
              <StatCard label="Fallidos"        value={stats.fallidos}             color="#dc2626" />
              <StatCard label="Tasa entrega"    value={`${stats.tasa}%`}           color="#0891b2" />
              <StatCard label="Ingresos totales" value={fmtBs(stats.ingresos)}    color="#15803d" wide />
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Código o cliente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              />
            </div>

            {/* Estado pills */}
            <div className="flex flex-wrap gap-1.5">
              <FilterPill active={estadoFilter === 'todos'} onClick={() => setEstadoFilter('todos')}>
                Todos los estados
              </FilterPill>
              {estadosEnDatos.map(e => (
                <FilterPill
                  key={e}
                  active={estadoFilter === e}
                  onClick={() => setEstadoFilter(e)}
                  color={ESTADO_CFG[e].dot}
                >
                  {ESTADO_CFG[e].label}
                </FilterPill>
              ))}
            </div>
          </div>

          {/* Zona pills */}
          <div className="flex flex-wrap gap-1.5">
            <FilterPill active={zonaFilter === 'todas'} onClick={() => setZonaFilter('todas')}>
              Todas las zonas
            </FilterPill>
            {zonas.map(z => (
              <FilterPill
                key={z.id}
                active={zonaFilter === z.id}
                onClick={() => setZonaFilter(z.id)}
                color={z.color}
              >
                {z.nombre}
              </FilterPill>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              {loading ? '…' : `${filtered.length} pedido${filtered.length !== 1 ? 's' : ''}`}
              {!loading && filtered.length !== pedidos.length && (
                <span className="ml-1 text-slate-400">de {pedidos.length} total</span>
              )}
            </p>
            {(estadoFilter !== 'todos' || zonaFilter !== 'todas' || search) && (
              <button
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                onClick={() => { setEstadoFilter('todos'); setZonaFilter('todas'); setSearch('') }}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Código', 'Cliente', 'Zona', 'Estado', 'Total', 'Fecha', ''].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-6 py-3.5">
                          <Skeleton className="h-4" style={{ width: `${55 + (j * 19) % 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <p className="text-slate-400 text-sm">No se encontraron pedidos</p>
                      <p className="text-slate-300 text-xs mt-1">Intenta con otros filtros</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, i) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer anim-card"
                      style={{ animationDelay: `${i * 20}ms` }}
                      onClick={() => setSelected(p)}
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-data text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md whitespace-nowrap">
                          {p.codigo}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-800 max-w-44 truncate">
                        {p.cliente_nombre}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: p.zona_color }}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.zona_color }} />
                          {p.zona_nombre}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <EstadoBadge estado={p.estado} />
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                        {fmtBs(p.total)}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {fmtFecha(p.fecha_pedido)}
                      </td>
                      <td className="px-6 py-3.5">
                        <button
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50 whitespace-nowrap"
                          onClick={e => { e.stopPropagation(); setSelected(p) }}
                        >
                          Ver →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Vista cards en móvil */}
          <div className="md:hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-slate-400 text-sm">No se encontraron pedidos</p>
                <p className="text-slate-300 text-xs mt-1">Intenta con otros filtros</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="w-full text-left px-4 py-3.5 hover:bg-blue-50/30 active:bg-blue-50/50 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-data text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        {p.codigo}
                      </span>
                      <EstadoBadge estado={p.estado} />
                    </div>
                    <p className="font-medium text-slate-800 text-sm truncate">{p.cliente_nombre}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: p.zona_color }}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.zona_color }} />
                        {p.zona_nombre}
                      </span>
                      <span className="text-xs text-slate-400">{fmtFecha(p.fecha_pedido)}</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{fmtBs(p.total)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {selected && (
        <PedidoDrawer
          pedido={selected}
          onClose={() => setSelected(null)}
          onEstadoChanged={handleEstadoChanged}
        />
      )}

      {showNuevo && (
        <NuevoPedidoModal onClose={() => setShowNuevo(false)} onSuccess={handleNuevoPedido} />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white anim-card ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success'
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 flex-shrink-0"><path d="M18 6L6 18M6 6l12 12"/></svg>
          }
          {toast.msg}
        </div>
      )}
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, wide }: { label: string; value: string | number; color: string; wide?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex flex-col gap-1 ${wide ? 'sm:col-span-2 xl:col-span-1' : ''}`}>
      <p className="text-xs font-semibold text-slate-400 truncate">{label}</p>
      <p className="text-xl font-extrabold truncate" style={{ color }}>{value}</p>
    </div>
  )
}

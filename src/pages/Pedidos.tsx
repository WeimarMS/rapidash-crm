import { useEffect, useMemo, useState } from 'react'
import { fetchPedidos, fetchPedidoItems, updatePedidoEstado, updatePedido, fetchPedidoFormOptions, createPedido, type Pedido, type EstadoPedido, type PedidoItem, type PedidoFormOptions } from '../lib/pedidos'
import { fetchProductos, type Producto } from '../lib/productos'
import { useAuth } from '../contexts/AuthContext'
import { useT } from '../contexts/LanguageContext'
import { isReadOnly } from '../lib/permissions'
import BuiltBy, { BuiltByMobile } from '../components/BuiltBy'

// ─── Config ───────────────────────────────────────────────────────────────────

const ESTADO_CFG: Record<EstadoPedido, { bg: string; text: string; dot: string }> = {
  pendiente:  { bg: 'bg-slate-100',   text: 'text-slate-500',   dot: '#94a3b8' },
  confirmado: { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: '#d97706' },
  en_ruta:    { bg: 'bg-blue-50',     text: 'text-blue-700',    dot: '#2563eb' },
  entregado:  { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: '#16a34a' },
  fallido:    { bg: 'bg-rose-50',     text: 'text-rose-700',    dot: '#dc2626' },
  cancelado:  { bg: 'bg-slate-100',   text: 'text-slate-500',   dot: '#94a3b8' },
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
  const { t } = useT()
  const cfg = ESTADO_CFG[estado] ?? ESTADO_CFG.pendiente
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {t('estado.' + estado)}
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
  const { t } = useT()
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
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
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
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{t('pedidos.changeState')}</p>
          <p className="font-data text-base font-bold text-blue-700">{pedido.codigo}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('pedidos.newState')}</label>
          <select
            value={nuevoEstado}
            onChange={e => setNuevoEstado(e.target.value as EstadoPedido)}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
          >
            {ESTADOS.map(e => (
              <option key={e} value={e}>{t('estado.' + e)}</option>
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
            {t('common.cancel')}
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
            {saving ? t('common.saving') : t('pedidos.confirm')}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Pedido Detail Drawer ─────────────────────────────────────────────────────

function PedidoDrawer({ pedido, onClose, onEstadoChanged, onPedidoUpdated }: {
  pedido: Pedido
  onClose: () => void
  onEstadoChanged: (newEstado: EstadoPedido) => void
  onPedidoUpdated: (updated: Pedido) => void
}) {
  const [items, setItems]               = useState<PedidoItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [showEstadoModal, setShowEstadoModal] = useState(false)
  const [showEditModal, setShowEditModal]     = useState(false)
  const { t, tZona } = useT()
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{t('pedidos.detail')}</p>
            <p className="font-data text-lg font-bold text-blue-700">{pedido.codigo}</p>
            <div className="flex items-center gap-2 mt-2">
              <EstadoBadge estado={pedido.estado} />
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: pedido.zona_color }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: pedido.zona_color }} />
                {tZona(pedido.zona_nombre)}
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
          <SummaryCell label={t('common.total')} value={fmtBs(pedido.total)} accent />
          <SummaryCell label={t('pedidos.order')} value={fmtFecha(pedido.fecha_pedido)} />
          <SummaryCell label={t('pedidos.estimatedDelivery')} value={fmtFecha(pedido.fecha_entrega_estimada)} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Cliente */}
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('common.client')}</p>
            <p className="font-semibold text-slate-800">{pedido.cliente_nombre}</p>
          </div>

          {/* Items */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              {t('pedidos.products').replace('{n}', loadingItems ? '…' : String(items.length))}
            </p>

            {loadingItems ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-400">{t('pedidos.noItems')}</p>
            ) : (
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('pedidos.colProduct')}</th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">{t('pedidos.colQty')}</th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">{t('pedidos.colUnitPrice')}</th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">{t('pedidos.colSubtotal')}</th>
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
                      <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('common.total')}</td>
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('pedidos.deliveredOn')}</p>
                  <p className="text-sm font-semibold text-emerald-700">{fmtFechaLarga(pedido.fecha_entrega_real)}</p>
                </div>
              )}
              {pedido.notas && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('pedidos.notes')}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{pedido.notas}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer (oculto para el rol demo) */}
        {!readOnly && (
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {t('pedidos.editOrder')}
            </button>
            <button
              onClick={() => setShowEstadoModal(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: cfg.dot }}
            >
              {t('pedidos.changeState')}
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

      {showEditModal && (
        <EditarPedidoModal
          pedido={pedido}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => {
            onPedidoUpdated(updated)
            setShowEditModal(false)
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

// ─── Editar Pedido Modal ──────────────────────────────────────────────────────

const INP = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all'
const LBL = 'block text-xs font-semibold text-slate-500 mb-1'
const Spinner = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

function EditarPedidoModal({ pedido, onClose, onSuccess }: {
  pedido: Pedido
  onClose: () => void
  onSuccess: (updated: Pedido) => void
}) {
  const { t } = useT()
  const [opts, setOpts]       = useState<PedidoFormOptions | null>(null)
  const [optsErr, setOptsErr] = useState<string | null>(null)
  const [form, setForm]       = useState({
    repartidor_id:          pedido.repartidor_id ?? '',
    fecha_entrega_estimada: pedido.fecha_entrega_estimada?.slice(0, 10) ?? '',
    notas:                  pedido.notas ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  useEffect(() => {
    fetchPedidoFormOptions().then(setOpts).catch(e => setOptsErr(e.message))
  }, [])

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  const repartidoresZona = opts
    ? (pedido.zona_id ? opts.repartidores.filter(r => r.zona_id === pedido.zona_id) : opts.repartidores)
    : []

  const handleSubmit = async () => {
    setErr(null); setSaving(true)
    try {
      await updatePedido(pedido.id, {
        repartidor_id:          form.repartidor_id || null,
        fecha_entrega_estimada: form.fecha_entrega_estimada,
        notas:                  form.notas,
      })
      onSuccess({
        ...pedido,
        repartidor_id:          form.repartidor_id          || null,
        fecha_entrega_estimada: form.fecha_entrega_estimada || null,
        notas:                  form.notas                  || null,
      })
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 z-50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed z-[60] bg-white rounded-2xl shadow-2xl border border-slate-100 w-[calc(100vw-2rem)] max-w-md p-6"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'fadeSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
              {t('pedidos.editModal.eyebrow')} · <span className="font-data text-blue-700">{pedido.codigo}</span>
            </p>
            <h2 className="text-lg font-extrabold text-slate-900">{t('pedidos.editModal.title')}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {optsErr && <p className="mb-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{optsErr}</p>}
        <div className="space-y-3">
          <div>
            <label className={LBL}>{t('pedidos.editModal.courier')}</label>
            <select value={form.repartidor_id} onChange={set('repartidor_id')} className={INP}>
              <option value="">{t('pedidos.unassigned')}</option>
              {repartidoresZona.map(r => (
                <option key={r.id} value={r.id}>{r.nombre} {r.apellido}</option>
              ))}
            </select>
            {opts && pedido.zona_id && repartidoresZona.length === 0 && (
              <p className="mt-1 text-[11px] text-amber-600">{t('pedidos.noCouriers')}</p>
            )}
          </div>
          <div>
            <label className={LBL}>{t('pedidos.editModal.date')}</label>
            <input type="date" value={form.fecha_entrega_estimada} onChange={set('fecha_entrega_estimada')} className={INP} />
          </div>
          <div>
            <label className={LBL}>{t('pedidos.editModal.notes')}</label>
            <textarea
              value={form.notas}
              onChange={set('notas')}
              rows={3}
              placeholder={t('pedidos.observationsPh')}
              className={`${INP} resize-none`}
            />
          </div>
        </div>
        {err && <p className="mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !opts}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#1e40af' }}
          >
            {saving && <Spinner />}
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Nuevo Pedido Modal ───────────────────────────────────────────────────────

function NuevoPedidoModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: (p: Pedido) => void
}) {
  const { t, tZona } = useT()
  const [opts, setOpts]       = useState<PedidoFormOptions | null>(null)
  const [optsErr, setOptsErr] = useState<string | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [form, setForm]       = useState({
    cliente_id: '', repartidor_id: '', zona_id: '',
    fecha_entrega_estimada: '', notas: '',
  })
  // Líneas del pedido. `key` es un id local solo para React.
  const [lineas, setLineas] = useState<{ key: number; producto_id: string; cantidad: number; precio_unitario: number }[]>([
    { key: 0, producto_id: '', cantidad: 1, precio_unitario: 0 },
  ])
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  useEffect(() => {
    fetchPedidoFormOptions().then(setOpts).catch(e => setOptsErr(e.message))
    fetchProductos().then(setProductos).catch(e => setOptsErr(e.message))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  // ─── Líneas del pedido ──────────────────────────────────────────────
  const addLinea = () =>
    setLineas(prev => [...prev, { key: (prev.at(-1)?.key ?? -1) + 1, producto_id: '', cantidad: 1, precio_unitario: 0 }])

  const removeLinea = (key: number) =>
    setLineas(prev => (prev.length > 1 ? prev.filter(l => l.key !== key) : prev))

  const onProductoChange = (key: number, productoId: string) => {
    const prod = productos.find(p => p.id === productoId)
    setLineas(prev => prev.map(l =>
      l.key === key
        ? { ...l, producto_id: productoId, precio_unitario: prod?.precio_unitario ?? 0 }
        : l,
    ))
  }

  const onCantidadChange = (key: number, value: string) => {
    const n = parseInt(value, 10)
    setLineas(prev => prev.map(l =>
      l.key === key ? { ...l, cantidad: Number.isNaN(n) || n < 1 ? 1 : n } : l,
    ))
  }

  const lineasValidas = lineas.filter(l => l.producto_id && l.cantidad >= 1)
  const total = lineasValidas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0)

  // Al elegir cliente: autocompletar su zona y preseleccionar el primer repartidor activo de esa zona
  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clienteId = e.target.value
    const zonaId    = opts?.clientes.find(c => c.id === clienteId)?.zona_id ?? ''
    const sugerido  = opts?.repartidores.find(r => r.zona_id === zonaId)?.id ?? ''
    setForm(prev => ({ ...prev, cliente_id: clienteId, zona_id: zonaId, repartidor_id: sugerido }))
  }

  // Repartidores activos de la zona del cliente (todos si aún no hay cliente)
  const repartidoresZona = opts
    ? (form.zona_id ? opts.repartidores.filter(r => r.zona_id === form.zona_id) : opts.repartidores)
    : []

  const handleSubmit = async () => {
    if (!form.cliente_id || !form.zona_id) { setErr(t('pedidos.errClientZone')); return }
    if (lineasValidas.length === 0) { setErr(t('pedidos.errNoProduct')); return }
    setErr(null); setSaving(true)
    try {
      const pedido = await createPedido({
        cliente_id: form.cliente_id, repartidor_id: form.repartidor_id || null,
        zona_id: form.zona_id, fecha_entrega_estimada: form.fecha_entrega_estimada,
        notas: form.notas,
        items: lineasValidas.map(l => ({
          producto_id: l.producto_id, cantidad: l.cantidad, precio_unitario: l.precio_unitario,
        })),
      })
      onSuccess(pedido)
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 w-[calc(100vw-2rem)] max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'fadeSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">{t('pedidos.title')}</p>
            <h2 className="text-lg font-extrabold text-slate-900">{t('pedidos.new')}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {optsErr && <p className="mb-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{optsErr}</p>}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LBL}>{t('pedidos.clientReq')}</label>
              <select value={form.cliente_id} onChange={handleClienteChange} className={INP}>
                <option value="">{t('common.select')}</option>
                {opts?.clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>
                {t('pedidos.zoneReq')}
                <span className="font-normal text-slate-400">{t('pedidos.zoneHint')}</span>
              </label>
              <select
                value={form.zona_id}
                disabled
                className={`${INP} disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed`}
              >
                <option value="">{form.cliente_id ? '—' : t('pedidos.pickClient')}</option>
                {opts?.zonas.map(z => <option key={z.id} value={z.id}>{tZona(z.nombre)}</option>)}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">{t('pedidos.zoneAutoHelp')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LBL}>
                {t('pedidos.courier')}
                {form.zona_id && (
                  <span className="font-normal text-slate-400">{t('pedidos.courierHint')}</span>
                )}
              </label>
              <select value={form.repartidor_id} onChange={set('repartidor_id')} className={INP}>
                <option value="">{t('pedidos.unassigned')}</option>
                {repartidoresZona.map(r => <option key={r.id} value={r.id}>{r.nombre} {r.apellido}</option>)}
              </select>
              {form.zona_id && repartidoresZona.length === 0 && (
                <p className="mt-1 text-[11px] text-amber-600">{t('pedidos.noCouriers')}</p>
              )}
            </div>
            <div>
              <label className={LBL}>{t('pedidos.estimatedDateLbl')}</label>
              <input type="date" value={form.fecha_entrega_estimada} onChange={set('fecha_entrega_estimada')} className={INP} />
            </div>
          </div>
          <div>
            <label className={LBL}>{t('pedidos.observations')}</label>
            <textarea value={form.notas} onChange={set('notas')} rows={2}
              placeholder={t('pedidos.observationsPh')}
              className={`${INP} resize-none`} />
          </div>

          {/* Productos del pedido */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <label className={`${LBL} mb-0`}>{t('pedidos.orderProductsReq')}</label>
              <button
                type="button"
                onClick={addLinea}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5"><path d="M12 5v14M5 12h14"/></svg>
                {t('pedidos.addProduct')}
              </button>
            </div>

            <div className="space-y-2">
              {lineas.map(linea => {
                const subtotal = linea.cantidad * linea.precio_unitario
                return (
                  <div key={linea.key} className="flex items-end gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('pedidos.colProduct')}</label>
                      <select
                        value={linea.producto_id}
                        onChange={e => onProductoChange(linea.key, e.target.value)}
                        className={`${INP} bg-white`}
                      >
                        <option value="">{t('common.select')}</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-16 flex-shrink-0">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('pedidos.colQty')}</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={linea.cantidad}
                        onChange={e => onCantidadChange(linea.key, e.target.value)}
                        className={`${INP} bg-white text-right`}
                      />
                    </div>
                    <div className="w-24 flex-shrink-0 text-right">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('pedidos.colSubtotal')}</label>
                      <p className="px-1 py-2 text-sm font-semibold text-slate-800 whitespace-nowrap">
                        {new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2 }).format(subtotal)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLinea(linea.key)}
                      disabled={lineas.length === 1}
                      title={t('pedidos.removeProduct')}
                      className="w-9 h-9 mb-0.5 flex-shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Total */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('common.total')}</span>
              <span className="text-base font-extrabold text-blue-800">{fmtBs(total)}</span>
            </div>
          </div>
        </div>
        {err && <p className="mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            {t('common.cancel')}
          </button>
          <button onClick={handleSubmit} disabled={saving || !opts || lineasValidas.length === 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#1e40af' }}>
            {saving && <Spinner />}
            {saving ? t('common.saving') : t('pedidos.createOrder')}
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
  const { t, tZona } = useT()
  const { profile } = useAuth()
  const readOnly = isReadOnly(profile?.rol)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const handleNuevoPedido = (p: Pedido) => {
    setPedidos(prev => [p, ...prev])
    showToast('success', t('pedidos.toastCreated').replace('{code}', p.codigo))
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
    showToast('success', t('pedidos.toastStateChanged').replace('{state}', t('estado.' + newEstado)))
  }

  const handlePedidoUpdated = (updated: Pedido) => {
    setPedidos(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelected(updated)
    showToast('success', t('pedidos.toastUpdated').replace('{code}', updated.codigo))
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
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>{t('pedidos.title')}</h1>
          <p className="hidden md:block text-xs text-slate-400 capitalize mt-0.5">{hoy}</p>
          <BuiltByMobile />
        </div>
        <div className="flex items-center gap-4 lg:mr-24">
          <BuiltBy />
          {!readOnly && (
            <button
              onClick={() => setShowNuevo(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#1e40af' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              {t('pedidos.new')}
            </button>
          )}
        </div>
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
              <StatCard label={t('pedidos.statTotal')}    value={stats.total}            color="#1e40af" />
              <StatCard label={t('pedidos.statDelivered')} value={stats.entregados}      color="#15803d" />
              <StatCard label={t('pedidos.statFailed')}   value={stats.fallidos}         color="#dc2626" />
              <StatCard label={t('pedidos.statRate')}     value={`${stats.tasa}%`}       color="#0891b2" />
              <StatCard label={t('pedidos.statRevenue')}  value={fmtBs(stats.ingresos)}  color="#15803d" wide />
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
                placeholder={t('pedidos.searchPh')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              />
            </div>

            {/* Estado pills */}
            <div className="flex flex-wrap gap-1.5">
              <FilterPill active={estadoFilter === 'todos'} onClick={() => setEstadoFilter('todos')}>
                {t('common.allStates')}
              </FilterPill>
              {estadosEnDatos.map(e => (
                <FilterPill
                  key={e}
                  active={estadoFilter === e}
                  onClick={() => setEstadoFilter(e)}
                  color={ESTADO_CFG[e].dot}
                >
                  {t('estado.' + e)}
                </FilterPill>
              ))}
            </div>
          </div>

          {/* Zona pills */}
          <div className="flex flex-wrap gap-1.5">
            <FilterPill active={zonaFilter === 'todas'} onClick={() => setZonaFilter('todas')}>
              {t('common.allZones')}
            </FilterPill>
            {zonas.map(z => (
              <FilterPill
                key={z.id}
                active={zonaFilter === z.id}
                onClick={() => setZonaFilter(z.id)}
                color={z.color}
              >
                {tZona(z.nombre)}
              </FilterPill>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              {loading
                ? '…'
                : (filtered.length === 1 ? t('pedidos.countOne') : t('pedidos.countMany')).replace('{n}', String(filtered.length))}
              {!loading && filtered.length !== pedidos.length && (
                <span className="ml-1 text-slate-400">{t('common.of')} {pedidos.length} {t('common.totalSuffix')}</span>
              )}
            </p>
            {(estadoFilter !== 'todos' || zonaFilter !== 'todas' || search) && (
              <button
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                onClick={() => { setEstadoFilter('todos'); setZonaFilter('todas'); setSearch('') }}
              >
                {t('common.clearFilters')}
              </button>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['common.code', 'common.client', 'common.zone', 'common.state', 'common.total', 'common.date', ''].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h ? t(h) : ''}
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
                      <p className="text-slate-400 text-sm">{t('pedidos.noneFound')}</p>
                      <p className="text-slate-300 text-xs mt-1">{t('common.tryOtherFilters')}</p>
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
                          {tZona(p.zona_nombre)}
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
                          {t('common.view')}
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
                <p className="text-slate-400 text-sm">{t('pedidos.noneFound')}</p>
                <p className="text-slate-300 text-xs mt-1">{t('common.tryOtherFilters')}</p>
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
                        {tZona(p.zona_nombre)}
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
          onPedidoUpdated={handlePedidoUpdated}
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

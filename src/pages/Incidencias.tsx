import { useEffect, useMemo, useState } from 'react'
import { fetchIncidencias, createIncidencia, type Incidencia } from '../lib/incidencias'
import { fetchPedidosSelector } from '../lib/pedidos'
import { useAuth } from '../contexts/AuthContext'
import { isReadOnly } from '../lib/permissions'
import BuiltBy, { BuiltByMobile } from '../components/BuiltBy'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-200 rounded-lg animate-pulse ${className}`} />
}
function FilterPill({ active, onClick, color, children }: { active: boolean; onClick: () => void; color?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${active ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
      style={active ? { background: color ?? '#1e40af' } : {}}>
      {children}
    </button>
  )
}

const TIPOS_INCIDENCIA: { value: string; label: string }[] = [
  { value: 'cliente_ausente',     label: 'Cliente ausente'      },
  { value: 'direccion_incorrecta', label: 'Dirección incorrecta' },
  { value: 'producto_danado',     label: 'Producto dañado'      },
  { value: 'rechazo_cliente',     label: 'Rechazo del cliente'  },
  { value: 'accidente',           label: 'Accidente'            },
  { value: 'otro',                label: 'Otro'                 },
]

function RegistrarIncidenciaModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [pedidos, setPedidos]       = useState<{ id: string; codigo: string }[]>([])
  const [loadingPed, setLoadingPed] = useState(true)
  const [pedidoId, setPedidoId]     = useState('')
  const [tipo, setTipo]             = useState('cliente_ausente')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving]         = useState(false)
  const [err, setErr]               = useState<string | null>(null)

  useEffect(() => {
    fetchPedidosSelector()
      .then(d => { setPedidos(d); if (d.length > 0) setPedidoId(d[0].id); setLoadingPed(false) })
      .catch(() => setLoadingPed(false))
  }, [])

  const handleGuardar = async () => {
    if (!pedidoId)      { setErr('Selecciona un pedido'); return }
    if (!descripcion.trim()) { setErr('La descripción es obligatoria'); return }
    setErr(null)
    setSaving(true)
    try {
      await createIncidencia({ pedido_id: pedidoId, tipo, descripcion: descripcion.trim() })
      onSuccess()
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
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 w-[calc(100vw-2rem)] max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'fadeSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Nueva incidencia</p>
            <h2 className="text-lg font-extrabold text-slate-900">Registrar incidencia</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Pedido selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pedido asociado</label>
          {loadingPed ? (
            <div className="w-full h-10 bg-slate-100 rounded-xl animate-pulse" />
          ) : pedidos.length === 0 ? (
            <p className="text-sm text-slate-400">No hay pedidos disponibles</p>
          ) : (
            <select
              value={pedidoId}
              onChange={e => setPedidoId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all font-data"
            >
              {pedidos.map(p => (
                <option key={p.id} value={p.id}>{p.codigo}</option>
              ))}
            </select>
          )}
        </div>

        {/* Tipo */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tipo de incidencia</label>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
          >
            {TIPOS_INCIDENCIA.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Descripción</label>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={3}
            placeholder="Describe brevemente la incidencia…"
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all resize-none"
          />
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
            onClick={handleGuardar}
            disabled={saving || loadingPed || pedidos.length === 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#dc2626' }}
          >
            {saving && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            )}
            {saving ? 'Guardando…' : 'Guardar incidencia'}
          </button>
        </div>
      </div>
    </>
  )
}

function EstadoBadgeInc({ estado }: { estado: string }) {
  const resuelta = estado === 'resuelta'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${resuelta ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${resuelta ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {resuelta ? 'Resuelta' : 'Pendiente'}
    </span>
  )
}

export default function Incidencias() {
  const [incidencias, setIncidencias]     = useState<Incidencia[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [search, setSearch]               = useState('')
  const [estadoFilter, setEstadoFilter]   = useState<'todos' | 'pendiente' | 'resuelta'>('todos')
  const [selected, setSelected]           = useState<Incidencia | null>(null)
  const [showModal, setShowModal]         = useState(false)
  const { profile } = useAuth()
  const readOnly = isReadOnly(profile?.rol)
  const [toast, setToast]                 = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const loadIncidencias = () => {
    setLoading(true)
    fetchIncidencias()
      .then(d => { setIncidencias(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  useEffect(() => { loadIncidencias() }, [])

  const filtered = useMemo(() => incidencias.filter(i => {
    const q = search.toLowerCase()
    return (!search || i.tipo.toLowerCase().includes(q) || i.descripcion.toLowerCase().includes(q) || (i.pedido_codigo ?? '').toLowerCase().includes(q))
      && (estadoFilter === 'todos' || i.estado === estadoFilter)
  }), [incidencias, search, estadoFilter])

  const hoy = new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const pendientes = incidencias.filter(i => i.estado !== 'resuelta').length

  return (
    <>
      <header className="sticky top-14 lg:top-0 z-10 bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>Incidencias</h1>
          <p className="hidden md:block text-xs text-slate-400 capitalize mt-0.5">{hoy}</p>
          <BuiltByMobile />
        </div>
        <div className="flex items-center gap-4">
          <BuiltBy />
          {!readOnly && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#dc2626' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
              Registrar incidencia
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-7xl w-full mx-auto">
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {loading ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-16" />) : (
            <>
              <StatCard label="Total" value={incidencias.length} color="#1e40af" />
              <StatCard label="Pendientes" value={pendientes} color={pendientes>0?'#dc2626':'#64748b'} />
              <StatCard label="Resueltas" value={incidencias.length-pendientes} color="#15803d" />
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Tipo, pedido..." value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all" />
          </div>
          <div className="flex gap-1.5">
            <FilterPill active={estadoFilter==='todos'} onClick={()=>setEstadoFilter('todos')}>Todos</FilterPill>
            <FilterPill active={estadoFilter==='pendiente'} onClick={()=>setEstadoFilter('pendiente')} color="#d97706">Pendientes</FilterPill>
            <FilterPill active={estadoFilter==='resuelta'} onClick={()=>setEstadoFilter('resuelta')} color="#16a34a">Resueltas</FilterPill>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3.5 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500">{loading ? '…' : `${filtered.length} incidencia${filtered.length!==1?'s':''}`}</p>
          </div>
          <div className="hidden md:block overflow-x-auto">
            {!loading && incidencias.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-emerald-50">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={1.5} className="w-7 h-7"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-base font-bold text-slate-700">Sin incidencias registradas</p>
                <p className="text-sm text-slate-400">Las operaciones están funcionando correctamente</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Tipo','Pedido','Repartidor','Descripción','Estado','Fecha',''].map(h=>(
                      <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({length:5}).map((_,i)=>(
                    <tr key={i} className="border-b border-slate-50">{Array.from({length:7}).map((_,j)=><td key={j} className="px-6 py-3.5"><Skeleton className="h-4 w-20" /></td>)}</tr>
                  )) : filtered.length===0 ? (
                    <tr><td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-sm">Sin resultados</td></tr>
                  ) : filtered.map((inc, i) => (
                    <tr key={inc.id} className="border-b border-slate-50 hover:bg-rose-50/20 transition-colors cursor-pointer anim-card" style={{animationDelay:`${i*30}ms`}} onClick={()=>setSelected(inc)}>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 capitalize">{inc.tipo}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        {inc.pedido_codigo
                          ? <span className="font-data text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">{inc.pedido_codigo}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600">{inc.repartidor_nombre ?? '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-700 max-w-52 truncate">{inc.descripcion}</td>
                      <td className="px-6 py-3.5"><EstadoBadgeInc estado={inc.estado} /></td>
                      <td className="px-6 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(inc.created_at).toLocaleDateString('es-BO',{day:'2-digit',month:'2-digit',year:'2-digit'})}
                      </td>
                      <td className="px-6 py-3.5">
                        <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          onClick={e=>{e.stopPropagation();setSelected(inc)}}>Ver →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Vista cards en móvil */}
          <div className="md:hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : incidencias.length === 0 ? (
              <div className="py-20 text-center space-y-3 px-4">
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-emerald-50">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={1.5} className="w-7 h-7"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-base font-bold text-slate-700">Sin incidencias registradas</p>
                <p className="text-sm text-slate-400">Las operaciones están funcionando correctamente</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-16 text-center text-slate-400 text-sm">Sin resultados</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map(inc => (
                  <button
                    key={inc.id}
                    onClick={() => setSelected(inc)}
                    className="w-full text-left px-4 py-3.5 hover:bg-rose-50/20 active:bg-rose-50/40 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 capitalize">{inc.tipo}</span>
                      <EstadoBadgeInc estado={inc.estado} />
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">{inc.descripcion}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        {inc.pedido_codigo && (
                          <span className="font-data text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex-shrink-0">{inc.pedido_codigo}</span>
                        )}
                        {inc.repartidor_nombre && (
                          <span className="text-xs text-slate-500 truncate">{inc.repartidor_nombre}</span>
                        )}
                      </span>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {new Date(inc.created_at).toLocaleDateString('es-BO',{day:'2-digit',month:'2-digit',year:'2-digit'})}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Registrar incidencia modal */}
      {showModal && (
        <RegistrarIncidenciaModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            loadIncidencias()
            showToast('success', 'Incidencia registrada correctamente')
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white anim-card ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success'
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 flex-shrink-0"><path d="M18 6L6 18M6 6l12 12"/></svg>
          }
          {toast.msg}
        </div>
      )}

      {/* Simple detail modal */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 z-30 backdrop-blur-[1px]" onClick={()=>setSelected(null)} />
          <aside className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white z-40 shadow-2xl flex flex-col slide-in-right">
            <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Incidencia</p>
                <p className="font-bold text-slate-900 capitalize">{selected.tipo}</p>
                <div className="mt-2"><EstadoBadgeInc estado={selected.estado} /></div>
              </div>
              <button onClick={()=>setSelected(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {selected.pedido_codigo && <InfoBlock label="Pedido" value={<span className="font-data text-blue-700">{selected.pedido_codigo}</span>} />}
              {selected.repartidor_nombre && <InfoBlock label="Repartidor" value={selected.repartidor_nombre} />}
              <InfoBlock label="Descripción" value={selected.descripcion} />
              {selected.resolucion && <InfoBlock label="Resolución" value={selected.resolucion} />}
              <InfoBlock label="Registrado" value={new Date(selected.created_at).toLocaleDateString('es-BO',{day:'numeric',month:'long',year:'numeric'})} />
            </div>
            <div className="px-6 py-4 border-t border-slate-100">
              <button className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                Marcar como resuelta
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  )
}

function InfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-700 leading-relaxed">{value}</p>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { fetchRutas, fetchRutaOptions, createRuta, type Ruta, type EstadoRuta, type RutaOption } from '../lib/rutas'

const ESTADO_CFG: Record<EstadoRuta, { label: string; bg: string; text: string; dot: string }> = {
  planificada: { label: 'Planificada', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: '#d97706' },
  en_curso:    { label: 'En curso',    bg: 'bg-blue-50',    text: 'text-blue-700',    dot: '#2563eb' },
  completada:  { label: 'Completada',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: '#16a34a' },
}
const ESTADOS: EstadoRuta[] = ['planificada', 'en_curso', 'completada']

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-200 rounded-lg animate-pulse ${className}`} />
}
function FilterPill({ active, onClick, color, children }: { active: boolean; onClick: () => void; color?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${active ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
      style={active ? { background: color ?? '#1e40af' } : {}}>
      {color && !active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  )
}

// ─── Nueva Ruta Modal ─────────────────────────────────────────────────────────

function NuevaRutaModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: (ruta: Ruta) => void
}) {
  const [opts, setOpts]             = useState<RutaOption | null>(null)
  const [loadingOpts, setLoadingOpts] = useState(true)

  const [fecha, setFecha]           = useState(new Date().toISOString().split('T')[0])
  const [zonaId, setZonaId]         = useState('')
  const [repartidorId, setRepartidorId] = useState('')
  const [kmEstimado, setKmEstimado] = useState('')

  const [saving, setSaving]         = useState(false)
  const [err, setErr]               = useState<string | null>(null)

  useEffect(() => {
    fetchRutaOptions()
      .then(o => {
        setOpts(o)
        if (o.zonas.length > 0)        setZonaId(o.zonas[0].id)
        if (o.repartidores.length > 0) setRepartidorId(o.repartidores[0].id)
        setLoadingOpts(false)
      })
      .catch(() => setLoadingOpts(false))
  }, [])

  const zonaSeleccionada = opts?.zonas.find(z => z.id === zonaId)

  const handleGuardar = async () => {
    if (!fecha)  { setErr('La fecha es obligatoria');      return }
    if (!zonaId) { setErr('Selecciona una zona');          return }
    setErr(null)
    setSaving(true)
    try {
      const nueva = await createRuta({
        fecha,
        zona_id:       zonaId,
        repartidor_id: repartidorId || null,
        km_estimado:   kmEstimado ? parseInt(kmEstimado, 10) : null,
      })
      onSuccess(nueva)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all'
  const labelCls = 'block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5'

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'fadeSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Rutas</p>
            <h2 className="text-lg font-extrabold text-slate-900">Nueva ruta</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {loadingOpts ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-11 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Fecha */}
              <div>
                <label className={labelCls}>Fecha <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Zona */}
              <div>
                <label className={labelCls}>Zona <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select
                    value={zonaId}
                    onChange={e => setZonaId(e.target.value)}
                    className={inputCls}
                    style={{ paddingLeft: zonaSeleccionada ? '2.5rem' : undefined }}
                  >
                    {opts?.zonas.map(z => (
                      <option key={z.id} value={z.id}>{z.nombre}</option>
                    ))}
                  </select>
                  {zonaSeleccionada && (
                    <span
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none"
                      style={{ background: zonaSeleccionada.color }}
                    />
                  )}
                </div>
              </div>

              {/* Repartidor */}
              <div>
                <label className={labelCls}>Repartidor</label>
                <select
                  value={repartidorId}
                  onChange={e => setRepartidorId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Sin asignar</option>
                  {opts?.repartidores.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre} {r.apellido}</option>
                  ))}
                </select>
              </div>

              {/* Km estimado */}
              <div>
                <label className={labelCls}>Km estimado</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="9999"
                    value={kmEstimado}
                    onChange={e => setKmEstimado(e.target.value)}
                    placeholder="Ej. 45"
                    className={`${inputCls} pr-12`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">km</span>
                </div>
              </div>

              {/* Estado (readonly) */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-amber-700">Estado inicial: Planificada</span>
              </div>
            </>
          )}

          {err && (
            <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">{err}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={saving || loadingOpts}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition-opacity"
            style={{ background: '#1e40af' }}
          >
            {saving && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            )}
            {saving ? 'Creando ruta…' : 'Crear ruta'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Rutas() {
  const [rutas, setRutas]               = useState<Ruta[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [search, setSearch]             = useState('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoRuta | 'todos'>('todos')
  const [zonaFilter, setZonaFilter]     = useState('todas')
  const [showModal, setShowModal]       = useState(false)
  const [toast, setToast]               = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchRutas()
      .then(d => { setRutas(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const handleRutaCreada = (nueva: Ruta) => {
    setRutas(prev => [nueva, ...prev])
    setShowModal(false)
    showToast('success', `Ruta ${nueva.codigo} creada correctamente`)
  }

  const zonas = useMemo(() => {
    const m = new Map<string, { nombre: string; color: string }>()
    rutas.forEach(r => m.set(r.zona_id, { nombre: r.zona_nombre, color: r.zona_color }))
    return Array.from(m.entries()).map(([id, z]) => ({ id, ...z })).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [rutas])

  const filtered = useMemo(() => rutas.filter(r => {
    const q = search.toLowerCase()
    return (!search || r.codigo.toLowerCase().includes(q) || r.repartidor_nombre.toLowerCase().includes(q))
      && (estadoFilter === 'todos' || r.estado === estadoFilter)
      && (zonaFilter === 'todas' || r.zona_id === zonaFilter)
  }), [rutas, search, estadoFilter, zonaFilter])

  const hoy = new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const completadas = rutas.filter(r => r.estado === 'completada').length
  const totalPedidos = rutas.reduce((s, r) => s + r.total_pedidos, 0)
  const totalEntregados = rutas.reduce((s, r) => s + r.pedidos_entregados, 0)

  return (
    <>
      <header className="sticky top-14 lg:top-0 z-10 bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>Rutas</h1>
          <p className="text-xs text-slate-400 capitalize mt-0.5">{hoy}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: '#1e40af' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
          Nueva ruta
        </button>
      </header>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-7xl w-full mx-auto">
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {loading ? Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-16" />) : (
            <>
              <StatCard label="Total rutas" value={rutas.length} color="#1e40af" />
              <StatCard label="Completadas" value={completadas} color="#15803d" />
              <StatCard label="Pedidos cubiertos" value={totalPedidos} color="#0891b2" />
              <StatCard label="Entregados" value={totalEntregados} color="#15803d" />
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Código o repartidor..." value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FilterPill active={estadoFilter==='todos'} onClick={()=>setEstadoFilter('todos')}>Todos</FilterPill>
            {ESTADOS.map(e => <FilterPill key={e} active={estadoFilter===e} onClick={()=>setEstadoFilter(e)} color={ESTADO_CFG[e].dot}>{ESTADO_CFG[e].label}</FilterPill>)}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FilterPill active={zonaFilter==='todas'} onClick={()=>setZonaFilter('todas')}>Todas las zonas</FilterPill>
            {zonas.map(z => <FilterPill key={z.id} active={zonaFilter===z.id} onClick={()=>setZonaFilter(z.id)} color={z.color}>{z.nombre}</FilterPill>)}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">{loading ? '…' : `${filtered.length} ruta${filtered.length!==1?'s':''}`}</p>
            {(estadoFilter!=='todos'||zonaFilter!=='todas'||search) && (
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                onClick={()=>{setEstadoFilter('todos');setZonaFilter('todas');setSearch('')}}>Limpiar</button>
            )}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Código','Fecha','Repartidor','Zona','Estado','Progreso','Horario'].map(h=>(
                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({length:6}).map((_,i)=>(
                  <tr key={i} className="border-b border-slate-50">{Array.from({length:7}).map((_,j)=><td key={j} className="px-6 py-3.5"><Skeleton className="h-4 w-20" /></td>)}</tr>
                )) : filtered.length===0 ? (
                  <tr><td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-sm">Sin rutas</td></tr>
                ) : filtered.map((r, i) => {
                  const cfg = ESTADO_CFG[r.estado]
                  const pct = r.total_pedidos > 0 ? Math.round((r.pedidos_entregados / r.total_pedidos) * 100) : 0
                  const barColor = pct>=80?'#16a34a':pct>=50?'#d97706':'#2563eb'
                  return (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors anim-card" style={{animationDelay:`${i*30}ms`}}>
                      <td className="px-6 py-3.5">
                        <span className="font-data text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">{r.codigo}</span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                        {new Date(r.fecha).toLocaleDateString('es-BO',{day:'2-digit',month:'2-digit',year:'2-digit'})}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-800">{r.repartidor_nombre}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{color:r.zona_color}}>
                          <span className="w-2 h-2 rounded-full" style={{background:r.zona_color}} />{r.zona_nombre}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{background:cfg.dot}} />{cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2 min-w-32">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full" style={{width:`${pct}%`,background:barColor}} />
                          </div>
                          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                            {r.pedidos_entregados}/{r.total_pedidos}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {r.hora_inicio ? `${r.hora_inicio}${r.hora_fin ? ` – ${r.hora_fin}` : ''}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Vista cards en móvil */}
          <div className="md:hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-16 text-center text-slate-400 text-sm">Sin rutas</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map(r => {
                  const cfg = ESTADO_CFG[r.estado]
                  const pct = r.total_pedidos > 0 ? Math.round((r.pedidos_entregados / r.total_pedidos) * 100) : 0
                  const barColor = pct>=80?'#16a34a':pct>=50?'#d97706':'#2563eb'
                  return (
                    <div key={r.id} className="px-4 py-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-data text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">{r.codigo}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{background:cfg.dot}} />{cfg.label}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 text-sm truncate">{r.repartidor_nombre}</p>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-semibold" style={{color:r.zona_color}}>
                          <span className="w-2 h-2 rounded-full" style={{background:r.zona_color}} />{r.zona_nombre}
                        </span>
                        <span className="text-slate-400">
                          {new Date(r.fecha).toLocaleDateString('es-BO',{day:'2-digit',month:'2-digit',year:'2-digit'})}
                          {r.hora_inicio && ` · ${r.hora_inicio}${r.hora_fin ? `–${r.hora_fin}` : ''}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full" style={{width:`${pct}%`,background:barColor}} />
                        </div>
                        <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                          {r.pedidos_entregados}/{r.total_pedidos}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <NuevaRutaModal
          onClose={() => setShowModal(false)}
          onSuccess={handleRutaCreada}
        />
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

function StatCard({ label, value, color }: { label: string; value: string|number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-400 truncate">{label}</p>
      <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
    </div>
  )
}

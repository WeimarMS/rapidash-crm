import { useEffect, useMemo, useState } from 'react'
import { fetchProductos, createProducto, type Producto, type CategoriaProducto, type NewProductoInput } from '../lib/productos'
import { useAuth } from '../contexts/AuthContext'
import { isReadOnly } from '../lib/permissions'
import BuiltBy, { BuiltByMobile } from '../components/BuiltBy'

const CATEGORIA_CFG: Record<CategoriaProducto, { label: string; bg: string; text: string; dot: string }> = {
  analgesico:  { label: 'Analgésico',  bg: 'bg-orange-50',  text: 'text-orange-700',  dot: '#ea580c' },
  antibiotico: { label: 'Antibiótico', bg: 'bg-violet-50',  text: 'text-violet-700',  dot: '#7c3aed' },
  insumo:      { label: 'Insumo',      bg: 'bg-slate-100',  text: 'text-slate-600',   dot: '#64748b' },
  vacuna:      { label: 'Vacuna',      bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: '#0891b2' },
  vitamina:    { label: 'Vitamina',    bg: 'bg-emerald-50', text: 'text-emerald-700', dot: '#059669' },
}
const CATEGORIAS: CategoriaProducto[] = ['analgesico', 'antibiotico', 'insumo', 'vacuna', 'vitamina']
const fmtBs = (n: number) => `Bs. ${new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2 }).format(n)}`

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

// ─── Nuevo Producto Modal ─────────────────────────────────────────────────────

const INP = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all'
const LBL = 'block text-xs font-semibold text-slate-500 mb-1'
const Spinner = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

const UNIDADES = ['unidad', 'caja', 'frasco', 'ampolla', 'blister', 'sobre', 'vial', 'jeringa', 'litro', 'gramo']

function NuevoProductoModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: (p: Producto) => void
}) {
  const [form, setForm] = useState<NewProductoInput>({
    nombre: '', descripcion: '', categoria: 'analgesico',
    unidad: 'unidad', precio_unitario: 0, stock_actual: 0, stock_minimo: 0,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  const set = (k: keyof NewProductoInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.nombre || !form.unidad) { setErr('Nombre y unidad son obligatorios'); return }
    if (form.precio_unitario <= 0) { setErr('El precio debe ser mayor a 0'); return }
    setErr(null); setSaving(true)
    try {
      const producto = await createProducto({
        ...form,
        precio_unitario: Number(form.precio_unitario),
        stock_actual:    Number(form.stock_actual),
        stock_minimo:    Number(form.stock_minimo),
      })
      onSuccess(producto)
    } catch (e: any) { setErr(e.message) }
    finally { setSaving(false) }
  }

  const esFrio = form.categoria === 'vacuna'

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 w-[calc(100vw-2rem)] max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'fadeSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Productos</p>
            <h2 className="text-lg font-extrabold text-slate-900">Nuevo producto</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className={LBL}>Nombre *</label>
            <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej. Paracetamol 500mg" className={INP} />
          </div>
          <div>
            <label className={LBL}>Descripción</label>
            <textarea value={form.descripcion} onChange={set('descripcion')} rows={2}
              placeholder="Indicaciones, presentación…" className={`${INP} resize-none`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Categoría *</label>
              <select value={form.categoria} onChange={set('categoria')} className={INP}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{CATEGORIA_CFG[c].label}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>Unidad *</label>
              <select value={form.unidad} onChange={set('unidad')} className={INP}>
                {UNIDADES.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={LBL}>Precio (Bs.) *</label>
              <input type="number" min="0" step="0.01" value={form.precio_unitario || ''} onChange={set('precio_unitario')} placeholder="0.00" className={INP} />
            </div>
            <div>
              <label className={LBL}>Stock inicial</label>
              <input type="number" min="0" value={form.stock_actual || ''} onChange={set('stock_actual')} placeholder="0" className={INP} />
            </div>
            <div>
              <label className={LBL}>Stock mínimo</label>
              <input type="number" min="0" value={form.stock_minimo || ''} onChange={set('stock_minimo')} placeholder="0" className={INP} />
            </div>
          </div>
          {esFrio && (
            <div className="flex items-center gap-2 px-3 py-2 bg-cyan-50 border border-cyan-200 rounded-xl">
              <span className="text-sm">❄</span>
              <span className="text-xs font-semibold text-cyan-700">Requiere cadena de frío (categoría Vacuna)</span>
            </div>
          )}
        </div>
        {err && <p className="mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#1e40af' }}>
            {saving && <Spinner />}
            {saving ? 'Guardando…' : 'Crear producto'}
          </button>
        </div>
      </div>
    </>
  )
}

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState<CategoriaProducto | 'todos'>('todos')
  const [soloAlerta, setSoloAlerta] = useState(false)
  const [toast, setToast]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showNuevo, setShowNuevo]   = useState(false)
  const { profile } = useAuth()
  const readOnly = isReadOnly(profile?.rol)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500)
  }

  const handleNuevoProducto = (p: Producto) => {
    setProductos(prev => [...prev, p].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    showToast('success', `Producto "${p.nombre}" creado correctamente`)
    setShowNuevo(false)
  }

  useEffect(() => {
    fetchProductos()
      .then(d => { setProductos(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const filtered = useMemo(() => productos.filter(p => {
    const q = search.toLowerCase()
    return (!search || p.nombre.toLowerCase().includes(q))
      && (catFilter === 'todos' || p.categoria === catFilter)
      && (!soloAlerta || p.stock_bajo)
  }), [productos, search, catFilter, soloAlerta])

  const alertas = productos.filter(p => p.stock_bajo).length
  const hoy = new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <header className="sticky top-14 lg:top-0 z-10 bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>Productos</h1>
          <p className="text-xs text-slate-400 capitalize mt-0.5">{hoy}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 md:flex-row md:items-center md:gap-4">
          <BuiltBy />
          {!readOnly && (
            <button onClick={() => setShowNuevo(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: '#1e40af' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
              Nuevo producto
            </button>
          )}
          <BuiltByMobile />
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-7xl w-full mx-auto">
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {loading ? Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-16" />) : (
            <>
              <StatCard label="Total productos" value={productos.length} color="#1e40af" />
              <StatCard label="Stock bajo" value={alertas} color={alertas > 0 ? '#dc2626' : '#15803d'} />
              {CATEGORIAS.map(c => <StatCard key={c} label={CATEGORIA_CFG[c].label} value={productos.filter(p=>p.categoria===c).length} color={CATEGORIA_CFG[c].dot} />)}
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Buscar producto..." value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FilterPill active={catFilter==='todos'} onClick={()=>setCatFilter('todos')}>Todas las categorías</FilterPill>
            {CATEGORIAS.map(c => (
              <FilterPill key={c} active={catFilter===c} onClick={()=>setCatFilter(c)} color={CATEGORIA_CFG[c].dot}>{CATEGORIA_CFG[c].label}</FilterPill>
            ))}
          </div>
          <button
            onClick={()=>setSoloAlerta(v=>!v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${soloAlerta ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Solo alertas {alertas > 0 && `(${alertas})`}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              {loading ? '…' : `${filtered.length} producto${filtered.length!==1?'s':''}`}
              {!loading && filtered.length!==productos.length && <span className="ml-1 text-slate-400">de {productos.length}</span>}
            </p>
            {(catFilter!=='todos'||search||soloAlerta) && (
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                onClick={()=>{setCatFilter('todos');setSearch('');setSoloAlerta(false)}}>Limpiar filtros</button>
            )}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Producto','Categoría','Unidad','Precio','Stock','Mín.','Estado',''].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({length:8}).map((_,i) => (
                  <tr key={i} className="border-b border-slate-50">{Array.from({length:8}).map((_,j)=><td key={j} className="px-6 py-3.5"><Skeleton className="h-4 w-20" /></td>)}</tr>
                )) : filtered.length===0 ? (
                  <tr><td colSpan={8} className="px-6 py-16 text-center text-slate-400 text-sm">Sin resultados</td></tr>
                ) : filtered.map((p, i) => {
                  const cfg = CATEGORIA_CFG[p.categoria]
                  const pct = p.stock_minimo > 0 ? Math.min(100, Math.round((p.stock_actual / p.stock_minimo) * 100)) : 100
                  const barColor = p.stock_bajo ? '#dc2626' : p.stock_actual <= p.stock_minimo * 1.5 ? '#d97706' : '#16a34a'
                  return (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors anim-card" style={{animationDelay:`${i*25}ms`}}>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800">{p.nombre}</p>
                          {p.cadena_frio && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-700">❄ Frío</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{background:cfg.dot}} />{cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 text-xs font-semibold uppercase">{p.unidad}</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{fmtBs(p.precio_unitario)}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 w-8 text-right">{p.stock_actual}</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full" style={{width:`${pct}%`, background:barColor}} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-400 font-semibold">{p.stock_minimo}</td>
                      <td className="px-6 py-3.5">
                        {p.stock_bajo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Stock bajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />OK
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {!readOnly && (
                          <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50">Editar</button>
                        )}
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
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-16 text-center text-slate-400 text-sm">Sin resultados</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map(p => {
                  const cfg = CATEGORIA_CFG[p.categoria]
                  const pct = p.stock_minimo > 0 ? Math.min(100, Math.round((p.stock_actual / p.stock_minimo) * 100)) : 100
                  const barColor = p.stock_bajo ? '#dc2626' : p.stock_actual <= p.stock_minimo * 1.5 ? '#d97706' : '#16a34a'
                  return (
                    <div key={p.id} className="px-4 py-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{p.nombre}</p>
                          {p.cadena_frio && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-700 flex-shrink-0">❄ Frío</span>
                          )}
                        </div>
                        {p.stock_bajo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Stock bajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />OK
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{background:cfg.dot}} />{cfg.label}
                        </span>
                        <span className="font-semibold text-slate-800 text-sm">
                          {fmtBs(p.precio_unitario)} <span className="text-xs font-normal text-slate-400 uppercase">/ {p.unidad}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-semibold">Stock</span>
                        <span className="font-bold text-slate-800 text-sm">{p.stock_actual}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full" style={{width:`${pct}%`, background:barColor}} />
                        </div>
                        <span className="text-xs text-slate-400">mín. {p.stock_minimo}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {showNuevo && (
        <NuevoProductoModal onClose={() => setShowNuevo(false)} onSuccess={handleNuevoProducto} />
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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-400 truncate">{label}</p>
      <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
    </div>
  )
}

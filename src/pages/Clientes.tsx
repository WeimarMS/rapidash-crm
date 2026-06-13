import { useEffect, useMemo, useState } from 'react'
import { fetchClientes, toggleClienteActivo, fetchZonasSimple, createCliente, type Cliente, type TipoCliente, type NewClienteInput } from '../lib/clientes'
import { useAuth } from '../contexts/AuthContext'
import { isReadOnly } from '../lib/permissions'
import BuiltBy, { BuiltByMobile } from '../components/BuiltBy'

// ─── Config ──────────────────────────────────────────────────────────────────

const TIPO_CFG: Record<TipoCliente, { label: string; bg: string; text: string; dot: string }> = {
  farmacia:     { label: 'Farmacia',      bg: 'bg-blue-50',    text: 'text-blue-700',   dot: '#2563eb' },
  clinica:      { label: 'Clínica',       bg: 'bg-violet-50',  text: 'text-violet-700', dot: '#7c3aed' },
  centro_salud: { label: 'Centro Salud',  bg: 'bg-emerald-50', text: 'text-emerald-700',dot: '#059669' },
  consultorio:  { label: 'Consultorio',   bg: 'bg-cyan-50',    text: 'text-cyan-700',   dot: '#0891b2' },
}

const TIPOS: TipoCliente[] = ['farmacia', 'clinica', 'centro_salud', 'consultorio']

// ─── Sub-components ───────────────────────────────────────────────────────────

function TipoBadge({ tipo }: { tipo: TipoCliente }) {
  const cfg = TIPO_CFG[tipo]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
      Suspendido
    </span>
  )
}

function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`bg-slate-200 rounded-lg animate-pulse ${className}`} style={style} />
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function Drawer({ cliente, onClose, onToggleActivo }: {
  cliente: Cliente
  onClose: () => void
  onToggleActivo: (newActivo: boolean) => Promise<void>
}) {
  const [saving, setSaving]   = useState(false)
  const [actError, setActError] = useState<string | null>(null)
  const { profile } = useAuth()
  const readOnly = isReadOnly(profile?.rol)

  const fmtBs = (n: number | null) =>
    n == null ? '—' : `Bs. ${new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2 }).format(n)}`

  const fmtFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 z-30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <aside className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white z-40 shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.28s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header strip */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Detalle del cliente</p>
            <h2 className="text-lg font-extrabold text-slate-900 leading-tight">{cliente.nombre}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <TipoBadge tipo={cliente.tipo} />
              <EstadoBadge activo={cliente.activo} />
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

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Zona */}
          <Section title="Zona">
            <InfoRow label="Zona" value={
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: cliente.zona_color }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cliente.zona_color }} />
                {cliente.zona_nombre}
              </span>
            } />
            <InfoRow label="Dirección" value={cliente.direccion} />
          </Section>

          {/* Contacto */}
          <Section title="Contacto">
            <InfoRow label="Responsable"   value={cliente.contacto_nombre} />
            <InfoRow label="Teléfono"      value={cliente.telefono} />
            <InfoRow label="Correo"        value={cliente.email} />
          </Section>

          {/* Comercial */}
          <Section title="Información comercial">
            <InfoRow label="NIT"            value={cliente.nit} />
            <InfoRow label="Crédito límite" value={fmtBs(cliente.credito_limite)} />
            <InfoRow label="Miembro desde"  value={fmtFecha(cliente.created_at)} />
          </Section>
        </div>

        {/* Footer actions */}
        {actError && (
          <div className="mx-6 mb-0 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {actError}
          </div>
        )}
        {!readOnly && (
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            Editar
          </button>
          <button
            disabled={saving}
            onClick={async () => {
              setActError(null)
              setSaving(true)
              try {
                await onToggleActivo(!cliente.activo)
              } catch (e: any) {
                setActError(e.message)
              } finally {
                setSaving(false)
              }
            }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: cliente.activo ? '#fff1f2' : '#f0fdf4', color: cliente.activo ? '#e11d48' : '#16a34a' }}
          >
            {saving && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            )}
            {saving ? 'Guardando…' : cliente.activo ? 'Suspender' : 'Activar'}
          </button>
        </div>
        )}
      </aside>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">{title}</p>
      <div className="bg-slate-50 rounded-xl divide-y divide-slate-100 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  const display = value == null || value === '' ? '—' : value
  return (
    <div className="flex items-center justify-between px-4 py-2.5 gap-4">
      <span className="text-xs font-medium text-slate-400 flex-shrink-0">{label}</span>
      <span className="text-xs font-semibold text-slate-700 text-right truncate max-w-48">{display}</span>
    </div>
  )
}

// ─── Nuevo Cliente Modal ──────────────────────────────────────────────────────

const INP = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all'
const LBL = 'block text-xs font-semibold text-slate-500 mb-1'
const Spinner = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

function NuevoClienteModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: (c: Cliente) => void
}) {
  const [zonas, setZonas]     = useState<{ id: string; nombre: string; color: string }[]>([])
  const [optsErr, setOptsErr] = useState<string | null>(null)
  const [form, setForm]       = useState<NewClienteInput>({
    nombre: '', tipo: 'farmacia', zona_id: '', direccion: '',
    telefono: '', email: '', contacto_nombre: '', credito_limite: null,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  useEffect(() => {
    fetchZonasSimple().then(setZonas).catch(e => setOptsErr(e.message))
  }, [])

  const set = (k: keyof NewClienteInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.nombre || !form.zona_id || !form.direccion) {
      setErr('Nombre, zona y dirección son obligatorios'); return
    }
    setErr(null); setSaving(true)
    try {
      const cliente = await createCliente({
        ...form,
        credito_limite: form.credito_limite ? Number(form.credito_limite) : null,
      })
      onSuccess(cliente)
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Clientes</p>
            <h2 className="text-lg font-extrabold text-slate-900">Nuevo cliente</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {optsErr && <p className="mb-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{optsErr}</p>}
        <div className="space-y-3">
          <div>
            <label className={LBL}>Nombre *</label>
            <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej. Farmacia Central" className={INP} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Tipo *</label>
              <select value={form.tipo} onChange={set('tipo')} className={INP}>
                <option value="farmacia">Farmacia</option>
                <option value="clinica">Clínica</option>
                <option value="centro_salud">Centro de Salud</option>
                <option value="consultorio">Consultorio</option>
              </select>
            </div>
            <div>
              <label className={LBL}>Zona *</label>
              <select value={form.zona_id} onChange={set('zona_id')} className={INP}>
                <option value="">— Seleccionar —</option>
                {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={LBL}>Dirección *</label>
            <input type="text" value={form.direccion} onChange={set('direccion')} placeholder="Av. o calle, número, referencia" className={INP} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Teléfono</label>
              <input type="tel" value={form.telefono} onChange={set('telefono')} placeholder="Ej. 77712345" className={INP} />
            </div>
            <div>
              <label className={LBL}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="correo@ejemplo.com" className={INP} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Contacto</label>
              <input type="text" value={form.contacto_nombre} onChange={set('contacto_nombre')} placeholder="Nombre del responsable" className={INP} />
            </div>
            <div>
              <label className={LBL}>Crédito límite (Bs.)</label>
              <input type="number" min="0" step="0.01"
                value={form.credito_limite ?? ''} onChange={set('credito_limite')}
                placeholder="0.00" className={INP} />
            </div>
          </div>
        </div>
        {err && <p className="mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving || !zonas.length}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#1e40af' }}>
            {saving && <Spinner />}
            {saving ? 'Guardando…' : 'Crear cliente'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Clientes() {
  const [clientes, setClientes]       = useState<Cliente[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [zonaFilter, setZonaFilter]   = useState<string>('todas')
  const [tipoFilter, setTipoFilter]   = useState<TipoCliente | 'todos'>('todos')
  const [selected, setSelected]       = useState<Cliente | null>(null)
  const [toast, setToast]             = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showNuevo, setShowNuevo]     = useState(false)
  const { profile } = useAuth()
  const readOnly = isReadOnly(profile?.rol)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const handleNuevoCliente = (c: Cliente) => {
    setClientes(prev => [c, ...prev])
    showToast('success', `Cliente "${c.nombre}" creado correctamente`)
    setShowNuevo(false)
  }

  useEffect(() => {
    fetchClientes()
      .then(data => { setClientes(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const handleToggleActivo = async (newActivo: boolean) => {
    if (!selected) return
    await toggleClienteActivo(selected.id, newActivo)
    const updated = { ...selected, activo: newActivo }
    setClientes(prev => prev.map(c => c.id === selected.id ? updated : c))
    setSelected(updated)
    showToast('success', newActivo ? 'Cliente activado correctamente' : 'Cliente suspendido correctamente')
  }

  // Derived: unique zones from data
  const zonas = useMemo(() => {
    const map = new Map<string, { nombre: string; color: string }>()
    clientes.forEach(c => map.set(c.zona_id, { nombre: c.zona_nombre, color: c.zona_color }))
    return Array.from(map.entries()).map(([id, z]) => ({ id, ...z }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [clientes])

  // Filtered list
  const filtered = useMemo(() => clientes.filter(c => {
    const matchSearch = !search || c.nombre.toLowerCase().includes(search.toLowerCase())
      || (c.contacto_nombre ?? '').toLowerCase().includes(search.toLowerCase())
    const matchZona = zonaFilter === 'todas' || c.zona_id === zonaFilter
    const matchTipo = tipoFilter === 'todos' || c.tipo === tipoFilter
    return matchSearch && matchZona && matchTipo
  }), [clientes, search, zonaFilter, tipoFilter])

  // Stats
  const stats = useMemo(() => ({
    total:   clientes.length,
    activos: clientes.filter(c => c.activo).length,
    porTipo: TIPOS.map(t => ({ tipo: t, count: clientes.filter(c => c.tipo === t).length })),
  }), [clientes])

  const hoy = new Date().toLocaleDateString('es-BO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-14 lg:top-0 z-10 bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>
            Clientes
          </h1>
          <p className="hidden md:block text-xs text-slate-400 capitalize mt-0.5">{hoy}</p>
          <BuiltByMobile />
        </div>
        <div className="flex items-center gap-4">
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
              Nuevo cliente
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

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)
          ) : (
            <>
              <StatCard label="Total clientes" value={stats.total} color="#1e40af" />
              <StatCard label="Activos" value={stats.activos} color="#15803d" />
              {stats.porTipo.map(({ tipo, count }) => (
                <StatCard
                  key={tipo}
                  label={TIPO_CFG[tipo].label}
                  value={count}
                  color={TIPO_CFG[tipo].dot}
                />
              ))}
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
            />
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

          {/* Tipo pills */}
          <div className="flex flex-wrap gap-1.5">
            <FilterPill active={tipoFilter === 'todos'} onClick={() => setTipoFilter('todos')}>
              Todos
            </FilterPill>
            {TIPOS.map(t => (
              <FilterPill
                key={t}
                active={tipoFilter === t}
                onClick={() => setTipoFilter(t)}
                color={TIPO_CFG[t].dot}
              >
                {TIPO_CFG[t].label}
              </FilterPill>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              {loading ? '…' : `${filtered.length} cliente${filtered.length !== 1 ? 's' : ''}`}
              {filtered.length !== clientes.length && !loading && (
                <span className="ml-1 text-slate-400">de {clientes.length} total</span>
              )}
            </p>
            {(zonaFilter !== 'todas' || tipoFilter !== 'todos' || search) && (
              <button
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                onClick={() => { setZonaFilter('todas'); setTipoFilter('todos'); setSearch('') }}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Cliente', 'Tipo', 'Zona', 'Teléfono', 'Contacto', 'Estado', ''].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-6 py-3.5">
                          <Skeleton className="h-4" style={{ width: `${60 + (j * 17) % 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <p className="text-slate-400 text-sm">No se encontraron clientes</p>
                      <p className="text-slate-300 text-xs mt-1">Intenta con otros filtros</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, i) => (
                    <tr
                      key={c.id}
                      className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer anim-card"
                      style={{ animationDelay: `${i * 30}ms` }}
                      onClick={() => setSelected(c)}
                    >
                      <td className="px-6 py-3.5">
                        <div>
                          <p className="font-semibold text-slate-800 leading-tight">{c.nombre}</p>
                          {c.email && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-48">{c.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <TipoBadge tipo={c.tipo} />
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: c.zona_color }}
                        >
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.zona_color }} />
                          {c.zona_nombre}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600">
                        {c.telefono ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600">
                        {c.contacto_nombre ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        <EstadoBadge activo={c.activo} />
                      </td>
                      <td className="px-6 py-3.5">
                        <button
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
                          onClick={e => { e.stopPropagation(); setSelected(c) }}
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
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-slate-400 text-sm">No se encontraron clientes</p>
                <p className="text-slate-300 text-xs mt-1">Intenta con otros filtros</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="w-full text-left px-4 py-3.5 hover:bg-blue-50/30 active:bg-blue-50/50 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-800 leading-tight min-w-0 truncate">{c.nombre}</p>
                      <EstadoBadge activo={c.activo} />
                    </div>
                    {c.email && <p className="text-xs text-slate-400 truncate">{c.email}</p>}
                    <div className="flex items-center justify-between gap-2">
                      <TipoBadge tipo={c.tipo} />
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: c.zona_color }}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.zona_color }} />
                        {c.zona_nombre}
                      </span>
                    </div>
                    {(c.telefono || c.contacto_nombre) && (
                      <p className="text-xs text-slate-500 truncate">
                        {[c.contacto_nombre, c.telefono].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {selected && (
        <Drawer
          cliente={selected}
          onClose={() => setSelected(null)}
          onToggleActivo={handleToggleActivo}
        />
      )}

      {showNuevo && (
        <NuevoClienteModal onClose={() => setShowNuevo(false)} onSuccess={handleNuevoCliente} />
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
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-400 truncate">{label}</p>
      <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
    </div>
  )
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
      {color && !active && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      )}
      {children}
    </button>
  )
}

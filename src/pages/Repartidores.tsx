import { useEffect, useMemo, useState } from 'react'
import { fetchRepartidores, toggleRepartidorActivo, fetchRepartidorFormOptions, createRepartidor, updateRepartidor, type Repartidor, type RepartidorFormOptions } from '../lib/repartidores'
import { useAuth } from '../contexts/AuthContext'
import { useT } from '../contexts/LanguageContext'
import { isReadOnly } from '../lib/permissions'
import BuiltBy, { BuiltByMobile } from '../components/BuiltBy'

const VEHICULO_ICON: Record<string, string> = { moto: '🏍', camioneta: '🚙', furgon: '🚐' }

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

function RepartidorDrawer({ rep, onClose, onToggleActivo, onEdit }: {
  rep: Repartidor
  onClose: () => void
  onToggleActivo: (newActivo: boolean) => Promise<void>
  onEdit: () => void
}) {
  const [saving, setSaving]     = useState(false)
  const [actError, setActError] = useState<string | null>(null)
  const tasaColor = rep.tasa_entrega >= 80 ? '#16a34a' : rep.tasa_entrega >= 60 ? '#d97706' : '#dc2626'
  const { profile } = useAuth()
  const { t, tZona } = useT()
  const readOnly = isReadOnly(profile?.rol)
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-30 backdrop-blur-[1px]" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white z-40 shadow-2xl flex flex-col slide-in-right">
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{t('repartidores.drawer.eyebrow')}</p>
            <h2 className="text-lg font-extrabold text-slate-900">{rep.nombre} {rep.apellido}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${rep.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${rep.activo ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                {rep.activo ? t('common.active') : t('common.inactive')}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: rep.zona_color }}>
                <span className="w-2 h-2 rounded-full" style={{ background: rep.zona_color }} />{tZona(rep.zona_nombre)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Métricas */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl px-3 py-3 text-center">
              <p className="text-xs font-semibold text-blue-400 mb-1">{t('repartidores.drawer.total')}</p>
              <p className="text-2xl font-extrabold text-blue-700">{rep.pedidos_total}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl px-3 py-3 text-center">
              <p className="text-xs font-semibold text-emerald-400 mb-1">{t('repartidores.drawer.delivered')}</p>
              <p className="text-2xl font-extrabold text-emerald-700">{rep.pedidos_entregados}</p>
            </div>
            <div className="rounded-xl px-3 py-3 text-center" style={{ background: `${tasaColor}15` }}>
              <p className="text-xs font-semibold mb-1" style={{ color: tasaColor }}>{t('repartidores.drawer.rate')}</p>
              <p className="text-2xl font-extrabold" style={{ color: tasaColor }}>{rep.tasa_entrega}%</p>
            </div>
          </div>

          {/* Barra de tasa */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
              <span>{t('common.deliveryRate')}</span><span style={{ color: tasaColor }}>{rep.tasa_entrega}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="h-full rounded-full anim-bar" style={{ width: `${rep.tasa_entrega}%`, background: tasaColor }} />
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">{t('repartidores.drawer.personal')}</p>
            <div className="bg-slate-50 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {[[t('repartidores.drawer.ci'), rep.ci], [t('repartidores.drawer.phone'), rep.telefono ?? '—'], [t('repartidores.drawer.zone'), tZona(rep.zona_nombre)]].map(([l,v]) => (
                <div key={l} className="flex justify-between px-4 py-2.5">
                  <span className="text-xs font-medium text-slate-400">{l}</span>
                  <span className="text-xs font-semibold text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">{t('repartidores.drawer.vehicle')}</p>
            <div className="bg-slate-50 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {[[t('repartidores.drawer.plate'), rep.vehiculo_placa], [t('repartidores.drawer.type'), `${VEHICULO_ICON[rep.vehiculo_tipo] ?? ''} ${rep.vehiculo_tipo}`]].map(([l,v]) => (
                <div key={l} className="flex justify-between px-4 py-2.5">
                  <span className="text-xs font-medium text-slate-400">{l}</span>
                  <span className="text-xs font-semibold text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {actError && (
          <div className="mx-6 mb-0 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {actError}
          </div>
        )}
        {!readOnly && (
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
            <button onClick={onEdit} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">{t('common.edit')}</button>
            <button
              disabled={saving}
              onClick={async () => {
                setActError(null)
                setSaving(true)
                try { await onToggleActivo(!rep.activo) }
                catch (e: unknown) { setActError(e instanceof Error ? e.message : String(e)) }
                finally { setSaving(false) }
              }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: rep.activo ? '#fff1f2' : '#f0fdf4', color: rep.activo ? '#e11d48' : '#16a34a' }}
            >
              {saving && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              )}
              {saving ? t('common.saving') : rep.activo ? t('common.deactivate') : t('common.activate')}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

// ─── Nuevo Repartidor Modal ───────────────────────────────────────────────────

const INP = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all'
const LBL = 'block text-xs font-semibold text-slate-500 mb-1'
const Spinner = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

function NuevoRepartidorModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: (r: Repartidor) => void
}) {
  const [opts, setOpts]       = useState<RepartidorFormOptions | null>(null)
  const [optsErr, setOptsErr] = useState<string | null>(null)
  const [form, setForm]       = useState({
    nombre: '', apellido: '', ci: '', telefono: '', zona_id: '', vehiculo_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)
  const { t, tZona } = useT()

  useEffect(() => {
    fetchRepartidorFormOptions().then(setOpts).catch(e => setOptsErr(e.message))
  }, [])

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.nombre || !form.apellido || !form.ci || !form.zona_id || !form.vehiculo_id) {
      setErr(t('repartidores.modal.required')); return
    }
    setErr(null); setSaving(true)
    try {
      const rep = await createRepartidor({
        nombre: form.nombre, apellido: form.apellido, ci: form.ci,
        telefono: form.telefono, zona_id: form.zona_id, vehiculo_id: form.vehiculo_id,
      })
      onSuccess(rep)
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">{t('repartidores.modal.eyebrow')}</p>
            <h2 className="text-lg font-extrabold text-slate-900">{t('repartidores.modal.title')}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {optsErr && <p className="mb-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{optsErr}</p>}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LBL}>{t('repartidores.modal.firstName')}</label>
              <input type="text" value={form.nombre} onChange={set('nombre')} placeholder={t('repartidores.modal.phFirstName')} className={INP} />
            </div>
            <div>
              <label className={LBL}>{t('repartidores.modal.lastName')}</label>
              <input type="text" value={form.apellido} onChange={set('apellido')} placeholder={t('repartidores.modal.phLastName')} className={INP} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LBL}>{t('repartidores.modal.ci')}</label>
              <input type="text" value={form.ci} onChange={set('ci')} placeholder={t('repartidores.modal.phCi')} className={INP} />
            </div>
            <div>
              <label className={LBL}>{t('repartidores.modal.phone')}</label>
              <input type="tel" value={form.telefono} onChange={set('telefono')} placeholder={t('repartidores.modal.phPhone')} className={INP} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LBL}>{t('repartidores.modal.zone')}</label>
              <select value={form.zona_id} onChange={set('zona_id')} className={INP}>
                <option value="">{t('common.select')}</option>
                {opts?.zonas.map(z => <option key={z.id} value={z.id}>{tZona(z.nombre)}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>{t('repartidores.modal.vehicle')}</label>
              <select value={form.vehiculo_id} onChange={set('vehiculo_id')} className={INP}>
                <option value="">{t('common.select')}</option>
                {opts?.vehiculos.map(v => (
                  <option key={v.id} value={v.id}>
                    {VEHICULO_ICON[v.tipo] ?? '🚚'} {v.placa} ({v.tipo})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {err && <p className="mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            {t('common.cancel')}
          </button>
          <button onClick={handleSubmit} disabled={saving || !opts}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#1e40af' }}>
            {saving && <Spinner />}
            {saving ? t('common.saving') : t('repartidores.modal.submit')}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Editar Repartidor Modal ──────────────────────────────────────────────────

function EditarRepartidorModal({ rep, onClose, onSuccess }: {
  rep: Repartidor
  onClose: () => void
  onSuccess: (updated: Repartidor) => void
}) {
  const [opts, setOpts]       = useState<RepartidorFormOptions | null>(null)
  const [optsErr, setOptsErr] = useState<string | null>(null)
  const [form, setForm]       = useState({
    telefono:    rep.telefono ?? '',
    zona_id:     rep.zona_id,
    vehiculo_id: rep.vehiculo_id,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)
  const { t, tZona } = useT()

  useEffect(() => {
    fetchRepartidorFormOptions().then(setOpts).catch(e => setOptsErr(e.message))
  }, [])

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.zona_id || !form.vehiculo_id) {
      setErr(t('repartidores.editModal.required')); return
    }
    setErr(null); setSaving(true)
    try {
      const updated = await updateRepartidor(rep.id, {
        telefono:    form.telefono,
        zona_id:     form.zona_id,
        vehiculo_id: form.vehiculo_id,
      })
      // Preserve pedido metrics from the original rep object
      onSuccess({ ...updated, pedidos_total: rep.pedidos_total, pedidos_entregados: rep.pedidos_entregados, tasa_entrega: rep.tasa_entrega })
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 z-50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed z-[60] bg-white rounded-2xl shadow-2xl border border-slate-100 w-[calc(100vw-2rem)] max-w-md p-6 max-h-[90vh] overflow-y-auto"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'fadeSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">{t('repartidores.editModal.eyebrow')}</p>
            <h2 className="text-lg font-extrabold text-slate-900">{t('repartidores.editModal.title')}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{rep.nombre} {rep.apellido}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {optsErr && <p className="mb-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{optsErr}</p>}
        <div className="space-y-3">
          <div>
            <label className={LBL}>{t('repartidores.editModal.phone')}</label>
            <input type="tel" value={form.telefono} onChange={set('telefono')} placeholder="Ej. 77712345" className={INP} />
          </div>
          <div>
            <label className={LBL}>{t('repartidores.editModal.zone')}</label>
            <select value={form.zona_id} onChange={set('zona_id')} className={INP}>
              <option value="">{t('common.select')}</option>
              {opts?.zonas.map(z => <option key={z.id} value={z.id}>{tZona(z.nombre)}</option>)}
            </select>
          </div>
          <div>
            <label className={LBL}>{t('repartidores.editModal.vehicle')}</label>
            <select value={form.vehiculo_id} onChange={set('vehiculo_id')} className={INP}>
              <option value="">{t('common.select')}</option>
              {opts?.vehiculos.map(v => (
                <option key={v.id} value={v.id}>
                  {VEHICULO_ICON[v.tipo] ?? '🚚'} {v.placa} ({v.tipo})
                </option>
              ))}
            </select>
          </div>
        </div>
        {err && <p className="mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            {t('common.cancel')}
          </button>
          <button onClick={handleSubmit} disabled={saving || !opts}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#1e40af' }}>
            {saving && <Spinner />}
            {saving ? t('common.saving') : t('repartidores.editModal.submit')}
          </button>
        </div>
      </div>
    </>
  )
}

export default function Repartidores() {
  const [repartidores, setRepartidores] = useState<Repartidor[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [search, setSearch]             = useState('')
  const [zonaFilter, setZonaFilter]     = useState('todas')
  const [selected, setSelected]         = useState<Repartidor | null>(null)
  const [toast, setToast]               = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showNuevo, setShowNuevo]       = useState(false)
  const [showEditar, setShowEditar]     = useState(false)
  const { profile } = useAuth()
  const { t, tZona } = useT()
  const readOnly = isReadOnly(profile?.rol)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const handleEditarRepartidor = (updated: Repartidor) => {
    setRepartidores(prev => prev.map(r => r.id === updated.id ? updated : r))
    setShowEditar(false)
    setSelected(null)
    showToast('success', t('repartidores.toast.updated').replace('{name}', `${updated.nombre} ${updated.apellido}`))
  }

  const handleNuevoRepartidor = (r: Repartidor) => {
    setRepartidores(prev => [...prev, r].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    showToast('success', t('repartidores.toast.created').replace('{name}', `${r.nombre} ${r.apellido}`))
    setShowNuevo(false)
  }

  useEffect(() => {
    fetchRepartidores()
      .then(d => { setRepartidores(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const handleToggleActivo = async (newActivo: boolean) => {
    if (!selected) return
    await toggleRepartidorActivo(selected.id, newActivo)
    const updated = { ...selected, activo: newActivo }
    setRepartidores(prev => prev.map(r => r.id === selected.id ? updated : r))
    setSelected(updated)
    showToast('success', newActivo ? t('repartidores.toast.activated') : t('repartidores.toast.deactivated'))
  }

  const zonas = useMemo(() => {
    const m = new Map<string, { nombre: string; color: string }>()
    repartidores.forEach(r => m.set(r.zona_id, { nombre: r.zona_nombre, color: r.zona_color }))
    return Array.from(m.entries()).map(([id, z]) => ({ id, ...z })).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [repartidores])

  const filtered = useMemo(() => repartidores.filter(r => {
    const q = search.toLowerCase()
    return (!search || `${r.nombre} ${r.apellido}`.toLowerCase().includes(q) || r.vehiculo_placa.toLowerCase().includes(q))
      && (zonaFilter === 'todas' || r.zona_id === zonaFilter)
  }), [repartidores, search, zonaFilter])

  const hoy = new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const activos = repartidores.filter(r => r.activo).length
  const avgTasa = repartidores.length ? Math.round(repartidores.reduce((s, r) => s + r.tasa_entrega, 0) / repartidores.length) : 0

  return (
    <>
      <header className="sticky top-14 lg:top-0 z-10 bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>{t('repartidores.title')}</h1>
          <p className="hidden md:block text-xs text-slate-400 capitalize mt-0.5">{hoy}</p>
          <BuiltByMobile />
        </div>
        <div className="flex items-center gap-4 lg:mr-24">
          <BuiltBy />
          {!readOnly && (
            <button onClick={() => setShowNuevo(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: '#1e40af' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
              {t('repartidores.new')}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-7xl w-full mx-auto">
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {loading ? Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-16" />) : (
            <>
              <StatCard label={t('repartidores.stat.total')} value={repartidores.length} color="#1e40af" />
              <StatCard label={t('repartidores.stat.active')} value={activos} color="#15803d" />
              <StatCard label={t('repartidores.stat.inactive')} value={repartidores.length - activos} color="#64748b" />
              <StatCard label={t('repartidores.stat.avgRate')} value={`${avgTasa}%`} color={avgTasa>=80?'#16a34a':avgTasa>=60?'#d97706':'#dc2626'} />
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder={t('repartidores.search')} value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FilterPill active={zonaFilter==='todas'} onClick={()=>setZonaFilter('todas')}>{t('common.allZones')}</FilterPill>
            {zonas.map(z => <FilterPill key={z.id} active={zonaFilter===z.id} onClick={()=>setZonaFilter(z.id)} color={z.color}>{tZona(z.nombre)}</FilterPill>)}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3.5 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500">{loading ? '…' : `${filtered.length} ${filtered.length!==1?t('repartidores.count.many'):t('repartidores.count.one')}`}</p>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[t('repartidores.col.courier'),t('repartidores.col.zone'),t('repartidores.col.vehicle'),t('repartidores.col.status'),t('repartidores.col.totalOrders'),t('repartidores.col.delivered'),t('repartidores.col.rate'),''].map(h=>(
                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({length:6}).map((_,i)=>(
                  <tr key={i} className="border-b border-slate-50">{Array.from({length:8}).map((_,j)=><td key={j} className="px-6 py-3.5"><Skeleton className="h-4 w-20" /></td>)}</tr>
                )) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <p className="text-slate-400 text-sm">{t('repartidores.empty')}</p>
                      <p className="text-slate-300 text-xs mt-1">{t('common.tryOtherFilters')}</p>
                    </td>
                  </tr>
                ) : filtered.map((r, i) => {
                  const tasaColor = r.tasa_entrega>=80?'#16a34a':r.tasa_entrega>=60?'#d97706':'#dc2626'
                  return (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer anim-card" style={{animationDelay:`${i*40}ms`}} onClick={()=>setSelected(r)}>
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-slate-800">{r.nombre} {r.apellido}</p>
                        <p className="text-xs text-slate-400 mt-0.5">C.I. {r.ci}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{color:r.zona_color}}>
                          <span className="w-2 h-2 rounded-full" style={{background:r.zona_color}} />{tZona(r.zona_nombre)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-semibold text-slate-700">{VEHICULO_ICON[r.vehiculo_tipo] ?? ''} {r.vehiculo_placa}</p>
                        <p className="text-xs text-slate-400 capitalize">{r.vehiculo_tipo}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${r.activo?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${r.activo?'bg-emerald-500':'bg-rose-400'}`} />{r.activo?t('common.active'):t('common.inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-700 text-center">{r.pedidos_total}</td>
                      <td className="px-6 py-3.5 font-bold text-emerald-700 text-center">{r.pedidos_entregados}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full" style={{width:`${r.tasa_entrega}%`,background:tasaColor}} />
                          </div>
                          <span className="text-xs font-bold w-8" style={{color:tasaColor}}>{r.tasa_entrega}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          onClick={e=>{e.stopPropagation();setSelected(r)}}>{t('common.view')}</button>
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
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-slate-400 text-sm">{t('repartidores.empty')}</p>
                <p className="text-slate-300 text-xs mt-1">{t('common.tryOtherFilters')}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map(r => {
                  const tasaColor = r.tasa_entrega>=80?'#16a34a':r.tasa_entrega>=60?'#d97706':'#dc2626'
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className="w-full text-left px-4 py-3.5 hover:bg-blue-50/30 active:bg-blue-50/50 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{r.nombre} {r.apellido}</p>
                          <p className="text-xs text-slate-400 mt-0.5">C.I. {r.ci}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${r.activo?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${r.activo?'bg-emerald-500':'bg-rose-400'}`} />{r.activo?t('common.active'):t('common.inactive')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{color:r.zona_color}}>
                          <span className="w-2 h-2 rounded-full" style={{background:r.zona_color}} />{tZona(r.zona_nombre)}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {VEHICULO_ICON[r.vehiculo_tipo] ?? ''} {r.vehiculo_placa}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">{t('repartidores.card.orders')}: <strong className="text-slate-800">{r.pedidos_total}</strong></span>
                        <span className="text-slate-500">{t('repartidores.card.delivered')}: <strong className="text-emerald-700">{r.pedidos_entregados}</strong></span>
                        <div className="flex items-center gap-1.5 flex-1 justify-end">
                          <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full" style={{width:`${r.tasa_entrega}%`,background:tasaColor}} />
                          </div>
                          <span className="font-bold" style={{color:tasaColor}}>{r.tasa_entrega}%</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      {selected && (
        <RepartidorDrawer
          rep={selected}
          onClose={() => setSelected(null)}
          onToggleActivo={handleToggleActivo}
          onEdit={() => setShowEditar(true)}
        />
      )}

      {showEditar && selected && (
        <EditarRepartidorModal
          rep={selected}
          onClose={() => setShowEditar(false)}
          onSuccess={handleEditarRepartidor}
        />
      )}

      {showNuevo && (
        <NuevoRepartidorModal onClose={() => setShowNuevo(false)} onSuccess={handleNuevoRepartidor} />
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

import { useEffect, useState } from 'react'
import { fetchZonas, createZona, type ZonaDetalle, type NewZonaInput } from '../lib/zonas'
import { useAuth } from '../contexts/AuthContext'
import { isReadOnly } from '../lib/permissions'
import { useT } from '../contexts/LanguageContext'
import BuiltBy, { BuiltByMobile } from '../components/BuiltBy'

const fmtBs = (n: number) => `Bs. ${new Intl.NumberFormat('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)}`

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-200 rounded-xl animate-pulse ${className}`} />
}

function ZonaCard({ zona, delay }: { zona: ZonaDetalle; delay: number }) {
  const { t, tZona } = useT()
  const pctEnt = zona.total_pedidos > 0
    ? Math.round((zona.pedidos_entregados / zona.total_pedidos) * 100)
    : 0

  return (
    <div
      className="anim-card bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Color header */}
      <div className="h-2" style={{ background: zona.color }} />

      <div className="p-6 space-y-5">
        {/* Title row */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>{tZona(zona.nombre)}</h2>
            {zona.descripcion && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{zona.descripcion}</p>}
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${zona.color}20` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={zona.color} strokeWidth={1.5} className="w-5 h-5">
              <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/>
            </svg>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCell label={t('zonas.clients')} value={zona.total_clientes} color={zona.color} icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          } />
          <MetricCell label={t('zonas.orders')} value={zona.total_pedidos} color={zona.color} icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
          } />
          <MetricCell label={t('zonas.couriers')} value={zona.repartidores_activos} color={zona.color} icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg>
          } />
          <MetricCell label={t('zonas.revenue')} value={fmtBs(zona.ingresos_total)} color={zona.color} small icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          } />
        </div>

        {/* Progress pedidos */}
        {zona.total_pedidos > 0 && (
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
              <span>{t('zonas.deliveredOrders')}</span>
              <span style={{ color: zona.color }}>{zona.pedidos_entregados} / {zona.total_pedidos} ({pctEnt}%)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full rounded-full anim-bar" style={{ width: `${pctEnt}%`, background: zona.color }} />
            </div>
          </div>
        )}

        {/* Supervisor */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: zona.color }}>
            {zona.supervisor_nombre ? zona.supervisor_nombre.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '—'}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">{zona.supervisor_nombre ?? t('zonas.noSupervisor')}</p>
            <p className="text-[10px] text-slate-400">{t('zonas.supervisor')}</p>
          </div>
          <span className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${zona.activa ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${zona.activa ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {zona.activa ? t('zonas.active') : t('zonas.inactive')}
          </span>
        </div>
      </div>
    </div>
  )
}

function MetricCell({ label, value, color, icon, small }: { label: string; value: string|number; color: string; icon: React.ReactNode; small?: boolean }) {
  return (
    <div className="rounded-xl px-3 py-3" style={{ background: `${color}10` }}>
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`font-extrabold ${small ? 'text-base' : 'text-2xl'}`} style={{ color: '#0f172a' }}>{value}</p>
    </div>
  )
}

// ─── Nueva Zona Modal ─────────────────────────────────────────────────────────

const INP = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all'
const LBL = 'block text-xs font-semibold text-slate-500 mb-1'
const Spinner = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

const COLORES = ['#2563eb', '#7c3aed', '#059669', '#0891b2', '#ea580c', '#dc2626', '#d97706', '#db2777']

function NuevaZonaModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: (z: ZonaDetalle) => void
}) {
  const { t } = useT()
  const [form, setForm]     = useState<NewZonaInput>({ nombre: '', color: COLORES[0], descripcion: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!form.nombre.trim()) { setErr(t('zonas.reqError')); return }
    setErr(null); setSaving(true)
    try {
      const zona = await createZona({ ...form, nombre: form.nombre.trim() })
      onSuccess(zona)
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">{t('zonas.modalEyebrow')}</p>
            <h2 className="text-lg font-extrabold text-slate-900">{t('zonas.new')}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className={LBL}>{t('zonas.fieldName')}</label>
            <input type="text" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              placeholder={t('zonas.namePlaceholder')} className={INP} />
          </div>
          <div>
            <label className={LBL}>{t('zonas.fieldDescription')}</label>
            <textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} rows={2}
              placeholder={t('zonas.descPlaceholder')} className={`${INP} resize-none`} />
          </div>
          <div>
            <label className={LBL}>{t('zonas.fieldColor')}</label>
            <div className="flex flex-wrap items-center gap-2">
              {COLORES.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                  className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                  style={{ background: c }} aria-label={t('zonas.colorAria').replace('{color}', c)} />
              ))}
              <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer bg-white p-0.5" aria-label={t('zonas.customColorAria')} />
            </div>
          </div>
        </div>
        {err && <p className="mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            {t('common.cancel')}
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#1e40af' }}>
            {saving && <Spinner />}
            {saving ? t('common.saving') : t('zonas.create')}
          </button>
        </div>
      </div>
    </>
  )
}

export default function Zonas() {
  const [zonas, setZonas]     = useState<ZonaDetalle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [showNuevo, setShowNuevo] = useState(false)
  const [toast, setToast]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const { profile } = useAuth()
  const { t, lang, tZona } = useT()
  const readOnly = isReadOnly(profile?.rol)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500)
  }

  const handleNuevaZona = (z: ZonaDetalle) => {
    setZonas(prev => [...prev, z].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    showToast('success', t('zonas.toastCreated').replace('{name}', tZona(z.nombre)))
    setShowNuevo(false)
  }

  useEffect(() => {
    fetchZonas()
      .then(d => { setZonas(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const hoy = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <header className="sticky top-14 lg:top-0 z-10 bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>{t('zonas.title')}</h1>
          <p className="hidden md:block text-xs text-slate-400 capitalize mt-0.5">{hoy}</p>
          <BuiltByMobile />
        </div>
        <div className="flex items-center gap-4 lg:mr-24">
          <BuiltBy />
          <span className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
            {loading ? '…' : t('zonas.count').replace('{n}', String(zonas.length))}
          </span>
          {!readOnly && (
            <button onClick={() => setShowNuevo(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#1e40af' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
              {t('zonas.new')}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
        {error && <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {zonas.map((z, i) => <ZonaCard key={z.id} zona={z} delay={i * 80} />)}
          </div>
        )}
      </main>

      {showNuevo && (
        <NuevaZonaModal onClose={() => setShowNuevo(false)} onSuccess={handleNuevaZona} />
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

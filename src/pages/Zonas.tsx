import { useEffect, useState } from 'react'
import { fetchZonas, type ZonaDetalle } from '../lib/zonas'

const fmtBs = (n: number) => `Bs. ${new Intl.NumberFormat('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)}`

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-200 rounded-xl animate-pulse ${className}`} />
}

function ZonaCard({ zona, delay }: { zona: ZonaDetalle; delay: number }) {
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
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>{zona.nombre}</h2>
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
          <MetricCell label="Clientes" value={zona.total_clientes} color={zona.color} icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          } />
          <MetricCell label="Pedidos" value={zona.total_pedidos} color={zona.color} icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
          } />
          <MetricCell label="Repartidores" value={zona.repartidores_activos} color={zona.color} icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg>
          } />
          <MetricCell label="Ingresos" value={fmtBs(zona.ingresos_total)} color={zona.color} small icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          } />
        </div>

        {/* Progress pedidos */}
        {zona.total_pedidos > 0 && (
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
              <span>Pedidos entregados</span>
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
            <p className="text-xs font-semibold text-slate-700">{zona.supervisor_nombre ?? 'Sin supervisor'}</p>
            <p className="text-[10px] text-slate-400">Supervisor de zona</p>
          </div>
          <span className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${zona.activa ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${zona.activa ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {zona.activa ? 'Activa' : 'Inactiva'}
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

export default function Zonas() {
  const [zonas, setZonas]     = useState<ZonaDetalle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetchZonas()
      .then(d => { setZonas(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const hoy = new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <header className="sticky top-14 lg:top-0 z-10 bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>Zonas</h1>
          <p className="text-xs text-slate-400 capitalize mt-0.5">{hoy}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
            {loading ? '…' : `${zonas.length} zonas`}
          </span>
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
    </>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  fetchDashboardRaw,
  computeEstadoBreakdown,
  computeZonaData,
  computeKPIs,
  type DashboardRaw,
  type EstadoPedido,
  type EstadoItem,
  type ZonaItem,
} from '../lib/dashboard'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBs = (n: number) =>
  new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

const fmtFecha = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-BO', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0)
  const raf = useRef<number>()
  useEffect(() => {
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const e = 1 - Math.pow(1 - p, 4)
      setVal(Math.round(e * target))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration])
  return val
}

// ─── Estado config ────────────────────────────────────────────────────────────

const ESTADO: Record<EstadoPedido, { label: string; dot: string; pill: string }> = {
  entregado:  { label: 'Entregado',  dot: '#16a34a', pill: 'bg-emerald-50 text-emerald-700' },
  fallido:    { label: 'Fallido',    dot: '#dc2626', pill: 'bg-rose-50 text-rose-700'       },
  cancelado:  { label: 'Cancelado',  dot: '#94a3b8', pill: 'bg-slate-100 text-slate-600'    },
  en_ruta:    { label: 'En ruta',    dot: '#2563eb', pill: 'bg-blue-50 text-blue-700'       },
  confirmado: { label: 'Confirmado', dot: '#d97706', pill: 'bg-amber-50 text-amber-700'     },
  pendiente:  { label: 'Pendiente',  dot: '#cbd5e1', pill: 'bg-slate-50 text-slate-500'     },
}

const ESTADO_BAR: Record<EstadoPedido, string> = {
  entregado: '#16a34a', fallido: '#dc2626', cancelado: '#94a3b8',
  en_ruta: '#2563eb', confirmado: '#d97706', pendiente: '#e2e8f0',
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-200 rounded-xl animate-pulse ${className}`} />
}

// ─── EstadoBadge ──────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const cfg = ESTADO[estado] ?? ESTADO.pendiente
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.pill}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string; value: number; prefix?: string; suffix?: string
  icon: React.ReactNode; accentColor: string; delay?: number; isFloat?: boolean
}

function KPICard({ label, value, prefix, suffix, icon, accentColor, delay = 0, isFloat }: KPICardProps) {
  const animated = useCountUp(isFloat ? Math.round(value) : value)
  return (
    <div
      className="anim-card bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: accentColor }} />
      <div className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center opacity-10"
        style={{ background: accentColor }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center absolute top-4 right-4"
        style={{ color: accentColor }} >{icon}</div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900 leading-none anim-num" style={{ animationDelay: `${delay + 80}ms` }}>
        {prefix && <span className="text-lg text-slate-400 mr-0.5">{prefix}</span>}
        {isFloat ? fmtBs(animated) : animated.toLocaleString('es-BO')}
        {suffix && <span className="text-lg text-slate-400 ml-0.5">{suffix}</span>}
      </p>
    </div>
  )
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, color, onRemove }: { label: string; color: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold text-white"
      style={{ background: color }}>
      {label}
      <button
        onClick={onRemove}
        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/25 transition-colors flex-shrink-0"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </span>
  )
}

// ─── Estado Breakdown (clickable) ─────────────────────────────────────────────

function EstadoBreakdown({
  data, selectedEstado, onEstadoClick,
}: {
  data: EstadoItem[]
  selectedEstado: EstadoPedido | null
  onEstadoClick: (e: EstadoPedido) => void
}) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return <p className="text-sm text-slate-400 text-center py-8">Sin datos para el filtro actual</p>

  return (
    <div className="space-y-4">
      {/* Stacked bar — cada segmento clickable */}
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {data.map(d => {
          const isSelected = selectedEstado === d.estado
          const isDimmed   = selectedEstado !== null && !isSelected
          return (
            <div
              key={d.estado}
              title={`${ESTADO[d.estado]?.label}: ${d.count}`}
              className="h-full cursor-pointer transition-all duration-200 first:rounded-l-full last:rounded-r-full"
              style={{
                width:         `${(d.count / total) * 100}%`,
                background:    ESTADO_BAR[d.estado] ?? '#e2e8f0',
                opacity:       isDimmed ? 0.28 : 1,
                outline:       isSelected ? `2.5px solid ${ESTADO_BAR[d.estado]}` : 'none',
                outlineOffset: isSelected ? '2px' : '0',
              }}
              onClick={() => onEstadoClick(d.estado)}
            />
          )
        })}
      </div>

      {/* Legend rows — también clickables */}
      <div className="space-y-1">
        {data.map((d, i) => {
          const cfg        = ESTADO[d.estado] ?? ESTADO.pendiente
          const isSelected = selectedEstado === d.estado
          const isDimmed   = selectedEstado !== null && !isSelected
          return (
            <div
              key={d.estado}
              className="anim-card flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer transition-all duration-200 select-none"
              style={{
                animationDelay: `${200 + i * 60}ms`,
                opacity:        isDimmed ? 0.3 : 1,
                background:     isSelected ? `${cfg.dot}14` : 'transparent',
                borderLeft:     isSelected ? `3px solid ${cfg.dot}` : '3px solid transparent',
              }}
              onClick={() => onEstadoClick(d.estado)}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                <span className="text-sm text-slate-700 font-medium">{cfg.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full anim-bar"
                    style={{ width: `${d.pct}%`, background: cfg.dot, animationDelay: `${300 + i * 80}ms` }} />
                </div>
                <span className="text-xs font-semibold text-slate-500 w-7 text-right">{d.pct}%</span>
                <span className="text-sm font-bold text-slate-800 w-8 text-right">{d.count}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Zonas Bar Chart (clickable) ──────────────────────────────────────────────

const CustomTooltipZona = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg font-data">
      <p className="font-semibold">{payload[0]?.payload?.zona}</p>
      <p className="text-slate-300">{payload[0]?.value} pedidos</p>
    </div>
  )
}

function ZonasChart({
  data, selectedZona, onZonaClick,
}: {
  data: ZonaItem[]
  selectedZona: string | null
  onZonaClick: (id: string) => void
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="zona"
          tick={{ fontSize: 11, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fill: '#64748b', fontWeight: 600 }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fill: '#94a3b8' }}
          axisLine={false} tickLine={false}
        />
        <Tooltip content={<CustomTooltipZona />} cursor={{ fill: '#f8fafc' }} />
        <Bar
          dataKey="pedidos"
          radius={[6, 6, 0, 0]}
          isAnimationActive
          animationDuration={900}
          cursor="pointer"
          onClick={(payload: ZonaItem) => onZonaClick(payload.zona_id)}
        >
          {data.map(entry => {
            const isSelected = selectedZona === entry.zona_id
            const isDimmed   = selectedZona !== null && !isSelected
            return (
              <Cell
                key={entry.zona_id}
                fill={entry.color}
                opacity={isDimmed ? 0.28 : 1}
                stroke={isSelected ? '#1e293b' : 'transparent'}
                strokeWidth={isSelected ? 2 : 0}
              />
            )
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [raw, setRaw]                       = useState<DashboardRaw | null>(null)
  const [error, setError]                   = useState<string | null>(null)
  const [selectedZona, setSelectedZona]     = useState<string | null>(null)
  const [selectedEstado, setSelectedEstado] = useState<EstadoPedido | null>(null)

  useEffect(() => {
    fetchDashboardRaw()
      .then(setRaw)
      .catch(e => setError(e.message ?? 'Error al cargar datos'))
  }, [])

  const hasFilter = selectedZona !== null || selectedEstado !== null
  const clearFilters = () => { setSelectedZona(null); setSelectedEstado(null) }

  const handleZonaClick  = (id: string)     => setSelectedZona(prev => prev === id ? null : id)
  const handleEstadoClick = (e: EstadoPedido) => setSelectedEstado(prev => prev === e ? null : e)

  // ── Cross-filter derivations ────────────────────────────────────────────────

  // Fully filtered: KPIs + table
  const filtered = useMemo(() => {
    if (!raw) return []
    return raw.pedidos.filter(p =>
      (!selectedZona  || p.zona_id === selectedZona) &&
      (!selectedEstado || p.estado  === selectedEstado)
    )
  }, [raw, selectedZona, selectedEstado])

  // Estado breakdown filtered by zona only → shows estado distribution within zona
  const estadoBreakdownData = useMemo(() => {
    if (!raw) return []
    const base = selectedZona ? raw.pedidos.filter(p => p.zona_id === selectedZona) : raw.pedidos
    return computeEstadoBreakdown(base)
  }, [raw, selectedZona])

  // Zona chart filtered by estado only → shows which zones have selected estado
  const zonaChartData = useMemo(() => {
    if (!raw) return []
    const base = selectedEstado ? raw.pedidos.filter(p => p.estado === selectedEstado) : raw.pedidos
    return computeZonaData(base, raw.zonas)
  }, [raw, selectedEstado])

  const kpis = useMemo(() => computeKPIs(filtered), [filtered])

  const ultimosPedidos = useMemo(() => filtered.slice(0, 10), [filtered])

  const selectedZonaMeta = raw?.zonas.find(z => z.id === selectedZona)

  const hoy = new Date().toLocaleDateString('es-BO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-extrabold tracking-tight"
              style={{ fontFamily: 'var(--font-jakarta)', color: 'var(--rd-navy)' }}
            >
              Dashboard
            </h1>
            <p className="text-xs text-slate-400 capitalize mt-0.5">{hoy}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Conectado
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700">Admin</span>
          </div>
        </div>

        {/* Active filter chips */}
        {hasFilter && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-400">Filtros activos:</span>
            {selectedZonaMeta && (
              <FilterChip
                label={selectedZonaMeta.nombre}
                color={selectedZonaMeta.color}
                onRemove={() => setSelectedZona(null)}
              />
            )}
            {selectedEstado && (
              <FilterChip
                label={ESTADO[selectedEstado].label}
                color={ESTADO_BAR[selectedEstado]}
                onRemove={() => setSelectedEstado(null)}
              />
            )}
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors underline underline-offset-2 ml-1"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 px-8 py-6 space-y-6 max-w-7xl w-full mx-auto">

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* ── KPI Row ── */}
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {!raw ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          ) : (
            <>
              <KPICard
                label="Total pedidos" value={kpis.totalPedidos}
                accentColor="var(--rd-blue)" delay={0}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                </svg>}
              />
              <KPICard
                label="Pedidos entregados" value={kpis.totalEntregados}
                accentColor="var(--rd-blue)" delay={80}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <polyline points="9 11 12 14 22 4"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>}
              />
              <KPICard
                label="Ingresos totales" value={kpis.ingresosTotal}
                prefix="Bs." accentColor="var(--rd-green)" delay={160} isFloat
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>}
              />
              <KPICard
                label="Tasa de entrega" value={kpis.tasaEntrega}
                suffix="%" accentColor="var(--rd-green)" delay={240}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>}
              />
            </>
          )}
        </section>

        {/* ── Charts Row ── */}
        <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Estado breakdown — 3/5 */}
          <div
            className="anim-card xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
            style={{ animationDelay: '320ms' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-800 tracking-tight">Pedidos por estado</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedZona ? `Zona: ${selectedZonaMeta?.nombre}` : 'Distribución acumulada'}
                  {' · '}
                  <span className="text-slate-500 font-medium">Clic para filtrar</span>
                </p>
              </div>
              {raw && (
                <span className="text-xs font-semibold text-slate-400">
                  Total: <strong className="text-slate-700">
                    {estadoBreakdownData.reduce((s, d) => s + d.count, 0)}
                  </strong>
                </span>
              )}
            </div>
            {!raw
              ? <div className="space-y-3">
                  <Skeleton className="h-3" />
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
                </div>
              : <EstadoBreakdown
                  data={estadoBreakdownData}
                  selectedEstado={selectedEstado}
                  onEstadoClick={handleEstadoClick}
                />
            }
          </div>

          {/* Zona chart — 2/5 */}
          <div
            className="anim-card xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
            style={{ animationDelay: '400ms' }}
          >
            <div className="mb-5">
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Pedidos por zona</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedEstado ? `Estado: ${ESTADO[selectedEstado].label}` : 'Santa Cruz de la Sierra'}
                {' · '}
                <span className="text-slate-500 font-medium">Clic para filtrar</span>
              </p>
            </div>
            {!raw
              ? <Skeleton className="h-52" />
              : <ZonasChart
                  data={zonaChartData}
                  selectedZona={selectedZona}
                  onZonaClick={handleZonaClick}
                />
            }
          </div>
        </section>

        {/* ── Últimos pedidos ── */}
        <section
          className="anim-card bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          style={{ animationDelay: '480ms' }}
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                {hasFilter ? `Pedidos filtrados (${ultimosPedidos.length} de ${filtered.length})` : 'Últimos 10 pedidos'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasFilter ? 'Resultado del filtro activo' : 'Ordenados por fecha de pedido'}
              </p>
            </div>
            <Link to="/pedidos" className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Ver todos →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Código', 'Cliente', 'Zona', 'Estado', 'Total', 'Fecha'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!raw
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-6 py-3.5"><Skeleton className="h-4 w-24" /></td>
                        ))}
                      </tr>
                    ))
                  : ultimosPedidos.length === 0
                    ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <p className="text-slate-400 text-sm">Sin pedidos para el filtro actual</p>
                          <button onClick={clearFilters}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 mt-2 underline">
                            Limpiar filtros
                          </button>
                        </td>
                      </tr>
                    )
                  : ultimosPedidos.map((p, i) => (
                      <tr
                        key={p.id}
                        className="border-b border-slate-50 hover:bg-blue-50/40 transition-colors anim-card"
                        style={{ animationDelay: `${500 + i * 40}ms` }}
                      >
                        <td className="px-6 py-3.5">
                          <span className="font-data text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            {p.codigo}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-800 max-w-48 truncate">
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
                        <td className="px-6 py-3.5">
                          <span className="text-sm font-semibold text-slate-800">Bs. {fmtBs(p.total)}</span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-400">
                          {fmtFecha(p.fecha_pedido)}
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </section>

        <footer className="text-center py-4">
          <p className="text-xs text-slate-400">RapiDash CRM · Distribución Farmacéutica · Santa Cruz, Bolivia</p>
        </footer>
      </main>
    </>
  )
}

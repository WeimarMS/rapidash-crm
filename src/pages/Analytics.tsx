import { useEffect, useMemo, useState, lazy, Suspense, useCallback } from 'react'
import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LabelList,
} from 'recharts'
import {
  fetchAnalyticsRaw,
  computePorMes,
  computeTopProductosByIngresos,
  computePorZona,
  computePorEstado,
  computeRepartidorPerf,
  getMonthRange,
  type AnalyticsRaw,
  type TopItem,
  type ZonaComp,
  type EstadoData,
} from '../lib/analytics'
import { fetchClientesMapData, type ClienteMapData } from '../lib/mapa'
import BuiltBy, { BuiltByMobile } from '../components/BuiltBy'
import { useT } from '../contexts/LanguageContext'

const ClientesMapa = lazy(() => import('../components/ClientesMapa'))

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif"
const fmtBs  = (n: number) => `Bs. ${new Intl.NumberFormat('es-BO', { minimumFractionDigits: 0 }).format(Math.round(n))}`
const fmtNum = (n: number) => n.toLocaleString('es-BO')
const fmtPct = (n: number) => `${n}%`

const ESTADOS_FILTRO = ['pendiente','confirmado','en_ruta','entregado','fallido','cancelado']
const CATEGORIAS     = ['analgesico','antibiotico','vitamina','insumo','vacuna']

const PROD_COLORS = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#818cf8','#4f46e5','#7c3aed','#9333ea']
const ZONA_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6']

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconTrendUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
)
const IconPackage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconReceipt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconFilter = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)

// ─── Axis / Grid shared ───────────────────────────────────────────────────────

const axisStyle  = { fontSize: 11, fontFamily: FONT, fill: '#94a3b8' }
const gridProps  = { strokeDasharray: '3 3', stroke: '#f1f5f9', vertical: false } as const

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skel({ h = 220 }: { h?: number }) {
  return <div className="bg-slate-100 rounded-xl animate-pulse" style={{ height: h }} />
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white text-xs px-3 py-2.5 rounded-xl shadow-2xl space-y-1.5 border border-slate-700">
      {label && <p className="font-bold text-slate-300 mb-1 text-[11px] uppercase tracking-wide">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color ?? p.fill ?? '#fff' }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold text-white">
            {p.name?.includes('Ingreso') || p.name?.includes('Bs')
              ? fmtBs(p.value)
              : p.name?.includes('Tasa') || p.name?.includes('%')
              ? fmtPct(p.value)
              : fmtNum(p.value)}
          </span>
        </p>
      ))}
    </div>
  )
}

// ─── ChartCard ────────────────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children, loading, height = 240, className = '' }: {
  title: string; subtitle?: string; children: React.ReactNode
  loading: boolean; height?: number; className?: string
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className}`}>
      <div className="mb-5">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {loading ? <Skel h={height} /> : children}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear?: () => void }) {
  const { t } = useT()
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <p className="text-sm text-slate-400">{t('analytics.empty')}</p>
      {onClear && (
        <button onClick={onClear} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline">
          {t('analytics.empty.clear')}
        </button>
      )}
    </div>
  )
}

// ─── FilterSelect ─────────────────────────────────────────────────────────────

function FilterSelect({ label, value, options, onChange }: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="relative w-full sm:w-auto">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`
          appearance-none w-full sm:w-auto pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-indigo-300
          ${value
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}
        `}
      >
        <option value="">{label}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${value ? 'text-white/70' : 'text-slate-400'}`}>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z"/>
        </svg>
      </span>
    </div>
  )
}

// ─── ActiveChip ───────────────────────────────────────────────────────────────

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
      {label}
      <button onClick={onRemove} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-indigo-200 transition-colors">
        <IconX />
      </button>
    </span>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, subvalue, icon, accent, delta, deltaLabel, loading }: {
  label: string; value: string; subvalue?: string
  icon: React.ReactNode; accent: string
  delta?: number; deltaLabel?: string; loading?: boolean
}) {
  const positive = (delta ?? 0) >= 0
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}18`, color: accent }}>
          {icon}
        </span>
      </div>
      {loading ? (
        <Skel h={40} />
      ) : (
        <>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 leading-tight">{value}</p>
            {subvalue && <p className="text-xs text-slate-400 mt-0.5">{subvalue}</p>}
          </div>
          {delta !== undefined && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-rose-500'}`}>
              <span>{positive ? '↑' : '↓'} {Math.abs(delta)}%</span>
              {deltaLabel && <span className="text-slate-400 font-normal">{deltaLabel}</span>}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Date Range Slider ────────────────────────────────────────────────────────

function DateRangeSlider({ months, startIdx, endIdx, onChange }: {
  months: string[]
  startIdx: number
  endIdx: number
  onChange: (start: number, end: number) => void
}) {
  const { t } = useT()
  const n = months.length
  if (n < 2) return null

  const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const fmt = (key: string) => {
    const [y, m] = key.split('-')
    return `${MESES_ES[parseInt(m) - 1]} ${y}`
  }

  const pct = (i: number) => `${(i / (n - 1)) * 100}%`

  return (
    <div className="flex items-center gap-4 min-w-0">
      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:block">{t('analytics.period')}</span>
      <div className="flex items-center gap-3 flex-1 min-w-[200px]">
        <span className="text-xs font-bold text-indigo-600 whitespace-nowrap">{fmt(months[startIdx])}</span>
        <div className="relative flex-1 h-5 flex items-center">
          {/* Track */}
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-slate-200" />
          {/* Active track */}
          <div
            className="absolute h-1.5 rounded-full bg-indigo-500"
            style={{ left: pct(startIdx), right: `${100 - (endIdx / (n - 1)) * 100}%` }}
          />
          {/* Start handle */}
          <input
            type="range" min={0} max={n - 1} value={startIdx}
            onChange={e => {
              const v = parseInt(e.target.value)
              if (v <= endIdx) onChange(v, endIdx)
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-5"
            style={{ zIndex: startIdx === endIdx ? 5 : undefined }}
          />
          {/* End handle */}
          <input
            type="range" min={0} max={n - 1} value={endIdx}
            onChange={e => {
              const v = parseInt(e.target.value)
              if (v >= startIdx) onChange(startIdx, v)
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-5"
          />
          {/* Thumb markers */}
          <div className="absolute w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow pointer-events-none -translate-x-1/2"
            style={{ left: pct(startIdx) }} />
          <div className="absolute w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow pointer-events-none -translate-x-1/2"
            style={{ left: pct(endIdx) }} />
        </div>
        <span className="text-xs font-bold text-indigo-600 whitespace-nowrap">{fmt(months[endIdx])}</span>
      </div>
    </div>
  )
}

// ─── Custom label for donut segments ─────────────────────────────────────────

const RADIAN = Math.PI / 180
const DonutLabel = ({ cx, cy, midAngle, outerRadius, value, percent, fill }: any) => {
  if (!value) return null
  const r = outerRadius + 16
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x} y={y}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={10} fontWeight={700} fontFamily={FONT} fill={fill}
    >
      {fmtNum(value)} · {Math.round(percent * 100)}%
    </text>
  )
}

// ─── Custom label for line chart points ───────────────────────────────────────

const LineLabel = ({ x, y, value, fill }: any) => {
  if (value === undefined || value === null) return null
  return (
    <text x={x} y={y - 8} textAnchor="middle" fill={fill ?? '#6366f1'} fontSize={10} fontWeight={700} fontFamily={FONT}>
      {typeof value === 'number' && value > 999 ? `${(value/1000).toFixed(1)}k` : value}
    </text>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Analytics() {
  const { t, tZona } = useT()
  // computePorEstado (lib) devuelve la etiqueta en español; la mapeamos a la clave
  // del núcleo para traducirla en la leyenda del donut.
  const estadoLabel = useCallback((label: string): string => {
    const keyByEs: Record<string, string> = {
      'Pendiente': 'pendiente', 'Confirmado': 'confirmado', 'En ruta': 'en_ruta',
      'Entregado': 'entregado', 'Fallido': 'fallido', 'Cancelado': 'cancelado',
    }
    const k = keyByEs[label]
    return k ? t('estado.' + k) : label
  }, [t])
  const [raw, setRaw]           = useState<AnalyticsRaw | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [mapaClientes, setMapaClientes] = useState<ClienteMapData[]>([])
  const [mapaLoading, setMapaLoading]   = useState(true)

  // ── Dropdown filters ───────────────────────────────────────────────────────
  const [fZona,        setFZona]        = useState('')
  const [fCategoria,   setFCategoria]   = useState('')
  const [fRepartidor,  setFRepartidor]  = useState('')
  const [fEstado,      setFEstado]      = useState('')

  // ── Date range slider ──────────────────────────────────────────────────────
  const [dateStart, setDateStart] = useState(0)
  const [dateEnd,   setDateEnd]   = useState(0)

  useEffect(() => {
    fetchAnalyticsRaw()
      .then(d => {
        setRaw(d)
        const months = getMonthRange(d.pedidos)
        if (months.length > 0) {
          setDateStart(0)
          setDateEnd(months.length - 1)
        }
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })

    fetchClientesMapData()
      .then(d => { setMapaClientes(d); setMapaLoading(false) })
      .catch(() => setMapaLoading(false))
  }, [])

  const monthKeys = useMemo(() => raw ? getMonthRange(raw.pedidos) : [], [raw])

  const clearFilters = useCallback(() => {
    setFZona(''); setFCategoria(''); setFRepartidor(''); setFEstado('')
    if (monthKeys.length > 0) { setDateStart(0); setDateEnd(monthKeys.length - 1) }
  }, [monthKeys])

  const hasFilter = fZona !== '' || fCategoria !== '' || fRepartidor !== '' || fEstado !== ''
    || (monthKeys.length > 1 && (dateStart > 0 || dateEnd < monthKeys.length - 1))

  // ── Zona lookup ─────────────────────────────────────────────────────────────
  const zonaLookup = useMemo(() =>
    Object.fromEntries((raw?.zonas ?? []).map(z => [z.id, z.nombre])),
    [raw])

  // ── Items filtered by category ─────────────────────────────────────────────
  const itemsByCategory = useMemo(() => {
    if (!raw || !fCategoria) return null
    return new Set(
      raw.items
        .filter(i => i.producto_categoria === fCategoria)
        .map(i => i.pedido_id)
    )
  }, [raw, fCategoria])

  // ── Active month keys in range ─────────────────────────────────────────────
  const activeMonthKeys = useMemo(() => {
    if (!monthKeys.length) return new Set<string>()
    return new Set(monthKeys.slice(dateStart, dateEnd + 1))
  }, [monthKeys, dateStart, dateEnd])

  // ── Main filtered pedidos ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!raw) return []
    return raw.pedidos.filter(p =>
      (!fZona          || p.zona_id === fZona) &&
      (!fRepartidor    || p.repartidor_id === fRepartidor) &&
      (!fEstado        || p.estado === fEstado) &&
      (!itemsByCategory || itemsByCategory.has(p.id)) &&
      (activeMonthKeys.size === 0 || activeMonthKeys.has(p.mes_key))
    )
  }, [raw, fZona, fRepartidor, fEstado, itemsByCategory, activeMonthKeys])

  // ── Items for filtered pedidos ─────────────────────────────────────────────
  const filteredPedidoIds = useMemo(() => new Set(filtered.map(p => p.id)), [filtered])
  const filteredItems = useMemo(() => {
    if (!raw) return []
    return raw.items.filter(i => filteredPedidoIds.has(i.pedido_id))
  }, [raw, filteredPedidoIds])

  // ── Chart data ─────────────────────────────────────────────────────────────
  const porMesData        = useMemo(() => computePorMes(filtered),                              [filtered])
  const porZonaData       = useMemo(() => computePorZona(filtered, raw?.zonas ?? []),           [filtered, raw])
  const porZonaDataI18n   = useMemo(() => porZonaData.map(z => ({ ...z, nombre: tZona(z.nombre) })), [porZonaData, tZona])
  const porEstadoData     = useMemo(() => computePorEstado(filtered),                           [filtered])
  const topProdData       = useMemo(() => computeTopProductosByIngresos(filteredItems, null),   [filteredItems])
  const repartidorData    = useMemo(() => computeRepartidorPerf(filtered),                      [filtered])

  // ── KPI calculations ───────────────────────────────────────────────────────
  const kpiIngresos     = useMemo(() => filtered.filter(p => p.estado === 'entregado').reduce((s, p) => s + p.total, 0), [filtered])
  const kpiPedidos      = filtered.length
  const kpiEntregados   = useMemo(() => filtered.filter(p => p.estado === 'entregado').length, [filtered])
  const kpiTasaEntrega  = kpiPedidos > 0 ? Math.round((kpiEntregados / kpiPedidos) * 100) : 0
  const kpiTicketProm   = kpiEntregados > 0 ? kpiIngresos / kpiEntregados : 0
  const kpiFallidos     = useMemo(() => filtered.filter(p => p.estado === 'fallido').length, [filtered])
  const kpiEstrella     = useMemo(() => {
    if (!repartidorData.length) return '—'
    return repartidorData[0].nombre.split(' ')[0]
  }, [repartidorData])

  // Delta vs prev half: compare last half of months vs first half
  const kpiDelta = useMemo(() => {
    if (porMesData.length < 2) return null
    const mid   = Math.floor(porMesData.length / 2)
    const prev  = porMesData.slice(0, mid).reduce((s, m) => s + m.ingresos, 0)
    const curr  = porMesData.slice(mid).reduce((s, m) => s + m.ingresos, 0)
    if (prev === 0) return null
    return Math.round(((curr - prev) / prev) * 100)
  }, [porMesData])

  // ── Filter options from data ───────────────────────────────────────────────
  const zonaOptions = useMemo(() =>
    (raw?.zonas ?? []).map(z => ({ value: z.id, label: tZona(z.nombre) })),
    [raw, tZona])

  const repOptions = useMemo(() =>
    (raw?.repartidores ?? []).map(r => ({ value: r.id, label: r.nombre.split(' ')[0] + ' ' + r.nombre.split(' ')[1] })),
    [raw])

  return (
    <>
      {/* ── Header ── */}
      <header className="sticky top-14 lg:top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 px-4 sm:px-6 py-3">
        <div className="flex flex-col gap-3 max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">{t('analytics.title')}</h1>
              <p className="hidden md:block text-xs text-slate-400 mt-0.5">{t('analytics.subtitle')}</p>
              <BuiltByMobile />
            </div>

            {/* Date range slider: fila completa en móvil, inline en desktop */}
            {!loading && monthKeys.length > 1 && (
              <div className="w-full order-last lg:order-none lg:w-auto lg:flex-1 lg:max-w-lg">
                <DateRangeSlider
                  months={monthKeys}
                  startIdx={dateStart}
                  endIdx={dateEnd}
                  onChange={(s, e) => { setDateStart(s); setDateEnd(e) }}
                />
              </div>
            )}

            <div className="flex items-center gap-4 flex-shrink-0 lg:mr-24">
              <BuiltBy />
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                hasFilter ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {hasFilter ? t('analytics.activeFilter') : t('analytics.ordersCount').replace('{count}', String(kpiPedidos))}
              </span>
            </div>
          </div>

          {/* Filter bar: grid 2 col en móvil, inline en desktop */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 flex-shrink-0 hidden sm:block"><IconFilter /></span>
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-wrap sm:items-center">
              <FilterSelect
                label={t('analytics.filter.zona')} value={fZona}
                options={zonaOptions}
                onChange={setFZona}
              />
              <FilterSelect
                label={t('analytics.filter.categoria')} value={fCategoria}
                options={CATEGORIAS.map(c => ({ value: c, label: t('categoria.' + c) }))}
                onChange={setFCategoria}
              />
              <FilterSelect
                label={t('analytics.filter.repartidor')} value={fRepartidor}
                options={repOptions}
                onChange={setFRepartidor}
              />
              <FilterSelect
                label={t('analytics.filter.estado')} value={fEstado}
                options={ESTADOS_FILTRO.map(e => ({ value: e, label: t('estado.' + e) }))}
                onChange={setFEstado}
              />
            </div>

            {/* Active chips */}
            {fZona && (
              <ActiveChip label={t('analytics.chip.zona').replace('{value}', tZona(zonaLookup[fZona] ?? fZona))} onRemove={() => setFZona('')} />
            )}
            {fCategoria && (
              <ActiveChip label={t('analytics.chip.cat').replace('{value}', t('categoria.' + fCategoria))} onRemove={() => setFCategoria('')} />
            )}
            {fRepartidor && (
              <ActiveChip label={repOptions.find(r => r.value === fRepartidor)?.label ?? fRepartidor} onRemove={() => setFRepartidor('')} />
            )}
            {fEstado && (
              <ActiveChip label={t('estado.' + fEstado)} onRemove={() => setFEstado('')} />
            )}
            {hasFilter && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors ml-1 underline underline-offset-2"
              >
                {t('common.clearAll')}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl w-full mx-auto space-y-5">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            label={t('analytics.kpi.ingresos')} value={fmtBs(kpiIngresos)}
            subvalue={t('analytics.kpi.ingresos.sub')}
            icon={<IconTrendUp />} accent="#6366f1"
            delta={kpiDelta ?? undefined}
            deltaLabel={t('analytics.kpi.ingresos.delta')}
            loading={loading}
          />
          <KpiCard
            label={t('analytics.kpi.pedidos')} value={fmtNum(kpiPedidos)}
            subvalue={t('analytics.kpi.pedidos.sub')}
            icon={<IconPackage />} accent="#3b82f6"
            loading={loading}
          />
          <KpiCard
            label={t('analytics.kpi.tasaEntrega')} value={fmtPct(kpiTasaEntrega)}
            subvalue={t('analytics.kpi.tasaEntrega.sub').replace('{count}', fmtNum(kpiEntregados))}
            icon={<IconCheck />} accent="#22c55e"
            loading={loading}
          />
          <KpiCard
            label={t('analytics.kpi.ticket')} value={fmtBs(kpiTicketProm)}
            subvalue={t('analytics.kpi.ticket.sub')}
            icon={<IconReceipt />} accent="#f59e0b"
            loading={loading}
          />
          <KpiCard
            label={t('analytics.kpi.fallidos')} value={fmtNum(kpiFallidos)}
            subvalue={kpiPedidos > 0 ? t('analytics.kpi.fallidos.sub').replace('{pct}', String(Math.round((kpiFallidos/kpiPedidos)*100))) : '—'}
            icon={<IconAlert />} accent="#ef4444"
            loading={loading}
          />
          <KpiCard
            label={t('analytics.kpi.mejorRepartidor')} value={kpiEstrella}
            subvalue={repartidorData[0] ? t('analytics.kpi.mejorRepartidor.sub').replace('{count}', String(repartidorData[0].entregados)) : '—'}
            icon={<IconStar />} accent="#f59e0b"
            loading={loading}
          />
        </div>

        {/* ── Row 1: Línea combinada + Donut estados ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Gráfico combinado pedidos + ingresos */}
          <ChartCard
            title={t('analytics.chart.evolucion.title')}
            subtitle={t('analytics.chart.evolucion.subtitle')}
            loading={loading}
            height={260}
            className="xl:col-span-2"
          >
            {porMesData.length === 0
              ? <EmptyState onClear={clearFilters} />
              : (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={porMesData} margin={{ top: 24, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="mes" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis
                      yAxisId="pedidos"
                      orientation="left"
                      tick={axisStyle} axisLine={false} tickLine={false}
                    />
                    <YAxis
                      yAxisId="ingresos"
                      orientation="right"
                      tick={axisStyle} axisLine={false} tickLine={false}
                      tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{ fontFamily: FONT, fontSize: 11, paddingTop: 8 }} />
                    <Line
                      yAxisId="pedidos"
                      type="monotone"
                      dataKey="pedidos"
                      name={t('analytics.series.pedidos')}
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive
                    >
                      <LabelList dataKey="pedidos" content={<LineLabel fill="#6366f1" />} />
                    </Line>
                    <Line
                      yAxisId="ingresos"
                      type="monotone"
                      dataKey="ingresos"
                      name={t('analytics.series.ingresos')}
                      stroke="#22c55e"
                      strokeWidth={2.5}
                      strokeDasharray="5 3"
                      dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive
                    >
                      <LabelList dataKey="ingresos" content={<LineLabel fill="#22c55e" />} />
                    </Line>
                  </ComposedChart>
                </ResponsiveContainer>
              )
            }
          </ChartCard>

          {/* Donut de estados */}
          <ChartCard
            title={t('analytics.chart.porEstado.title')}
            subtitle={t('analytics.chart.porEstado.subtitle')}
            loading={loading}
            height={260}
          >
            {porEstadoData.length === 0
              ? <EmptyState onClear={clearFilters} />
              : (
                <div className="flex flex-col items-center gap-3">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={porEstadoData}
                        dataKey="valor"
                        nameKey="estado"
                        cx="50%" cy="50%"
                        innerRadius={40}
                        outerRadius={62}
                        paddingAngle={2}
                        label={<DonutLabel />}
                        labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                        isAnimationActive
                      >
                        {porEstadoData.map((entry: EstadoData, i: number) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<Tip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1.5 w-full px-2">
                    {porEstadoData.map((e: EstadoData) => (
                      <div key={e.estado} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                          <span className="text-slate-600 font-medium">{estadoLabel(e.estado)}</span>
                        </span>
                        <span className="font-bold text-slate-800">
                          {fmtNum(e.valor)}
                          <span className="font-normal text-slate-400 ml-1.5">
                            ({kpiPedidos > 0 ? Math.round((e.valor / kpiPedidos) * 100) : 0}%)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          </ChartCard>
        </div>

        {/* ── Row 2: Performance repartidores + Top productos ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* Performance repartidores */}
          <ChartCard
            title={t('analytics.chart.performance.title')}
            subtitle={t('analytics.chart.performance.subtitle')}
            loading={loading}
            height={260}
          >
            {repartidorData.length === 0
              ? <EmptyState onClear={clearFilters} />
              : (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart
                    data={repartidorData}
                    layout="vertical"
                    margin={{ top: 0, right: 50, left: 0, bottom: 0 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category" dataKey="nombre"
                      tick={{ ...axisStyle, fontSize: 10 }}
                      axisLine={false} tickLine={false} width={80}
                      tickFormatter={n => n.split(' ')[0]}
                    />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{ fontFamily: FONT, fontSize: 11 }} />
                    <Bar dataKey="pedidos"    name={t('analytics.series.total')}      fill="#c7d2fe" radius={[0, 4, 4, 0]} isAnimationActive />
                    <Bar dataKey="entregados" name={t('analytics.series.entregados')} fill="#6366f1" radius={[0, 4, 4, 0]} isAnimationActive>
                      <LabelList
                        dataKey="tasa"
                        position="right"
                        formatter={(v: unknown) => `${v as number}%`}
                        style={{ fontSize: 10, fontFamily: FONT, fill: '#64748b', fontWeight: 700 }}
                      />
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              )
            }
          </ChartCard>

          {/* Top productos por ingresos */}
          <ChartCard
            title={t('analytics.chart.topProductos.title')}
            subtitle={t('analytics.chart.topProductos.subtitle')}
            loading={loading}
            height={260}
          >
            {topProdData.length === 0
              ? <EmptyState onClear={clearFilters} />
              : (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart
                    data={topProdData}
                    layout="vertical"
                    margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
                    barCategoryGap="18%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false}
                      tickFormatter={v => `${(v/1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category" dataKey="nombre"
                      tick={{ ...axisStyle, fontSize: 9 }}
                      axisLine={false} tickLine={false} width={110}
                    />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="valor" name={t('analytics.series.ingresos')} radius={[0, 4, 4, 0]} isAnimationActive>
                      {topProdData.map((_: TopItem, i: number) => (
                        <Cell key={i} fill={PROD_COLORS[i % PROD_COLORS.length]} />
                      ))}
                      <LabelList
                        dataKey="valor"
                        position="right"
                        formatter={(v: unknown) => `${((v as number)/1000).toFixed(1)}k`}
                        style={{ fontSize: 10, fontFamily: FONT, fill: '#64748b', fontWeight: 700 }}
                      />
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              )
            }
          </ChartCard>
        </div>

        {/* ── Row 3: Comparativa por zona ── */}
        <ChartCard
          title={t('analytics.chart.porZona.title')}
          subtitle={t('analytics.chart.porZona.subtitle')}
          loading={loading}
          height={260}
        >
          {porZonaData.length === 0
            ? <EmptyState onClear={clearFilters} />
            : (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={porZonaDataI18n} margin={{ top: 18, right: 20, left: -10, bottom: 0 }} barCategoryGap="22%">
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="nombre" tick={{ ...axisStyle, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="cnt" orientation="left"  tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="ing" orientation="right"
                    tick={axisStyle} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v/1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontFamily: FONT, fontSize: 11 }} />
                  <Bar yAxisId="cnt" dataKey="pedidos"    name={t('analytics.series.total')}        radius={[4,4,0,0]} isAnimationActive>
                    {porZonaDataI18n.map((z: ZonaComp, i: number) => (
                      <Cell key={z.nombre} fill={`${ZONA_COLORS[i % ZONA_COLORS.length]}40`} />
                    ))}
                    <LabelList
                      dataKey="pedidos"
                      position="top"
                      style={{ fontSize: 10, fontFamily: FONT, fill: '#64748b', fontWeight: 700 }}
                    />
                  </Bar>
                  <Bar yAxisId="cnt" dataKey="entregados" name={t('analytics.series.entregados')}   radius={[4,4,0,0]} isAnimationActive>
                    {porZonaDataI18n.map((z: ZonaComp, i: number) => (
                      <Cell key={z.nombre} fill={ZONA_COLORS[i % ZONA_COLORS.length]} />
                    ))}
                    <LabelList
                      dataKey="entregados"
                      position="top"
                      style={{ fontSize: 10, fontFamily: FONT, fill: '#475569', fontWeight: 700 }}
                    />
                  </Bar>
                  <Bar yAxisId="ing" dataKey="ingresos" name={t('analytics.series.ingresos')} fill="#f59e0b" radius={[4,4,0,0]} isAnimationActive>
                    <LabelList
                      dataKey="ingresos"
                      position="top"
                      formatter={(v: unknown) => `${((v as number)/1000).toFixed(1)}k`}
                      style={{ fontSize: 10, fontFamily: FONT, fill: '#b45309', fontWeight: 700 }}
                    />
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            )
          }
        </ChartCard>

        {/* ── Mapa de clientes ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">{t('analytics.mapa.title')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('analytics.mapa.subtitle')}
                {!mapaLoading && mapaClientes.length > 0 && (
                  <> · <strong className="text-slate-600">{mapaClientes.length}</strong>{' '}
                    {t('analytics.mapa.clientes').replace('{count}', '').trim()}</>
                )}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
              OpenStreetMap
            </span>
          </div>
          <div className="p-5">
            {mapaLoading ? (
              <Skel h={500} />
            ) : mapaClientes.length === 0 ? (
              <div className="flex items-center justify-center" style={{ height: 500 }}>
                <p className="text-sm text-slate-400">{t('analytics.mapa.empty')}</p>
              </div>
            ) : (
              <Suspense fallback={<Skel h={500} />}>
                <ClientesMapa clients={mapaClientes} />
              </Suspense>
            )}
          </div>
        </div>

        <footer className="text-center py-4">
          <p className="text-xs text-slate-400">{t('analytics.footer')}</p>
        </footer>
      </main>
    </>
  )
}

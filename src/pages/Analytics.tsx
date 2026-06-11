import { useEffect, useMemo, useState, lazy, Suspense } from 'react'
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend,
} from 'recharts'
import {
  fetchAnalyticsRaw,
  computePorMes,
  computeTopProductos,
  computeTopClientes,
  computePorZona,
  type AnalyticsRaw,
  type MesData,
  type TopItem,
  type ZonaComp,
} from '../lib/analytics'
import { fetchClientesMapData, type ClienteMapData } from '../lib/mapa'

const ClientesMapa = lazy(() => import('../components/ClientesMapa'))

const FONT   = "'Plus Jakarta Sans', system-ui, sans-serif"
const fmtBs  = (n: number) => `Bs. ${new Intl.NumberFormat('es-BO', { minimumFractionDigits: 0 }).format(n)}`
const fmtNum = (n: number) => n.toLocaleString('es-BO')

// ─── Colors ───────────────────────────────────────────────────────────────────

const AZUL_SCALE  = ['#1e40af','#2563eb','#3b82f6','#60a5fa','#93c5fd']
const VERDE_SCALE = ['#15803d','#16a34a','#22c55e','#4ade80','#86efac']

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`bg-slate-200 rounded-xl animate-pulse ${className}`} style={style} />
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, prefix = '' }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg space-y-1">
      {label && <p className="font-bold text-slate-300 mb-1">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? '#fff' }}>
          {p.name}: <span className="font-bold">{prefix}{typeof p.value === 'number' ? fmtNum(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ─── ChartCard ────────────────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children, loading, height = 220 }: {
  title: string; subtitle?: string; children: React.ReactNode; loading: boolean; height?: number
}) {
  return (
    <div className="anim-card bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="mb-5">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {loading
        ? <Skeleton style={{ height }} />
        : children}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, small }: { label: string; value: string | number; color: string; small?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-400 truncate">{label}</p>
      <p className={`font-extrabold truncate ${small ? 'text-lg' : 'text-2xl'}`} style={{ color }}>{value}</p>
    </div>
  )
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

function FilterChip({ label, color, onRemove }: { label: string; color: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold text-white"
      style={{ background: color }}
    >
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

// ─── Axis shared styles ───────────────────────────────────────────────────────

const axisStyle = { fontSize: 11, fontFamily: FONT, fill: '#94a3b8' }
const gridProps = { strokeDasharray: '3 3', stroke: '#f1f5f9', vertical: false } as const

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Analytics() {
  const [raw, setRaw]       = useState<AnalyticsRaw | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const [selectedMes,      setSelectedMes]      = useState<string | null>(null)
  const [selectedProducto, setSelectedProducto] = useState<string | null>(null)
  const [selectedCliente,  setSelectedCliente]  = useState<string | null>(null)

  const [mapaClientes, setMapaClientes] = useState<ClienteMapData[]>([])
  const [mapaLoading,  setMapaLoading]  = useState(true)

  useEffect(() => {
    fetchAnalyticsRaw()
      .then(d => { setRaw(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })

    fetchClientesMapData()
      .then(d => { setMapaClientes(d); setMapaLoading(false) })
      .catch(() => setMapaLoading(false))
  }, [])

  const hasFilter = selectedMes !== null || selectedProducto !== null || selectedCliente !== null
  const clearFilters = () => { setSelectedMes(null); setSelectedProducto(null); setSelectedCliente(null) }

  const toggleMes      = (m: string) => setSelectedMes(prev => prev === m ? null : m)
  const toggleProducto = (n: string) => setSelectedProducto(prev => prev === n ? null : n)
  const toggleCliente  = (n: string) => setSelectedCliente(prev => prev === n ? null : n)

  // ── Cross-filter derivations ────────────────────────────────────────────────

  // Pedido IDs that contain the selected product (for filtering other views)
  const productoPedidoIds = useMemo(() => {
    if (!raw || !selectedProducto) return null
    return new Set(
      raw.items.filter(i => i.producto_nombre === selectedProducto).map(i => i.pedido_id)
    )
  }, [raw, selectedProducto])

  // "Por mes" charts: filtered by cliente + producto only (NOT mes → all months visible, selected highlighted)
  const porMesPedidos = useMemo(() => {
    if (!raw) return []
    return raw.pedidos.filter(p =>
      (!selectedCliente   || p.cliente_nombre === selectedCliente) &&
      (!productoPedidoIds || productoPedidoIds.has(p.id))
    )
  }, [raw, selectedCliente, productoPedidoIds])

  // IDs for "Top productos" chart: filtered by mes + cliente (NOT producto → all products visible, selected highlighted)
  const topProdPedidoIds = useMemo(() => {
    if (!raw || (!selectedMes && !selectedCliente)) return null
    return new Set(
      raw.pedidos
        .filter(p =>
          (!selectedMes     || p.mes_label === selectedMes) &&
          (!selectedCliente || p.cliente_nombre === selectedCliente)
        )
        .map(p => p.id)
    )
  }, [raw, selectedMes, selectedCliente])

  // "Top clientes": filtered by mes + producto (NOT cliente → all clients visible, selected highlighted)
  const topClientePedidos = useMemo(() => {
    if (!raw) return []
    return raw.pedidos.filter(p =>
      (!selectedMes      || p.mes_label === selectedMes) &&
      (!productoPedidoIds || productoPedidoIds.has(p.id))
    )
  }, [raw, selectedMes, productoPedidoIds])

  // All filters active: for KPIs + zona
  const allFiltered = useMemo(() => {
    if (!raw) return []
    return raw.pedidos.filter(p =>
      (!selectedMes      || p.mes_label === selectedMes) &&
      (!selectedCliente  || p.cliente_nombre === selectedCliente) &&
      (!productoPedidoIds || productoPedidoIds.has(p.id))
    )
  }, [raw, selectedMes, selectedCliente, productoPedidoIds])

  // ── Derived chart data ──────────────────────────────────────────────────────

  const porMesData    = useMemo(() => computePorMes(porMesPedidos),                              [porMesPedidos])
  const topProdData   = useMemo(() => computeTopProductos(raw?.items ?? [], topProdPedidoIds),   [raw, topProdPedidoIds])
  const topCliData    = useMemo(() => computeTopClientes(topClientePedidos),                     [topClientePedidos])
  const porZonaData   = useMemo(() => computePorZona(allFiltered, raw?.zonas ?? []),             [allFiltered, raw])

  // ── Summary KPIs from fully-filtered data ──────────────────────────────────

  const summaryTotalPedidos  = allFiltered.length
  const summaryIngresos      = useMemo(() =>
    allFiltered.filter(p => p.estado === 'entregado').reduce((s, p) => s + p.total, 0),
    [allFiltered])
  const summaryMejorMes      = porMesData.length
    ? porMesData.reduce((best, m) => m.pedidos > best.pedidos ? m : best, porMesData[0]).mes
    : '—'
  const summaryZonas         = porZonaData.length

  const hoy = new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>Analytics</h1>
            <p className="text-xs text-slate-400 capitalize mt-0.5">{hoy}</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
            {hasFilter ? 'Filtro activo' : 'Datos históricos · 6 meses'}
          </span>
        </div>

        {/* Active filter chips */}
        {hasFilter && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-400">Filtros activos:</span>
            {selectedMes && (
              <FilterChip label={`Mes: ${selectedMes}`} color="#1e40af" onRemove={() => setSelectedMes(null)} />
            )}
            {selectedProducto && (
              <FilterChip label={`Producto: ${selectedProducto}`} color="#7c3aed" onRemove={() => setSelectedProducto(null)} />
            )}
            {selectedCliente && (
              <FilterChip label={`Cliente: ${selectedCliente}`} color="#15803d" onRemove={() => setSelectedCliente(null)} />
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

      <main className="flex-1 px-8 py-6 space-y-5 max-w-7xl w-full mx-auto">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {/* ── Summary row ── */}
        {loading ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard label="Total pedidos"    value={fmtNum(summaryTotalPedidos)} color="#1e40af" />
            <StatCard label="Ingresos totales" value={fmtBs(summaryIngresos)}      color="#15803d" small />
            <StatCard label="Mejor mes"        value={summaryMejorMes}             color="#0891b2" />
            <StatCard label="Zonas activas"    value={summaryZonas}                color="#7c3aed" />
          </div>
        )}

        {/* ── Row 1: pedidos por mes + ingresos por mes ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* Pedidos por mes (BarChart — clickable) */}
          <ChartCard
            title="Pedidos por mes"
            subtitle={
              selectedProducto || selectedCliente
                ? `Filtrado · Clic para ${selectedMes ? 'cambiar' : 'seleccionar'} mes`
                : `Clic para filtrar · ${selectedMes ? `Mes: ${selectedMes}` : 'Todos los meses'}`
            }
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porMesData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="mes" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar
                  dataKey="pedidos"
                  name="Pedidos"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive
                  animationDuration={900}
                  cursor="pointer"
                  onClick={(d) => { const m = d.payload as MesData; if (m) toggleMes(m.mes) }}
                >
                  {porMesData.map(entry => {
                    const isSelected = selectedMes === entry.mes
                    const isDimmed   = selectedMes !== null && !isSelected
                    return (
                      <Cell
                        key={entry.mes}
                        fill="#1e40af"
                        opacity={isDimmed ? 0.25 : 1}
                        stroke={isSelected ? '#1e293b' : 'transparent'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Ingresos por mes (BarChart — clickable, mismo selectedMes) */}
          <ChartCard
            title="Ingresos por mes"
            subtitle={
              selectedProducto || selectedCliente
                ? `Filtrado · Clic para ${selectedMes ? 'cambiar' : 'seleccionar'} mes`
                : `Pedidos entregados (Bs.) · Clic para filtrar`
            }
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porMesData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="mes" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis
                  tick={axisStyle} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip prefix="Bs. " />} cursor={{ fill: '#f8fafc' }} />
                <Bar
                  dataKey="ingresos"
                  name="Ingresos"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive
                  animationDuration={900}
                  cursor="pointer"
                  onClick={(d) => { const m = d.payload as MesData; if (m) toggleMes(m.mes) }}
                >
                  {porMesData.map(entry => {
                    const isSelected = selectedMes === entry.mes
                    const isDimmed   = selectedMes !== null && !isSelected
                    return (
                      <Cell
                        key={entry.mes}
                        fill="#15803d"
                        opacity={isDimmed ? 0.25 : 1}
                        stroke={isSelected ? '#1e293b' : 'transparent'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Row 2: top productos + top clientes ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* Top 5 productos (clickable) */}
          <ChartCard
            title="Top 5 productos"
            subtitle={
              selectedMes || selectedCliente
                ? `Filtrado · Clic para ${selectedProducto ? 'cambiar' : 'seleccionar'} producto`
                : `Por unidades pedidas · Clic para filtrar`
            }
            loading={loading}
            height={200}
          >
            {topProdData.length === 0
              ? <EmptyChart msg="Sin datos para el filtro actual" />
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={topProdData}
                    layout="vertical"
                    margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                    barCategoryGap="25%"
                  >
                    <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category" dataKey="nombre"
                      tick={{ ...axisStyle, fontSize: 10 }}
                      axisLine={false} tickLine={false} width={120}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar
                      dataKey="valor"
                      name="Unidades"
                      radius={[0, 6, 6, 0]}
                      isAnimationActive
                      animationDuration={900}
                      cursor="pointer"
                      onClick={(d) => { const t = d.payload as TopItem; if (t) toggleProducto(t.nombre) }}
                    >
                      {topProdData.map((entry, i) => {
                        const isSelected = selectedProducto === entry.nombre
                        const isDimmed   = selectedProducto !== null && !isSelected
                        return (
                          <Cell
                            key={entry.nombre}
                            fill={AZUL_SCALE[i] ?? '#3b82f6'}
                            opacity={isDimmed ? 0.25 : 1}
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
          </ChartCard>

          {/* Top 5 clientes (clickable) */}
          <ChartCard
            title="Top 5 clientes"
            subtitle={
              selectedMes || selectedProducto
                ? `Filtrado · Clic para ${selectedCliente ? 'cambiar' : 'seleccionar'} cliente`
                : `Por número de pedidos · Clic para filtrar`
            }
            loading={loading}
            height={200}
          >
            {topCliData.length === 0
              ? <EmptyChart msg="Sin datos para el filtro actual" />
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={topCliData}
                    layout="vertical"
                    margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                    barCategoryGap="25%"
                  >
                    <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category" dataKey="nombre"
                      tick={{ ...axisStyle, fontSize: 10 }}
                      axisLine={false} tickLine={false} width={130}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar
                      dataKey="valor"
                      name="Pedidos"
                      radius={[0, 6, 6, 0]}
                      isAnimationActive
                      animationDuration={900}
                      cursor="pointer"
                      onClick={(d) => { const t = d.payload as TopItem; if (t) toggleCliente(t.nombre) }}
                    >
                      {topCliData.map((entry, i) => {
                        const isSelected = selectedCliente === entry.nombre
                        const isDimmed   = selectedCliente !== null && !isSelected
                        return (
                          <Cell
                            key={entry.nombre}
                            fill={VERDE_SCALE[i] ?? '#16a34a'}
                            opacity={isDimmed ? 0.25 : 1}
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
          </ChartCard>
        </div>

        {/* ── Row 3: comparativa por zona (responsive to all filters) ── */}
        <ChartCard
          title="Comparativa por zona"
          subtitle={hasFilter ? 'Resultado del filtro activo' : 'Pedidos totales y entregados'}
          loading={loading}
          height={240}
        >
          {porZonaData.length === 0
            ? <EmptyChart msg="Sin datos para el filtro actual" onClear={clearFilters} />
            : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={porZonaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="nombre" tick={{ ...axisStyle, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: FONT, fontSize: 11 }} />
                  <Bar dataKey="pedidos" name="Total" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={900}>
                    {porZonaData.map((z: ZonaComp) => <Cell key={z.nombre} fill={`${z.color}60`} />)}
                  </Bar>
                  <Bar dataKey="entregados" name="Entregados" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1100}>
                    {porZonaData.map((z: ZonaComp) => <Cell key={z.nombre} fill={z.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </ChartCard>

        {/* ── Mapa de clientes ── */}
        <section
          className="anim-card bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          style={{ animationDelay: '560ms' }}
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Mapa de clientes</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Distribución geográfica en Santa Cruz de la Sierra
                {!mapaLoading && mapaClientes.length > 0 && (
                  <> · <strong className="text-slate-600">{mapaClientes.length}</strong> clientes georeferenciados</>
                )}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
              OpenStreetMap
            </span>
          </div>

          <div className="p-5">
            {mapaLoading ? (
              <Skeleton style={{ height: 500 }} />
            ) : mapaClientes.length === 0 ? (
              <div className="flex items-center justify-center" style={{ height: 500 }}>
                <p className="text-sm text-slate-400">Sin clientes georeferenciados</p>
              </div>
            ) : (
              <Suspense fallback={<Skeleton style={{ height: 500 }} />}>
                <ClientesMapa clients={mapaClientes} />
              </Suspense>
            )}
          </div>
        </section>

        <footer className="text-center py-4">
          <p className="text-xs text-slate-400">RapiDash CRM · Distribución Farmacéutica · Santa Cruz, Bolivia</p>
        </footer>
      </main>
    </>
  )
}

// ─── Empty state helper ───────────────────────────────────────────────────────

function EmptyChart({ msg, onClear }: { msg: string; onClear?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <p className="text-sm text-slate-400">{msg}</p>
      {onClear && (
        <button onClick={onClear} className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline">
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

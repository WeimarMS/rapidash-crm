import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useMemo, useRef, useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from 'react-leaflet'
import type { ClienteMapData } from '../lib/mapa'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
  farmacia:          'Farmacia',
  clinica:           'Clínica',
  consultorio:       'Consultorio',
  centro_de_salud:   'Centro de Salud',
  tienda_naturista:  'Tienda Naturista',
  botiquin:          'Botiquín',
}

function tipoLabel(t: string) {
  return TIPO_LABEL[t] ?? t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const fmtBs   = (n: number) => `Bs. ${n.toLocaleString('es-BO')}`
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

// ─── Auto-fit bounds (runs once when data loads) ──────────────────────────────

function FitBounds({ clients }: { clients: ClienteMapData[] }) {
  const map    = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (fitted.current || !clients.length) return
    const bounds = L.latLngBounds(clients.map(c => [c.latitud, c.longitud]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 })
    fitted.current = true
  }, [clients, map])
  return null
}

// ─── Tooltip content ──────────────────────────────────────────────────────────

function TooltipContent({ c }: { c: ClienteMapData }) {
  return (
    <div style={{
      minWidth: 170,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      padding: '2px 0',
    }}>
      <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1.3 }}>
        {c.nombre}
      </p>
      <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 7px 0' }}>
        {tipoLabel(c.tipo)}
        <span style={{ margin: '0 5px', color: '#cbd5e1' }}>·</span>
        <span style={{ color: c.zona_color, fontWeight: 600 }}>{c.zona_nombre}</span>
      </p>
      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#475569' }}>
        <span>
          <strong style={{ color: '#1e293b' }}>{c.total_pedidos}</strong>{' '}
          pedido{c.total_pedidos !== 1 ? 's' : ''}
        </span>
        <span style={{ color: '#15803d', fontWeight: 700 }}>{fmtBs(c.total_ingresos)}</span>
      </div>
    </div>
  )
}

// ─── Popup content ────────────────────────────────────────────────────────────

function PopupContent({ c }: { c: ClienteMapData }) {
  const rows: [string, string][] = [
    ['Tipo',          tipoLabel(c.tipo)],
    ['Zona',          c.zona_nombre],
    ['Dirección',     c.direccion],
    ['Teléfono',      c.telefono],
    ['Pedidos',       String(c.total_pedidos)],
    ['Ingresos',      fmtBs(c.total_ingresos)],
    ['Último pedido', fmtDate(c.ultimo_pedido)],
  ]
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", padding: '6px 4px', minWidth: 220 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8,
        borderBottom: '1px solid #f1f5f9' }}>
        <span style={{
          width: 11, height: 11, borderRadius: '50%', background: c.zona_color, flexShrink: 0,
          border: '2px solid #fff', boxShadow: `0 0 0 1.5px ${c.zona_color}`,
        }} />
        <strong style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.3 }}>{c.nombre}</strong>
      </div>
      {/* Detail rows */}
      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td style={{
                color: '#94a3b8', paddingRight: 10, paddingBottom: 5,
                whiteSpace: 'nowrap', verticalAlign: 'top', fontWeight: 500,
              }}>
                {label}
              </td>
              <td style={{ color: '#334155', fontWeight: 500, paddingBottom: 5 }}>
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main map component ───────────────────────────────────────────────────────

interface Props { clients: ClienteMapData[] }

export default function ClientesMapa({ clients }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const zonas = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of clients) map.set(c.zona_color, c.zona_nombre)
    return Array.from(map.entries())
      .map(([color, nombre]) => ({ color, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [clients])

  return (
    <div>
      {/* Leaflet map */}
      {/* isolation + zIndex confinan los z-index internos de Leaflet (panes 400-700,
          controles 800-1000) a este contexto de apilamiento, para que no floten
          sobre el sidebar (z-20) ni el drawer movil (z-50). */}
      <div style={{
        height: 470, borderRadius: '0.875rem', overflow: 'hidden',
        position: 'relative', zIndex: 0, isolation: 'isolate',
      }}>
        <MapContainer
          center={[-17.7833, -63.1821]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
          zoomControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds clients={clients} />

          {clients.map(c => (
            <CircleMarker
              key={c.id}
              center={[c.latitud, c.longitud]}
              radius={activeId === c.id ? 13 : 9}
              pathOptions={{
                fillColor:   c.zona_color,
                fillOpacity: 0.92,
                color:       'white',
                weight:      2.5,
              }}
              eventHandlers={{
                mouseover: () => setActiveId(c.id),
                mouseout:  () => setActiveId(null),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} sticky={false}>
                <TooltipContent c={c} />
              </Tooltip>
              <Popup maxWidth={270} minWidth={230} closeButton>
                <PopupContent c={c} />
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Legend + attribution strip */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap',
        gap: '8px 20px', marginTop: 12, padding: '0 2px',
      }}>
        {zonas.map(z => (
          <span key={z.color} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%', background: z.color,
              border: '2px solid white', boxShadow: `0 0 0 1.5px ${z.color}`,
              flexShrink: 0,
            }} />
            <span style={{ color: '#475569', fontWeight: 600 }}>{z.nombre}</span>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8' }}>
          {clients.length} clientes · Datos de Supabase
        </span>
      </div>
    </div>
  )
}

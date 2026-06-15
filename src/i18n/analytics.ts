import type { DictModule } from './core'

// Claves de la página Analytics. Namespace: 'analytics.*'
export const analytics: DictModule = {
  es: {
    'analytics.title':    'Analytics',
    'analytics.subtitle': 'Centro de inteligencia de negocio',

    // ── Header / filtros ──
    'analytics.activeFilter':  'Filtro activo',
    'analytics.ordersCount':   '{count} pedidos',
    'analytics.filter.zona':       'Zona',
    'analytics.filter.categoria':  'Categoría',
    'analytics.filter.repartidor': 'Repartidor',
    'analytics.filter.estado':     'Estado',
    'analytics.chip.zona': 'Zona: {value}',
    'analytics.chip.cat':  'Cat: {value}',
    'analytics.period':    'Período',

    // ── KPIs ──
    'analytics.kpi.ingresos':            'Ingresos',
    'analytics.kpi.ingresos.sub':        'Pedidos entregados',
    'analytics.kpi.ingresos.delta':      'vs período ant.',
    'analytics.kpi.pedidos':             'Pedidos',
    'analytics.kpi.pedidos.sub':         'Total en período',
    'analytics.kpi.tasaEntrega':         'Tasa entrega',
    'analytics.kpi.tasaEntrega.sub':     '{count} entregados',
    'analytics.kpi.ticket':              'Ticket promedio',
    'analytics.kpi.ticket.sub':          'Por pedido entregado',
    'analytics.kpi.fallidos':            'Pedidos fallidos',
    'analytics.kpi.fallidos.sub':        '{pct}% del total',
    'analytics.kpi.mejorRepartidor':     'Mejor repartidor',
    'analytics.kpi.mejorRepartidor.sub': '{count} entregas',

    // ── ChartCards ──
    'analytics.chart.evolucion.title':     'Evolución mensual',
    'analytics.chart.evolucion.subtitle':  'Pedidos (eje izq.) · Ingresos Bs. (eje der.)',
    'analytics.chart.porEstado.title':     'Por estado',
    'analytics.chart.porEstado.subtitle':  'Distribución de pedidos',
    'analytics.chart.performance.title':    'Performance de repartidores',
    'analytics.chart.performance.subtitle': 'Entregas completadas y tasa de éxito',
    'analytics.chart.topProductos.title':    'Top productos',
    'analytics.chart.topProductos.subtitle': 'Por ingresos generados (Bs.)',
    'analytics.chart.porZona.title':    'Comparativa por zona',
    'analytics.chart.porZona.subtitle': 'Total pedidos · Entregados · Ingresos Bs.',

    // ── Series de gráficos ──
    'analytics.series.pedidos':     'Pedidos',
    'analytics.series.ingresos':    'Ingresos Bs.',
    'analytics.series.total':       'Total',
    'analytics.series.entregados':  'Entregados',

    // ── Empty state ──
    'analytics.empty':      'Sin datos para el filtro activo',
    'analytics.empty.clear':'Limpiar filtros',

    // ── Mapa ──
    'analytics.mapa.title':    'Distribución geográfica',
    'analytics.mapa.subtitle': 'Clientes georeferenciados en Santa Cruz de la Sierra',
    'analytics.mapa.clientes': '{count} clientes',
    'analytics.mapa.empty':    'Sin clientes georeferenciados',

    // ── Footer ──
    'analytics.footer': 'RapiDash CRM · Distribución Farmacéutica · Santa Cruz, Bolivia',
  },
  en: {
    'analytics.title':    'Analytics',
    'analytics.subtitle': 'Business intelligence center',

    // ── Header / filters ──
    'analytics.activeFilter':  'Active filter',
    'analytics.ordersCount':   '{count} orders',
    'analytics.filter.zona':       'Zone',
    'analytics.filter.categoria':  'Category',
    'analytics.filter.repartidor': 'Courier',
    'analytics.filter.estado':     'Status',
    'analytics.chip.zona': 'Zone: {value}',
    'analytics.chip.cat':  'Cat: {value}',
    'analytics.period':    'Period',

    // ── KPIs ──
    'analytics.kpi.ingresos':            'Revenue',
    'analytics.kpi.ingresos.sub':        'Delivered orders',
    'analytics.kpi.ingresos.delta':      'vs prev. period',
    'analytics.kpi.pedidos':             'Orders',
    'analytics.kpi.pedidos.sub':         'Total in period',
    'analytics.kpi.tasaEntrega':         'Delivery rate',
    'analytics.kpi.tasaEntrega.sub':     '{count} delivered',
    'analytics.kpi.ticket':              'Average ticket',
    'analytics.kpi.ticket.sub':          'Per delivered order',
    'analytics.kpi.fallidos':            'Failed orders',
    'analytics.kpi.fallidos.sub':        '{pct}% of total',
    'analytics.kpi.mejorRepartidor':     'Top courier',
    'analytics.kpi.mejorRepartidor.sub': '{count} deliveries',

    // ── ChartCards ──
    'analytics.chart.evolucion.title':     'Monthly evolution',
    'analytics.chart.evolucion.subtitle':  'Orders (left axis) · Revenue Bs. (right axis)',
    'analytics.chart.porEstado.title':     'By status',
    'analytics.chart.porEstado.subtitle':  'Order distribution',
    'analytics.chart.performance.title':    'Courier performance',
    'analytics.chart.performance.subtitle': 'Completed deliveries and success rate',
    'analytics.chart.topProductos.title':    'Top products',
    'analytics.chart.topProductos.subtitle': 'By revenue generated (Bs.)',
    'analytics.chart.porZona.title':    'Comparison by zone',
    'analytics.chart.porZona.subtitle': 'Total orders · Delivered · Revenue Bs.',

    // ── Chart series ──
    'analytics.series.pedidos':     'Orders',
    'analytics.series.ingresos':    'Revenue Bs.',
    'analytics.series.total':       'Total',
    'analytics.series.entregados':  'Delivered',

    // ── Empty state ──
    'analytics.empty':      'No data for the active filter',
    'analytics.empty.clear':'Clear filters',

    // ── Map ──
    'analytics.mapa.title':    'Geographic distribution',
    'analytics.mapa.subtitle': 'Georeferenced clients in Santa Cruz de la Sierra',
    'analytics.mapa.clientes': '{count} clients',
    'analytics.mapa.empty':    'No georeferenced clients',

    // ── Footer ──
    'analytics.footer': 'RapiDash CRM · Pharmaceutical Distribution · Santa Cruz, Bolivia',
  },
}

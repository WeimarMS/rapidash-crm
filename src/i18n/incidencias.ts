import type { DictModule } from './core'

// Claves de la página Incidencias. Namespace: 'incidencias.*'
export const incidencias: DictModule = {
  es: {
    'incidencias.title':            'Incidencias',
    'incidencias.register':         'Registrar incidencia',

    // Stats
    'incidencias.stat.total':       'Total',
    'incidencias.stat.pending':     'Pendientes',
    'incidencias.stat.resolved':    'Resueltas',

    // Búsqueda + filtros
    'incidencias.search':           'Tipo, pedido...',
    'incidencias.filter.all':       'Todos',
    'incidencias.filter.pending':   'Pendientes',
    'incidencias.filter.resolved':  'Resueltas',

    // Tabla
    'incidencias.col.type':         'Tipo',
    'incidencias.col.order':        'Pedido',
    'incidencias.col.courier':      'Repartidor',
    'incidencias.col.description':  'Descripción',
    'incidencias.col.status':       'Estado',
    'incidencias.col.date':         'Fecha',
    'incidencias.count.one':        'incidencia',
    'incidencias.count.many':       'incidencias',
    'incidencias.empty.title':      'Sin incidencias registradas',
    'incidencias.empty.subtitle':   'Las operaciones están funcionando correctamente',

    // Estado badge
    'incidencias.status.resolved':  'Resuelta',
    'incidencias.status.pending':   'Pendiente',

    // Tipos de incidencia
    'incidencias.tipo.cliente_ausente':      'Cliente ausente',
    'incidencias.tipo.direccion_incorrecta': 'Dirección incorrecta',
    'incidencias.tipo.producto_danado':      'Producto dañado',
    'incidencias.tipo.rechazo_cliente':      'Rechazo del cliente',
    'incidencias.tipo.accidente':            'Accidente',
    'incidencias.tipo.otro':                 'Otro',

    // Modal
    'incidencias.modal.eyebrow':    'Nueva incidencia',
    'incidencias.modal.title':      'Registrar incidencia',
    'incidencias.modal.order':      'Pedido asociado',
    'incidencias.modal.noOrders':   'No hay pedidos disponibles',
    'incidencias.modal.type':       'Tipo de incidencia',
    'incidencias.modal.description':'Descripción',
    'incidencias.modal.phDesc':     'Describe brevemente la incidencia…',
    'incidencias.modal.submit':     'Guardar incidencia',
    'incidencias.modal.errOrder':   'Selecciona un pedido',
    'incidencias.modal.errDesc':    'La descripción es obligatoria',

    // Drawer detalle
    'incidencias.drawer.eyebrow':     'Incidencia',
    'incidencias.drawer.order':       'Pedido',
    'incidencias.drawer.courier':     'Repartidor',
    'incidencias.drawer.description': 'Descripción',
    'incidencias.drawer.resolution':  'Resolución',
    'incidencias.drawer.registered':  'Registrado',
    'incidencias.drawer.markResolved':'Marcar como resuelta',

    // Toasts
    'incidencias.toast.created':    'Incidencia registrada correctamente',
  },
  en: {
    'incidencias.title':            'Incidents',
    'incidencias.register':         'Report incident',

    // Stats
    'incidencias.stat.total':       'Total',
    'incidencias.stat.pending':     'Pending',
    'incidencias.stat.resolved':    'Resolved',

    // Search + filters
    'incidencias.search':           'Type, order...',
    'incidencias.filter.all':       'All',
    'incidencias.filter.pending':   'Pending',
    'incidencias.filter.resolved':  'Resolved',

    // Table
    'incidencias.col.type':         'Type',
    'incidencias.col.order':        'Order',
    'incidencias.col.courier':      'Courier',
    'incidencias.col.description':  'Description',
    'incidencias.col.status':       'Status',
    'incidencias.col.date':         'Date',
    'incidencias.count.one':        'incident',
    'incidencias.count.many':       'incidents',
    'incidencias.empty.title':      'No incidents reported',
    'incidencias.empty.subtitle':   'Operations are running smoothly',

    // Status badge
    'incidencias.status.resolved':  'Resolved',
    'incidencias.status.pending':   'Pending',

    // Incident types
    'incidencias.tipo.cliente_ausente':      'Customer absent',
    'incidencias.tipo.direccion_incorrecta': 'Wrong address',
    'incidencias.tipo.producto_danado':      'Damaged product',
    'incidencias.tipo.rechazo_cliente':      'Customer rejection',
    'incidencias.tipo.accidente':            'Accident',
    'incidencias.tipo.otro':                 'Other',

    // Modal
    'incidencias.modal.eyebrow':    'New incident',
    'incidencias.modal.title':      'Report incident',
    'incidencias.modal.order':      'Linked order',
    'incidencias.modal.noOrders':   'No orders available',
    'incidencias.modal.type':       'Incident type',
    'incidencias.modal.description':'Description',
    'incidencias.modal.phDesc':     'Briefly describe the incident…',
    'incidencias.modal.submit':     'Save incident',
    'incidencias.modal.errOrder':   'Select an order',
    'incidencias.modal.errDesc':    'Description is required',

    // Detail drawer
    'incidencias.drawer.eyebrow':     'Incident',
    'incidencias.drawer.order':       'Order',
    'incidencias.drawer.courier':     'Courier',
    'incidencias.drawer.description': 'Description',
    'incidencias.drawer.resolution':  'Resolution',
    'incidencias.drawer.registered':  'Reported',
    'incidencias.drawer.markResolved':'Mark as resolved',

    // Toasts
    'incidencias.toast.created':    'Incident reported successfully',
  },
}

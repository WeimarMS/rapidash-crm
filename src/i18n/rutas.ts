import type { DictModule } from './core'

// Claves de la página Rutas. Namespace: 'rutas.*'
export const rutas: DictModule = {
  es: {
    'rutas.title':              'Rutas',
    'rutas.new':                'Nueva ruta',

    // Stats
    'rutas.stat.total':         'Total rutas',
    'rutas.stat.completed':     'Completadas',
    'rutas.stat.ordersCovered': 'Pedidos cubiertos',
    'rutas.stat.delivered':     'Entregados',

    // Búsqueda
    'rutas.search':             'Código o repartidor...',

    // Tabla
    'rutas.col.code':           'Código',
    'rutas.col.date':           'Fecha',
    'rutas.col.courier':        'Repartidor',
    'rutas.col.zone':           'Zona',
    'rutas.col.status':         'Estado',
    'rutas.col.progress':       'Progreso',
    'rutas.col.schedule':       'Horario',
    'rutas.count.one':          'ruta',
    'rutas.count.many':         'rutas',
    'rutas.empty':              'Sin rutas',

    // Modal
    'rutas.modal.eyebrow':      'Rutas',
    'rutas.modal.title':        'Nueva ruta',
    'rutas.modal.date':         'Fecha',
    'rutas.modal.zone':         'Zona',
    'rutas.modal.courier':      'Repartidor',
    'rutas.modal.unassigned':   'Sin asignar',
    'rutas.modal.kmEstimate':   'Km estimado',
    'rutas.modal.phKm':         'Ej. 45',
    'rutas.modal.initialState': 'Estado inicial: Planificada',
    'rutas.modal.submit':       'Crear ruta',
    'rutas.modal.submitting':   'Creando ruta…',
    'rutas.modal.errDate':      'La fecha es obligatoria',
    'rutas.modal.errZone':      'Selecciona una zona',

    // Toasts
    'rutas.toast.created':      'Ruta {code} creada correctamente',
  },
  en: {
    'rutas.title':              'Routes',
    'rutas.new':                'New route',

    // Stats
    'rutas.stat.total':         'Total routes',
    'rutas.stat.completed':     'Completed',
    'rutas.stat.ordersCovered': 'Orders covered',
    'rutas.stat.delivered':     'Delivered',

    // Search
    'rutas.search':             'Code or courier...',

    // Table
    'rutas.col.code':           'Code',
    'rutas.col.date':           'Date',
    'rutas.col.courier':        'Courier',
    'rutas.col.zone':           'Zone',
    'rutas.col.status':         'Status',
    'rutas.col.progress':       'Progress',
    'rutas.col.schedule':       'Schedule',
    'rutas.count.one':          'route',
    'rutas.count.many':         'routes',
    'rutas.empty':              'No routes',

    // Modal
    'rutas.modal.eyebrow':      'Routes',
    'rutas.modal.title':        'New route',
    'rutas.modal.date':         'Date',
    'rutas.modal.zone':         'Zone',
    'rutas.modal.courier':      'Courier',
    'rutas.modal.unassigned':   'Unassigned',
    'rutas.modal.kmEstimate':   'Estimated km',
    'rutas.modal.phKm':         'e.g. 45',
    'rutas.modal.initialState': 'Initial status: Planned',
    'rutas.modal.submit':       'Create route',
    'rutas.modal.submitting':   'Creating route…',
    'rutas.modal.errDate':      'Date is required',
    'rutas.modal.errZone':      'Select a zone',

    // Toasts
    'rutas.toast.created':      'Route {code} created successfully',
  },
}

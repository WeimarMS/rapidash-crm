import type { DictModule } from './core'

// Claves de la página Zonas. Namespace: 'zonas.*'
export const zonas: DictModule = {
  es: {
    'zonas.title':            'Zonas',
    'zonas.new':              'Nueva zona',
    'zonas.count':            '{n} zonas',

    // ZonaCard
    'zonas.clients':          'Clientes',
    'zonas.orders':           'Pedidos',
    'zonas.couriers':         'Repartidores',
    'zonas.revenue':          'Ingresos',
    'zonas.deliveredOrders':  'Pedidos entregados',
    'zonas.noSupervisor':     'Sin supervisor',
    'zonas.supervisor':       'Supervisor de zona',
    'zonas.active':           'Activa',
    'zonas.inactive':         'Inactiva',

    // Modal
    'zonas.modalEyebrow':     'Zonas',
    'zonas.fieldName':        'Nombre *',
    'zonas.namePlaceholder':  'Ej. Zona Norte',
    'zonas.fieldDescription': 'Descripción',
    'zonas.descPlaceholder':  'Barrios, referencias o cobertura de la zona…',
    'zonas.fieldColor':       'Color',
    'zonas.colorAria':        'Color {color}',
    'zonas.customColorAria':  'Color personalizado',
    'zonas.create':           'Crear zona',
    'zonas.reqError':         'El nombre es obligatorio',

    // Toasts
    'zonas.toastCreated':     'Zona "{name}" creada correctamente',
  },
  en: {
    'zonas.title':            'Zones',
    'zonas.new':              'New zone',
    'zonas.count':            '{n} zones',

    // ZonaCard
    'zonas.clients':          'Clients',
    'zonas.orders':           'Orders',
    'zonas.couriers':         'Couriers',
    'zonas.revenue':          'Revenue',
    'zonas.deliveredOrders':  'Delivered orders',
    'zonas.noSupervisor':     'No supervisor',
    'zonas.supervisor':       'Zone supervisor',
    'zonas.active':           'Active',
    'zonas.inactive':         'Inactive',

    // Modal
    'zonas.modalEyebrow':     'Zones',
    'zonas.fieldName':        'Name *',
    'zonas.namePlaceholder':  'E.g. North Zone',
    'zonas.fieldDescription': 'Description',
    'zonas.descPlaceholder':  'Neighborhoods, landmarks or zone coverage…',
    'zonas.fieldColor':       'Color',
    'zonas.colorAria':        'Color {color}',
    'zonas.customColorAria':  'Custom color',
    'zonas.create':           'Create zone',
    'zonas.reqError':         'Name is required',

    // Toasts
    'zonas.toastCreated':     'Zone "{name}" created successfully',
  },
}

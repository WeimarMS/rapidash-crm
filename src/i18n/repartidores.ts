import type { DictModule } from './core'

// Claves de la página Repartidores. Namespace: 'repartidores.*'
export const repartidores: DictModule = {
  es: {
    'repartidores.title':            'Repartidores',
    'repartidores.new':              'Nuevo repartidor',

    // Stats
    'repartidores.stat.total':       'Total',
    'repartidores.stat.active':      'Activos',
    'repartidores.stat.inactive':    'Inactivos',
    'repartidores.stat.avgRate':     'Tasa promedio',

    // Búsqueda
    'repartidores.search':           'Nombre o placa...',

    // Tabla
    'repartidores.col.courier':      'Repartidor',
    'repartidores.col.zone':         'Zona',
    'repartidores.col.vehicle':      'Vehículo',
    'repartidores.col.status':       'Estado',
    'repartidores.col.totalOrders':  'Total ped.',
    'repartidores.col.delivered':    'Entregados',
    'repartidores.col.rate':         'Tasa',
    'repartidores.card.orders':      'Pedidos',
    'repartidores.card.delivered':   'Entregados',
    'repartidores.count.one':        'repartidor',
    'repartidores.count.many':       'repartidores',
    'repartidores.empty':            'No se encontraron repartidores',

    // Drawer
    'repartidores.drawer.eyebrow':   'Repartidor',
    'repartidores.drawer.total':     'Total',
    'repartidores.drawer.delivered': 'Entregados',
    'repartidores.drawer.rate':      'Tasa',
    'repartidores.drawer.personal':  'Datos personales',
    'repartidores.drawer.ci':        'C.I.',
    'repartidores.drawer.phone':     'Teléfono',
    'repartidores.drawer.zone':      'Zona',
    'repartidores.drawer.vehicle':   'Vehículo',
    'repartidores.drawer.plate':     'Placa',
    'repartidores.drawer.type':      'Tipo',

    // Modal
    'repartidores.modal.eyebrow':    'Repartidores',
    'repartidores.modal.title':      'Nuevo repartidor',
    'repartidores.modal.firstName':  'Nombre *',
    'repartidores.modal.lastName':   'Apellido *',
    'repartidores.modal.ci':         'C.I. / Licencia *',
    'repartidores.modal.phone':      'Teléfono',
    'repartidores.modal.zone':       'Zona *',
    'repartidores.modal.vehicle':    'Vehículo *',
    'repartidores.modal.submit':     'Crear repartidor',
    'repartidores.modal.phFirstName':'Ej. Carlos',
    'repartidores.modal.phLastName': 'Ej. Mamani',
    'repartidores.modal.phCi':       'Ej. 7812345',
    'repartidores.modal.phPhone':    'Ej. 77712345',
    'repartidores.modal.required':   'Nombre, apellido, C.I., zona y vehículo son obligatorios',

    // Toasts
    'repartidores.toast.created':    'Repartidor {name} creado correctamente',
    'repartidores.toast.activated':  'Repartidor activado correctamente',
    'repartidores.toast.deactivated':'Repartidor desactivado correctamente',
  },
  en: {
    'repartidores.title':            'Couriers',
    'repartidores.new':              'New courier',

    // Stats
    'repartidores.stat.total':       'Total',
    'repartidores.stat.active':      'Active',
    'repartidores.stat.inactive':    'Inactive',
    'repartidores.stat.avgRate':     'Avg. rate',

    // Search
    'repartidores.search':           'Name or plate...',

    // Table
    'repartidores.col.courier':      'Courier',
    'repartidores.col.zone':         'Zone',
    'repartidores.col.vehicle':      'Vehicle',
    'repartidores.col.status':       'Status',
    'repartidores.col.totalOrders':  'Total ord.',
    'repartidores.col.delivered':    'Delivered',
    'repartidores.col.rate':         'Rate',
    'repartidores.card.orders':      'Orders',
    'repartidores.card.delivered':   'Delivered',
    'repartidores.count.one':        'courier',
    'repartidores.count.many':       'couriers',
    'repartidores.empty':            'No couriers found',

    // Drawer
    'repartidores.drawer.eyebrow':   'Courier',
    'repartidores.drawer.total':     'Total',
    'repartidores.drawer.delivered': 'Delivered',
    'repartidores.drawer.rate':      'Rate',
    'repartidores.drawer.personal':  'Personal details',
    'repartidores.drawer.ci':        'ID',
    'repartidores.drawer.phone':     'Phone',
    'repartidores.drawer.zone':      'Zone',
    'repartidores.drawer.vehicle':   'Vehicle',
    'repartidores.drawer.plate':     'Plate',
    'repartidores.drawer.type':      'Type',

    // Modal
    'repartidores.modal.eyebrow':    'Couriers',
    'repartidores.modal.title':      'New courier',
    'repartidores.modal.firstName':  'First name *',
    'repartidores.modal.lastName':   'Last name *',
    'repartidores.modal.ci':         'ID / License *',
    'repartidores.modal.phone':      'Phone',
    'repartidores.modal.zone':       'Zone *',
    'repartidores.modal.vehicle':    'Vehicle *',
    'repartidores.modal.submit':     'Create courier',
    'repartidores.modal.phFirstName':'e.g. Carlos',
    'repartidores.modal.phLastName': 'e.g. Mamani',
    'repartidores.modal.phCi':       'e.g. 7812345',
    'repartidores.modal.phPhone':    'e.g. 77712345',
    'repartidores.modal.required':   'First name, last name, ID, zone and vehicle are required',

    // Toasts
    'repartidores.toast.created':    'Courier {name} created successfully',
    'repartidores.toast.activated':  'Courier activated successfully',
    'repartidores.toast.deactivated':'Courier deactivated successfully',
  },
}

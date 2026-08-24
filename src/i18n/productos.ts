import type { DictModule } from './core'

// Claves de la página Productos. Namespace: 'productos.*'
export const productos: DictModule = {
  es: {
    'productos.title':            'Productos',
    'productos.new':              'Nuevo producto',

    // Stats
    'productos.statTotal':        'Total productos',
    'productos.statLowStock':     'Stock bajo',

    // Filtros
    'productos.searchPlaceholder':'Buscar producto...',
    'productos.onlyAlerts':       'Solo alertas',

    // Tabla
    'productos.colProduct':       'Producto',
    'productos.colCategory':      'Categoría',
    'productos.colUnit':          'Unidad',
    'productos.colPrice':         'Precio',
    'productos.colStock':         'Stock',
    'productos.colMin':           'Mín.',
    'productos.colState':         'Estado',
    'productos.countOne':         'producto',
    'productos.countMany':        'productos',
    'productos.lowStock':         'Stock bajo',
    'productos.ok':               'OK',
    'productos.cold':             '❄ Frío',
    'productos.minPrefix':        'mín.',
    'productos.stock':            'Stock',

    // Modal
    'productos.modalEyebrow':     'Productos',
    'productos.fieldName':        'Nombre *',
    'productos.namePlaceholder':  'Ej. Paracetamol 500mg',
    'productos.fieldDescription': 'Descripción',
    'productos.descPlaceholder':  'Indicaciones, presentación…',
    'productos.fieldCategory':    'Categoría *',
    'productos.fieldUnit':        'Unidad *',
    'productos.fieldPrice':       'Precio (Bs.) *',
    'productos.fieldStockInitial':'Stock inicial',
    'productos.fieldStockMin':    'Stock mínimo',
    'productos.coldNote':         'Requiere cadena de frío (categoría Vacuna)',
    'productos.create':           'Crear producto',
    'productos.reqError':         'Nombre y unidad son obligatorios',
    'productos.priceError':       'El precio debe ser mayor a 0',

    // Modal editar
    'productos.editModal.eyebrow': 'Productos',
    'productos.editModal.title':   'Editar producto',
    'productos.editModal.errName': 'El nombre es obligatorio',
    'productos.editModal.errPrice':'El precio debe ser mayor a 0',

    // Toasts
    'productos.toastCreated':     'Producto "{name}" creado correctamente',
    'productos.toastUpdated':     'Producto "{name}" actualizado correctamente',
  },
  en: {
    'productos.title':            'Products',
    'productos.new':              'New product',

    // Stats
    'productos.statTotal':        'Total products',
    'productos.statLowStock':     'Low stock',

    // Filters
    'productos.searchPlaceholder':'Search product...',
    'productos.onlyAlerts':       'Alerts only',

    // Table
    'productos.colProduct':       'Product',
    'productos.colCategory':      'Category',
    'productos.colUnit':          'Unit',
    'productos.colPrice':         'Price',
    'productos.colStock':         'Stock',
    'productos.colMin':           'Min.',
    'productos.colState':         'Status',
    'productos.countOne':         'product',
    'productos.countMany':        'products',
    'productos.lowStock':         'Low stock',
    'productos.ok':               'OK',
    'productos.cold':             '❄ Cold',
    'productos.minPrefix':        'min.',
    'productos.stock':            'Stock',

    // Modal
    'productos.modalEyebrow':     'Products',
    'productos.fieldName':        'Name *',
    'productos.namePlaceholder':  'E.g. Paracetamol 500mg',
    'productos.fieldDescription': 'Description',
    'productos.descPlaceholder':  'Directions, presentation…',
    'productos.fieldCategory':    'Category *',
    'productos.fieldUnit':        'Unit *',
    'productos.fieldPrice':       'Price (Bs.) *',
    'productos.fieldStockInitial':'Initial stock',
    'productos.fieldStockMin':    'Minimum stock',
    'productos.coldNote':         'Requires cold chain (Vaccine category)',
    'productos.create':           'Create product',
    'productos.reqError':         'Name and unit are required',
    'productos.priceError':       'Price must be greater than 0',

    // Edit modal
    'productos.editModal.eyebrow': 'Products',
    'productos.editModal.title':   'Edit product',
    'productos.editModal.errName': 'Name is required',
    'productos.editModal.errPrice':'Price must be greater than 0',

    // Toasts
    'productos.toastCreated':     'Product "{name}" created successfully',
    'productos.toastUpdated':     'Product "{name}" updated successfully',
  },
}

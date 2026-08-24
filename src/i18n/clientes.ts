import type { DictModule } from './core'

// Claves de la página Clientes. Namespace: 'clientes.*'
export const clientes: DictModule = {
  es: {
    'clientes.title':            'Clientes',
    'clientes.new':              'Nuevo cliente',
    'clientes.suspended':        'Suspendido',

    // Stats
    'clientes.statTotal':        'Total clientes',
    'clientes.statActive':       'Activos',

    // Filtros
    'clientes.searchPlaceholder':'Buscar cliente...',

    // Tabla
    'clientes.colClient':        'Cliente',
    'clientes.colType':          'Tipo',
    'clientes.colZone':          'Zona',
    'clientes.colPhone':         'Teléfono',
    'clientes.colContact':       'Contacto',
    'clientes.colState':         'Estado',
    'clientes.countOne':         'cliente',
    'clientes.countMany':        'clientes',
    'clientes.empty':            'No se encontraron clientes',

    // Drawer
    'clientes.detailTitle':      'Detalle del cliente',
    'clientes.address':          'Dirección',
    'clientes.contact':          'Contacto',
    'clientes.responsible':      'Responsable',
    'clientes.phone':            'Teléfono',
    'clientes.email':            'Correo',
    'clientes.commercial':       'Información comercial',
    'clientes.nit':              'NIT',
    'clientes.creditLimit':      'Crédito límite',
    'clientes.memberSince':      'Miembro desde',
    'clientes.suspend':          'Suspender',
    'clientes.activate':         'Activar',

    // Modal
    'clientes.modalEyebrow':     'Clientes',
    'clientes.fieldName':        'Nombre *',
    'clientes.namePlaceholder':  'Ej. Farmacia Central',
    'clientes.fieldType':        'Tipo *',
    'clientes.fieldZone':        'Zona *',
    'clientes.fieldAddress':     'Dirección *',
    'clientes.addressPlaceholder':'Av. o calle, número, referencia',
    'clientes.fieldPhone':       'Teléfono',
    'clientes.phonePlaceholder': 'Ej. 77712345',
    'clientes.fieldEmail':       'Email',
    'clientes.emailPlaceholder': 'correo@ejemplo.com',
    'clientes.fieldContact':     'Contacto',
    'clientes.contactPlaceholder':'Nombre del responsable',
    'clientes.fieldCredit':      'Crédito límite (Bs.)',
    'clientes.create':           'Crear cliente',
    'clientes.reqError':         'Nombre, zona y dirección son obligatorios',

    // Edit modal
    'clientes.editModal.title':   'Editar cliente',
    'clientes.editModal.eyebrow': 'Clientes',
    'clientes.editModal.name':    'Nombre *',
    'clientes.editModal.phone':   'Teléfono',
    'clientes.editModal.email':   'Correo',
    'clientes.editModal.errName': 'El nombre es obligatorio',

    // Toasts
    'clientes.toastCreated':     'Cliente "{name}" creado correctamente',
    'clientes.toastActivated':   'Cliente activado correctamente',
    'clientes.toastSuspended':   'Cliente suspendido correctamente',
    'clientes.toast.updated':    'Cliente "{name}" actualizado correctamente',
  },
  en: {
    'clientes.title':            'Clients',
    'clientes.new':              'New client',
    'clientes.suspended':        'Suspended',

    // Stats
    'clientes.statTotal':        'Total clients',
    'clientes.statActive':       'Active',

    // Filters
    'clientes.searchPlaceholder':'Search client...',

    // Table
    'clientes.colClient':        'Client',
    'clientes.colType':          'Type',
    'clientes.colZone':          'Zone',
    'clientes.colPhone':         'Phone',
    'clientes.colContact':       'Contact',
    'clientes.colState':         'Status',
    'clientes.countOne':         'client',
    'clientes.countMany':        'clients',
    'clientes.empty':            'No clients found',

    // Drawer
    'clientes.detailTitle':      'Client detail',
    'clientes.address':          'Address',
    'clientes.contact':          'Contact',
    'clientes.responsible':      'Responsible',
    'clientes.phone':            'Phone',
    'clientes.email':            'Email',
    'clientes.commercial':       'Commercial information',
    'clientes.nit':              'Tax ID',
    'clientes.creditLimit':      'Credit limit',
    'clientes.memberSince':      'Member since',
    'clientes.suspend':          'Suspend',
    'clientes.activate':         'Activate',

    // Modal
    'clientes.modalEyebrow':     'Clients',
    'clientes.fieldName':        'Name *',
    'clientes.namePlaceholder':  'E.g. Central Pharmacy',
    'clientes.fieldType':        'Type *',
    'clientes.fieldZone':        'Zone *',
    'clientes.fieldAddress':     'Address *',
    'clientes.addressPlaceholder':'Street or avenue, number, landmark',
    'clientes.fieldPhone':       'Phone',
    'clientes.phonePlaceholder': 'E.g. 77712345',
    'clientes.fieldEmail':       'Email',
    'clientes.emailPlaceholder': 'email@example.com',
    'clientes.fieldContact':     'Contact',
    'clientes.contactPlaceholder':'Name of the person in charge',
    'clientes.fieldCredit':      'Credit limit (Bs.)',
    'clientes.create':           'Create client',
    'clientes.reqError':         'Name, zone and address are required',

    // Edit modal
    'clientes.editModal.title':   'Edit client',
    'clientes.editModal.eyebrow': 'Clients',
    'clientes.editModal.name':    'Name *',
    'clientes.editModal.phone':   'Phone',
    'clientes.editModal.email':   'Email',
    'clientes.editModal.errName': 'Name is required',

    // Toasts
    'clientes.toastCreated':     'Client "{name}" created successfully',
    'clientes.toastActivated':   'Client activated successfully',
    'clientes.toastSuspended':   'Client suspended successfully',
    'clientes.toast.updated':    'Client "{name}" updated successfully',
  },
}

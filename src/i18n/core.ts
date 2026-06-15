// ─── Diccionario base (compartido por toda la app) ────────────────────────────
//
// Claves comunes + navegación + cabecera + roles + estados + tipos + categorías.
// Cada página tiene además su propio módulo en src/i18n/<pagina>.ts.
//
// CÓMO AGREGAR CLAVES:
//   1. Claves planas "namespaced": 'common.cancel', 'estado.entregado', etc.
//   2. Misma clave en `es` y `en`. Si falta, t() devuelve la propia key.

export interface DictModule {
  es: Record<string, string>
  en: Record<string, string>
}

export const core: DictModule = {
  es: {
    // ── Navegación lateral ──
    'nav.dashboard':    'Dashboard',
    'nav.pedidos':      'Pedidos',
    'nav.clientes':     'Clientes',
    'nav.productos':    'Productos',
    'nav.repartidores': 'Repartidores',
    'nav.rutas':        'Rutas',
    'nav.zonas':        'Zonas',
    'nav.incidencias':  'Incidencias',
    'nav.analytics':    'Analytics',
    'nav.usuarios':     'Usuarios',

    // ── Cabecera / menús ──
    'header.account':      'Mi cuenta',
    'header.signOut':      'Cerrar sesión',
    'header.openMenu':     'Abrir menú',
    'header.closeMenu':    'Cerrar menú',
    'header.collapseMenu': 'Colapsar menú',
    'header.expandMenu':   'Expandir menú',
    'header.collapse':     'Colapsar',
    'header.language':     'Idioma',

    // ── Roles ──
    'role.admin':           'Admin',
    'role.supervisor_zona': 'Supervisor',
    'role.repartidor':      'Repartidor',
    'role.cliente':         'Cliente',
    'role.demo':            'Demo',

    // ── Estado de pedido ──
    'estado.pendiente':  'Pendiente',
    'estado.confirmado': 'Confirmado',
    'estado.en_ruta':    'En ruta',
    'estado.entregado':  'Entregado',
    'estado.fallido':    'Fallido',
    'estado.cancelado':  'Cancelado',

    // ── Estado de ruta ──
    'estadoRuta.planificada': 'Planificada',
    'estadoRuta.en_curso':    'En curso',
    'estadoRuta.completada':  'Completada',

    // ── Tipo de cliente ──
    'tipo.farmacia':     'Farmacia',
    'tipo.clinica':      'Clínica',
    'tipo.centro_salud': 'Centro Salud',
    'tipo.consultorio':  'Consultorio',

    // ── Categoría de producto ──
    'categoria.analgesico':  'Analgésico',
    'categoria.antibiotico': 'Antibiótico',
    'categoria.insumo':      'Insumo',
    'categoria.vacuna':      'Vacuna',
    'categoria.vitamina':    'Vitamina',

    // ── Nombres de zona (datos de BD; traducidos vía tZona) ──
    'zona.centro': 'Centro',
    'zona.norte':  'Norte',
    'zona.sur':    'Sur',
    'zona.este':   'Este',
    'zona.oeste':  'Oeste',

    // ── Comunes ──
    'common.cancel':         'Cancelar',
    'common.save':           'Guardar',
    'common.saving':         'Guardando…',
    'common.saveChanges':    'Guardar cambios',
    'common.create':         'Crear',
    'common.creating':       'Creando…',
    'common.edit':           'Editar',
    'common.view':           'Ver →',
    'common.seeAll':         'Ver todos →',
    'common.search':         'Buscar',
    'common.clearFilters':   'Limpiar filtros',
    'common.clear':          'Limpiar',
    'common.clearAll':       'Limpiar todo',
    'common.all':            'Todos',
    'common.allZones':       'Todas las zonas',
    'common.allCategories':  'Todas las categorías',
    'common.allStates':      'Todos los estados',
    'common.select':         '— Seleccionar —',
    'common.noResults':      'Sin resultados',
    'common.tryOtherFilters':'Intenta con otros filtros',
    'common.total':          'Total',
    'common.active':         'Activo',
    'common.inactive':       'Inactivo',
    'common.activeF':        'Activa',
    'common.inactiveF':      'Inactiva',
    'common.connected':      'Conectado',
    'common.activeFilters':  'Filtros activos:',
    'common.of':             'de',
    'common.totalSuffix':    'total',
    'common.zone':           'Zona',
    'common.client':         'Cliente',
    'common.state':          'Estado',
    'common.date':           'Fecha',
    'common.code':           'Código',
    'common.couriers':       'Repartidores',
    'common.deliveryRate':   'Tasa de entrega',
    'common.activate':       'Activar',
    'common.deactivate':     'Desactivar',
  },
  en: {
    // ── Sidebar nav ──
    'nav.dashboard':    'Dashboard',
    'nav.pedidos':      'Orders',
    'nav.clientes':     'Clients',
    'nav.productos':    'Products',
    'nav.repartidores': 'Couriers',
    'nav.rutas':        'Routes',
    'nav.zonas':        'Zones',
    'nav.incidencias':  'Incidents',
    'nav.analytics':    'Analytics',
    'nav.usuarios':     'Users',

    // ── Header / menus ──
    'header.account':      'My account',
    'header.signOut':      'Sign out',
    'header.openMenu':     'Open menu',
    'header.closeMenu':    'Close menu',
    'header.collapseMenu': 'Collapse menu',
    'header.expandMenu':   'Expand menu',
    'header.collapse':     'Collapse',
    'header.language':     'Language',

    // ── Roles ──
    'role.admin':           'Admin',
    'role.supervisor_zona': 'Supervisor',
    'role.repartidor':      'Courier',
    'role.cliente':         'Client',
    'role.demo':            'Demo',

    // ── Order status ──
    'estado.pendiente':  'Pending',
    'estado.confirmado': 'Confirmed',
    'estado.en_ruta':    'On route',
    'estado.entregado':  'Delivered',
    'estado.fallido':    'Failed',
    'estado.cancelado':  'Cancelled',

    // ── Route status ──
    'estadoRuta.planificada': 'Planned',
    'estadoRuta.en_curso':    'In progress',
    'estadoRuta.completada':  'Completed',

    // ── Client type ──
    'tipo.farmacia':     'Pharmacy',
    'tipo.clinica':      'Clinic',
    'tipo.centro_salud': 'Health Center',
    'tipo.consultorio':  'Practice',

    // ── Product category ──
    'categoria.analgesico':  'Analgesic',
    'categoria.antibiotico': 'Antibiotic',
    'categoria.insumo':      'Supply',
    'categoria.vacuna':      'Vaccine',
    'categoria.vitamina':    'Vitamin',

    // ── Zone names (DB data; translated via tZona) ──
    'zona.centro': 'Center',
    'zona.norte':  'North',
    'zona.sur':    'South',
    'zona.este':   'East',
    'zona.oeste':  'West',

    // ── Common ──
    'common.cancel':         'Cancel',
    'common.save':           'Save',
    'common.saving':         'Saving…',
    'common.saveChanges':    'Save changes',
    'common.create':         'Create',
    'common.creating':       'Creating…',
    'common.edit':           'Edit',
    'common.view':           'View →',
    'common.seeAll':         'View all →',
    'common.search':         'Search',
    'common.clearFilters':   'Clear filters',
    'common.clear':          'Clear',
    'common.clearAll':       'Clear all',
    'common.all':            'All',
    'common.allZones':       'All zones',
    'common.allCategories':  'All categories',
    'common.allStates':      'All statuses',
    'common.select':         '— Select —',
    'common.noResults':      'No results',
    'common.tryOtherFilters':'Try different filters',
    'common.total':          'Total',
    'common.active':         'Active',
    'common.inactive':       'Inactive',
    'common.activeF':        'Active',
    'common.inactiveF':      'Inactive',
    'common.connected':      'Connected',
    'common.activeFilters':  'Active filters:',
    'common.of':             'of',
    'common.totalSuffix':    'total',
    'common.zone':           'Zone',
    'common.client':         'Client',
    'common.state':          'Status',
    'common.date':           'Date',
    'common.code':           'Code',
    'common.couriers':       'Couriers',
    'common.deliveryRate':   'Delivery rate',
    'common.activate':       'Activate',
    'common.deactivate':     'Deactivate',
  },
}

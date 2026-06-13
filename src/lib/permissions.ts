// ============================================================
// permissions — fuente única de verdad: ruta → roles permitidos
// ============================================================
// La consumen tanto el guard de rutas (App.tsx <RoleGuard>) como el
// Sidebar, para que la visibilidad del menú y el acceso real nunca
// se desincronicen.

import type { Rol } from './auth'

// Roles que pueden acceder a cada ruta del dashboard.
// Una ruta sin entrada acá se considera permitida para cualquier rol autenticado.
export const ROUTE_ROLES: Record<string, Rol[]> = {
  '/':             ['admin', 'supervisor_zona', 'demo'],
  '/pedidos':      ['admin', 'supervisor_zona', 'repartidor', 'cliente', 'demo'],
  '/clientes':     ['admin', 'supervisor_zona', 'demo'],
  '/productos':    ['admin', 'supervisor_zona', 'demo'],
  '/repartidores': ['admin', 'supervisor_zona', 'demo'],
  '/rutas':        ['admin', 'supervisor_zona', 'repartidor', 'demo'],
  '/zonas':        ['admin', 'demo'],
  '/incidencias':  ['admin', 'supervisor_zona', 'demo'],
  '/analytics':    ['admin', 'supervisor_zona', 'demo'],
  '/usuarios':     ['admin'],
}

export function canAccess(rol: Rol, path: string): boolean {
  const allowed = ROUTE_ROLES[path]
  return allowed ? allowed.includes(rol) : true
}

// A dónde mandar a cada rol cuando entra a una ruta sin permiso (o a la raíz).
// El Dashboard ('/') es solo admin/supervisor; repartidor y cliente aterrizan
// en Pedidos, que es la pantalla común a todos los roles.
export function defaultRouteForRole(rol: Rol): string {
  switch (rol) {
    case 'admin':
    case 'supervisor_zona':
    case 'demo':
      return '/'
    case 'repartidor':
    case 'cliente':
      return '/pedidos'
  }
}

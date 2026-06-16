// ─── i18n: pantalla de Login ──────────────────────────────────────────────────
//
// Textos de la carátula (columna izquierda) y del formulario de acceso.
// El bloque "Like what you see?" se mantiene siempre en inglés a propósito
// (marketing), por lo que no se incluye aquí.

import type { DictModule } from './core'

export const login: DictModule = {
  es: {
    // ── Carátula (columna izquierda) ──
    'login.tagline':      '// entrega farmacéutica de última milla',
    'login.description':  'Centro de operaciones para la distribución farmacéutica en Santa Cruz de la Sierra: pedidos, rutas, repartidores y análisis del negocio en un solo panel.',

    'login.h1.pedidos.title':      'Pedidos trazables',
    'login.h1.pedidos.sub':        'Códigos RD-2025-XXXX con flujo de estados completo',
    'login.h1.rutas.title':        'Rutas por zona',
    'login.h1.rutas.sub':          'Planificación diaria en las 5 zonas de Santa Cruz',
    'login.h1.analytics.title':    'Analytics en vivo',
    'login.h1.analytics.sub':      'KPIs, tendencias e ingresos del negocio',
    'login.h1.roles.title':        'Acceso por roles',
    'login.h1.roles.sub':          'Admin, supervisores, repartidores y clientes',

    // ── Formulario ──
    'login.title':            'Iniciar sesión',
    'login.subtitle':         'Accedé a tu panel de operaciones',
    'login.userLabel':        'Usuario o email',
    'login.userPlaceholder':  'tu.usuario o tu@email.com',
    'login.passwordLabel':    'Contraseña',
    'login.submit':           'Iniciar sesión',
    'login.submitLoading':    'Iniciando sesión…',

    // ── Errores ──
    'login.errorFields':      'Completa todos los campos',
    'login.errorCredentials': 'Usuario o contraseña incorrectos',
    'login.errorDemo':        'No se pudo iniciar el demo',
    'login.errorUnknown':     'error desconocido',

    // ── Demo ──
    'login.or':         'o',
    'login.demoButton': 'Entrar al Demo',
    'login.demoNote':   'Acceso de solo lectura a todo el sistema',
  },
  en: {
    // ── Hero (left column) ──
    'login.tagline':      '// last-mile pharmaceutical delivery',
    'login.description':  'Operations hub for pharmaceutical distribution in Santa Cruz de la Sierra: orders, routes, couriers and business analytics in a single panel.',

    'login.h1.pedidos.title':      'Traceable orders',
    'login.h1.pedidos.sub':        'RD-2025-XXXX codes with a full status flow',
    'login.h1.rutas.title':        'Routes by zone',
    'login.h1.rutas.sub':          'Daily planning across the 5 zones of Santa Cruz',
    'login.h1.analytics.title':    'Live analytics',
    'login.h1.analytics.sub':      'KPIs, trends and business revenue',
    'login.h1.roles.title':        'Role-based access',
    'login.h1.roles.sub':          'Admins, supervisors, couriers and clients',

    // ── Form ──
    'login.title':            'Sign in',
    'login.subtitle':         'Access your operations panel',
    'login.userLabel':        'Username or email',
    'login.userPlaceholder':  'your.username or you@email.com',
    'login.passwordLabel':    'Password',
    'login.submit':           'Sign in',
    'login.submitLoading':    'Signing in…',

    // ── Errors ──
    'login.errorFields':      'Please fill in all fields',
    'login.errorCredentials': 'Incorrect username or password',
    'login.errorDemo':        'Could not start the demo',
    'login.errorUnknown':     'unknown error',

    // ── Demo ──
    'login.or':         'or',
    'login.demoButton': 'Enter Demo',
    'login.demoNote':   'Read-only access to the whole system',
  },
}

// ─── Ensamblado de diccionarios i18n ──────────────────────────────────────────
//
// El diccionario final se compone del núcleo compartido (core) + un módulo por
// página. Cada módulo aporta sus propias claves namespaced (p.ej. 'pedidos.title').
// Para agregar claves de una página, editá su módulo en src/i18n/<pagina>.ts.

import { core, type DictModule } from './core'
import { login } from './login'
import { dashboard } from './dashboard'
import { pedidos } from './pedidos'
import { clientes } from './clientes'
import { productos } from './productos'
import { repartidores } from './repartidores'
import { rutas } from './rutas'
import { zonas } from './zonas'
import { incidencias } from './incidencias'
import { analytics } from './analytics'
import { usuarios } from './usuarios'

const modules: DictModule[] = [
  core, login, dashboard, pedidos, clientes, productos,
  repartidores, rutas, zonas, incidencias, analytics, usuarios,
]

export type Lang = 'es' | 'en'

export const translations: Record<Lang, Record<string, string>> = {
  es: Object.assign({}, ...modules.map(m => m.es)),
  en: Object.assign({}, ...modules.map(m => m.en)),
}

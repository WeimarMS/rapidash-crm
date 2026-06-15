import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { translations, type Lang } from '../i18n'

// ─── i18n casero (sin dependencias externas) ───────────────────────────────────
//
// Sistema de internacionalización ligero para RapiDash CRM.
// Idioma por defecto: 'es'. La elección persiste en localStorage ('rapidash-lang').
//
// El diccionario se ensambla en src/i18n/index.ts a partir de un núcleo
// compartido (core.ts) + un módulo por página (src/i18n/<pagina>.ts).
//
// CÓMO USAR:
//   const { t } = useT()        → t('pedidos.title')
//   const { lang, setLang, toggle } = useLang()
//
// CÓMO AGREGAR CLAVES:
//   Editá el módulo de la página correspondiente en src/i18n/. Si una clave no
//   existe, t() devuelve la propia key (visible en UI para detectar faltantes).

export type { Lang }

// Las claves de traducción son strings planos namespaced. Mantener el alias
// permite tipar parámetros (p.ej. en Sidebar) sin acoplarse a un union literal.
export type TransKey = string

const STORAGE_KEY = 'rapidash-lang'

interface LanguageCtx {
  lang:    Lang
  setLang: (l: Lang) => void
  toggle:  () => void
  /** Devuelve la traducción de la clave en el idioma actual (fallback: la propia key). */
  t: (key: TransKey) => string
  /**
   * Traduce nombres de zona que vienen de la BD (datos, no claves). Traduce
   * palabra por palabra contra el diccionario `zona.*`, así soporta tanto
   * "Norte" como "Zona Norte". Lo desconocido se deja igual.
   */
  tZona: (nombre: string) => string
}

// Tokens de zona conocidos → clave del diccionario (`zona.*`). Normalizados a
// minúsculas sin acentos para tolerar variantes (Centro/centro/Este/este…).
const ZONA_TOKENS: Record<string, TransKey> = {
  centro: 'zona.centro',
  norte:  'zona.norte',
  sur:    'zona.sur',
  este:   'zona.este',
  oeste:  'zona.oeste',
}

const LanguageContext = createContext<LanguageCtx | null>(null)

function readInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'en' || stored === 'es' ? stored : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang)

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, lang) } catch { /* almacenamiento no disponible */ }
    if (typeof document !== 'undefined') document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const toggle  = useCallback(() => setLangState(v => (v === 'es' ? 'en' : 'es')), [])

  const t = useCallback(
    (key: TransKey): string => translations[lang][key] ?? key,
    [lang],
  )

  const tZona = useCallback(
    (nombre: string): string => {
      if (!nombre) return nombre
      return nombre
        .split(/\s+/)
        .map(tok => {
          const key = ZONA_TOKENS[tok.toLowerCase()]
          return key ? translations[lang][key] : tok
        })
        .join(' ')
    },
    [lang],
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t, tZona }}>
      {children}
    </LanguageContext.Provider>
  )
}

function useLanguageCtx(): LanguageCtx {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang/useT debe usarse dentro de <LanguageProvider>')
  return ctx
}

/** Acceso al idioma actual y a las funciones para cambiarlo. */
export function useLang(): LanguageCtx {
  return useLanguageCtx()
}

/** Atajo cuando solo necesitas traducir: const { t } = useT(). */
export function useT(): LanguageCtx {
  return useLanguageCtx()
}

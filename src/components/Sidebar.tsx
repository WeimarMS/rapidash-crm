import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useT, type TransKey } from '../contexts/LanguageContext'
import LogoCapsula from './LogoCapsula'
import type { Rol } from '../lib/auth'
import { canAccess } from '../lib/permissions'

// ─── Nav items ────────────────────────────────────────────────────────────────
// La visibilidad por rol no se define acá: se deriva de canAccess (permissions.ts),
// la misma fuente de verdad que usa el guard de rutas en App.tsx.

const NAV_ITEMS: { labelKey: TransKey; path: string; icon: React.ReactNode }[] = [
  {
    labelKey: 'nav.dashboard', path: '/',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>,
  },
  {
    labelKey: 'nav.pedidos', path: '/pedidos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
    </svg>,
  },
  {
    labelKey: 'nav.clientes', path: '/clientes',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>,
  },
  {
    labelKey: 'nav.productos', path: '/productos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
    </svg>,
  },
  {
    labelKey: 'nav.repartidores', path: '/repartidores',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
    </svg>,
  },
  {
    labelKey: 'nav.rutas', path: '/rutas',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/>
    </svg>,
  },
  {
    labelKey: 'nav.zonas', path: '/zonas',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/>
    </svg>,
  },
  {
    labelKey: 'nav.incidencias', path: '/incidencias',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>,
  },
  {
    labelKey: 'nav.analytics', path: '/analytics',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>,
  },
  {
    labelKey: 'nav.usuarios', path: '/usuarios',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      <path d="M19 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
  },
]

// ─── Role display config ──────────────────────────────────────────────────────

const ROL_CFG: Record<Rol, { labelKey: TransKey; bg: string; text: string }> = {
  admin:           { labelKey: 'role.admin',           bg: 'bg-blue-50',    text: 'text-blue-700'    },
  supervisor_zona: { labelKey: 'role.supervisor_zona', bg: 'bg-violet-50',  text: 'text-violet-700'  },
  repartidor:      { labelKey: 'role.repartidor',      bg: 'bg-orange-50',  text: 'text-orange-700'  },
  cliente:         { labelKey: 'role.cliente',         bg: 'bg-teal-50',    text: 'text-teal-700'    },
  demo:            { labelKey: 'role.demo',            bg: 'bg-emerald-50', text: 'text-emerald-700' },
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
// Desktop (lg+): rail fijo con dos modos — colapsado (64px, solo iconos) y
// expandido (224px, iconos + labels). El estado vive en Layout (localStorage).
// Móvil: barra superior fija con hamburguesa que abre un drawer lateral.

export default function Sidebar({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const { profile } = useAuth()
  const { t }       = useT()
  const rol         = profile?.rol ?? 'cliente'
  const visibleItems = NAV_ITEMS.filter(item => canAccess(rol, item.path))
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Cerrar drawer con Escape
  useEffect(() => {
    if (!drawerOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [drawerOpen])

  return (
    <>
      {/* ── Desktop rail (colapsado 64px / expandido 224px) ── */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 ${expanded ? 'w-56' : 'w-16'} flex-col py-5 gap-1 z-20 transition-[width] duration-200 overflow-hidden`}
        style={{ background: '#0f172a' }}
      >
        {/* Brand */}
        <div className={`mb-5 flex items-center gap-2.5 ${expanded ? 'px-4' : 'justify-center'}`}>
          <span className="flex-shrink-0"><LogoCapsula size={38} /></span>
          {expanded && (
            <span className="text-white font-extrabold tracking-tight whitespace-nowrap">RapiDash CRM</span>
          )}
        </div>

        <nav className={`flex flex-col gap-1 flex-1 ${expanded ? 'px-3' : 'items-center'}`}>
          {visibleItems.map(({ labelKey, path, icon }) => (
            <NavLink
              key={labelKey}
              to={path}
              end={path === '/'}
              title={expanded ? undefined : t(labelKey)}
              className={({ isActive }) =>
                `relative rounded-xl flex items-center transition-colors ${
                  expanded ? 'gap-3 px-3 py-2.5 text-sm font-semibold' : 'w-10 h-10 justify-center'
                } ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`
              }
              style={({ isActive }) => isActive ? { background: 'rgba(30,64,175,0.4)' } : {}}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
                      style={{ background: '#15803d' }}
                    />
                  )}
                  {icon}
                  {expanded && <span className="whitespace-nowrap">{t(labelKey)}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Toggle colapsar/expandir */}
        <div className={`mb-2 ${expanded ? 'px-3' : 'flex justify-center'}`}>
          <button
            onClick={onToggle}
            title={expanded ? t('header.collapseMenu') : t('header.expandMenu')}
            className={`rounded-xl flex items-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors ${
              expanded ? 'gap-3 px-3 py-2.5 text-sm font-semibold w-full' : 'w-10 h-10 justify-center'
            }`}
          >
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {expanded && <span className="whitespace-nowrap">{t('header.collapse')}</span>}
          </button>
        </div>

        <div className={expanded ? 'px-4' : 'flex justify-center'}>
          <UserMenu railWidth={expanded ? 224 : 64} />
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div
        className="lg:hidden fixed top-0 inset-x-0 h-14 z-30 flex items-center justify-between px-4"
        style={{ background: '#0f172a' }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label={t('header.openMenu')}
          className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <LogoCapsula size={32} />
          <span className="text-white font-extrabold text-sm tracking-tight">RapiDash</span>
        </div>

        {/* Espaciador simétrico al botón hamburguesa */}
        <div className="w-10 h-10 -mr-2" />
      </div>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-[1px]"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className="lg:hidden fixed top-0 left-0 h-screen w-72 max-w-[85vw] z-50 flex flex-col overscroll-contain"
            style={{ background: '#0f172a', height: '100dvh', animation: 'slideInLeft 0.22s cubic-bezier(0.16,1,0.3,1)' }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <LogoCapsula size={36} />
                <span className="text-white font-extrabold tracking-tight">RapiDash CRM</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label={t('header.closeMenu')}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-0.5">
              {visibleItems.map(({ labelKey, path, icon }) => (
                <NavLink
                  key={labelKey}
                  to={path}
                  end={path === '/'}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                    }`
                  }
                  style={({ isActive }) => isActive ? { background: 'rgba(30,64,175,0.4)' } : {}}
                >
                  {icon}
                  {t(labelKey)}
                </NavLink>
              ))}
            </nav>

            {/* Drawer user footer */}
            <DrawerUserFooter />
          </aside>
        </>
      )}
    </>
  )
}

// ─── Drawer user footer (móvil) ───────────────────────────────────────────────

function DrawerUserFooter() {
  const { profile, signOut } = useAuth()
  const { t }    = useT()
  const initials = profile
    ? `${profile.nombre.charAt(0)}${profile.apellido.charAt(0)}`.toUpperCase()
    : '?'
  const fullName = profile ? `${profile.nombre} ${profile.apellido}` : '…'
  const rolCfg   = profile ? ROL_CFG[profile.rol] : ROL_CFG.cliente

  return (
    <div className="border-t border-slate-800 px-4 py-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{fullName}</p>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${rolCfg.bg} ${rolCfg.text}`}>
            {t(rolCfg.labelKey)}
          </span>
        </div>
      </div>
      <button
        onClick={() => signOut()}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
        </svg>
        {t('header.signOut')}
      </button>
    </div>
  )
}

// ─── User menu popup ──────────────────────────────────────────────────────────

function UserMenu({ railWidth = 64 }: { railWidth?: number }) {
  const { profile, signOut } = useAuth()
  const { t }                = useT()
  const [open, setOpen]      = useState(false)
  const btnRef               = useRef<HTMLButtonElement>(null)
  const popupRef             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        btnRef.current   && !btnRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const initials = profile
    ? `${profile.nombre.charAt(0)}${profile.apellido.charAt(0)}`.toUpperCase()
    : '?'
  const fullName  = profile ? `${profile.nombre} ${profile.apellido}` : '…'
  const rolCfg    = profile ? ROL_CFG[profile.rol] : ROL_CFG.cliente

  return (
    <div>
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        title={t('header.account')}
        className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-200 text-xs font-bold transition-colors"
      >
        {initials}
      </button>

      {open && (
        <div
          ref={popupRef}
          className="fixed w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
          style={{ left: railWidth + 12, bottom: 16, animation: 'fadeSlideUp 0.18s cubic-bezier(0.16,1,0.3,1)' }}
        >
          {/* Profile */}
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{fullName}</p>
                <p className="text-xs text-slate-500 truncate">@{profile?.usuario ?? '…'}</p>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 ${rolCfg.bg} ${rolCfg.text}`}>
                  {t(rolCfg.labelKey)}
                </span>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 mx-3" />

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={async () => { setOpen(false); await signOut() }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              {t('header.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

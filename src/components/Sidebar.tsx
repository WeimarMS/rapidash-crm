import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Rol } from '../lib/auth'

// ─── Nav items (role visibility) ─────────────────────────────────────────────

const ALL_ROLES: Rol[] = ['admin', 'supervisor_zona', 'repartidor', 'cliente']

const NAV_ITEMS: { label: string; path: string; roles: Rol[]; icon: React.ReactNode }[] = [
  {
    label: 'Dashboard', path: '/', roles: ['admin', 'supervisor_zona'],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>,
  },
  {
    label: 'Pedidos', path: '/pedidos', roles: ALL_ROLES,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
    </svg>,
  },
  {
    label: 'Clientes', path: '/clientes', roles: ['admin', 'supervisor_zona'],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>,
  },
  {
    label: 'Productos', path: '/productos', roles: ['admin', 'supervisor_zona'],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
    </svg>,
  },
  {
    label: 'Repartidores', path: '/repartidores', roles: ['admin', 'supervisor_zona'],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
    </svg>,
  },
  {
    label: 'Rutas', path: '/rutas', roles: ['admin', 'supervisor_zona', 'repartidor'],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/>
    </svg>,
  },
  {
    label: 'Zonas', path: '/zonas', roles: ['admin'],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/>
    </svg>,
  },
  {
    label: 'Incidencias', path: '/incidencias', roles: ['admin', 'supervisor_zona'],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>,
  },
  {
    label: 'Analytics', path: '/analytics', roles: ['admin', 'supervisor_zona'],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>,
  },
  {
    label: 'Usuarios', path: '/usuarios', roles: ['admin'],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      <path d="M19 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
  },
]

// ─── Role display config ──────────────────────────────────────────────────────

const ROL_CFG: Record<Rol, { label: string; bg: string; text: string }> = {
  admin:           { label: 'Admin',      bg: 'bg-blue-50',   text: 'text-blue-700'   },
  supervisor_zona: { label: 'Supervisor', bg: 'bg-violet-50', text: 'text-violet-700' },
  repartidor:      { label: 'Repartidor', bg: 'bg-orange-50', text: 'text-orange-700' },
  cliente:         { label: 'Cliente',    bg: 'bg-teal-50',   text: 'text-teal-700'   },
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { profile } = useAuth()
  const rol         = profile?.rol ?? 'cliente'
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(rol))

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-16 flex flex-col items-center py-5 gap-1 z-20"
      style={{ background: '#0f172a' }}
    >
      {/* Brand mark */}
      <div className="mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
          style={{ background: '#15803d' }}
        >
          RD
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {visibleItems.map(({ label, path, icon }) => (
          <NavLink
            key={label}
            to={path}
            end={path === '/'}
            title={label}
            className={({ isActive }) =>
              `relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`
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
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User avatar */}
      <UserMenu />
    </aside>
  )
}

// ─── User menu popup ──────────────────────────────────────────────────────────

function UserMenu() {
  const { profile, signOut } = useAuth()
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
        title="Mi cuenta"
        className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-200 text-xs font-bold transition-colors"
      >
        {initials}
      </button>

      {open && (
        <div
          ref={popupRef}
          className="fixed w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
          style={{ left: 64 + 12, bottom: 16, animation: 'fadeSlideUp 0.18s cubic-bezier(0.16,1,0.3,1)' }}
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
                  {rolCfg.label}
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
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

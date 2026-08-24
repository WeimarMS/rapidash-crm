import { useEffect, useState, type ReactNode } from 'react'
import { fetchAllUsers, createUser, inviteUser, updateUserRole, toggleUserActivo } from '../lib/adminApi'
import type { FullUser, Rol, NewUserInput } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import BuiltBy, { BuiltByMobile } from '../components/BuiltBy'
import { useT } from '../contexts/LanguageContext'

// ─── Config ───────────────────────────────────────────────────────────────────

interface Zona { id: string; nombre: string }

const ROL_CFG: Record<Rol, { label: string; bg: string; text: string; dot: string }> = {
  admin:           { label: 'Admin',      bg: 'bg-blue-50',    text: 'text-blue-700',    dot: '#1d4ed8' },
  supervisor_zona: { label: 'Supervisor', bg: 'bg-violet-50',  text: 'text-violet-700',  dot: '#7c3aed' },
  repartidor:      { label: 'Repartidor', bg: 'bg-orange-50',  text: 'text-orange-700',  dot: '#ea580c' },
  cliente:         { label: 'Cliente',    bg: 'bg-teal-50',    text: 'text-teal-700',    dot: '#0891b2' },
  demo:            { label: 'Demo',       bg: 'bg-emerald-50', text: 'text-emerald-700', dot: '#059669' },
}
// El rol demo no se ofrece al crear usuarios: se administra solo via SQL
const ROLES: Rol[]  = ['admin', 'supervisor_zona', 'repartidor', 'cliente']
const ROL_NEEDS_ZONA: Rol[] = ['supervisor_zona', 'repartidor']

const INP = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all'
const LBL = 'block text-xs font-semibold text-slate-500 mb-1'
const Spinner = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-200 rounded-lg animate-pulse ${className}`} />
}

// ─── Piezas de modal compartidas ──────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useT()
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 w-[calc(100vw-2rem)] max-w-md p-6 max-h-[90vh] overflow-y-auto"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'fadeSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">{t('usuarios.modal.eyebrow')}</p>
            <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {children}
      </div>
    </>
  )
}

function ModalFooter({ onClose, onSubmit, saving, label, savingLabel }: {
  onClose: () => void; onSubmit: () => void; saving: boolean; label: string; savingLabel: string
}) {
  const { t } = useT()
  return (
    <div className="flex gap-3 mt-5">
      <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
        {t('common.cancel')}
      </button>
      <button onClick={onSubmit} disabled={saving}
        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: '#1e40af' }}>
        {saving && <Spinner />}
        {saving ? savingLabel : label}
      </button>
    </div>
  )
}

// Selector de rol + zona (la zona solo aparece para roles que la requieren).
function RolZonaFields({ rol, zonaId, zonas, onRol, onZona }: {
  rol: Rol; zonaId: string | null; zonas: Zona[]
  onRol: (r: Rol) => void; onZona: (z: string | null) => void
}) {
  const { t, tZona } = useT()
  const needsZona = ROL_NEEDS_ZONA.includes(rol)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={LBL}>{t('usuarios.label.rol')}</label>
        <select value={rol} onChange={e => onRol(e.target.value as Rol)} className={INP}>
          {ROLES.map(r => <option key={r} value={r}>{t('role.' + r)}</option>)}
        </select>
      </div>
      {needsZona ? (
        <div>
          <label className={LBL}>{t('usuarios.label.zona')}</label>
          <select value={zonaId ?? ''} onChange={e => onZona(e.target.value || null)} className={INP}>
            <option value="">{t('common.select')}</option>
            {zonas.map(z => <option key={z.id} value={z.id}>{tZona(z.nombre)}</option>)}
          </select>
        </div>
      ) : (
        <div className="flex items-end pb-1">
          <p className="text-xs text-slate-400 italic">{t('usuarios.noZona')}</p>
        </div>
      )}
    </div>
  )
}

// ─── Nuevo Usuario Modal ──────────────────────────────────────────────────────

function NuevoUsuarioModal({ zonas, onClose, onSuccess }: {
  zonas: Zona[]
  onClose: () => void
  onSuccess: (u: FullUser) => void
}) {
  const { t } = useT()
  const [form, setForm]     = useState<NewUserInput>({
    usuario: '', nombre: '', apellido: '', password: '', rol: 'repartidor', zona_id: null,
  })
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState<string | null>(null)

  const setText = (k: 'usuario' | 'nombre' | 'apellido' | 'password') =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  const needsZona = ROL_NEEDS_ZONA.includes(form.rol)

  const handleSubmit = async () => {
    if (!form.usuario || !form.nombre || !form.apellido || !form.password) {
      setErr(t('usuarios.err.required')); return
    }
    if (form.password.length < 8) {
      setErr(t('usuarios.err.passwordLen')); return
    }
    if (needsZona && !form.zona_id) {
      setErr(t('usuarios.err.zonaRequired')); return
    }
    setErr(null); setSaving(true)
    try {
      const user = await createUser({ ...form, zona_id: needsZona ? form.zona_id : null })
      onSuccess(user)
    } catch (e: any) { setErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal title={t('usuarios.modal.new.title')} onClose={onClose}>
      <form className="space-y-3" autoComplete="off" onSubmit={e => e.preventDefault()}>
        <div>
          <label className={LBL}>{t('usuarios.label.usuario')}</label>
          <input type="text" value={form.usuario} onChange={setText('usuario')}
            placeholder="ej. ejemplo@tumail.com" className={INP}
            onKeyDown={e => { if (e.key === ' ') e.preventDefault() }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LBL}>{t('usuarios.label.nombre')}</label>
            <input type="text" value={form.nombre} onChange={setText('nombre')} placeholder="Carlos" className={INP} />
          </div>
          <div>
            <label className={LBL}>{t('usuarios.label.apellido')}</label>
            <input type="text" value={form.apellido} onChange={setText('apellido')} placeholder="Mendoza" className={INP} />
          </div>
        </div>
        <div>
          <label className={LBL}>{t('usuarios.label.password')} <span className="text-slate-400 font-normal">{t('usuarios.label.passwordHint')}</span></label>
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={setText('password')}
              autoComplete="new-password" placeholder="••••••••" className={`${INP} pr-10`} />
            <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPwd
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
              }
            </button>
          </div>
        </div>
        <RolZonaFields rol={form.rol} zonaId={form.zona_id} zonas={zonas}
          onRol={r => setForm(p => ({ ...p, rol: r }))} onZona={z => setForm(p => ({ ...p, zona_id: z }))} />
      </form>

      {err && <p className="mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}

      <ModalFooter onClose={onClose} onSubmit={handleSubmit} saving={saving} label={t('usuarios.btn.create')} savingLabel={t('usuarios.btn.creating')} />
    </Modal>
  )
}

// ─── Invitar por Email Modal ──────────────────────────────────────────────────

function InvitarUsuarioModal({ zonas, onClose, onSuccess }: {
  zonas: Zona[]
  onClose: () => void
  onSuccess: (u: FullUser) => void
}) {
  const { t } = useT()
  const [form, setForm] = useState<{ email: string; nombre: string; apellido: string; rol: Rol; zona_id: string | null }>({
    email: '', nombre: '', apellido: '', rol: 'supervisor_zona', zona_id: null,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  const setText = (k: 'email' | 'nombre' | 'apellido') =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  const needsZona = ROL_NEEDS_ZONA.includes(form.rol)

  const handleSubmit = async () => {
    const email = form.email.trim().toLowerCase()
    if (!email || !email.includes('@') || !form.nombre || !form.apellido) {
      setErr(t('usuarios.err.inviteRequired')); return
    }
    if (needsZona && !form.zona_id) {
      setErr(t('usuarios.err.zonaRequired')); return
    }
    setErr(null); setSaving(true)
    try {
      const user = await inviteUser({ email, nombre: form.nombre, apellido: form.apellido, rol: form.rol, zona_id: needsZona ? form.zona_id : null })
      onSuccess(user)
    } catch (e: any) { setErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal title={t('usuarios.modal.invite.title')} onClose={onClose}>
      <p className="text-xs text-slate-500 mb-3 -mt-2">
        {t('usuarios.invite.hint')}
      </p>
      <div className="space-y-3">
        <div>
          <label className={LBL}>{t('usuarios.label.email')}</label>
          <input type="email" value={form.email} onChange={setText('email')}
            placeholder="persona@empresa.com" className={INP} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LBL}>{t('usuarios.label.nombre')}</label>
            <input type="text" value={form.nombre} onChange={setText('nombre')} placeholder="Carlos" className={INP} />
          </div>
          <div>
            <label className={LBL}>{t('usuarios.label.apellido')}</label>
            <input type="text" value={form.apellido} onChange={setText('apellido')} placeholder="Mendoza" className={INP} />
          </div>
        </div>
        <RolZonaFields rol={form.rol} zonaId={form.zona_id} zonas={zonas}
          onRol={r => setForm(p => ({ ...p, rol: r }))} onZona={z => setForm(p => ({ ...p, zona_id: z }))} />
      </div>

      {err && <p className="mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}

      <ModalFooter onClose={onClose} onSubmit={handleSubmit} saving={saving} label={t('usuarios.btn.invite')} savingLabel={t('usuarios.btn.inviting')} />
    </Modal>
  )
}

// ─── Cambiar Rol Modal ────────────────────────────────────────────────────────

function CambiarRolModal({ user, zonas, onClose, onSuccess }: {
  user: FullUser
  zonas: Zona[]
  onClose: () => void
  onSuccess: (rol: Rol, zonaId: string | null) => void
}) {
  const { t } = useT()
  const [rol, setRol]       = useState<Rol>(user.rol)
  const [zonaId, setZonaId] = useState<string | null>(user.zona_id)
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  const needsZona = ROL_NEEDS_ZONA.includes(rol)
  const sinCambios = rol === user.rol && zonaId === user.zona_id

  const handleSubmit = async () => {
    if (needsZona && !zonaId) { setErr(t('usuarios.err.zonaRequired')); return }
    setErr(null); setSaving(true)
    try {
      const finalZona = needsZona ? zonaId : null
      await updateUserRole(user.id, rol, finalZona)
      onSuccess(rol, finalZona)
    } catch (e: any) { setErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal title={t('usuarios.modal.changeRole.title')} onClose={onClose}>
      <div className="mb-4 px-3 py-2.5 bg-slate-50 rounded-xl">
        <p className="text-sm font-semibold text-slate-800">{user.nombre} {user.apellido}</p>
        <p className="text-xs text-slate-400">{user.email}</p>
      </div>
      <RolZonaFields rol={rol} zonaId={zonaId} zonas={zonas} onRol={setRol} onZona={setZonaId} />

      {err && <p className="mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}

      <div className="flex gap-3 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
          {t('common.cancel')}
        </button>
        <button onClick={handleSubmit} disabled={saving || sinCambios}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: '#1e40af' }}>
          {saving && <Spinner />}
          {saving ? t('common.saving') : t('common.saveChanges')}
        </button>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Usuarios() {
  const { t, tZona } = useT()
  const { user: authUser } = useAuth()
  const [users, setUsers]       = useState<FullUser[]>([])
  const [zonas, setZonas]       = useState<Zona[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [showNuevo, setShowNuevo]     = useState(false)
  const [showInvitar, setShowInvitar] = useState(false)
  const [editRol, setEditRol]   = useState<FullUser | null>(null)
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [menuPos, setMenuPos]   = useState<{ top: number; right: number } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500)
  }

  // Cierra el menú contextual al hacer click fuera
  useEffect(() => {
    if (!openMenu) return
    const close = () => setOpenMenu(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenu])

  useEffect(() => {
    supabase.from('zonas').select('id, nombre').order('nombre')
      .then(({ data }) => setZonas((data ?? []) as Zona[]))
    fetchAllUsers()
      .then(d => { setUsers(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const zonaNombre = (id: string) => {
    const n = zonas.find(z => z.id === id)?.nombre
    return n ? tZona(n) : id.slice(0, 8) + '…'
  }
  const displayName = (u: FullUser) => u.email.endsWith('@rapidash.bo') ? `@${u.usuario}` : u.email

  const handleNuevoUsuario = (u: FullUser) => {
    setUsers(prev => [...prev, u].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    showToast('success', t('usuarios.toast.created').replace('{name}', displayName(u)))
    setShowNuevo(false)
  }

  const handleInvitado = (u: FullUser) => {
    setUsers(prev => [...prev, u].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    showToast('success', t('usuarios.toast.invited').replace('{email}', u.email))
    setShowInvitar(false)
  }

  const handleRolCambiado = (rol: Rol, zonaId: string | null) => {
    if (!editRol) return
    const u = editRol
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, rol, zona_id: zonaId } : x))
    showToast('success', t('usuarios.toast.roleUpdated').replace('{name}', u.nombre).replace('{role}', t('role.' + rol)))
    setEditRol(null)
  }

  const openMenuFor = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (openMenu === id) { setOpenMenu(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setOpenMenu(id)
  }

  const handleToggle = async (u: FullUser) => {
    setToggling(u.id)
    try {
      await toggleUserActivo(u.id, !u.activo)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, activo: !u.activo } : x))
      showToast('success', u.activo
        ? t('usuarios.toast.deactivated').replace('{name}', displayName(u))
        : t('usuarios.toast.activated').replace('{name}', displayName(u)))
    } catch (e: any) {
      showToast('error', e.message)
    } finally {
      setToggling(null)
    }
  }

  const hoy = new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const admins = users.filter(u => u.rol === 'admin').length
  const activos = users.filter(u => u.activo).length

  return (
    <>
      {/* Dropdown de acciones — position:fixed para escapar cualquier overflow container */}
      {openMenu && menuPos && (() => {
        const u = users.find(x => x.id === openMenu)
        if (!u) return null
        return (
          <div
            style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[160px]"
          >
            <button
              onClick={() => { setEditRol(u); setOpenMenu(null) }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-shrink-0">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {t('usuarios.changeRole')}
            </button>
            <button
              onClick={() => { handleToggle(u); setOpenMenu(null) }}
              disabled={toggling === u.id}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors disabled:opacity-50 ${
                u.activo ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              {u.activo
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
              }
              {toggling === u.id ? '…' : u.activo ? t('common.deactivate') : t('common.activate')}
            </button>
          </div>
        )
      })()}

      <header className="sticky top-14 lg:top-0 z-10 bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>{t('usuarios.title')}</h1>
          <p className="hidden md:block text-xs text-slate-400 capitalize mt-0.5">{hoy}</p>
          <BuiltByMobile />
        </div>
        <div className="flex items-center gap-4 lg:mr-24">
          <BuiltBy />
          <div className="flex items-center gap-2.5">
            <button onClick={() => setShowInvitar(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>
              </svg>
              {t('usuarios.invite')}
            </button>
            <button onClick={() => setShowNuevo(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#1e40af' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
              {t('usuarios.new')}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-5xl w-full mx-auto">

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {loading ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-16" />) : (
            <>
              <StatCard label={t('usuarios.stats.total')} value={users.length} color="#1e40af" />
              <StatCard label={t('usuarios.stats.activos')} value={activos} color="#15803d" />
              <StatCard label={t('usuarios.stats.admins')} value={admins} color="#7c3aed" />
              <StatCard label={t('usuarios.stats.inactivos')} value={users.length - activos} color="#64748b" />
            </>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-3.5 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500">
              {loading ? '…' : (users.length === 1 ? t('usuarios.count') : t('usuarios.count.plural')).replace('{count}', String(users.length))}
            </p>
          </div>
          <div className="hidden md:block overflow-x-auto rounded-b-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[
                    { key: 'usuario',        label: t('usuarios.th.usuario') },
                    { key: 'nombreCompleto', label: t('usuarios.th.nombreCompleto') },
                    { key: 'rol',            label: t('usuarios.th.rol') },
                    { key: 'zona',           label: t('usuarios.th.zona') },
                    { key: 'registrado',     label: t('usuarios.th.registrado') },
                    { key: 'estado',         label: t('usuarios.th.estado') },
                    { key: 'acciones',       label: '' },
                  ].map(h => (
                    <th key={h.key} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({length:4}).map((_,i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {Array.from({length:7}).map((_,j) => <td key={j} className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>)}
                  </tr>
                )) : users.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                    {t('usuarios.empty')}
                  </td></tr>
                ) : users.map(u => {
                  const cfg = ROL_CFG[u.rol]
                  const isSelf = u.id === authUser?.id
                  const fmtDate = (iso: string) =>
                    iso ? new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
                  return (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors anim-card">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-sm font-semibold text-slate-700">{displayName(u)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800">{u.nombre} {u.apellido}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                          {t('role.' + u.rol)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        {u.zona_id ? zonaNombre(u.zona_id) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{fmtDate(u.created)}</td>
                      <td className="px-5 py-3.5">
                        {u.invited
                          ? <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{t('usuarios.estado.invitado')}
                            </span>
                          : u.activo
                            ? <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{t('usuarios.estado.activo')}
                              </span>
                            : <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />{t('usuarios.estado.inactivo')}
                              </span>
                        }
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {isSelf ? (
                          <span className="text-xs text-slate-300 italic">{t('usuarios.self')}</span>
                        ) : (
                          <button
                            onClick={e => openMenuFor(u.id, e)}
                            className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            aria-label="Acciones"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Vista cards en móvil */}
          <div className="md:hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
              </div>
            ) : users.length === 0 ? (
              <div className="px-5 py-12 text-center text-slate-400 text-sm">
                {t('usuarios.empty')}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {users.map(u => {
                  const cfg = ROL_CFG[u.rol]
                  const isSelf = u.id === authUser?.id
                  const fmtDate = (iso: string) =>
                    iso ? new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
                  return (
                    <div key={u.id} className="px-4 py-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-semibold text-slate-700 truncate">{displayName(u)}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                          {t('role.' + u.rol)}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">{u.nombre} {u.apellido}</p>
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                        <span>{u.zona_id ? zonaNombre(u.zona_id) : '—'}</span>
                        <span>{t('usuarios.registradoMobile').replace('{date}', fmtDate(u.created))}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        {u.invited
                          ? <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{t('usuarios.estado.invitado')}
                            </span>
                          : u.activo
                            ? <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{t('usuarios.estado.activo')}
                              </span>
                            : <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />{t('usuarios.estado.inactivo')}
                              </span>
                        }
                        {isSelf ? (
                          <span className="text-xs text-slate-300 italic">{t('usuarios.self')}</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditRol(u)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              {t('usuarios.changeRole')}
                            </button>
                            <button
                              onClick={() => handleToggle(u)}
                              disabled={toggling === u.id}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                                u.activo ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {toggling === u.id ? '…' : u.activo ? t('common.deactivate') : t('common.activate')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {showNuevo && (
        <NuevoUsuarioModal zonas={zonas} onClose={() => setShowNuevo(false)} onSuccess={handleNuevoUsuario} />
      )}
      {showInvitar && (
        <InvitarUsuarioModal zonas={zonas} onClose={() => setShowInvitar(false)} onSuccess={handleInvitado} />
      )}
      {editRol && (
        <CambiarRolModal user={editRol} zonas={zonas} onClose={() => setEditRol(null)} onSuccess={handleRolCambiado} />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white anim-card ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success'
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 flex-shrink-0"><path d="M18 6L6 18M6 6l12 12"/></svg>
          }
          {toast.msg}
        </div>
      )}
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-400 truncate">{label}</p>
      <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
    </div>
  )
}

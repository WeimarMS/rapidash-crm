import { useEffect, useState } from 'react'
import { fetchAllUsers, createUser, toggleUserActivo } from '../lib/adminApi'
import type { FullUser, Rol, NewUserInput } from '../lib/auth'
import { supabase } from '../lib/supabase'

// ─── Config ───────────────────────────────────────────────────────────────────

const ROL_CFG: Record<Rol, { label: string; bg: string; text: string; dot: string }> = {
  admin:           { label: 'Admin',      bg: 'bg-blue-50',   text: 'text-blue-700',   dot: '#1d4ed8' },
  supervisor_zona: { label: 'Supervisor', bg: 'bg-violet-50', text: 'text-violet-700', dot: '#7c3aed' },
  repartidor:      { label: 'Repartidor', bg: 'bg-orange-50', text: 'text-orange-700', dot: '#ea580c' },
  cliente:         { label: 'Cliente',    bg: 'bg-teal-50',   text: 'text-teal-700',   dot: '#0891b2' },
}
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

// ─── Nuevo Usuario Modal ──────────────────────────────────────────────────────

function NuevoUsuarioModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: (u: FullUser) => void
}) {
  const [zonas, setZonas]   = useState<{ id: string; nombre: string }[]>([])
  const [form, setForm]     = useState<NewUserInput>({
    usuario: '', nombre: '', apellido: '', password: '', rol: 'repartidor', zona_id: null,
  })
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState<string | null>(null)

  useEffect(() => {
    supabase.from('zonas').select('id, nombre').order('nombre')
      .then(({ data }) => setZonas((data ?? []) as { id: string; nombre: string }[]))
  }, [])

  const set = (k: keyof NewUserInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  const needsZona = ROL_NEEDS_ZONA.includes(form.rol)

  const handleSubmit = async () => {
    if (!form.usuario || !form.nombre || !form.apellido || !form.password) {
      setErr('Todos los campos marcados con * son obligatorios'); return
    }
    if (form.password.length < 8) {
      setErr('La contraseña debe tener al menos 8 caracteres'); return
    }
    if (needsZona && !form.zona_id) {
      setErr('Selecciona una zona para este rol'); return
    }
    setErr(null); setSaving(true)
    try {
      const user = await createUser({ ...form, zona_id: needsZona ? form.zona_id : null })
      onSuccess(user)
    } catch (e: any) { setErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-6"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'fadeSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Usuarios</p>
            <h2 className="text-lg font-extrabold text-slate-900">Nuevo usuario</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={LBL}>Usuario * <span className="text-slate-400 font-normal">(sin @rapidash.bo)</span></label>
            <input type="text" value={form.usuario} onChange={set('usuario')}
              placeholder="Ej. carlos.mendoza" className={INP}
              onKeyDown={e => { if (e.key === ' ') e.preventDefault() }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Nombre *</label>
              <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Carlos" className={INP} />
            </div>
            <div>
              <label className={LBL}>Apellido *</label>
              <input type="text" value={form.apellido} onChange={set('apellido')} placeholder="Mendoza" className={INP} />
            </div>
          </div>
          <div>
            <label className={LBL}>Contraseña * <span className="text-slate-400 font-normal">(mín. 8 caracteres)</span></label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
                placeholder="••••••••" className={`${INP} pr-10`} />
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Rol *</label>
              <select value={form.rol} onChange={set('rol')} className={INP}>
                {ROLES.map(r => <option key={r} value={r}>{ROL_CFG[r].label}</option>)}
              </select>
            </div>
            {needsZona ? (
              <div>
                <label className={LBL}>Zona *</label>
                <select value={form.zona_id ?? ''} onChange={set('zona_id')} className={INP}>
                  <option value="">— Seleccionar —</option>
                  {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                </select>
              </div>
            ) : (
              <div className="flex items-end pb-1">
                <p className="text-xs text-slate-400 italic">Este rol no requiere zona</p>
              </div>
            )}
          </div>
        </div>

        {err && <p className="mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#1e40af' }}>
            {saving && <Spinner />}
            {saving ? 'Creando…' : 'Crear usuario'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Usuarios() {
  const [users, setUsers]       = useState<FullUser[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [showNuevo, setShowNuevo] = useState(false)
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchAllUsers()
      .then(d => { setUsers(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const handleNuevoUsuario = (u: FullUser) => {
    setUsers(prev => [...prev, u].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    showToast('success', `Usuario @${u.usuario} creado correctamente`)
    setShowNuevo(false)
  }

  const handleToggle = async (u: FullUser) => {
    setToggling(u.id)
    try {
      await toggleUserActivo(u.id, !u.activo)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, activo: !u.activo } : x))
      showToast('success', u.activo ? `@${u.usuario} desactivado` : `@${u.usuario} activado`)
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
      <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>Usuarios</h1>
          <p className="text-xs text-slate-400 capitalize mt-0.5">{hoy}</p>
        </div>
        <button onClick={() => setShowNuevo(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: '#1e40af' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
          Nuevo usuario
        </button>
      </header>

      <main className="flex-1 px-8 py-6 space-y-5 max-w-5xl w-full mx-auto">

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {loading ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-16" />) : (
            <>
              <StatCard label="Total usuarios" value={users.length} color="#1e40af" />
              <StatCard label="Activos" value={activos} color="#15803d" />
              <StatCard label="Administradores" value={admins} color="#7c3aed" />
              <StatCard label="Inactivos" value={users.length - activos} color="#64748b" />
            </>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-3.5 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500">
                {loading ? '…' : `${users.length} usuario${users.length !== 1 ? 's' : ''} del sistema`}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Usuario', 'Nombre completo', 'Rol', 'Zona', 'Registrado', 'Estado', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
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
                      Sin usuarios del sistema. Crea el primero con "+ Nuevo usuario".
                    </td></tr>
                  ) : users.map(u => {
                    const cfg = ROL_CFG[u.rol]
                    const fmtDate = (iso: string) =>
                      iso ? new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
                    return (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors anim-card">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-sm font-semibold text-slate-700">@{u.usuario}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-800">{u.nombre} {u.apellido}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">
                          {u.zona_id ? <ZonaNombre id={u.zona_id} /> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-xs">{fmtDate(u.created)}</td>
                        <td className="px-5 py-3.5">
                          {u.activo
                            ? <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Activo
                              </span>
                            : <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />Inactivo
                              </span>
                          }
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleToggle(u)}
                            disabled={toggling === u.id}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              u.activo
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {toggling === u.id ? '…' : u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
      </main>

      {showNuevo && (
        <NuevoUsuarioModal onClose={() => setShowNuevo(false)} onSuccess={handleNuevoUsuario} />
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

// Zona name resolver (simple lookup from the hardcoded seed zones)
const ZONA_NOMBRES: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'Centro',
  '00000000-0000-0000-0000-000000000002': 'Norte',
  '00000000-0000-0000-0000-000000000003': 'Sur',
  '00000000-0000-0000-0000-000000000004': 'Este',
  '00000000-0000-0000-0000-000000000005': 'Oeste',
}

function ZonaNombre({ id }: { id: string }) {
  return <>{ZONA_NOMBRES[id] ?? id.slice(0, 8) + '…'}</>
}

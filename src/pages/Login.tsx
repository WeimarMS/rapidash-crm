import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// ─── Logo: cápsula en movimiento ──────────────────────────────────────────────

function LogoCapsula({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="RapiDash">
      <defs>
        <linearGradient id="rd-cap" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
      </defs>
      {/* Trazos de velocidad */}
      <line x1="4"  y1="30" x2="20" y2="30" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" opacity="0.25" />
      <line x1="9"  y1="39" x2="22" y2="39" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      <line x1="14" y1="48" x2="24" y2="48" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      {/* Cápsula inclinada 45° apuntando arriba-derecha */}
      <g transform="rotate(45 40 28)">
        {/* Mitad inferior: contorno */}
        <path
          d="M30 28 V38 A10 10 0 0 0 50 38 V28 Z"
          fill="white" fillOpacity="0.06"
          stroke="#22c55e" strokeWidth="2.5"
        />
        {/* Mitad superior: sólida con gradiente */}
        <path
          d="M30 28 V18 A10 10 0 0 1 50 18 V28 Z"
          fill="url(#rd-cap)"
          stroke="#22c55e" strokeWidth="2.5"
        />
        {/* Brillo */}
        <line x1="35" y1="14" x2="35" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </g>
    </svg>
  )
}

// ─── Red de rutas de fondo (columna izquierda) ────────────────────────────────

function RutasBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {/* Grilla urbana tenue */}
      <g stroke="#334155" strokeWidth="1" opacity="0.18">
        {[100, 220, 340, 460, 580].map(y => <line key={`h${y}`} x1="0" y1={y} x2="800" y2={y} />)}
        {[130, 290, 450, 610, 740].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="600" />)}
      </g>
      {/* Rutas de entrega */}
      <g fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 10" strokeLinecap="round" opacity="0.35">
        <path className="rd-route" d="M60 520 L130 460 L290 460 L380 340 L450 340 L560 220" />
        <path className="rd-route" style={{ animationDelay: '0.8s' }} d="M130 580 L130 460 L240 380 L450 380 L610 220 L740 220" />
        <path className="rd-route" style={{ animationDelay: '1.6s' }} d="M290 560 L290 460 L450 460 L530 380 L610 380 L680 300" />
      </g>
      {/* Nodos: farmacias / puntos de entrega */}
      <g>
        {[
          { x: 130, y: 460, c: '#22c55e' }, { x: 290, y: 460, c: '#22c55e' },
          { x: 450, y: 340, c: '#f59e0b' }, { x: 560, y: 220, c: '#22c55e' },
          { x: 450, y: 380, c: '#22c55e' }, { x: 610, y: 220, c: '#f59e0b' },
          { x: 530, y: 380, c: '#22c55e' }, { x: 680, y: 300, c: '#22c55e' },
        ].map((n, i) => (
          <circle
            key={i} cx={n.x} cy={n.y} r="4"
            fill={n.c} className="rd-node"
            style={{ animationDelay: `${i * 0.35}s` }}
          />
        ))}
      </g>
    </svg>
  )
}

// ─── Highlights ───────────────────────────────────────────────────────────────

const HIGHLIGHTS = [
  {
    title: 'Pedidos trazables',
    sub: 'Códigos RD-2025-XXXX con flujo de estados completo',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4.5 h-4.5">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
    </svg>,
  },
  {
    title: 'Rutas por zona',
    sub: 'Planificación diaria en las 5 zonas de Santa Cruz',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4.5 h-4.5">
      <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/>
    </svg>,
  },
  {
    title: 'Analytics en vivo',
    sub: 'KPIs, tendencias e ingresos del negocio',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4.5 h-4.5">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>,
  },
  {
    title: 'Acceso por roles',
    sub: 'Admin, supervisores, repartidores y clientes',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4.5 h-4.5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>,
  },
]

// ─── Página ───────────────────────────────────────────────────────────────────

const DEMO_EMAIL    = import.meta.env.VITE_DEMO_EMAIL as string | undefined
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD as string | undefined

export default function Login() {
  const { signIn }  = useAuth()
  const navigate    = useNavigate()
  const [usuario,   setUsuario]  = useState('')
  const [password,  setPassword] = useState('')
  const [showPwd,   setShowPwd]  = useState(false)
  const [loading,   setLoading]  = useState(false)
  const [error,     setError]    = useState<string | null>(null)

  const demoAvailable = Boolean(DEMO_EMAIL && DEMO_PASSWORD)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario.trim() || !password) { setError('Completa todos los campos'); return }
    setError(null); setLoading(true)
    try {
      await signIn(usuario, password)
      navigate('/', { replace: true })
    } catch {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    if (!DEMO_EMAIL || !DEMO_PASSWORD) return
    setUsuario(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError(null); setLoading(true)
    try {
      await signIn(DEMO_EMAIL, DEMO_PASSWORD)
      navigate('/', { replace: true })
    } catch (e: any) {
      setError(`No se pudo iniciar el demo: ${e?.message ?? 'error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <style>{`
        @keyframes rdRoute { to { stroke-dashoffset: -64; } }
        .rd-route { animation: rdRoute 4s linear infinite; }
        @keyframes rdNode { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
        .rd-node { animation: rdNode 2.8s ease-in-out infinite; }
        .rd-mono { font-family: 'DM Mono', 'Courier New', monospace; }
      `}</style>

      {/* ── Columna izquierda: carátula (compacta en móvil) ── */}
      <section
        className="relative overflow-hidden lg:w-2/3 lg:min-h-screen flex flex-col justify-center px-6 py-6 lg:px-16 lg:py-12"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <RutasBackground />
        {/* Glow radial */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 30% 40%, rgba(34,197,94,0.10), transparent 70%)' }}
        />

        <div className="relative z-10">
          {/* Logo + nombre: fila en móvil, columna en desktop */}
          <div className="anim-card flex items-center gap-4 lg:flex-col lg:items-start lg:gap-6">
            <div className="relative flex-shrink-0">
              {/* Glow de marca detrás de la cápsula */}
              <span
                aria-hidden
                className="absolute -inset-5 rounded-full blur-2xl pointer-events-none"
                style={{ background: 'rgba(34,197,94,0.28)' }}
              />
              <span className="relative hidden lg:block"><LogoCapsula size={88} /></span>
              <span className="relative lg:hidden"><LogoCapsula size={56} /></span>
            </div>
            <div>
              <h1 className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight">
                RapiDash <span className="text-emerald-400">CRM</span>
              </h1>
              <p className="rd-mono text-emerald-300/80 text-xs lg:text-sm mt-1">
                {'// entrega farmacéutica de última milla'}
              </p>
            </div>
          </div>

          {/* Descripción — solo desktop */}
          <p
            className="anim-card hidden lg:block text-slate-300 text-base leading-relaxed max-w-lg mt-8"
            style={{ animationDelay: '120ms' }}
          >
            Centro de operaciones para la distribución farmacéutica en Santa Cruz de la Sierra:
            pedidos, rutas, repartidores y análisis del negocio en un solo panel.
          </p>

          {/* Highlights — solo desktop */}
          <div className="hidden lg:grid grid-cols-2 gap-x-8 gap-y-6 mt-10 max-w-2xl">
            {HIGHLIGHTS.map((h, i) => (
              <div
                key={h.title}
                className="anim-card flex items-start gap-3.5"
                style={{ animationDelay: `${240 + i * 100}ms` }}
              >
                <span className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  {h.icon}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{h.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{h.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer izquierda — solo desktop */}
        <p className="hidden lg:block absolute bottom-6 left-16 z-10 rd-mono text-xs text-emerald-300/80">
          {'// built by Weimar Miranda'}
        </p>
      </section>

      {/* ── Columna derecha: login ── */}
      <section className="flex-1 lg:w-1/3 bg-white flex flex-col items-center justify-center px-6 py-10 lg:px-10 lg:py-12">
        <div className="w-full max-w-sm anim-card" style={{ animationDelay: '160ms' }}>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Iniciar sesión</h2>
          <p className="text-sm text-slate-400 mt-1 mb-8">Accedé a tu panel de operaciones</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Usuario */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Usuario o email
              </label>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                value={usuario}
                onChange={e => { setUsuario(e.target.value); setError(null) }}
                placeholder="tu.usuario o tu@email.com"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPwd
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-rose-500 flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-xs font-semibold text-rose-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              style={{ background: '#1e40af' }}
            >
              {loading && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              )}
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>

          </form>

          {/* ── Acceso demo ── */}
          {demoAvailable && (
            <>
              <div className="flex items-center gap-3 my-6">
                <span className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">o</span>
                <span className="flex-1 h-px bg-slate-200" />
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-bold border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Entrar al Demo
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Acceso de solo lectura a todo el sistema
              </p>
            </>
          )}

          {/* ── Contacto ── */}
          <div className="mt-10 pt-6 border-t border-slate-100 text-center space-y-1.5">
            <p className="text-sm font-bold text-slate-800">Like what you see?</p>
            <p className="text-xs text-slate-500 pb-2">
              I build custom dashboards &amp; CRMs for your business.
            </p>
            <p className="text-xs text-slate-500">🌐 Available for remote work worldwide</p>
            <p className="text-xs">
              <a
                href="https://wa.me/59176700989"
                target="_blank" rel="noopener noreferrer"
                className="text-emerald-700 font-semibold hover:underline"
              >
                📱 +591 76700989 (WhatsApp)
              </a>
            </p>
            <p className="text-xs">
              <a
                href="mailto:weimar.miranda.s@gmail.com"
                className="text-emerald-700 font-semibold hover:underline"
              >
                ✉ weimar.miranda.s@gmail.com
              </a>
            </p>
            <p className="rd-mono text-[11px] text-slate-400 pt-2">
              Weimar Miranda — BI &amp; Automation Consultant
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

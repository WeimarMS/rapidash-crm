import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { canAccess, defaultRouteForRole } from './lib/permissions'
import Layout       from './components/Layout'
import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import Pedidos      from './pages/Pedidos'
import Clientes     from './pages/Clientes'
import Productos    from './pages/Productos'
import Repartidores from './pages/Repartidores'
import Rutas        from './pages/Rutas'
import Zonas        from './pages/Zonas'
import Incidencias  from './pages/Incidencias'
import Analytics    from './pages/Analytics'
import Usuarios     from './pages/Usuarios'

// ─── Loading splash ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg"
          style={{ background: '#15803d' }}>
          RD
        </div>
        <svg className="animate-spin w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  )
}

// ─── Route guards ─────────────────────────────────────────────────────────────

function ProtectedLayout() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" replace />
  return <Layout />
}

// Verifica que el rol del usuario tenga permiso sobre la ruta actual.
// Si no, lo redirige a la pantalla por defecto de su rol (sin sacarlo de sesión).
function RoleGuard() {
  const { profile, loading } = useAuth()
  const { pathname } = useLocation()
  if (loading) return <LoadingScreen />
  // Sesión válida pero sin perfil: no redirigir a /login (causaría un bucle con
  // RedirectIfAuthed). Mostramos una salida explícita.
  if (!profile) return <NoProfileScreen />
  if (!canAccess(profile.rol, pathname)) return <Navigate to={defaultRouteForRole(profile.rol)} replace />
  return <Outlet />
}

function NoProfileScreen() {
  const { signOut } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0f172a' }}>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 text-center">
        <h1 className="text-lg font-extrabold text-slate-900 mb-1">Perfil no encontrado</h1>
        <p className="text-sm text-slate-500 mb-5">
          Tu cuenta no tiene un perfil asignado. Contactá a un administrador o volvé a iniciar sesión.
        </p>
        <button onClick={() => signOut()}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: '#1e40af' }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

function RedirectIfAuthed() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user)    return <Navigate to="/" replace />
  return <Outlet />
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public: redirect to dashboard if already logged in */}
          <Route element={<RedirectIfAuthed />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected: require session, then enforce role per route */}
          <Route element={<ProtectedLayout />}>
            <Route element={<RoleGuard />}>
              <Route index              element={<Dashboard />}    />
              <Route path="/pedidos"      element={<Pedidos />}      />
              <Route path="/clientes"     element={<Clientes />}     />
              <Route path="/productos"    element={<Productos />}    />
              <Route path="/repartidores" element={<Repartidores />} />
              <Route path="/rutas"        element={<Rutas />}        />
              <Route path="/zonas"        element={<Zonas />}        />
              <Route path="/incidencias"  element={<Incidencias />}  />
              <Route path="/analytics"    element={<Analytics />}    />
              <Route path="/usuarios"     element={<Usuarios />}     />
            </Route>
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
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

          {/* Protected: require session */}
          <Route element={<ProtectedLayout />}>
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

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

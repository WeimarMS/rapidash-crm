import { useLocation } from 'react-router-dom'
import BuiltBy from '../components/BuiltBy'

const MODULE_NAMES: Record<string, string> = {
  '/pedidos':      'Pedidos',
  '/clientes':     'Clientes',
  '/productos':    'Productos',
  '/repartidores': 'Repartidores',
  '/rutas':        'Rutas',
  '/zonas':        'Zonas',
  '/incidencias':  'Incidencias',
  '/analytics':    'Analytics',
}

export default function ComingSoon() {
  const { pathname } = useLocation()
  const modulo = MODULE_NAMES[pathname] ?? 'Módulo'

  return (
    <>
      <header className="sticky top-14 lg:top-0 z-10 bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>
          {modulo}
        </h1>
        <BuiltBy />
      </header>
      <main className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="text-center space-y-3">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'rgba(30,64,175,0.08)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth={1.5} className="w-8 h-8">
              <path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/>
            </svg>
          </div>
          <p className="text-lg font-bold text-slate-700">{modulo}</p>
          <p className="text-sm text-slate-400">Módulo en desarrollo</p>
        </div>
      </main>
    </>
  )
}

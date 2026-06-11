import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen" style={{ background: '#f1f5f9' }}>
      <Sidebar />
      <div className="flex-1 ml-16 flex flex-col min-h-screen">
        <Outlet />
      </div>
    </div>
  )
}

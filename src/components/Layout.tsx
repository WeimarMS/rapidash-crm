import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen" style={{ background: '#f1f5f9' }}>
      <Sidebar />
      <div className="flex-1 ml-0 lg:ml-16 pt-14 lg:pt-0 flex flex-col min-h-screen">
        <Outlet />
      </div>
    </div>
  )
}

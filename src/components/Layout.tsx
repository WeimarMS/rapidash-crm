import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import LanguageToggle from './LanguageToggle'

const SIDEBAR_KEY = 'rd-sidebar-expanded'

export default function Layout() {
  const [expanded, setExpanded] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1')

  const toggleSidebar = () => {
    setExpanded(v => {
      const next = !v
      localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0')
      return next
    })
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#f1f5f9' }}>
      <Sidebar expanded={expanded} onToggle={toggleSidebar} />
      <LanguageToggle />
      <div
        className={`flex-1 ml-0 ${expanded ? 'lg:ml-56' : 'lg:ml-16'} pt-14 lg:pt-0 flex flex-col min-h-screen transition-[margin] duration-200`}
      >
        <Outlet />
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { AskPulseDrawer } from './components/AskPulseDrawer'

export function PulseApp() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar onAskPulse={() => setDrawerOpen(true)} />
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {drawerOpen && <AskPulseDrawer onClose={() => setDrawerOpen(false)} />}
        <Outlet />
      </main>
    </div>
  )
}

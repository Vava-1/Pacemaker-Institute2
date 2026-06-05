import { Outlet, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Footer } from '@/components/Footer'

export function AppLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const isAuthPage = location.pathname === '/login'
  const isAdminPage = location.pathname === '/admin'
  const showSidebar = user && !isAuthPage && !isAdminPage

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className={`flex-1 min-h-[calc(100vh-4rem)] ${showSidebar ? 'ml-64' : ''}`}>
          <Outlet />
        </main>
      </div>
      {!isAuthPage && !isAdminPage && <Footer />}
    </div>
  )
}

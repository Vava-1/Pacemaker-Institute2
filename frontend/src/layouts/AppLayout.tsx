import { Outlet, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Footer } from '@/components/Footer'
import { CookieConsent } from '@/components/CookieConsent'

export function AppLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname === '/reset-password' || location.pathname === '/verify-email'
  const isAdminPage = location.pathname === '/admin'
  const showSidebar = user && !isAuthPage && !isAdminPage

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex pt-14 md:pt-16">
        {showSidebar && <Sidebar />}
        <main className={`flex-1 ${showSidebar ? 'lg:ml-64' : ''}`}>
          <Outlet />
        </main>
      </div>
      {!isAuthPage && <Footer />}
      <CookieConsent />
    </div>
  )
}

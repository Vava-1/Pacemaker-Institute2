import { useAuth } from '@/hooks/useAuth'
import { useNavigate, useLocation } from 'react-router'
import { useState, useRef, useEffect } from 'react'
import { LogOut, Bell, Search, ChevronDown } from 'lucide-react'

const breadcrumbMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/courses': 'Courses',
  '/admin/categories': 'Categories',
  '/admin/finance': 'Finance',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Settings',
}

export function AdminHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const currentLabel = breadcrumbMap[location.pathname] ?? 'Admin'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Left: Breadcrumb + Search */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Admin</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-700">{currentLabel}</span>
        </div>

        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search anything..."
            className="h-8 w-56 rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs outline-none focus:border-teal-400 focus:bg-white focus:ring-1 focus:ring-teal-400"
          />
        </div>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-4">
        <button className="relative rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">3</span>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-700 leading-tight">{user?.name ?? 'Admin'}</p>
              <p className="text-[11px] text-slate-400">{user?.email}</p>
            </div>
            <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-30">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-medium text-slate-700">{user?.name ?? 'Admin'}</p>
                <p className="text-[10px] text-slate-400">{user?.email}</p>
              </div>
              <button
                onClick={() => { navigate('/profile'); setShowUserMenu(false) }}
                className="w-full px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"
              >
                View Profile
              </button>
              <button
                onClick={() => { logout(); navigate('/login') }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

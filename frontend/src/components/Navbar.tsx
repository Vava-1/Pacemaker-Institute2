import { Link, useNavigate, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import {
  Search, Bell, Menu, X, GraduationCap, LogOut, User, Settings,
} from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const { t } = useTranslation()

  const navLinks = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.courses'), href: '/courses' },
    { label: t('nav.blog'), href: '/blog' },
  ]
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { data: unreadCount } = trpc.notification.unreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  })

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 md:h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">
              Pacemaker Institute
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map(link => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "text-blue-700 bg-blue-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {link.label}
                  {link.badge && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {searchOpen ? (
              <div className="flex items-center gap-1 md:gap-2">
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('nav.searchPlaceholder')} className="w-32 sm:w-48 h-7 md:h-8 text-sm" autoFocus
                />
                <Button variant="ghost" size="icon" className="h-7 md:h-8 w-7 md:w-8" onClick={() => { setSearchOpen(false); setSearchQuery('') }}>
                  <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="h-7 md:h-8 w-7 md:w-8 text-slate-500" onClick={() => setSearchOpen(true)}>
                <Search className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            )}

            <LanguageSwitcher />

            {user && (
              <>
                <Link to="/notifications">
                  <Button variant="ghost" size="icon" className="h-8 w-8 relative text-slate-500">
                    <Bell className="h-4 w-4" />
                    {unreadCount ? (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    ) : null}
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 px-2 gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={user.avatar ?? ''} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs">
                          {user.name?.charAt(0) ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm hidden lg:block max-w-[100px] truncate text-slate-700">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" /> {t('nav.profile')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/subscription')}>
                      <Settings className="mr-2 h-4 w-4" /> {t('nav.subscription')}
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Settings className="mr-2 h-4 w-4" /> {t('nav.adminDashboard')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" /> {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {!user && (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" className="h-9 px-4 text-sm font-medium text-slate-600 hover:text-slate-900">
                    {t('nav.logIn')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="h-9 px-4 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm">
                    {t('nav.signUp')}
                  </Button>
                </Link>
              </div>
            )}

            <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden text-slate-500" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {link.label}
                  {link.badge && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              )
            })}
            {!user && (
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-2">
                <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full h-9 text-sm">{t('nav.logIn')}</Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full h-9 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white">{t('nav.signUp')}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Search, Bell, MessageCircle, BookOpen, Menu, X, GraduationCap, LogOut, User, Settings,
} from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { data: unreadCount } = trpc.notification.unreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  })

  const navLinks = [
    { label: 'Courses', href: '/courses', icon: BookOpen },
    { label: 'Exercises', href: '/exercises', icon: GraduationCap },
    { label: 'Leaderboard', href: '/leaderboard', icon: User },
    { label: 'AI Tutor', href: '/ai-tutor', icon: MessageCircle },
    { label: 'Live Classes', href: '/live-classes', icon: BookOpen },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="h-full px-4 flex items-center justify-between max-w-full">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent hidden sm:block">
              Pacemaker Institute
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.href} to={link.href}
              className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search courses..." className="w-48 h-8" autoFocus
              />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSearchOpen(false); setSearchQuery('') }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>
          )}

          {user && (
            <>
              <Link to="/notifications">
                <Button variant="ghost" size="icon" className="h-8 w-8 relative">
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
                      <AvatarFallback>{user.name?.charAt(0) ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm hidden lg:block max-w-[100px] truncate">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/subscription')}>
                    <Settings className="mr-2 h-4 w-4" /> Subscription
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="mr-2 h-4 w-4" /> Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!user && (
            <Link to="/login">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:opacity-90">
                Login
              </Button>
            </Link>
          )}

          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pb-4">
          {navLinks.map(link => (
            <Link key={link.href} to={link.href}
              className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}

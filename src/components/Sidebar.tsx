import { Link, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, GraduationCap, Trophy, MessageCircle,
  Video, MessageSquare, Bell, User, CreditCard, Shield,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Courses', href: '/courses?my=1', icon: BookOpen },
  { label: 'Exercises', href: '/exercises', icon: GraduationCap },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { label: 'PI Assistant', href: '/ai-tutor', icon: MessageCircle },
  { label: 'Live Classes', href: '/live-classes', icon: Video },
  { label: 'Community Chat', href: '/chat', icon: MessageSquare },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Subscription', href: '/subscription', icon: CreditCard },
]

export function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const { data: unreadCount } = trpc.notification.unreadCount.useQuery(undefined, { enabled: !!user, refetchInterval: 30000 })

  if (!user) return null

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto z-40 hidden lg:block">
      <div className="p-4 space-y-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href.split('?')[0])
          const Icon = item.icon
          return (
            <Link key={item.href} to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.label === 'Notifications' && unreadCount ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              ) : null}
            </Link>
          )
        })}

        {user.role === 'admin' && (
          <Link to="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-4",
              location.pathname === '/admin'
                ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Shield className="h-4 w-4 flex-shrink-0" />
            <span>Admin Dashboard</span>
          </Link>
        )}
      </div>
    </aside>
  )
}

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
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-[#0f172a] border-r border-[#1e293b] z-40 hidden lg:flex lg:flex-col">
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {navItems.map(item => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href.split('?')[0])
          const Icon = item.icon
          return (
            <Link key={item.href} to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600/20 text-blue-300"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
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
          <>
            <div className="border-t border-slate-700 my-3" />
            <Link to="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location.pathname === '/admin'
                  ? "bg-purple-600/20 text-purple-300"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span>Admin Dashboard</span>
            </Link>
          </>
        )}
      </div>
    </aside>
  )
}

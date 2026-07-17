import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, BookOpen, GraduationCap, Trophy, MessageCircle,
  Video, MessageSquare, Bell, User, CreditCard, Shield, Menu, X,
} from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const navItems = [
  { labelKey: 'nav.dashboard', label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { labelKey: 'nav.myCourses', label: 'My Courses', href: '/courses?my=1', icon: BookOpen },
  { labelKey: 'nav.exercises', label: 'Exercises', href: '/exercises', icon: GraduationCap },
  { labelKey: 'nav.leaderboard', label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { labelKey: 'nav.aiTutor', label: 'PI Assistant', href: '/ai-tutor', icon: MessageCircle },
  { labelKey: 'nav.liveClasses', label: 'Live Classes', href: '/live-classes', icon: Video },
  { labelKey: 'nav.chat', label: 'Community Chat', href: '/chat', icon: MessageSquare },
  { labelKey: 'nav.notifications', label: 'Notifications', href: '/notifications', icon: Bell },
  { labelKey: 'nav.profile', label: 'Profile', href: '/profile', icon: User },
  { labelKey: 'nav.subscription', label: 'Subscription', href: '/subscription', icon: CreditCard },
]

interface SidebarContentProps {
  onNavigate?: () => void
}

function SidebarContent({ onNavigate }: SidebarContentProps) {
  const { user } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()
  const { data: unreadCount } = trpc.notification.unreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  })

  if (!user) return null

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href.split('?')[0])
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary/20 text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{t(item.labelKey, { defaultValue: item.label })}</span>
              {item.label === 'Notifications' && unreadCount ? (
                <span
                  className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  aria-label={`${unreadCount} unread notifications`}
                >
                  {unreadCount}
                </span>
              ) : null}
            </Link>
          )
        })}

        {(user.role === 'admin' || user.role === 'instructor') && (
          <>
            <div className="border-t border-sidebar-border my-3" />
            <Link
              to="/admin"
              onClick={onNavigate}
              aria-current={location.pathname.startsWith('/admin') ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname.startsWith('/admin')
                  ? 'bg-sidebar-primary/20 text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
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

/** Mobile sidebar drawer (visible below `lg`). */
export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
          <SheetTitle className="text-left">Menu</SheetTitle>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>
        <div className="h-[calc(100%-3.5rem)]">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Desktop sidebar (visible at `lg` and up). */
export function Sidebar() {
  return (
    <div className="fixed left-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] md:top-16 md:h-[calc(100vh-4rem)] lg:block">
      <SidebarContent />
    </div>
  )
}

import { NavLink, useLocation } from 'react-router'
import { usePermission } from '@/hooks/usePermission'
import { sidebarModules, hasPermission } from '@/admin/rbac'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, BookOpen, Tags, DollarSign, BarChart3,
  Settings, Shield, ChevronLeft, ChevronRight, Award, Medal,
  Video, FileText, Activity, MessageSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo } from 'react'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, Users, BookOpen, Tags, DollarSign, BarChart3, Settings,
  Award, Medal, Video, FileText, Activity, MessageSquare,
}

export function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { role } = usePermission()
  const location = useLocation()

  const visibleModules = useMemo(
    () => sidebarModules.filter(m => hasPermission(role, m.permission)),
    [role],
  )

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-slate-200 bg-white transition-all duration-300 z-20',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Brand */}
      <div className={cn(
        'flex h-14 items-center border-b border-slate-200',
        collapsed ? 'justify-center px-2' : 'justify-between px-4',
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2">
            <img src="/PBI_logo.jpg" alt="Pacemaker Institute" className="h-8 w-auto" />
          </div>
        )}
        {collapsed && (
          <img src="/PBI_logo.jpg" alt="Pacemaker Institute" className="h-8 w-auto" />
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-14 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:text-slate-600"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {visibleModules.map((mod) => {
          const Icon = iconMap[mod.icon] || LayoutDashboard
          const isActive = mod.end
            ? location.pathname === mod.path
            : location.pathname.startsWith(mod.path)

          return (
            <NavLink
              key={mod.path}
              to={mod.path}
              end={mod.end ?? false}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-teal-50 text-teal-700 before:absolute before:left-0 before:top-1/2 before:h-5/6 before:w-0.5 before:-translate-y-1/2 before:rounded-r before:bg-teal-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
              )}
            >
              <Icon className={cn(
                'h-5 w-5 flex-shrink-0 transition-colors',
                isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600',
              )} />
              {!collapsed && <span>{mod.label}</span>}
              {!collapsed && isActive && (
                <span className="ml-auto text-xs font-medium text-teal-600">●</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Role footer */}
      <div className="border-t border-slate-200 px-3 py-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100">
              <Shield className="h-3 w-3 text-teal-600" />
            </div>
            <div className="text-xs">
              <p className="font-medium text-slate-600 capitalize">{role === 'super_admin' ? 'Super Admin' : role ?? 'User'}</p>
              <p className="text-slate-400">Administrator</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

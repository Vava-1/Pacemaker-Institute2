import { useState } from 'react'
import { Outlet, Navigate } from 'react-router'
import { usePermission } from '@/hooks/usePermission'
import { hasPermission } from '@/admin/rbac'
import { AdminSidebar } from '@/admin/layout/AdminSidebar'
import { AdminHeader } from '@/admin/layout/AdminHeader'
import { cn } from '@/lib/utils'

export function AdminLayout() {
  const { role, isLoading, isAuthenticated } = usePermission()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }
  if (!hasPermission(role, 'access_admin')) return <Navigate to="/" replace />

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)} />
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-[margin] duration-200',
          // When the sidebar is collapsed, give the main content more room.
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60',
        )}
      >
        <AdminHeader />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

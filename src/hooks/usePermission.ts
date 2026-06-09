import { useAuth } from './useAuth'
import { hasPermission, type Permission } from '@/admin/rbac'

export function usePermission() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const role = (user?.role as any) ?? null

  return {
    can: (permission: Permission) => hasPermission(role, permission),
    role,
    isAdmin: role === 'admin' || role === 'super_admin',
    isLoading,
    isAuthenticated,
  }
}

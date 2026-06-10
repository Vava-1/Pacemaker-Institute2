export type Role = 'super_admin' | 'admin' | 'instructor' | 'finance_admin' | 'support_staff' | 'content_manager' | 'marketing_manager' | 'user'

export type Permission =
  | 'access_admin'
  | 'view_dashboard'
  | 'view_users' | 'create_users' | 'edit_users' | 'delete_users' | 'suspend_users'
  | 'view_courses' | 'create_courses' | 'edit_courses' | 'delete_courses' | 'publish_courses'
  | 'view_categories' | 'create_categories' | 'edit_categories' | 'delete_categories'
  | 'view_finance' | 'manage_pricing' | 'process_refunds'
  | 'view_analytics'
  | 'view_marketing' | 'manage_campaigns' | 'manage_promotions'
  | 'view_certificates' | 'issue_certificates'
  | 'view_settings' | 'edit_settings'
  | 'view_activity_logs'
  | 'manage_testimonials'
  | 'manage_badges'

export const rolePermissions: Record<Role, Permission[]> = {
  super_admin: [
    'access_admin', 'view_dashboard', 'view_users', 'create_users', 'edit_users', 'delete_users', 'suspend_users',
    'view_courses', 'create_courses', 'edit_courses', 'delete_courses', 'publish_courses',
    'view_categories', 'create_categories', 'edit_categories', 'delete_categories',
    'view_finance', 'manage_pricing', 'process_refunds',
    'view_analytics',
    'view_marketing', 'manage_campaigns', 'manage_promotions',
    'view_certificates', 'issue_certificates',
    'view_settings', 'edit_settings',
    'view_activity_logs',
    'manage_testimonials',
    'manage_badges',
  ],
  admin: [
    'access_admin', 'view_dashboard', 'view_users', 'create_users', 'edit_users', 'suspend_users',
    'view_courses', 'create_courses', 'edit_courses', 'delete_courses', 'publish_courses',
    'view_categories', 'create_categories', 'edit_categories', 'delete_categories',
    'view_finance', 'manage_pricing',
    'view_analytics',
    'view_marketing', 'manage_campaigns',
    'view_certificates', 'issue_certificates',
    'view_settings', 'edit_settings',
    'view_activity_logs',
    'manage_testimonials',
    'manage_badges',
  ],
  instructor: [
    'access_admin', 'view_dashboard',
    'view_courses', 'create_courses', 'edit_courses',
    'view_analytics',
  ],
  finance_admin: [
    'access_admin', 'view_dashboard',
    'view_finance', 'manage_pricing', 'process_refunds',
    'view_analytics',
  ],
  support_staff: [
    'access_admin', 'view_dashboard',
    'view_users', 'edit_users',
    'view_courses',
  ],
  content_manager: [
    'access_admin', 'view_dashboard',
    'view_courses', 'create_courses', 'edit_courses', 'publish_courses',
    'view_categories', 'create_categories', 'edit_categories',
    'manage_testimonials',
  ],
  marketing_manager: [
    'access_admin', 'view_dashboard',
    'view_marketing', 'manage_campaigns', 'manage_promotions',
    'view_analytics',
    'view_certificates',
  ],
  user: [],
}

export function hasPermission(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false
  const perms = rolePermissions[role]
  if (!perms) return false
  return perms.includes(permission)
}

export const sidebarModules: Array<{
  label: string
  icon: string
  path: string
  permission: Permission
  end?: boolean
}> = [
  { label: 'Dashboard', icon: 'LayoutDashboard', path: '/admin', permission: 'view_dashboard', end: true },
  { label: 'Users', icon: 'Users', path: '/admin/users', permission: 'view_users' },
  { label: 'Courses', icon: 'BookOpen', path: '/admin/courses', permission: 'view_courses' },
  { label: 'Categories', icon: 'Tags', path: '/admin/categories', permission: 'view_categories' },
  { label: 'Finance', icon: 'DollarSign', path: '/admin/finance', permission: 'view_finance' },
  { label: 'Analytics', icon: 'BarChart3', path: '/admin/analytics', permission: 'view_analytics' },
  { label: 'Settings', icon: 'Settings', path: '/admin/settings', permission: 'view_settings' },
]

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
  | 'view_blogs' | 'create_blogs' | 'edit_blogs' | 'delete_blogs'
  | 'view_live_classes' | 'manage_live_classes'
  | 'view_ai_analytics'
  | 'view_communications' | 'send_announcements'

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
    'view_blogs', 'create_blogs', 'edit_blogs', 'delete_blogs',
    'view_live_classes', 'manage_live_classes',
    'view_ai_analytics',
    'view_communications', 'send_announcements',
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
    'view_blogs', 'create_blogs', 'edit_blogs',
    'view_live_classes', 'manage_live_classes',
    'view_ai_analytics',
    'view_communications',
  ],
  instructor: [
    'access_admin', 'view_dashboard',
    'view_courses', 'create_courses', 'edit_courses',
    'view_analytics',
    'view_blogs',
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
    'view_communications',
  ],
  content_manager: [
    'access_admin', 'view_dashboard',
    'view_courses', 'create_courses', 'edit_courses', 'publish_courses',
    'view_categories', 'create_categories', 'edit_categories',
    'manage_testimonials',
    'view_blogs', 'create_blogs', 'edit_blogs',
    'view_live_classes',
  ],
  marketing_manager: [
    'access_admin', 'view_dashboard',
    'view_marketing', 'manage_campaigns', 'manage_promotions',
    'view_analytics',
    'view_certificates',
    'view_communications', 'send_announcements',
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
  { label: 'Certificates', icon: 'Award', path: '/admin/certificates', permission: 'view_certificates' },
  { label: 'Badges', icon: 'Medal', path: '/admin/badges', permission: 'manage_badges' },
  { label: 'Live Classes', icon: 'Video', path: '/admin/live-classes', permission: 'view_live_classes' },
  { label: 'Blog', icon: 'FileText', path: '/admin/blog', permission: 'view_blogs' },
  { label: 'Activity Log', icon: 'Activity', path: '/admin/activity-log', permission: 'view_activity_logs' },
  { label: 'Communications', icon: 'MessageSquare', path: '/admin/communications', permission: 'view_communications' },
  { label: 'Analytics', icon: 'BarChart3', path: '/admin/analytics', permission: 'view_analytics' },
  { label: 'Settings', icon: 'Settings', path: '/admin/settings', permission: 'view_settings' },
]

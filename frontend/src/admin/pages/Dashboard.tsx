import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { trpc } from '@/providers/trpc'
import { StatCard } from '@/admin/components/StatCard'
import {
  Users, BookOpen, DollarSign, Clock, TrendingUp,
  UserPlus, BookPlus, Award, Zap, MessageSquare,
  GraduationCap, Target, Brain, Activity, Medal,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: stats } = trpc.admin.stats.useQuery()

  const enrollmentsChart = useMemo(() => {
    if (!stats?.enrollmentsByDay?.length) return []
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayMap: Record<string, number> = {}
    for (const e of stats.enrollmentsByDay) {
      const d = new Date(e.day + 'T00:00:00')
      dayMap[d.getDay()] = Number(e.count)
    }
    return days.map((name, i) => ({ name, value: dayMap[i] ?? 0 }))
  }, [stats])

  const revenueChart = useMemo(() => {
    if (!stats?.revenueByDay?.length) return []
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayMap: Record<string, number> = {}
    for (const e of stats.revenueByDay) {
      const d = new Date(e.day + 'T00:00:00')
      dayMap[d.getDay()] = (Number(e.sum) || 0) / 100
    }
    return days.map((name, i) => ({ name, value: dayMap[i] ?? 0 }))
  }, [stats])

  const categoryColors = ['#0F766E', '#D97706', '#3B82F6', '#7C3AED', '#DC2626', '#0891B2', '#059669', '#CA8A04']
  const pieData = useMemo(() => {
    if (!stats?.categoryDistribution?.length) return []
    return stats.categoryDistribution.map((c: any, i: number) => ({
      name: c.name,
      value: Number(c.count) || 1,
      color: c.color || categoryColors[i % categoryColors.length],
    }))
  }, [stats])

  const quickActions = [
    { label: 'Add New User', icon: UserPlus, onClick: () => navigate('/admin/users') },
    { label: 'Create Course', icon: BookPlus, onClick: () => navigate('/admin/courses/new/edit') },
    { label: 'View Reports', icon: TrendingUp, onClick: () => {} },
    { label: 'Send Announcement', icon: MessageSquare, onClick: () => {} },
    { label: 'Issue Certificate', icon: Award, onClick: () => {} },
    { label: 'Manage Badges', icon: Medal, onClick: () => {} },
  ]

  const activityIcons: Record<string, any> = {
    user_registered: UserPlus,
    course_published: BookPlus,
    enrollment_completed: GraduationCap,
    certificate_issued: Award,
    payment_completed: DollarSign,
    ai_tutor_chat: Brain,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time platform overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard title="Total Users" value={stats?.totalUsers?.toLocaleString() ?? '—'} icon={Users} variant="teal" trend={{ value: 12, positive: true }} subtitle="Registered accounts" />
        <StatCard title="Active Now" value={stats?.onlineUsers?.toLocaleString() ?? '—'} icon={Clock} variant="blue" subtitle="Currently online" />
        <StatCard title="Courses" value={stats?.totalCourses?.toLocaleString() ?? '—'} icon={BookOpen} variant="amber" trend={{ value: 8, positive: true }} subtitle="Published & draft" />
        <StatCard title="Enrollments" value={stats?.totalEnrollments?.toLocaleString() ?? '—'} icon={Target} variant="purple" subtitle="Total enrollments" />
        <StatCard title="Revenue" value={stats?.totalRevenue ? `${Number(stats.totalRevenue).toLocaleString()} Frw` : '—'} icon={DollarSign} variant="teal" trend={{ value: 23, positive: true }} subtitle="All time revenue" />
        <StatCard title="Certificates" value={stats?.totalCertificates?.toLocaleString() ?? '—'} icon={Award} variant="amber" subtitle="Issued" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Revenue Area Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Revenue Trend</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Daily revenue (last 7 days)</p>
            </div>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-medium text-teal-700">+23%</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart.length > 0 ? revenueChart : [
                { name: 'Mon', value: 0 }, { name: 'Tue', value: 0 }, { name: 'Wed', value: 0 },
                { name: 'Thu', value: 0 }, { name: 'Fri', value: 0 }, { name: 'Sat', value: 0 }, { name: 'Sun', value: 0 },
              ]}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F766E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={{ stroke: '#F1F5F9' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toLocaleString()} Frw`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: 12 }} formatter={(value: number) => [`${value.toLocaleString()} Frw`, 'Revenue']} />
                <Area type="monotone" dataKey="value" stroke="#0F766E" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Pie */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Categories</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Course distribution</p>
            </div>
          </div>
          {pieData.length > 0 ? (
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} formatter={(value: number, name: string) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">No category data yet</div>
          )}
          {pieData.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
              {pieData.map((entry: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-slate-600">{entry.name}</span>
                  </div>
                  <span className="font-medium text-slate-700">{entry.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">AI Chats</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{stats?.aiChats?.toLocaleString() ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Reviews</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{stats?.reviewsCount?.toLocaleString() ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Blog Posts</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{stats?.blogPostsCount?.toLocaleString() ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Live Classes</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{stats?.liveClassesCount?.toLocaleString() ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Badges</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{stats?.badgesCount?.toLocaleString() ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Exercises</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{stats?.totalExerciseAttempts?.toLocaleString() ?? '—'}</p>
        </div>
      </div>

      {/* Enrollments Bar + Activity + Quick Actions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Enrollments Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Enrollments</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Last 7 days</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentsChart.length > 0 ? enrollmentsChart : [
                { name: 'Mon', value: 0 }, { name: 'Tue', value: 0 }, { name: 'Wed', value: 0 },
                { name: 'Thu', value: 0 }, { name: 'Fri', value: 0 }, { name: 'Sat', value: 0 }, { name: 'Sun', value: 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={{ stroke: '#F1F5F9' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} formatter={(value: number) => [value, 'Enrollments']} />
                <Bar dataKey="value" fill="#0F766E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Recent Activity</h3>
            <span className="text-[11px] text-slate-400">Real-time</span>
          </div>
          <div className="space-y-0 max-h-72 overflow-y-auto">
            {(stats?.recentActivity?.length ?? 0) > 0 ? (
              stats!.recentActivity.map((item: any, i: number) => {
                const Icon = activityIcons[item.action] ?? Activity
                const colors = [
                  'text-teal-600 bg-teal-50',
                  'text-blue-600 bg-blue-50',
                  'text-amber-600 bg-amber-50',
                  'text-purple-600 bg-purple-50',
                  'text-green-600 bg-green-50',
                  'text-red-600 bg-red-50',
                ]
                return (
                  <div key={item.id ?? i} className="flex items-start gap-3 border-b border-slate-50 py-3 last:border-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${colors[i % colors.length]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-600 capitalize">{item.action?.replace(/_/g, ' ') ?? 'Activity'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.userName ?? 'System'}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Activity className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-100 px-4 py-3 text-sm text-slate-600 hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-700 transition-all"
              >
                <action.icon className="h-4 w-4" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-gradient-to-r from-teal-50 to-blue-50 p-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-teal-600" />
              <p className="text-xs font-medium text-teal-700">Pro Tip</p>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Use the search bar above to quickly find users, courses, and settings across the platform.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

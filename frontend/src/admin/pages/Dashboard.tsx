import { useState } from 'react'
import { trpc } from '@/providers/trpc'
import { StatCard } from '@/admin/components/StatCard'
import { EmptyState } from '@/admin/components/EmptyState'
import {
  Users, BookOpen, DollarSign, Clock, TrendingUp,
  UserPlus, BookPlus, MessageSquare, Award, Zap,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const periodTabs = ['Weekly', 'Monthly', 'Yearly'] as const

const weeklyRevenue = [
  { name: 'Mon', value: 2400 }, { name: 'Tue', value: 1398 }, { name: 'Wed', value: 9800 },
  { name: 'Thu', value: 3908 }, { name: 'Fri', value: 4800 }, { name: 'Sat', value: 3800 },
  { name: 'Sun', value: 4300 },
]

const weeklyEnrollments = [
  { name: 'Mon', value: 12 }, { name: 'Tue', value: 18 }, { name: 'Wed', value: 8 },
  { name: 'Thu', value: 22 }, { name: 'Fri', value: 15 }, { name: 'Sat', value: 25 },
  { name: 'Sun', value: 20 },
]

const activityFeed = [
  { icon: UserPlus, text: 'New user registered: Sarah Johnson', time: '2 min ago', color: 'text-green-600 bg-green-50' },
  { icon: BookPlus, text: 'Course "Advanced Physics" was published', time: '15 min ago', color: 'text-blue-600 bg-blue-50' },
  { icon: MessageSquare, text: 'Support ticket #1042 was resolved', time: '1 hr ago', color: 'text-amber-600 bg-amber-50' },
  { icon: Award, text: 'Certificate issued to Mark Thompson', time: '2 hrs ago', color: 'text-purple-600 bg-purple-50' },
  { icon: Zap, text: 'System backup completed successfully', time: '3 hrs ago', color: 'text-teal-600 bg-teal-50' },
]

const quickActions = [
  { label: 'Add New User', icon: UserPlus, onClick: () => {} },
  { label: 'Create Course', icon: BookPlus, onClick: () => {} },
  { label: 'View Reports', icon: TrendingUp, onClick: () => {} },
  { label: 'Send Broadcast', icon: MessageSquare, onClick: () => {} },
]

export default function Dashboard() {
  const [period, setPeriod] = useState<(typeof periodTabs)[number]>('Weekly')
  const { data: stats } = trpc.admin.stats.useQuery()

  return (
    <div className="space-y-6">
      {/* Period toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Dashboard Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time platform metrics at a glance</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {periodTabs.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                period === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats?.totalUsers ?? '—'} icon={Users} variant="teal" trend={{ value: 12, positive: true }} subtitle="Active accounts" />
        <StatCard title="Active Now" value="—" icon={Clock} variant="blue" subtitle="Currently online" />
        <StatCard title="Total Courses" value={stats?.totalCourses ?? '—'} icon={BookOpen} variant="amber" trend={{ value: 8, positive: true }} subtitle="Across all categories" />
        <StatCard title="Revenue" value={stats?.totalRevenue ? `$${Number(stats.totalRevenue).toLocaleString()}` : '—'} icon={DollarSign} variant="teal" trend={{ value: 23, positive: true }} subtitle="Total platform revenue" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Revenue Trend</h3>
            <span className="text-[11px] text-slate-400">Last 7 days</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyRevenue}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F766E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={{ stroke: '#F1F5F9' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: 12 }}
                  formatter={(value: number) => [`$${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="value" stroke="#0F766E" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enrollments Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Enrollments</h3>
            <span className="text-[11px] text-slate-400">Last 7 days</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyEnrollments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={{ stroke: '#F1F5F9' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: 12 }}
                  formatter={(value: number) => [value, 'Enrollments']}
                />
                <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Feed + Quick Actions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Activity Feed */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Recent Activity</h3>
          {activityFeed.length === 0 ? (
            <EmptyState title="No recent activity" description="Activities will appear here as users interact with the platform." />
          ) : (
            <div className="space-y-0">
              {activityFeed.map((item, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-slate-50 py-3 last:border-0">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-600">{item.text}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
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
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Tip: Use the search bar above to quickly find users, courses, and settings.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

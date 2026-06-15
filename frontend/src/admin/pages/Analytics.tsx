import { trpc } from '@/providers/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react'

export default function Analytics() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery()

  if (isLoading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" /></div>

  const summaryCards = [
    { label: 'Total Revenue', value: `RWF ${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Enrollments (7d)', value: (stats?.enrollmentsByDay ?? []).reduce((s: number, d: any) => s + d.count, 0), icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Active Users', value: (stats?.recentUsers ?? []).length, icon: Users, color: 'text-purple-500' },
    { label: 'Avg Rating', value: `${(stats?.reviewsCount ?? 0) > 0 ? '★' : '—'}`, icon: Activity, color: 'text-amber-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Analytics</h1>
        <p className="text-xs text-slate-400 mt-0.5">Platform metrics and trends.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-xs text-slate-400">{card.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Enrollments (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={(stats?.enrollmentsByDay ?? []) as any[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={(stats?.revenueByDay ?? []) as any[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sum" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Category Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(stats?.categoryDistribution ?? []) as any[]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Users</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-[200px] overflow-y-auto">
            {(stats?.recentUsers ?? []).slice(0, 5).map((u: any) => (
              <div key={u.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{u.name ?? 'Unnamed'}</p>
                  <p className="text-[11px] text-slate-400">{u.email}</p>
                </div>
                <span className="text-[10px] text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-[200px] overflow-y-auto">
            {(stats?.recentActivity ?? []).slice(0, 5).map((a: any) => (
              <div key={a.id} className="text-sm">
                <span className="font-medium text-slate-700">{a.userName ?? 'System'}</span>
                <span className="text-slate-500"> {a.action}</span>
                <p className="text-[10px] text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

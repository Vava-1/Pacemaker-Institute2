import { useMemo } from 'react'
import { trpc } from '@/providers/trpc'
import { EmptyState } from '@/admin/components/EmptyState'
import { DataTable } from '@/admin/components/DataTable'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Activity, UserPlus, BookPlus, Award, DollarSign, Brain, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

type ActivityItem = {
  id: number
  action: string
  details: any
  createdAt: string | Date
  userName?: string | null
  userAvatar?: string | null
}

export default function ActivityLog() {
  const { data: stats } = trpc.admin.stats.useQuery()
  const activities = stats?.recentActivity ?? []

  const activityIcons: Record<string, any> = {
    user_registered: { icon: UserPlus, color: 'text-green-600 bg-green-50' },
    course_published: { icon: BookPlus, color: 'text-blue-600 bg-blue-50' },
    enrollment_completed: { icon: Target, color: 'text-purple-600 bg-purple-50' },
    certificate_issued: { icon: Award, color: 'text-amber-600 bg-amber-50' },
    payment_completed: { icon: DollarSign, color: 'text-teal-600 bg-teal-50' },
    ai_tutor_chat: { icon: Brain, color: 'text-indigo-600 bg-indigo-50' },
  }

  const columnHelper = createColumnHelper<ActivityItem>()

  const columns = useMemo(() => [
    columnHelper.accessor('action', {
      header: 'Action',
      cell: ({ row }) => {
        const meta = activityIcons[row.original.action] ?? { icon: Activity, color: 'text-slate-600 bg-slate-50' }
        const Icon = meta.icon
        return (
          <div className="flex items-center gap-2.5">
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-full', meta.color)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm text-slate-700 capitalize">{row.original.action?.replace(/_/g, ' ') ?? 'Unknown'}</span>
          </div>
        )
      },
    }) as ColumnDef<ActivityItem>,
    columnHelper.accessor('userName', {
      header: 'User',
      cell: ({ getValue }) => <span className="text-sm text-slate-600">{getValue() ?? 'System'}</span>,
    }) as ColumnDef<ActivityItem>,
    columnHelper.accessor('createdAt', {
      header: 'Time',
      cell: ({ getValue }) => (
        <span className="text-xs text-slate-500">{new Date(getValue()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      ),
    }) as ColumnDef<ActivityItem>,
    columnHelper.accessor('details', {
      header: 'Details',
      cell: ({ getValue }) => {
        const d = getValue()
        return <span className="text-xs text-slate-400 max-w-[200px] truncate block">{d ? JSON.stringify(d).slice(0, 60) : '—'}</span>
      },
    }) as ColumnDef<ActivityItem>,
  ], [columnHelper])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Activity Log</h1>
        <p className="text-xs text-slate-400 mt-0.5">Track all actions performed across the platform.</p>
      </div>
      {activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Actions will be logged here as users interact with the platform."
        />
      ) : (
        <DataTable columns={columns} data={activities} searchable={false} />
      )}
    </div>
  )
}

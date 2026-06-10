import { useMemo } from 'react'
import { trpc } from '@/providers/trpc'
import { DataTable } from '@/admin/components/DataTable'
import { EmptyState } from '@/admin/components/EmptyState'
import { StatCard } from '@/admin/components/StatCard'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { DollarSign, CreditCard, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

type Payment = {
  id: number
  amount: string | number
  status: string
  paymentMethod: string | null
  userId: number | null
  userName?: string | null
  courseTitle?: string | null
  createdAt: string | Date
}

const statusStyles: Record<string, string> = {
  completed: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-purple-50 text-purple-700',
}

export default function Finance() {
  const { data: payments = [], isLoading } = trpc.admin.payments.useQuery()

  const totalRevenue = useMemo(() => {
    return payments
      .filter((p: Payment) => p.status === 'completed')
      .reduce((sum: number, p: Payment) => sum + Number(p.amount), 0)
  }, [payments])

  const completedCount = useMemo(() => payments.filter((p: Payment) => p.status === 'completed').length, [payments])
  const pendingCount = useMemo(() => payments.filter((p: Payment) => p.status === 'pending').length, [payments])

  const columnHelper = createColumnHelper<Payment>()

  const columns = useMemo(() => [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: ({ getValue }) => <span className="text-xs font-mono text-slate-500">#{getValue()}</span>,
    }) as ColumnDef<Payment>,
    columnHelper.accessor('userName', {
      header: 'User',
      cell: ({ getValue }) => <span className="text-sm text-slate-700">{getValue() ?? 'Unknown'}</span>,
    }) as ColumnDef<Payment>,
    columnHelper.accessor('courseTitle', {
      header: 'Course',
      cell: ({ getValue }) => <span className="text-sm text-slate-600">{getValue() ?? '—'}</span>,
    }) as ColumnDef<Payment>,
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: ({ getValue }) => (
        <span className="text-sm font-semibold text-slate-700">${Number(getValue()).toFixed(2)}</span>
      ),
    }) as ColumnDef<Payment>,
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue()
        return (
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            statusStyles[status] ?? 'bg-slate-50 text-slate-600',
          )}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
      },
    }) as ColumnDef<Payment>,
    columnHelper.accessor('paymentMethod', {
      header: 'Method',
      cell: ({ getValue }) => <span className="text-xs text-slate-500 capitalize">{getValue()?.replace(/_/g, ' ') ?? '—'}</span>,
    }) as ColumnDef<Payment>,
    columnHelper.accessor('createdAt', {
      header: 'Date',
      cell: ({ getValue }) => (
        <span className="text-xs text-slate-500">{new Date(getValue()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
      ),
    }) as ColumnDef<Payment>,
  ], [columnHelper])

  if (isLoading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Finance</h1>
        <p className="text-xs text-slate-400 mt-0.5">Track payments, revenue, and transaction history.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} variant="teal" />
        <StatCard title="Transactions" value={payments.length} icon={CreditCard} variant="amber" />
        <StatCard title="Completed" value={completedCount} icon={CheckCircle} variant="teal" subtitle="Successful payments" />
        <StatCard title="Pending" value={pendingCount} icon={Clock} variant="red" subtitle="Awaiting confirmation" />
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No payment records"
          description="Transaction data will appear once users start making purchases."
        />
      ) : (
        <DataTable columns={columns} data={payments} searchPlaceholder="Search transactions..." />
      )}
    </div>
  )
}

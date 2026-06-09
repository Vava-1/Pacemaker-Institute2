import { useMemo } from 'react'
import { trpc } from '@/providers/trpc'
import { DataTable } from '@/admin/components/DataTable'
import { EmptyState } from '@/admin/components/EmptyState'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Tags, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Category = {
  id: number
  name: string
  parentId: number | null
  parentName?: string | null
  order: number | null
  status: string | null
  createdAt: string | Date
}

export default function Categories() {
  const { data: categories = [], isLoading } = trpc.admin.getCategories.useQuery()

  const columnHelper = createColumnHelper<Category>()

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Category',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
            <Tags className="h-4 w-4 text-purple-700" />
          </div>
          <span className="text-sm font-medium text-slate-700">{row.original.name}</span>
        </div>
      ),
    }) as ColumnDef<Category>,
    columnHelper.accessor('parentName', {
      header: 'Parent',
      cell: ({ getValue }) => {
        const parent = getValue()
        return parent ? <span className="text-sm text-slate-600">{parent}</span> : <span className="text-xs text-slate-400 italic">Top-level</span>
      },
    }) as ColumnDef<Category>,
    columnHelper.accessor('order', {
      header: 'Order',
      cell: ({ getValue }) => {
        const order = getValue()
        return order !== null ? <span className="text-sm text-slate-600">{order}</span> : <span className="text-slate-400">—</span>
      },
    }) as ColumnDef<Category>,
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue()
        return (
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
            status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500',
          )}>
            {status === 'active' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {status === 'active' ? 'Active' : 'Inactive'}
          </span>
        )
      },
    }) as ColumnDef<Category>,
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: ({ getValue }) => (
        <span className="text-xs text-slate-500">{new Date(getValue()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
      ),
    }) as ColumnDef<Category>,
  ], [columnHelper])

  if (isLoading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Categories</h1>
        <p className="text-xs text-slate-400 mt-0.5">Organize courses into categories and subcategories.</p>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories defined"
          description="Categories help organize courses for easier discovery."
        />
      ) : (
        <DataTable columns={columns} data={categories} searchable={false} />
      )}
    </div>
  )
}

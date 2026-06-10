import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { trpc } from '@/providers/trpc'
import { DataTable } from '@/admin/components/DataTable'
import { EmptyState } from '@/admin/components/EmptyState'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { BookOpen, Plus, Edit3, Trash2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type CourseRow = {
  id: number
  title: string
  slug: string
  status: string
  price: string | number | null
  language: string | null
  level: string | null
  categoryId: number | null
  createdAt: string | Date
}

const statusStyles: Record<string, string> = {
  published: 'bg-green-50 text-green-700',
  draft: 'bg-amber-50 text-amber-700',
  archived: 'bg-slate-100 text-slate-500',
}

const languageFlags: Record<string, string> = {
  en: '🇬🇧', fr: '🇫🇷', sw: '🇰🇪', de: '🇩🇪',
}

export default function Courses() {
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const { data: courses = [], isLoading } = trpc.admin.courses.useQuery()
  const deleteCourse = trpc.admin.deleteCourse.useMutation({
    onSuccess: () => { utils.admin.courses.invalidate(); toast.success('Course deleted') },
    onError: (err) => toast.error(err.message),
  })

  const columnHelper = createColumnHelper<CourseRow>()

  const columns = useMemo(() => [
    columnHelper.accessor('title', {
      header: 'Course',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
            <BookOpen className="h-4 w-4 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">{row.original.title}</p>
            <p className="text-[11px] text-slate-400">ID: #{row.original.id}</p>
          </div>
        </div>
      ),
    }) as ColumnDef<CourseRow>,
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue()
        return (
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusStyles[status] ?? 'bg-slate-50 text-slate-600')}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
      },
    }) as ColumnDef<CourseRow>,
    columnHelper.accessor('price', {
      header: 'Price',
      cell: ({ getValue }) => {
        const price = getValue()
        return price !== null && price !== 0
          ? <span className="text-sm font-medium text-slate-700">${Number(price).toFixed(2)}</span>
          : <span className="text-xs font-medium text-green-600 bg-green-50 rounded-full px-2 py-0.5">Free</span>
      },
    }) as ColumnDef<CourseRow>,
    columnHelper.accessor('language', {
      header: 'Language',
      cell: ({ getValue }) => {
        const lang = getValue()
        return lang ? <span>{languageFlags[lang] ?? ''} {lang?.toUpperCase()}</span> : <span className="text-slate-400">—</span>
      },
    }) as ColumnDef<CourseRow>,
    columnHelper.accessor('level', {
      header: 'Level',
      cell: ({ getValue }) => {
        const level = getValue()
        return level ? <span className="text-sm text-slate-600 capitalize">{level.replace('_', ' ')}</span> : <span className="text-slate-400">—</span>
      },
    }) as ColumnDef<CourseRow>,
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: ({ getValue }) => (
        <span className="text-xs text-slate-500">{new Date(getValue()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
      ),
    }) as ColumnDef<CourseRow>,
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/courses/${row.original.id}/edit`) }}
            className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          {row.original.status === 'published' && (
            <button
              onClick={(e) => { e.stopPropagation(); window.open(`/courses/${row.original.slug}`, '_blank') }}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="View on site"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(`Delete "${row.original.title}"? This will remove all lessons and modules.`)) {
                deleteCourse.mutate({ id: row.original.id })
              }
            }}
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    }),
  ] as ColumnDef<CourseRow>[], [columnHelper, navigate, deleteCourse])

  if (isLoading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" /></div>

  const actions = (
    <button
      onClick={() => navigate('/admin/courses/new/edit')}
      className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-700 transition-colors"
    >
      <Plus className="h-3.5 w-3.5" /> Create Course
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Courses</h1>
          <p className="text-xs text-slate-400 mt-0.5">Create, edit, and manage courses on the platform.</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Get started by creating your first course."
          action={{ label: 'Create Course', onClick: () => navigate('/admin/courses/new/edit') }}
        />
      ) : (
        <DataTable columns={columns} data={courses} searchPlaceholder="Search courses..." actions={actions} />
      )}
    </div>
  )
}

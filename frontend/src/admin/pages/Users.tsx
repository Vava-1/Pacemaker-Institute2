import { useState, useMemo } from 'react'
import { trpc } from '@/providers/trpc'
import { DataTable } from '@/admin/components/DataTable'
import { EmptyState } from '@/admin/components/EmptyState'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Users as UsersIcon, UserPlus, Ban, CheckCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

type User = {
  id: number
  name: string | null
  email: string
  role: string
  isSuspended: boolean | null
  createdAt: string | Date
}

const roles = ['user', 'instructor', 'admin', 'super_admin', 'finance_admin', 'support_staff', 'content_manager', 'marketing_manager']

const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().min(1, 'Role is required'),
})

type CreateUserForm = z.infer<typeof createUserSchema>

export default function Users() {
  const [showCreate, setShowCreate] = useState(false)

  const { data: users = [], isLoading } = trpc.admin.users.useQuery()
  const utils = trpc.useUtils()
  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', role: 'user' },
  })

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => utils.admin.users.invalidate(),
  })
  const toggleSuspend = trpc.admin.toggleUserSuspension.useMutation({
    onSuccess: () => utils.admin.users.invalidate(),
  })
  const createUser = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      utils.admin.users.invalidate()
      setShowCreate(false)
      createForm.reset()
    },
  })

  const columnHelper = createColumnHelper<User>()

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
            {row.original.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">{row.original.name ?? 'Unnamed'}</p>
            <p className="text-[11px] text-slate-400">{row.original.email}</p>
          </div>
        </div>
      ),
    }) as ColumnDef<User>,
    columnHelper.accessor('email', { header: 'Email', cell: ({ getValue }) => <span className="text-slate-500 text-sm">{getValue()}</span> }) as ColumnDef<User>,
    columnHelper.accessor('role', {
      header: 'Role',
      cell: ({ row }) => (
        <select
          value={row.original.role}
          onChange={(e) => updateRole.mutate({ userId: row.original.id, role: e.target.value as 'admin' | 'instructor' | 'user' })}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
        >
          {roles.map((r) => (
            <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
      ),
    }) as ColumnDef<User>,
    columnHelper.accessor('isSuspended', {
      header: 'Status',
      cell: ({ row }) => (
        <span className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
          row.original.isSuspended ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700',
        )}>
          {row.original.isSuspended ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
          {row.original.isSuspended ? 'Suspended' : 'Active'}
        </span>
      ),
    }) as ColumnDef<User>,
    columnHelper.accessor('createdAt', {
      header: 'Joined',
      cell: ({ getValue }) => {
        const date = getValue()
        return <span className="text-slate-500 text-xs">{new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
      },
    }) as ColumnDef<User>,
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleSuspend.mutate({ userId: row.original.id, isSuspended: !row.original.isSuspended }) }}
          className={cn(
            'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
            row.original.isSuspended
              ? 'bg-green-50 text-green-700 hover:bg-green-100'
              : 'bg-red-50 text-red-700 hover:bg-red-100',
          )}
        >
          {row.original.isSuspended ? 'Unsuspend' : 'Suspend'}
        </button>
      ),
    }),
  ] as ColumnDef<User>[], [columnHelper, updateRole, toggleSuspend])

  const actions = (
    <button
      onClick={() => setShowCreate(true)}
      className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-700 transition-colors"
    >
      <UserPlus className="h-3.5 w-3.5" /> Add User
    </button>
  )

  if (isLoading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Users</h1>
        <p className="text-xs text-slate-400 mt-0.5">Manage platform users, roles, and account status.</p>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          description="Users will appear here once they register on the platform."
          action={{ label: 'Add User', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          searchPlaceholder="Search by name or email..."
          selectable
          actions={actions}
        />
      )}

      {/* Create User Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800">Create New User</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={createForm.handleSubmit((data) => createUser.mutate({ ...data, role: data.role as 'admin' | 'instructor' | 'user' }))} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                <input
                  {...createForm.register('name')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  placeholder="John Doe"
                />
                {createForm.formState.errors.name && <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input
                  {...createForm.register('email')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  placeholder="john@example.com"
                />
                {createForm.formState.errors.email && <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  {...createForm.register('password')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  placeholder="Min 6 characters"
                />
                {createForm.formState.errors.password && <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                <select
                  {...createForm.register('role')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={createUser.isPending} className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors">
                  {createUser.isPending ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
